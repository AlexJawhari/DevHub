const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all environments for user
router.get('/', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { data, error } = await supabase
            .from('environments')
            .select('*')
            .eq('user_id', req.user.userId)
            .order('name');

        if (error) throw error;
        res.json({ environments: data || [] });
    } catch (error) {
        console.error('Get environments error:', error);
        res.status(500).json({ error: 'Failed to fetch environments' });
    }
});

// Create environment
router.post('/', authenticate, [
    body('name').trim().notEmpty().withMessage('Environment name required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { name, variables = {} } = req.body;

        const { data, error } = await supabase
            .from('environments')
            .insert({
                user_id: req.user.userId,
                name,
                variables,
                is_active: false
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ environment: data });
    } catch (error) {
        console.error('Create environment error:', error);
        res.status(500).json({ error: 'Failed to create environment' });
    }
});

// Update environment
router.put('/:id', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;
        const { name, variables } = req.body;

        const updateData = { updated_at: new Date().toISOString() };
        if (name !== undefined) updateData.name = name;
        if (variables !== undefined) updateData.variables = variables;

        const { data, error } = await supabase
            .from('environments')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Environment not found' });
        }

        res.json({ environment: data });
    } catch (error) {
        console.error('Update environment error:', error);
        res.status(500).json({ error: 'Failed to update environment' });
    }
});

// Delete environment
router.delete('/:id', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;

        const { error } = await supabase
            .from('environments')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.userId);

        if (error) throw error;
        res.json({ message: 'Environment deleted' });
    } catch (error) {
        console.error('Delete environment error:', error);
        res.status(500).json({ error: 'Failed to delete environment' });
    }
});

// Activate environment
router.post('/:id/activate', authenticate, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;

        // Deactivate all environments for user
        await supabase
            .from('environments')
            .update({ is_active: false })
            .eq('user_id', req.user.userId);

        // Activate the selected one
        const { data, error } = await supabase
            .from('environments')
            .update({ is_active: true })
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Environment not found' });
        }

        res.json({ environment: data });
    } catch (error) {
        console.error('Activate environment error:', error);
        res.status(500).json({ error: 'Failed to activate environment' });
    }
});

module.exports = router;
