const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { proxyLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// URL validation to prevent SSRF
const isValidUrl = (urlString) => {
    try {
        const url = new URL(urlString);

        // Block internal/private IPs
        const hostname = url.hostname.toLowerCase();
        if (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '0.0.0.0' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.16.') ||
            hostname.endsWith('.local') ||
            hostname === '[::1]'
        ) {
            return false;
        }

        // Only allow http and https
        if (!['http:', 'https:'].includes(url.protocol)) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
};

// Proxy endpoint - execute HTTP request on behalf of client
router.post('/proxy', proxyLimiter, optionalAuth, async (req, res) => {
    try {
        const { url, method = 'GET', headers = {}, body: requestBody, timeout = 30000 } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (!isValidUrl(url)) {
            return res.status(400).json({ error: 'Invalid or blocked URL' });
        }

        const startTime = Date.now();

        // Remove host header to prevent issues
        const cleanHeaders = { ...headers };
        delete cleanHeaders.host;
        delete cleanHeaders.Host;

        const response = await axios({
            method: method.toUpperCase(),
            url,
            headers: cleanHeaders,
            data: requestBody,
            timeout: Math.min(timeout, 30000),
            validateStatus: () => true, // Don't throw on any status code
            maxRedirects: 5,
            responseType: 'text'
        });

        const responseTime = Date.now() - startTime;

        // Parse response data if JSON
        let responseData = response.data;
        let contentType = response.headers['content-type'] || '';

        if (contentType.includes('application/json')) {
            try {
                responseData = typeof response.data === 'string'
                    ? JSON.parse(response.data)
                    : response.data;
            } catch {
                // Keep as string if parsing fails
            }
        }

        // Save to history if user is authenticated
        if (req.user && supabase) {
            const responseStr = typeof responseData === 'object'
                ? JSON.stringify(responseData)
                : String(responseData);

            await supabase.from('request_history').insert({
                user_id: req.user.userId,
                method: method.toUpperCase(),
                url,
                status_code: response.status,
                response_time: responseTime,
                response_size: responseStr.length
            }).catch(err => console.error('Failed to save history:', err));
        }

        res.json({
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: responseData,
            responseTime,
            size: typeof responseData === 'string'
                ? responseData.length
                : JSON.stringify(responseData).length
        });
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({ error: 'Request timeout' });
        }
        if (error.code === 'ENOTFOUND') {
            return res.status(404).json({ error: 'Host not found' });
        }
        console.error('Proxy error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get saved requests
router.get('/', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { data, error } = await supabase
            .from('requests')
            .select('*')
            .eq('user_id', req.user.userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        res.json({ requests: data || [] });
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// Save a request
router.post('/', authenticate, [
    body('name').trim().notEmpty().withMessage('Request name required'),
    body('method').isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
    body('url').notEmpty().withMessage('URL required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { name, method, url, headers, body: reqBody, query_params, collection_id, auth_type, auth_config } = req.body;

        const { data, error } = await supabase
            .from('requests')
            .insert({
                user_id: req.user.userId,
                name,
                method,
                url,
                headers: headers || {},
                body: reqBody || '',
                query_params: query_params || {},
                collection_id: collection_id || null,
                auth_type: auth_type || null,
                auth_config: auth_config || {}
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ request: data });
    } catch (error) {
        console.error('Save request error:', error);
        res.status(500).json({ error: 'Failed to save request' });
    }
});

// Update a request
router.put('/:id', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;
        const { name, method, url, headers, body: reqBody, query_params, collection_id, auth_type, auth_config } = req.body;

        const { data, error } = await supabase
            .from('requests')
            .update({
                name,
                method,
                url,
                headers: headers || {},
                body: reqBody || '',
                query_params: query_params || {},
                collection_id: collection_id || null,
                auth_type: auth_type || null,
                auth_config: auth_config || {},
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({ request: data });
    } catch (error) {
        console.error('Update request error:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
});

// Delete a request
router.delete('/:id', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;

        const { error } = await supabase
            .from('requests')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.userId);

        if (error) throw error;
        res.json({ message: 'Request deleted' });
    } catch (error) {
        console.error('Delete request error:', error);
        res.status(500).json({ error: 'Failed to delete request' });
    }
});

// Get request history
router.get('/history', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { limit = 100 } = req.query;

        const { data, error } = await supabase
            .from('request_history')
            .select('*')
            .eq('user_id', req.user.userId)
            .order('executed_at', { ascending: false })
            .limit(Math.min(parseInt(limit), 100));

        if (error) throw error;
        res.json({ history: data || [] });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

module.exports = router;
