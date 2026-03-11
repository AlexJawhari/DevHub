const cron = require('node-cron');
const { supabase } = require('../config/database');
const { runSecurityScan } = require('../services/securityScanRunner');

async function runScheduledScans() {
    if (!supabase) {
        console.log('Skipping scheduled security scans - database not configured');
        return;
    }

    const now = new Date();

    try {
        const { data: schedules, error } = await supabase
            .from('security_schedules')
            .select('*')
            .eq('is_active', true)
            .lte('next_run_at', now.toISOString());

        if (error) {
            console.error('Failed to fetch schedules:', error);
            return;
        }

        if (!schedules || schedules.length === 0) {
            return;
        }

        for (const schedule of schedules) {
            const startedAt = new Date();
            try {
                const { findings, securityScore, recommendations } = await runSecurityScan({
                    url: schedule.target_url,
                    scanType: schedule.scan_type
                });

                const { data: scanRecord } = await supabase
                    .from('security_scans')
                    .insert({
                        user_id: schedule.user_id,
                        target_url: schedule.target_url,
                        scan_type: schedule.scan_type,
                        status: 'completed',
                        security_score: securityScore,
                        findings,
                        recommendations,
                        started_at: startedAt.toISOString(),
                        completed_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (scanRecord && findings.length > 0) {
                    const findingsToInsert = findings.map(f => ({
                        scan_id: scanRecord.id,
                        category: f.category,
                        severity: f.severity,
                        title: f.title,
                        description: f.description,
                        evidence: f.evidence || null,
                        recommendation: f.recommendation || null,
                        owasp_category: f.owasp_category || null,
                        cwe_id: f.cwe_id || null
                    }));

                    await supabase.from('security_findings').insert(findingsToInsert);
                }

                const nextRunAt = new Date(Date.now() + schedule.interval_minutes * 60000).toISOString();

                await supabase
                    .from('security_schedules')
                    .update({
                        last_run_at: new Date().toISOString(),
                        next_run_at: nextRunAt,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', schedule.id);
            } catch (scanError) {
                console.error('Scheduled scan error:', scanError);
                await supabase
                    .from('security_schedules')
                    .update({
                        last_run_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', schedule.id);
            }
        }
    } catch (error) {
        console.error('Run scheduled scans error:', error);
    }
}

function initSecurityScanJobs() {
    cron.schedule('*/5 * * * *', () => {
        console.log('Cron: Running scheduled security scans');
        runScheduledScans();
    });

    console.log('Security scan jobs initialized');

    setTimeout(() => {
        runScheduledScans();
    }, 15000);
}

module.exports = {
    initSecurityScanJobs,
    runScheduledScans
};
