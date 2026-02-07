const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: { error: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiter for security scans (resource intensive)
const scanLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 scans per minute
    message: { error: 'Too many scan requests, please wait before scanning again' },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiter for proxy requests
const proxyLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: { error: 'Too many proxy requests, please slow down' },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { apiLimiter, authLimiter, scanLimiter, proxyLimiter };
