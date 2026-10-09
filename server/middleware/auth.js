const { supabase } = require('../config/database');
const { verifyToken } = require('../lib/auth');

const getSupabaseUser = async (token) => {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser(token);
    return error ? null : data.user;
};

const bearer = (req) => {
    const h = req.headers.authorization;
    return h && h.startsWith('Bearer ') ? h.slice(7) : null;
};

const authenticate = async (req, res, next) => {
    const token = bearer(req);
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const user = await verifyToken(token, getSupabaseUser);
    if (!user) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
};

// Optional auth - doesn't fail if no/invalid token, just doesn't set req.user
const optionalAuth = async (req, res, next) => {
    const token = bearer(req);
    if (token) req.user = (await verifyToken(token, getSupabaseUser)) || undefined;
    next();
};

module.exports = { authenticate, optionalAuth };
