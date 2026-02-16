import { FiAlertCircle } from 'react-icons/fi';

function ResponseViewer({ response, loading }) {
    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Sending request...</p>
                </div>
            </div>
        );
    }

    if (!response) {
        return (
            <div className="h-full flex items-center justify-center text-slate-500">
                <p>Send a request to see the response</p>
            </div>
        );
    }

    if (response.error) {
        return (
            <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-xl space-y-4">
                <div className="flex items-center gap-3 text-red-400">
                    <FiAlertCircle className="text-xl shrink-0" />
                    <h3 className="font-bold text-lg">Request Failed</h3>
                </div>

                <p className="text-slate-300 leading-relaxed pl-1">{response.message}</p>

                {response.hint && (
                    <div className="flex gap-3 bg-red-500/5 p-4 rounded-lg border border-red-500/10">
                        <span className="text-xl">💡</span>
                        <div className="text-sm text-slate-300">
                            <span className="font-bold text-slate-200 block mb-1">Suggestion</span>
                            {response.hint}
                        </div>
                    </div>
                )}

                {/* Retry Button if it looks like a connection error */}
                {(response.status === 0 || !response.status) && (
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-300 px-4 py-2 rounded-lg transition-colors border border-red-500/20"
                    >
                        Reload Page to Retry Connection
                    </button>
                )}
            </div>
        );
    }

    const getStatusColor = (status) => {
        if (status >= 200 && status < 300) return 'text-green-500 bg-green-500/20';
        if (status >= 300 && status < 400) return 'text-amber-500 bg-amber-500/20';
        if (status >= 400 && status < 500) return 'text-orange-500 bg-orange-500/20';
        return 'text-red-500 bg-red-500/20';
    };

    const formatJSON = (data) => {
        try {
            if (typeof data === 'object') {
                return JSON.stringify(data, null, 2);
            }
            return JSON.stringify(JSON.parse(data), null, 2);
        } catch {
            return String(data);
        }
    };

    return (
        <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-lg font-mono font-medium ${getStatusColor(response.status)}`}>
                    {response.status} {response.statusText}
                </span>
            </div>

            {/* Headers Toggle */}
            <details className="group">
                <summary className="cursor-pointer text-sm text-slate-400 hover:text-white">
                    Response Headers ({Object.keys(response.headers || {}).length})
                </summary>
                <div className="mt-2 p-3 bg-slate-900 rounded-lg text-xs font-mono overflow-x-auto">
                    {Object.entries(response.headers || {}).map(([key, value]) => (
                        <div key={key} className="flex">
                            <span className="text-purple-400">{key}:</span>
                            <span className="text-slate-300 ml-2">{value}</span>
                        </div>
                    ))}
                </div>
            </details>

            {/* Body */}
            <div className="bg-slate-900 rounded-lg overflow-auto max-h-96">
                <pre className="p-4 text-sm font-mono text-slate-300 whitespace-pre-wrap">
                    {formatJSON(response.data)}
                </pre>
            </div>
        </div>
    );
}

export default ResponseViewer;
