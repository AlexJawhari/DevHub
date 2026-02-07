const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all collections for user
router.get('/', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { data, error } = await supabase
            .from('collections')
            .select('*')
            .eq('user_id', req.user.userId)
            .order('name');

        if (error) throw error;
        res.json({ collections: data || [] });
    } catch (error) {
        console.error('Get collections error:', error);
        res.status(500).json({ error: 'Failed to fetch collections' });
    }
});

// Create collection
router.post('/', authenticate, [
    body('name').trim().notEmpty().withMessage('Collection name required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { name, description, parent_id } = req.body;

        const { data, error } = await supabase
            .from('collections')
            .insert({
                user_id: req.user.userId,
                name,
                description: description || null,
                parent_id: parent_id || null
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ collection: data });
    } catch (error) {
        console.error('Create collection error:', error);
        res.status(500).json({ error: 'Failed to create collection' });
    }
});

// Update collection
router.put('/:id', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;
        const { name, description, parent_id } = req.body;

        const { data, error } = await supabase
            .from('collections')
            .update({
                name,
                description: description || null,
                parent_id: parent_id || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        res.json({ collection: data });
    } catch (error) {
        console.error('Update collection error:', error);
        res.status(500).json({ error: 'Failed to update collection' });
    }
});

// Delete collection
router.delete('/:id', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;

        const { error } = await supabase
            .from('collections')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.userId);

        if (error) throw error;
        res.json({ message: 'Collection deleted' });
    } catch (error) {
        console.error('Delete collection error:', error);
        res.status(500).json({ error: 'Failed to delete collection' });
    }
});

// Export collection as JSON
router.get('/:id/export', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;

        // Get collection
        const { data: collection, error: collError } = await supabase
            .from('collections')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .single();

        if (collError || !collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        // Get requests in collection
        const { data: requests, error: reqError } = await supabase
            .from('requests')
            .select('name, method, url, headers, body, query_params, auth_type, auth_config')
            .eq('collection_id', id)
            .eq('user_id', req.user.userId);

        if (reqError) throw reqError;

        const exportData = {
            name: collection.name,
            description: collection.description,
            exported_at: new Date().toISOString(),
            requests: requests || []
        };

        res.json(exportData);
    } catch (error) {
        console.error('Export collection error:', error);
        res.status(500).json({ error: 'Failed to export collection' });
    }
});

// Import collection from JSON
router.post('/import', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { name, description, requests: importRequests } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Collection name required' });
        }

        // Create collection
        const { data: collection, error: collError } = await supabase
            .from('collections')
            .insert({
                user_id: req.user.userId,
                name,
                description: description || null
            })
            .select()
            .single();

        if (collError) throw collError;

        // Import requests if provided
        if (importRequests && Array.isArray(importRequests) && importRequests.length > 0) {
            const requestsToInsert = importRequests.map(r => ({
                user_id: req.user.userId,
                collection_id: collection.id,
                name: r.name || 'Imported Request',
                method: r.method || 'GET',
                url: r.url || '',
                headers: r.headers || {},
                body: r.body || '',
                query_params: r.query_params || {},
                auth_type: r.auth_type || null,
                auth_config: r.auth_config || {}
            }));

            await supabase.from('requests').insert(requestsToInsert);
        }

        res.status(201).json({
            message: 'Collection imported successfully',
            collection
        });
    } catch (error) {
        console.error('Import collection error:', error);
        res.status(500).json({ error: 'Failed to import collection' });
    }
});

module.exports = router;
