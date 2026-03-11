const { URL } = require('url');
const {
    checkSecurityHeaders,
    validateSSL,
    scanVulnerabilities,
    scanSupplyChain,
    scanErrorHandling,
    scanAuthWeaknesses,
    analyzeCORS,
    calculateSecurityScore
} = require('./securityScanner');

async function runSecurityScan({ url, scanType = 'full' }) {
    const parsed = new URL(url);
    const allFindings = [];
    const results = {};

    if (scanType === 'full' || scanType === 'headers') {
        results.headers = await checkSecurityHeaders(url);
        allFindings.push(...(results.headers.findings || []));
    }

    if ((scanType === 'full' || scanType === 'ssl') && parsed.protocol === 'https:') {
        results.ssl = await validateSSL(parsed.hostname, parsed.port || 443);
        allFindings.push(...(results.ssl.findings || []));
    }

    if (scanType === 'full' || scanType === 'vulnerabilities') {
        const vulnFindings = await scanVulnerabilities(url);
        results.vulnerabilities = { findings: vulnFindings };
        allFindings.push(...vulnFindings);
    }

    if (scanType === 'full') {
        results.cors = await analyzeCORS(url);
        allFindings.push(...(results.cors.findings || []));

        const supplyChainFindings = await scanSupplyChain(url);
        results.supplyChain = { findings: supplyChainFindings };
        allFindings.push(...supplyChainFindings);

        const errorFindings = await scanErrorHandling(url);
        results.errorHandling = { findings: errorFindings };
        allFindings.push(...errorFindings);

        const authFindings = await scanAuthWeaknesses(url);
        results.authentication = { findings: authFindings };
        allFindings.push(...authFindings);
    }

    const securityScore = calculateSecurityScore(allFindings);

    const recommendations = allFindings
        .filter(f => f.recommendation)
        .sort((a, b) => {
            const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
            return order[a.severity] - order[b.severity];
        })
        .map(f => ({
            priority: f.severity,
            title: f.title,
            action: f.recommendation
        }));

    const summary = {
        total: allFindings.length,
        critical: allFindings.filter(f => f.severity === 'critical').length,
        high: allFindings.filter(f => f.severity === 'high').length,
        medium: allFindings.filter(f => f.severity === 'medium').length,
        low: allFindings.filter(f => f.severity === 'low').length,
        info: allFindings.filter(f => f.severity === 'info').length
    };

    return {
        results,
        findings: allFindings,
        securityScore,
        recommendations,
        summary
    };
}

module.exports = {
    runSecurityScan
};
