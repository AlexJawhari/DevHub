require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const requestRoutes = require('./routes/requests.routes');
const collectionRoutes = require('./routes/collections.routes');
const monitoringRoutes = require('./routes/monitoring.routes');
const securityRoutes = require('./routes/security.routes');
const environmentRoutes = require('./routes/environments.routes');
const reportRoutes = require('./routes/reports.routes');

const errorHandler = require('./middleware/errorHandler');
const cronRoutes = require('./routes/cron.routes');

const app = express();
// Trust proxy is required for rate limiting behind proxies (Render/Vercel)
app.set('trust proxy', 1);

// Allowed origins
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'https://devhub-steel.vercel.app',
    'https://devhub-git-main-alexjawharis-projects.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://vercel.live"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
            "connect-src": ["'self'", "https://devhub-ndjh.onrender.com", "https://vitals.vercel-insights.com"]
        },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hidePoweredBy: true
}));

// Custom middleware to further obfuscate/remove headers
app.use((req, res, next) => {
    res.removeHeader('X-Powered-By');
    res.setHeader('Server', 'Web Server'); // Obfuscate Vercel/Express
    next();
});

// CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/cron', cronRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`DevHub server running on port ${PORT}`));
}

module.exports = app;
