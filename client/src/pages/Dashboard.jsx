import { useState, useEffect } from 'react';
import { FiFolder, FiSend, FiPlus, FiClock, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { requestAPI, collectionsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

function Dashboard() {
    const { user } = useAuthStore();
    const [collections, setCollections] = useState([]);
    const [savedRequests, setSavedRequests] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('collections');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [collectionsRes, requestsRes, historyRes] = await Promise.all([
                collectionsAPI.getAll(),
                requestAPI.getAll(),
                requestAPI.getHistory()
            ]);

            setCollections(collectionsRes.data.collections || []);
            setSavedRequests(requestsRes.data.requests || []);
            setHistory(historyRes.data.history || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRequest = async (id) => {
        try {
            await requestAPI.delete(id);
            setSavedRequests(savedRequests.filter(r => r.id !== id));
            toast.success('Request deleted');
        } catch (error) {
            toast.error('Failed to delete request');
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
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-slate-400">Welcome back, {user?.username}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <FiFolder className="text-blue-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{collections.length}</div>
                            <div className="text-sm text-slate-400">Collections</div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <FiSend className="text-green-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{savedRequests.length}</div>
                            <div className="text-sm text-slate-400">Saved Requests</div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <FiClock className="text-purple-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{history.length}</div>
                            <div className="text-sm text-slate-400">History Items</div>
                        </div>
                    </div>
                </div>

                <div className="card cursor-pointer hover:border-blue-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-500/20 rounded-lg flex items-center justify-center">
                            <FiPlus className="text-slate-400" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-400">New Collection</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700">
                {['collections', 'requests', 'history'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === tab
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="card">
                {activeTab === 'collections' && (
                    collections.length === 0 ? (
                        <p className="text-center text-slate-400 py-8">No collections yet. Create one to organize your requests.</p>
                    ) : (
                        <div className="space-y-2">
                            {collections.map((collection) => (
                                <div key={collection.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FiFolder className="text-blue-400" />
                                        <span>{collection.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {activeTab === 'requests' && (
                    savedRequests.length === 0 ? (
                        <p className="text-center text-slate-400 py-8">No saved requests yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {savedRequests.map((request) => (
                                <div key={request.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className={`method-${request.method.toLowerCase()} px-2 py-0.5 rounded text-xs font-medium`}>
                                            {request.method}
                                        </span>
                                        <span>{request.name}</span>
                                        <span className="text-slate-500 text-sm truncate max-w-xs">{request.url}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteRequest(request.id)}
                                        className="p-2 text-slate-400 hover:text-red-400"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {activeTab === 'history' && (
                    history.length === 0 ? (
                        <p className="text-center text-slate-400 py-8">No request history yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {history.slice(0, 20).map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className={`method-${item.method.toLowerCase()} px-2 py-0.5 rounded text-xs font-medium`}>
                                            {item.method}
                                        </span>
                                        <span className="truncate max-w-md">{item.url}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                        <span className={item.status_code < 400 ? 'text-green-500' : 'text-red-500'}>
                                            {item.status_code}
                                        </span>
                                        <span>{item.response_time}ms</span>
                                        <span>{new Date(item.executed_at).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

export default Dashboard;
