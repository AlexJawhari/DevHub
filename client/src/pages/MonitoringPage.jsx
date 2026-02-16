import { useState, useEffect } from 'react';
import { FiPlus, FiActivity, FiCheck, FiX, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { monitoringAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function MonitoringPage() {
    const [endpoints, setEndpoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchEndpoints();
    }, []);

    const fetchEndpoints = async () => {
        try {
            const response = await monitoringAPI.getEndpoints();
            setEndpoints(response.data.endpoints || []);
        } catch (error) {
            toast.error('Failed to fetch endpoints');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (endpointId) => {
        try {
            const response = await monitoringAPI.getStats(endpointId);
            setStats(response.data);
        } catch (error) {
            toast.error('Failed to fetch stats');
        }
    };

    const handleSelectEndpoint = (endpoint) => {
        setSelectedEndpoint(endpoint);
        fetchStats(endpoint.id);
        fetchResults(endpoint.id);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this endpoint?')) return;

        try {
            await monitoringAPI.deleteEndpoint(id);
            setEndpoints(endpoints.filter(e => e.id !== id));
            if (selectedEndpoint?.id === id) {
                setSelectedEndpoint(null);
                setStats(null);
            }
            toast.success('Endpoint removed');
        } catch (error) {
            toast.error('Failed to remove endpoint');
        }
    };

    const [chartData, setChartData] = useState([]);

    const fetchResults = async (endpointId) => {
        try {
            const response = await monitoringAPI.getResults(endpointId);
            const results = response.data?.results || [];
            setChartData(
                results.slice(-50).map((r) => ({
                    time: new Date(r.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    ms: r.response_time || 0
                }))
            );
        } catch {
            setChartData([]);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">API Monitoring</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <FiPlus />
                    Add Endpoint
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Endpoints List */}
                <div className="card lg:col-span-1">
                    <h3 className="text-lg font-medium mb-4">Monitored Endpoints</h3>

                    {endpoints.length === 0 ? (
                        <div className="text-center py-8">
                            <FiActivity className="text-3xl text-slate-500 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No endpoints monitored yet.</p>
                            <p className="text-slate-500 text-xs mt-1">Click &ldquo;Add Endpoint&rdquo; to start monitoring an API.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {endpoints.map((endpoint) => (
                                <div
                                    key={endpoint.id}
                                    onClick={() => handleSelectEndpoint(endpoint)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all ${selectedEndpoint?.id === endpoint.id
                                        ? 'bg-blue-500/20 border border-blue-500/50'
                                        : 'bg-slate-800 hover:bg-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {endpoint.is_active ? (
                                                <FiCheck className="text-green-500" />
                                            ) : (
                                                <FiX className="text-slate-500" />
                                            )}
                                            <span className="font-medium truncate">{endpoint.name}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(endpoint.id);
                                            }}
                                            className="p-1 text-slate-400 hover:text-red-400"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate mt-1">{endpoint.url}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stats Panel */}
                <div className="card lg:col-span-2">
                    {selectedEndpoint && stats ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium">{selectedEndpoint.name}</h3>
                                    <p className="text-sm text-slate-400">{selectedEndpoint.url}</p>
                                </div>
                                <button
                                    onClick={() => fetchStats(selectedEndpoint.id)}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <FiRefreshCw />
                                    Refresh
                                </button>
                            </div>

                            {/* Uptime Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                {['24h', '7d', '30d'].map((period) => (
                                    <div key={period} className="bg-slate-800 rounded-lg p-4 text-center">
                                        <div className={`text-2xl font-bold ${(stats.stats[period]?.uptime || 0) >= 99 ? 'text-green-500' :
                                            (stats.stats[period]?.uptime || 0) >= 95 ? 'text-amber-500' : 'text-red-500'
                                            }`}>
                                            {stats.stats[period]?.uptime || 0}%
                                        </div>
                                        <div className="text-xs text-slate-400">Uptime ({period})</div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {stats.stats[period]?.avgResponseTime || 0}ms avg
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Response Time Chart */}
                            <div className="bg-slate-800 rounded-lg p-4">
                                <h4 className="text-sm font-medium mb-4">Response Time (Last 24h)</h4>
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={192}>
                                        <LineChart data={chartData}>
                                            <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit="ms" width={50} />
                                            <Tooltip
                                                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                                                labelStyle={{ color: '#94a3b8' }}
                                            />
                                            <Line type="monotone" dataKey="ms" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-48 flex items-center justify-center text-slate-500">
                                        <FiActivity className="text-4xl" />
                                        <span className="ml-2">No check data yet</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-slate-500">
                            <FiActivity className="text-4xl mr-3" />
                            <span>Select an endpoint to view stats</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Endpoint Modal */}
            {showAddModal && (
                <AddEndpointModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={(endpoint) => {
                        setEndpoints([endpoint, ...endpoints]);
                        setShowAddModal(false);
                    }}
                />
            )}
        </div>
    );
}

function AddEndpointModal({ onClose, onAdd }) {
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        method: 'GET',
        expected_status_code: 200,
        check_interval: 5
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await monitoringAPI.addEndpoint(formData);
            onAdd(response.data.endpoint);
            toast.success('Endpoint added to monitoring');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add endpoint');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="card w-full max-w-md animate-slide-up">
                <h3 className="text-lg font-medium mb-4">Add Endpoint</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input-field"
                            placeholder="My API"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">URL</label>
                        <input
                            type="url"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            className="input-field"
                            placeholder="https://api.example.com/health"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Method</label>
                            <select
                                value={formData.method}
                                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                className="input-field"
                            >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="HEAD">HEAD</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Expected Status</label>
                            <input
                                type="number"
                                value={formData.expected_status_code}
                                onChange={(e) => setFormData({ ...formData, expected_status_code: parseInt(e.target.value) })}
                                className="input-field"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Check Interval (minutes)</label>
                        <select
                            value={formData.check_interval}
                            onChange={(e) => setFormData({ ...formData, check_interval: parseInt(e.target.value) })}
                            className="input-field"
                        >
                            <option value={1}>1 minute</option>
                            <option value={5}>5 minutes</option>
                            <option value={15}>15 minutes</option>
                            <option value={60}>1 hour</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1">
                            {loading ? 'Adding...' : 'Add Endpoint'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default MonitoringPage;
