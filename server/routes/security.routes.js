const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { scanLimiter } = require('../middleware/rateLimiter');
const {
    checkSecurityHeaders,
    validateSSL,
    scanVulnerabilities,
    scanSupplyChain,
    scanErrorHandling,
    scanAuthWeaknesses,
    analyzeJWT,
    analyzeCORS,
    calculateSecurityScore
} = require('../services/securityScanner');

const router = express.Router();

// Start a full security scan
router.post('/scan', scanLimiter, optionalAuth, [
    body('url').isURL().withMessage('Valid URL required'),
    body('scanType').optional().isIn(['full', 'headers', 'ssl', 'vulnerabilities'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { url, scanType = 'full' } = req.body;
        const parsed = new URL(url);

        let scanId = null;

        // Create scan record if user is authenticated
        if (req.user && supabase) {
            const { data } = await supabase
                .from('security_scans')
                .insert({
                    user_id: req.user.userId,
                    target_url: url,
                    scan_type: scanType,
                    status: 'running'
                })
                .select()
                .single();

            if (data) scanId = data.id;
        }

        const allFindings = [];
        const results = {};

        // Security headers check
        if (scanType === 'full' || scanType === 'headers') {
            results.headers = await checkSecurityHeaders(url);
            allFindings.push(...(results.headers.findings || []));
        }

        // SSL/TLS validation (only for HTTPS)
        if ((scanType === 'full' || scanType === 'ssl') && parsed.protocol === 'https:') {
            results.ssl = await validateSSL(parsed.hostname, parsed.port || 443);
            allFindings.push(...(results.ssl.findings || []));
        }

        // Vulnerability scanning
        if (scanType === 'full' || scanType === 'vulnerabilities') {
            const vulnFindings = await scanVulnerabilities(url);
            results.vulnerabilities = { findings: vulnFindings };
            allFindings.push(...vulnFindings);
        }

        // CORS analysis
        if (scanType === 'full') {
            results.cors = await analyzeCORS(url);
            allFindings.push(...(results.cors.findings || []));
        }

        // Supply chain checks (A03:2025)
        if (scanType === 'full') {
            const supplyChainFindings = await scanSupplyChain(url);
            results.supplyChain = { findings: supplyChainFindings };
            allFindings.push(...supplyChainFindings);
        }

        // Error handling checks (A10:2025)
        if (scanType === 'full') {
            const errorFindings = await scanErrorHandling(url);
            results.errorHandling = { findings: errorFindings };
            allFindings.push(...errorFindings);
        }

        // Authentication weakness checks (A07:2025)
        if (scanType === 'full') {
            const authFindings = await scanAuthWeaknesses(url);
            results.authentication = { findings: authFindings };
            allFindings.push(...authFindings);
        }

        // Calculate score
        const securityScore = calculateSecurityScore(allFindings);

        // Generate recommendations based on severity
        const recommendations = allFindings
            .filter(f => f.recommendation)
            .sort((a, b) => {
                const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
                return order[a.severity] - order[b.severity];
            })
            .map(f => ({
                priority: f.severity,
                title: f.title,
                action: f.recommendation
            }));

        // Update scan record
        if (scanId && supabase) {
            await supabase
                .from('security_scans')
                .update({
                    status: 'completed',
                    security_score: securityScore,
                    findings: allFindings,
                    recommendations,
                    completed_at: new Date().toISOString()
                })
                .eq('id', scanId);

            // Store individual findings
            if (allFindings.length > 0) {
                const findingsToInsert = allFindings.map(f => ({
                    scan_id: scanId,
                    category: f.category,
                    severity: f.severity,
                    title: f.title,
                    description: f.description,
                    evidence: f.evidence || null,
                    recommendation: f.recommendation || null,
                    owasp_category: f.owasp_category || null,
                    cwe_id: f.cwe_id || null
                }));

                await supabase.from('security_findings').insert(findingsToInsert);
            }
        }

        res.json({
            scanId,
            url,
            scanType,
            securityScore,
            summary: {
                total: allFindings.length,
                critical: allFindings.filter(f => f.severity === 'critical').length,
                high: allFindings.filter(f => f.severity === 'high').length,
                medium: allFindings.filter(f => f.severity === 'medium').length,
                low: allFindings.filter(f => f.severity === 'low').length,
                info: allFindings.filter(f => f.severity === 'info').length
            },
            results,
            findings: allFindings,
            recommendations: recommendations.slice(0, 10)
        });
    } catch (error) {
        console.error('Security scan error:', error);
        res.status(500).json({ error: 'Scan failed: ' + error.message });
    }
});

// Get scan history
router.get('/scans', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { limit = 50 } = req.query;

        const { data, error } = await supabase
            .from('security_scans')
            .select('*')
            .eq('user_id', req.user.userId)
            .order('started_at', { ascending: false })
            .limit(Math.min(parseInt(limit), 100));

        if (error) throw error;
        res.json({ scans: data || [] });
    } catch (error) {
        console.error('Get scans error:', error);
        res.status(500).json({ error: 'Failed to fetch scans' });
    }
});

// Get scan details
router.get('/scans/:id', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;

        const { data: scan, error: scanError } = await supabase
            .from('security_scans')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .single();

        if (scanError || !scan) {
            return res.status(404).json({ error: 'Scan not found' });
        }

        // Get detailed findings
        const { data: findings } = await supabase
            .from('security_findings')
            .select('*')
            .eq('scan_id', id)
            .order('created_at');

        res.json({
            scan,
            findings: findings || []
        });
    } catch (error) {
        console.error('Get scan details error:', error);
        res.status(500).json({ error: 'Failed to fetch scan details' });
    }
});

// Quick security headers check (no auth required)
router.post('/headers', scanLimiter, [
    body('url').isURL().withMessage('Valid URL required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { url } = req.body;
        const result = await checkSecurityHeaders(url);

        res.json(result);
    } catch (error) {
        console.error('Header check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Quick SSL check
router.post('/ssl', scanLimiter, [
    body('hostname').notEmpty().withMessage('Hostname required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { hostname, port = 443 } = req.body;
        const result = await validateSSL(hostname, port);

        res.json(result);
    } catch (error) {
        console.error('SSL check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// JWT analysis
router.post('/jwt', [
    body('token').notEmpty().withMessage('JWT token required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { token } = req.body;
        const result = analyzeJWT(token);

        res.json(result);
    } catch (error) {
        console.error('JWT analysis error:', error);
        res.status(500).json({ error: error.message });
    }
});

// CORS analysis
router.post('/cors', scanLimiter, [
    body('url').isURL().withMessage('Valid URL required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { url } = req.body;
        const result = await analyzeCORS(url);

        res.json(result);
    } catch (error) {
        console.error('CORS analysis error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
