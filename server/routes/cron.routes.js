const express = require('express');
const { isCronAuthorized } = require('../lib/cronAuth');
const { runMonitoringChecks, cleanupOldResults } = require('../jobs/monitoringJobs');
const { runScheduledScans } = require('../jobs/securityScanJobs');

const router = express.Router();
let running = false; // ponytail: per-process guard, use a DB lock if the API ever runs on several instances

// Called every 5 minutes by .github/workflows/cron.yml
router.post('/run', async (req, res) => {
    if (!isCronAuthorized(req.get('x-cron-secret'), process.env.CRON_SECRET)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (running) return res.status(202).json({ status: 'already running' });
    running = true;
    try {
        await runMonitoringChecks();
        await runScheduledScans();
        if (new Date().getUTCHours() === 0 && new Date().getUTCMinutes() < 5) await cleanupOldResults();
        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Cron run error:', error);
        res.status(500).json({ error: 'Cron run failed' });
    } finally {
        running = false;
    }
});

module.exports = router;
