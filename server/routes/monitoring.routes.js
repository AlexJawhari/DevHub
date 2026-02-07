const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all monitored endpoints
router.get('/endpoints', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { data, error } = await supabase
            .from('monitored_endpoints')
            .select('*')
            .eq('user_id', req.user.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ endpoints: data || [] });
    } catch (error) {
        console.error('Get endpoints error:', error);
        res.status(500).json({ error: 'Failed to fetch endpoints' });
    }
});

// Add endpoint to monitor
router.post('/endpoints', authenticate, [
    body('name').trim().notEmpty().withMessage('Endpoint name required'),
    body('url').isURL().withMessage('Valid URL required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const {
            name,
            url,
            method = 'GET',
            headers = {},
            expected_status_code = 200,
            check_interval = 5,
            alert_on_failure = true
        } = req.body;

        const { data, error } = await supabase
            .from('monitored_endpoints')
            .insert({
                user_id: req.user.userId,
                name,
                url,
                method,
                headers,
                expected_status_code,
                check_interval,
                alert_on_failure,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ endpoint: data });
    } catch (error) {
        console.error('Add endpoint error:', error);
        res.status(500).json({ error: 'Failed to add endpoint' });
    }
});

// Update monitored endpoint
router.put('/endpoints/:id', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;
        const {
            name,
            url,
            method,
            headers,
            expected_status_code,
            check_interval,
            alert_on_failure,
            is_active
        } = req.body;

        const updateData = { updated_at: new Date().toISOString() };
        if (name !== undefined) updateData.name = name;
        if (url !== undefined) updateData.url = url;
        if (method !== undefined) updateData.method = method;
        if (headers !== undefined) updateData.headers = headers;
        if (expected_status_code !== undefined) updateData.expected_status_code = expected_status_code;
        if (check_interval !== undefined) updateData.check_interval = check_interval;
        if (alert_on_failure !== undefined) updateData.alert_on_failure = alert_on_failure;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { data, error } = await supabase
            .from('monitored_endpoints')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Endpoint not found' });
        }

        res.json({ endpoint: data });
    } catch (error) {
        console.error('Update endpoint error:', error);
        res.status(500).json({ error: 'Failed to update endpoint' });
    }
});

// Delete monitored endpoint
router.delete('/endpoints/:id', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;

        const { error } = await supabase
            .from('monitored_endpoints')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.userId);

        if (error) throw error;
        res.json({ message: 'Endpoint removed from monitoring' });
    } catch (error) {
        console.error('Delete endpoint error:', error);
        res.status(500).json({ error: 'Failed to delete endpoint' });
    }
});

// Get monitoring results for an endpoint
router.get('/results/:endpointId', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { endpointId } = req.params;
        const { limit = 100, hours = 24 } = req.query;

        // Verify endpoint belongs to user
        const { data: endpoint } = await supabase
            .from('monitored_endpoints')
            .select('id')
            .eq('id', endpointId)
            .eq('user_id', req.user.userId)
            .single();

        if (!endpoint) {
            return res.status(404).json({ error: 'Endpoint not found' });
        }

        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('monitoring_results')
            .select('*')
            .eq('endpoint_id', endpointId)
            .gte('checked_at', since)
            .order('checked_at', { ascending: false })
            .limit(Math.min(parseInt(limit), 1000));

        if (error) throw error;
        res.json({ results: data || [] });
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// Get uptime statistics for an endpoint
router.get('/stats/:endpointId', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { endpointId } = req.params;

        // Verify endpoint belongs to user
        const { data: endpoint } = await supabase
            .from('monitored_endpoints')
            .select('*')
            .eq('id', endpointId)
            .eq('user_id', req.user.userId)
            .single();

        if (!endpoint) {
            return res.status(404).json({ error: 'Endpoint not found' });
        }

        // Get stats for different time periods
        const periods = [
            { name: '24h', hours: 24 },
            { name: '7d', hours: 24 * 7 },
            { name: '30d', hours: 24 * 30 }
        ];

        const stats = {};

        for (const period of periods) {
            const since = new Date(Date.now() - period.hours * 60 * 60 * 1000).toISOString();

            const { data: results } = await supabase
                .from('monitoring_results')
                .select('is_up, response_time')
                .eq('endpoint_id', endpointId)
                .gte('checked_at', since);

            if (results && results.length > 0) {
                const upCount = results.filter(r => r.is_up).length;
                const uptimePercent = ((upCount / results.length) * 100).toFixed(2);
                const avgResponseTime = Math.round(
                    results.reduce((sum, r) => sum + (r.response_time || 0), 0) / results.length
                );

                stats[period.name] = {
                    uptime: parseFloat(uptimePercent),
                    totalChecks: results.length,
                    successfulChecks: upCount,
                    avgResponseTime
                };
            } else {
                stats[period.name] = {
                    uptime: 0,
                    totalChecks: 0,
                    successfulChecks: 0,
                    avgResponseTime: 0
                };
            }
        }

        res.json({ endpoint, stats });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;
