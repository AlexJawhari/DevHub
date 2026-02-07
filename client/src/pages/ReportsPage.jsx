import { useState, useEffect } from 'react';
import { FiFileText, FiDownload, FiExternalLink, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { securityAPI, reportsAPI } from '../services/api';

function ReportsPage() {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchScans();
    }, []);

    const fetchScans = async () => {
        try {
            const response = await securityAPI.getScans();
            setScans(response.data.scans || []);
        } catch (error) {
            toast.error('Failed to fetch scan history');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async (scanId) => {
        try {
            const response = await reportsAPI.downloadPDF(scanId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `security-report-${scanId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Report downloaded');
        } catch (error) {
            toast.error('Failed to download report');
        }
    };

    const downloadJSON = async (scanId) => {
        try {
            const response = await reportsAPI.downloadJSON(scanId);
            const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `security-report-${scanId}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Report downloaded');
        } catch (error) {
            toast.error('Failed to download report');
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-amber-500';
        if (score >= 40) return 'text-orange-500';
        return 'text-red-500';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Security Reports</h1>

            {scans.length === 0 ? (
                <div className="card text-center py-12">
                    <FiFileText className="text-4xl text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No reports yet</h3>
                    <p className="text-slate-400 mt-2">
                        Run a security scan to generate your first report.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {scans.map((scan) => (
                        <div key={scan.id} className="card flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                                    <FiShield className="text-white text-xl" />
                                </div>

                                <div>
                                    <h3 className="font-medium truncate max-w-md">{scan.target_url}</h3>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                                        <span>{new Date(scan.started_at).toLocaleDateString()}</span>
                                        <span className="capitalize">{scan.scan_type} scan</span>
                                        <span className={`font-medium ${getScoreColor(scan.security_score)}`}>
                                            Score: {scan.security_score}/100
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => downloadPDF(scan.id)}
                                    className="btn-secondary flex items-center gap-2 text-sm"
                                >
                                    <FiDownload />
                                    PDF
                                </button>
                                <button
                                    onClick={() => downloadJSON(scan.id)}
                                    className="btn-secondary flex items-center gap-2 text-sm"
                                >
                                    <FiDownload />
                                    JSON
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ReportsPage;
