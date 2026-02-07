const express = require('express');
const PDFDocument = require('pdfkit');
const { supabase } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get report data for a scan
router.get('/:scanId', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { scanId } = req.params;

        const { data: scan, error } = await supabase
            .from('security_scans')
            .select('*')
            .eq('id', scanId)
            .eq('user_id', req.user.userId)
            .single();

        if (error || !scan) {
            return res.status(404).json({ error: 'Scan not found' });
        }

        const { data: findings } = await supabase
            .from('security_findings')
            .select('*')
            .eq('scan_id', scanId)
            .order('severity');

        res.json({
            scan,
            findings: findings || [],
            report: {
                generated_at: new Date().toISOString(),
                summary: {
                    url: scan.target_url,
                    score: scan.security_score,
                    status: scan.status,
                    scan_type: scan.scan_type
                }
            }
        });
    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Download PDF report
router.get('/:scanId/pdf', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { scanId } = req.params;

        const { data: scan, error } = await supabase
            .from('security_scans')
            .select('*')
            .eq('id', scanId)
            .eq('user_id', req.user.userId)
            .single();

        if (error || !scan) {
            return res.status(404).json({ error: 'Scan not found' });
        }

        const { data: findings } = await supabase
            .from('security_findings')
            .select('*')
            .eq('scan_id', scanId);

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=security-report-${scanId}.pdf`);

        doc.pipe(res);

        // Title
        doc.fontSize(24).text('DevHub Security Report', { align: 'center' });
        doc.moveDown();

        // Summary
        doc.fontSize(16).text('Executive Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc.text(`Target URL: ${scan.target_url}`);
        doc.text(`Scan Type: ${scan.scan_type}`);
        doc.text(`Security Score: ${scan.security_score}/100`);
        doc.text(`Scan Date: ${new Date(scan.started_at).toLocaleString()}`);
        doc.moveDown();

        // Findings summary
        const severityCounts = {
            critical: (findings || []).filter(f => f.severity === 'critical').length,
            high: (findings || []).filter(f => f.severity === 'high').length,
            medium: (findings || []).filter(f => f.severity === 'medium').length,
            low: (findings || []).filter(f => f.severity === 'low').length,
            info: (findings || []).filter(f => f.severity === 'info').length
        };

        doc.fontSize(16).text('Findings Overview', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc.text(`Critical: ${severityCounts.critical}`);
        doc.text(`High: ${severityCounts.high}`);
        doc.text(`Medium: ${severityCounts.medium}`);
        doc.text(`Low: ${severityCounts.low}`);
        doc.text(`Informational: ${severityCounts.info}`);
        doc.moveDown();

        // Detailed findings
        if (findings && findings.length > 0) {
            doc.fontSize(16).text('Detailed Findings', { underline: true });
            doc.moveDown(0.5);

            const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];
            const sortedFindings = findings.sort((a, b) =>
                severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
            );

            for (const finding of sortedFindings) {
                doc.fontSize(12).text(`[${finding.severity.toUpperCase()}] ${finding.title}`, {
                    continued: false
                });
                doc.fontSize(10).text(finding.description || '');
                if (finding.recommendation) {
                    doc.text(`Recommendation: ${finding.recommendation}`);
                }
                if (finding.owasp_category) {
                    doc.text(`OWASP: ${finding.owasp_category}`);
                }
                doc.moveDown(0.5);
            }
        }

        // Recommendations
        if (scan.recommendations && scan.recommendations.length > 0) {
            doc.addPage();
            doc.fontSize(16).text('Recommendations', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12);

            for (const rec of scan.recommendations) {
                doc.text(`• [${rec.priority}] ${rec.title}: ${rec.action}`);
                doc.moveDown(0.3);
            }
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(10).text(`Generated by DevHub on ${new Date().toISOString()}`, {
            align: 'center',
            color: 'gray'
        });

        doc.end();
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// Download JSON report
router.get('/:scanId/json', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { scanId } = req.params;

        const { data: scan, error } = await supabase
            .from('security_scans')
            .select('*')
            .eq('id', scanId)
            .eq('user_id', req.user.userId)
            .single();

        if (error || !scan) {
            return res.status(404).json({ error: 'Scan not found' });
        }

        const { data: findings } = await supabase
            .from('security_findings')
            .select('*')
            .eq('scan_id', scanId);

        const report = {
            meta: {
                generator: 'DevHub Security Scanner',
                version: '1.0.0',
                generated_at: new Date().toISOString()
            },
            scan: {
                id: scan.id,
                target_url: scan.target_url,
                scan_type: scan.scan_type,
                status: scan.status,
                security_score: scan.security_score,
                started_at: scan.started_at,
                completed_at: scan.completed_at
            },
            summary: {
                total_findings: (findings || []).length,
                by_severity: {
                    critical: (findings || []).filter(f => f.severity === 'critical').length,
                    high: (findings || []).filter(f => f.severity === 'high').length,
                    medium: (findings || []).filter(f => f.severity === 'medium').length,
                    low: (findings || []).filter(f => f.severity === 'low').length,
                    info: (findings || []).filter(f => f.severity === 'info').length
                }
            },
            findings: findings || [],
            recommendations: scan.recommendations || []
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=security-report-${scanId}.json`);
        res.json(report);
    } catch (error) {
        console.error('JSON report error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

module.exports = router;
