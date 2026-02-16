require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth.routes');
const requestRoutes = require('./routes/requests.routes');
const collectionRoutes = require('./routes/collections.routes');
const monitoringRoutes = require('./routes/monitoring.routes');
const securityRoutes = require('./routes/security.routes');
const environmentRoutes = require('./routes/environments.routes');
const reportRoutes = require('./routes/reports.routes');

const errorHandler = require('./middleware/errorHandler');
const { initMonitoringJobs } = require('./jobs/monitoringJobs');

const app = express();
const server = http.createServer(app);

// Allowed origins
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'https://devhub-steel.vercel.app',
    'https://devhub-git-main-alexjawharis-projects.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

// WebSocket setup for real-time updates
const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Make io accessible to routes
app.set('io', io);

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

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

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`DevHub server running on port ${PORT}`);

    // Initialize monitoring cron jobs
    initMonitoringJobs(io);
});

module.exports = { app, io };
