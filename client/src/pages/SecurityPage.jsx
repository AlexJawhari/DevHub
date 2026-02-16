import { useState } from 'react';
import { FiShield, FiSearch, FiAlertTriangle, FiCheck, FiInfo, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { securityAPI } from '../services/api';

const SEVERITY_STYLES = {
    critical: 'severity-critical',
    high: 'severity-high',
    medium: 'severity-medium',
    low: 'severity-low',
    info: 'severity-info'
};

const SEVERITY_ICONS = {
    critical: FiAlertTriangle,
    high: FiAlertTriangle,
    medium: FiInfo,
    low: FiInfo,
    info: FiInfo
};

function SecurityPage() {
    const [url, setUrl] = useState('');
    const [scanType, setScanType] = useState('full');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    const handleScan = async () => {
        if (!url) {
            toast.error('Please enter a URL to scan');
            return;
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            toast.error('Please enter a valid URL');
            return;
        }

        setLoading(true);
        setResults(null);

        try {
            const response = await securityAPI.scan({ url, scanType });
            setResults(response.data);

            if (response.data.securityScore >= 80) {
                toast.success(`Security scan complete! Score: ${response.data.securityScore}/100`);
            } else if (response.data.securityScore >= 50) {
                toast.warning(`Security scan complete. Score: ${response.data.securityScore}/100`);
            } else {
                toast.error(`Security issues found. Score: ${response.data.securityScore}/100`);
            }
        } catch (error) {
            const message = error.response?.data?.error || 'Scan failed';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-amber-500';
        if (score >= 40) return 'text-orange-500';
        return 'text-red-500';
    };

    const getScoreLabel = (score) => {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Good';
        if (score >= 60) return 'Fair';
        if (score >= 40) return 'Poor';
        return 'Critical';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center mb-12">
                <h1 className="text-2xl font-bold">Security Scanner</h1>
            </div>

            {/* Scan Form */}
            <div className="card">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Enter URL to scan (e.g., https://example.com)"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-lg focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                            />
                        </div>

                        <div className="relative min-w-[200px]">
                            <select
                                value={scanType}
                                onChange={(e) => setScanType(e.target.value)}
                                className="w-full h-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 appearance-none cursor-pointer hover:border-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                            >
                                <option value="full">Full Scan</option>
                                <option value="headers">Headers Only</option>
                                <option value="ssl">SSL Only</option>
                                <option value="vulnerabilities">Vulnerabilities</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                        </div>
                    </div>

                    <button
                        onClick={handleScan}
                        disabled={loading}
                        className="w-full md:w-auto self-end btn-primary px-8 py-3 flex items-center justify-center gap-2 text-lg font-medium shadow-lg shadow-blue-500/20"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <FiShield className="text-xl" />
                                Start Security Scan
                            </>
                        )}
                    </button>
                </div>

                <p className="text-sm text-slate-400">
                    Scans for OWASP Top 10 (2025) vulnerabilities, security headers, SSL/TLS configuration, and more.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {[
                        { key: 'full', label: 'Full Scan', desc: 'Headers + SSL + Vulnerabilities + CORS' },
                        { key: 'headers', label: 'Headers Only', desc: 'Security header analysis' },
                        { key: 'ssl', label: 'SSL Only', desc: 'Certificate & TLS validation' },
                        { key: 'vulnerabilities', label: 'Vulnerabilities', desc: 'SQLi, XSS, sensitive data exposure' }
                    ].map((t) => (
                        <div
                            key={t.key}
                            onClick={() => setScanType(t.key)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all text-center ${scanType === t.key
                                ? 'bg-purple-500/15 border-purple-500/50 text-purple-300'
                                : 'border-slate-700 hover:border-slate-600 text-slate-400'
                                }`}
                        >
                            <div className="text-sm font-medium">{t.label}</div>
                            <div className="text-xs mt-1 opacity-70">{t.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="card text-center py-12">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Scanning...</h3>
                    <p className="text-slate-400 mt-2">Analyzing security headers, SSL, and vulnerabilities</p>
                </div>
            )}

            {/* Results */}
            {results && !loading && (
                <div className="space-y-6 animate-slide-up">
                    {/* Score Card */}
                    <div className="card gradient-border">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-medium text-slate-300">Security Score</h2>
                                <p className="text-sm text-slate-400 mt-1">{results.url}</p>
                            </div>

                            <div className="text-right">
                                <div className={`text-5xl font-bold ${getScoreColor(results.securityScore)}`}>
                                    {results.securityScore}
                                </div>
                                <div className={`text-sm ${getScoreColor(results.securityScore)}`}>
                                    {getScoreLabel(results.securityScore)}
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-5 gap-4 mt-6">
                            {Object.entries({
                                critical: 'Critical',
                                high: 'High',
                                medium: 'Medium',
                                low: 'Low',
                                info: 'Info'
                            }).map(([key, label]) => (
                                <div key={key} className="text-center">
                                    <div className={`text-2xl font-bold ${results.summary[key] > 0 ? SEVERITY_STYLES[key].replace('severity-', 'text-').replace('-', '-') : 'text-slate-500'
                                        }`}>
                                        {results.summary[key] || 0}
                                    </div>
                                    <div className="text-xs text-slate-400">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Findings */}
                    {results.findings && results.findings.length > 0 && (
                        <div className="card">
                            <h3 className="text-lg font-medium mb-4">
                                Findings ({results.findings.length})
                            </h3>

                            <div className="space-y-3">
                                {results.findings.map((finding, index) => {
                                    const Icon = SEVERITY_ICONS[finding.severity] || FiInfo;
                                    return (
                                        <div
                                            key={index}
                                            className={`p-4 rounded-lg ${SEVERITY_STYLES[finding.severity]}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Icon className="mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{finding.title}</span>
                                                        <span className="text-xs px-2 py-0.5 rounded bg-black/20">
                                                            {finding.severity.toUpperCase()}
                                                        </span>
                                                        {finding.owasp_category && (
                                                            <span className="text-xs px-2 py-0.5 rounded bg-black/20">
                                                                OWASP {finding.owasp_category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {finding.description && (
                                                        <p className="text-sm opacity-80 mt-1">{finding.description}</p>
                                                    )}
                                                    {finding.recommendation && (
                                                        <p className="text-sm mt-2">
                                                            <span className="font-medium">Fix: </span>
                                                            {finding.recommendation}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* No issues found */}
                    {results.findings && results.findings.length === 0 && (
                        <div className="card text-center py-8">
                            <FiCheck className="text-4xl text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No Issues Found</h3>
                            <p className="text-slate-400 mt-2">Great job! No security issues were detected.</p>
                        </div>
                    )}

                    {/* Recommendations */}
                    {results.recommendations && results.recommendations.length > 0 && (
                        <div className="card">
                            <h3 className="text-lg font-medium mb-4">Recommendations</h3>
                            <div className="space-y-2">
                                {results.recommendations.map((rec, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg">
                                        <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY_STYLES[rec.priority]}`}>
                                            {rec.priority}
                                        </span>
                                        <div>
                                            <p className="font-medium">{rec.title}</p>
                                            <p className="text-sm text-slate-400">{rec.action}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SecurityPage;
