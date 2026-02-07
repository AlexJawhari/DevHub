const cron = require('node-cron');
const axios = require('axios');
const { supabase } = require('../config/database');

let io = null;

/**
 * Check a single endpoint and record the result
 */
async function checkEndpoint(endpoint) {
    const startTime = Date.now();

    try {
        const response = await axios({
            method: endpoint.method || 'GET',
            url: endpoint.url,
            headers: endpoint.headers || {},
            timeout: 30000,
            validateStatus: () => true
        });

        const responseTime = Date.now() - startTime;
        const isUp = response.status === endpoint.expected_status_code;

        // Record result
        if (supabase) {
            await supabase.from('monitoring_results').insert({
                endpoint_id: endpoint.id,
                status_code: response.status,
                response_time: responseTime,
                is_up: isUp,
                error_message: isUp ? null : `Expected ${endpoint.expected_status_code}, got ${response.status}`
            });
        }

        // Emit real-time update
        if (io) {
            io.emit('monitoring:update', {
                endpointId: endpoint.id,
                status: isUp ? 'up' : 'down',
                statusCode: response.status,
                responseTime,
                checkedAt: new Date().toISOString()
            });
        }

        return { isUp, responseTime, statusCode: response.status };
    } catch (error) {
        const responseTime = Date.now() - startTime;

        // Record failure
        if (supabase) {
            await supabase.from('monitoring_results').insert({
                endpoint_id: endpoint.id,
                status_code: null,
                response_time: responseTime,
                is_up: false,
                error_message: error.message
            });
        }

        // Emit real-time update
        if (io) {
            io.emit('monitoring:update', {
                endpointId: endpoint.id,
                status: 'down',
                error: error.message,
                responseTime,
                checkedAt: new Date().toISOString()
            });
        }

        return { isUp: false, responseTime, error: error.message };
    }
}

/**
 * Run monitoring checks for all active endpoints
 */
async function runMonitoringChecks() {
    if (!supabase) {
        console.log('Skipping monitoring checks - database not configured');
        return;
    }

    try {
        // Get all active endpoints
        const { data: endpoints, error } = await supabase
            .from('monitored_endpoints')
            .select('*')
            .eq('is_active', true);

        if (error) {
            console.error('Failed to fetch endpoints:', error);
            return;
        }

        if (!endpoints || endpoints.length === 0) {
            return;
        }

        console.log(`Running monitoring checks for ${endpoints.length} endpoints`);

        // Check each endpoint
        for (const endpoint of endpoints) {
            await checkEndpoint(endpoint);
        }
    } catch (error) {
        console.error('Monitoring check error:', error);
    }
}

/**
 * Clean up old monitoring results (keep last 7 days)
 */
async function cleanupOldResults() {
    if (!supabase) return;

    try {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { error } = await supabase
            .from('monitoring_results')
            .delete()
            .lt('checked_at', cutoff);

        if (error) {
            console.error('Cleanup error:', error);
        } else {
            console.log('Cleaned up old monitoring results');
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

/**
 * Initialize monitoring cron jobs
 */
function initMonitoringJobs(socketIo) {
    io = socketIo;

    // Run monitoring checks every 5 minutes
    cron.schedule('*/5 * * * *', () => {
        console.log('Cron: Running monitoring checks');
        runMonitoringChecks();
    });

    // Clean up old results daily at midnight
    cron.schedule('0 0 * * *', () => {
        console.log('Cron: Cleaning up old monitoring results');
        cleanupOldResults();
    });

    console.log('Monitoring jobs initialized');

    // Run initial check after 10 seconds
    setTimeout(() => {
        runMonitoringChecks();
    }, 10000);
}

module.exports = {
    initMonitoringJobs,
    runMonitoringChecks,
    checkEndpoint
};
