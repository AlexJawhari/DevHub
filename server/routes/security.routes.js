const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { scanLimiter } = require('../middleware/rateLimiter');
const {
    checkSecurityHeaders,
    validateSSL,
    analyzeJWT,
    analyzeCORS
} = require('../services/securityScanner');
const { runSecurityScan } = require('../services/securityScanRunner');

const router = express.Router();

const scheduleValidation = [
    body('name').isLength({ min: 2, max: 120 }).withMessage('Name required'),
    body('url').isURL().withMessage('Valid URL required'),
    body('scanType').optional().isIn(['full', 'headers', 'ssl', 'vulnerabilities']),
    body('intervalMinutes').isInt({ min: 15, max: 10080 }).withMessage('Invalid interval')
];

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

        let scanId = null;

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

        const { results, findings, securityScore, recommendations, summary } = await runSecurityScan({ url, scanType });

        if (scanId && supabase) {
            await supabase
                .from('security_scans')
                .update({
                    status: 'completed',
                    security_score: securityScore,
                    findings,
                    recommendations,
                    completed_at: new Date().toISOString()
                })
                .eq('id', scanId);

            if (findings.length > 0) {
                const findingsToInsert = findings.map(f => ({
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
            summary,
            results,
            findings,
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

// Scheduled scans
router.get('/schedules', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { data, error } = await supabase
            .from('security_schedules')
            .select('*')
            .eq('user_id', req.user.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ schedules: data || [] });
    } catch (error) {
        console.error('Get schedules error:', error);
        res.status(500).json({ error: 'Failed to fetch schedules' });
    }
});

router.post('/schedules', authenticate, scheduleValidation, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, url, scanType = 'full', intervalMinutes } = req.body;
        const now = new Date();
        const nextRunAt = new Date(now.getTime() + intervalMinutes * 60000).toISOString();

        const { data, error } = await supabase
            .from('security_schedules')
            .insert({
                user_id: req.user.userId,
                name,
                target_url: url,
                scan_type: scanType,
                interval_minutes: intervalMinutes,
                is_active: true,
                next_run_at: nextRunAt
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ schedule: data });
    } catch (error) {
        console.error('Create schedule error:', error);
        res.status(500).json({ error: 'Failed to create schedule' });
    }
});

router.put('/schedules/:id', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;
        const { name, url, scanType, intervalMinutes, is_active } = req.body;

        const { data: existing, error: existingError } = await supabase
            .from('security_schedules')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .single();

        if (existingError || !existing) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        const updates = { updated_at: new Date().toISOString() };
        if (name) updates.name = name;
        if (url) updates.target_url = url;
        if (scanType) updates.scan_type = scanType;
        if (typeof intervalMinutes === 'number') {
            updates.interval_minutes = intervalMinutes;
        }
        if (typeof is_active === 'boolean') {
            updates.is_active = is_active;
        }

        if (typeof intervalMinutes === 'number' || typeof is_active === 'boolean') {
            if (typeof is_active === 'boolean' && !is_active) {
                updates.next_run_at = null;
            } else {
                const base = new Date();
                const interval = typeof intervalMinutes === 'number' ? intervalMinutes : existing.interval_minutes;
                updates.next_run_at = new Date(base.getTime() + interval * 60000).toISOString();
            }
        }

        const { data, error } = await supabase
            .from('security_schedules')
            .update(updates)
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .select()
            .single();

        if (error) throw error;
        res.json({ schedule: data });
    } catch (error) {
        console.error('Update schedule error:', error);
        res.status(500).json({ error: 'Failed to update schedule' });
    }
});

router.post('/schedules/:id/run', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;

        const { data: schedule, error } = await supabase
            .from('security_schedules')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .single();

        if (error || !schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        const { results, findings, securityScore, recommendations, summary } = await runSecurityScan({
            url: schedule.target_url,
            scanType: schedule.scan_type
        });

        const now = new Date();
        const { data: scanRecord } = await supabase
            .from('security_scans')
            .insert({
                user_id: req.user.userId,
                target_url: schedule.target_url,
                scan_type: schedule.scan_type,
                status: 'completed',
                security_score: securityScore,
                findings,
                recommendations,
                started_at: now.toISOString(),
                completed_at: now.toISOString()
            })
            .select()
            .single();

        if (scanRecord && findings.length > 0) {
            const findingsToInsert = findings.map(f => ({
                scan_id: scanRecord.id,
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

        const nextRunAt = schedule.is_active
            ? new Date(now.getTime() + schedule.interval_minutes * 60000).toISOString()
            : schedule.next_run_at;

        await supabase
            .from('security_schedules')
            .update({
                last_run_at: now.toISOString(),
                next_run_at: nextRunAt,
                updated_at: now.toISOString()
            })
            .eq('id', schedule.id);

        res.json({
            scanId: scanRecord?.id || null,
            scheduleId: schedule.id,
            summary,
            securityScore
        });
    } catch (error) {
        console.error('Run schedule error:', error);
        res.status(500).json({ error: 'Failed to run scheduled scan' });
    }
});

router.delete('/schedules/:id', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;

        const { error } = await supabase
            .from('security_schedules')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.userId);

        if (error) throw error;
        res.json({ message: 'Schedule deleted' });
    } catch (error) {
        console.error('Delete schedule error:', error);
        res.status(500).json({ error: 'Failed to delete schedule' });
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

