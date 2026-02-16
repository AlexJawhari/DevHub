import { useState } from 'react';
import { FiSend, FiPlus, FiTrash2, FiClock, FiDatabase, FiZap, FiInfo } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useRequestStore } from '../store/requestStore';
import { requestAPI } from '../services/api';
import ResponseViewer from '../components/request/ResponseViewer';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

const METHOD_COLORS = {
    GET: 'method-get',
    POST: 'method-post',
    PUT: 'method-put',
    DELETE: 'method-delete',
    PATCH: 'method-patch',
    HEAD: 'method-get',
    OPTIONS: 'method-get'
};

function RequestPage() {
    const {
        method, setMethod,
        url, setUrl,
        headers, addHeader, removeHeader, updateHeader,
        body, setBody,
        queryParams, addQueryParam, removeQueryParam, updateQueryParam,
        authType, setAuthType, authConfig, setAuthConfig,
        response, setResponse,
        loading, setLoading,
        buildRequest
    } = useRequestStore();

    const [activeTab, setActiveTab] = useState('params');

    const handleSend = async () => {
        if (!url) {
            toast.error('Please enter a URL');
            return;
        }

        setLoading(true);
        setResponse(null);

        try {
            const requestData = buildRequest();
            const result = await requestAPI.proxy(requestData);
            setResponse(result.data);
        } catch (error) {
            let message;
            let hint;
            if (error.code === 'ERR_NETWORK' || !error.response) {
                message = 'Could not reach the DevHub backend server.';
                hint = 'The backend may be starting up (free tier cold start takes ~30s). Please wait and try again.';
            } else {
                message = error.response?.data?.error || error.message;
                hint = error.response?.data?.hint || null;
            }
            toast.error(`Request failed: ${message}`);
            setResponse({
                error: true,
                message,
                hint,
                status: error.response?.status
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col gap-5">
            <div>
                <h1 className="text-2xl font-bold">API Tester</h1>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                    <FiInfo className="shrink-0" />
                    <span>Enter any public API URL and click Send.</span>
                    <button
                        onClick={() => {
                            setMethod('GET');
                            setUrl('https://jsonplaceholder.typicode.com/posts');
                            toast.info('Example loaded — click Send!');
                        }}
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <FiZap className="text-xs" />
                        Try Example
                    </button>
                </div>
            </div>

            {/* Request URL Bar */}
            <div className="flex gap-2">
                <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className={`px-4 py-2 rounded-lg font-medium border-0 cursor-pointer ${METHOD_COLORS[method]}`}
                >
                    {HTTP_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>

                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://api.example.com/users"
                    className="input-field flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />

                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="btn-primary flex items-center gap-2 px-6"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <FiSend />
                            Send
                        </>
                    )}
                </button>
            </div>

            <div className="flex-1 grid lg:grid-cols-2 gap-6 min-h-0">
                {/* Request Configuration */}
                <div className="card flex flex-col min-h-0">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-700 mb-4">
                        {['params', 'headers', 'body', 'auth'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-slate-400 hover:text-white'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-auto">
                        {/* Query Params Tab */}
                        {activeTab === 'params' && (
                            <div className="space-y-2">
                                {queryParams.map((param, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <input
                                            type="checkbox"
                                            checked={param.enabled}
                                            onChange={(e) => updateQueryParam(index, 'enabled', e.target.checked)}
                                            className="w-4 h-4 rounded"
                                        />
                                        <input
                                            type="text"
                                            value={param.key}
                                            onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                                            placeholder="Key"
                                            className="input-field flex-1"
                                        />
                                        <input
                                            type="text"
                                            value={param.value}
                                            onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                                            placeholder="Value"
                                            className="input-field flex-1"
                                        />
                                        <button
                                            onClick={() => removeQueryParam(index)}
                                            className="p-2 text-slate-400 hover:text-red-400"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={addQueryParam}
                                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400"
                                >
                                    <FiPlus /> Add Parameter
                                </button>
                            </div>
                        )}

                        {/* Headers Tab */}
                        {activeTab === 'headers' && (
                            <div className="space-y-2">
                                {headers.map((header, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <input
                                            type="checkbox"
                                            checked={header.enabled}
                                            onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                                            className="w-4 h-4 rounded"
                                        />
                                        <input
                                            type="text"
                                            value={header.key}
                                            onChange={(e) => updateHeader(index, 'key', e.target.value)}
                                            placeholder="Header Name"
                                            className="input-field flex-1"
                                            list="common-headers"
                                        />
                                        <input
                                            type="text"
                                            value={header.value}
                                            onChange={(e) => updateHeader(index, 'value', e.target.value)}
                                            placeholder="Value"
                                            className="input-field flex-1"
                                        />
                                        <button
                                            onClick={() => removeHeader(index)}
                                            className="p-2 text-slate-400 hover:text-red-400"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={addHeader}
                                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400"
                                >
                                    <FiPlus /> Add Header
                                </button>

                                <datalist id="common-headers">
                                    <option value="Content-Type" />
                                    <option value="Authorization" />
                                    <option value="Accept" />
                                    <option value="User-Agent" />
                                    <option value="Cache-Control" />
                                    <option value="X-API-Key" />
                                </datalist>
                            </div>
                        )}

                        {/* Body Tab */}
                        {activeTab === 'body' && (
                            <div className="h-full flex flex-col">
                                <div className="text-xs text-slate-400 mb-2">
                                    {['POST', 'PUT', 'PATCH'].includes(method)
                                        ? 'Request body (JSON)'
                                        : 'Body is only sent with POST, PUT, and PATCH requests'}
                                </div>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder='{"key": "value"}'
                                    className="input-field flex-1 font-mono text-sm resize-none"
                                    disabled={!['POST', 'PUT', 'PATCH'].includes(method)}
                                />
                            </div>
                        )}

                        {/* Auth Tab */}
                        {activeTab === 'auth' && (
                            <div className="space-y-4">
                                <select
                                    value={authType}
                                    onChange={(e) => setAuthType(e.target.value)}
                                    className="input-field"
                                >
                                    <option value="none">No Auth</option>
                                    <option value="bearer">Bearer Token</option>
                                    <option value="basic">Basic Auth</option>
                                    <option value="apikey">API Key</option>
                                </select>

                                {authType === 'bearer' && (
                                    <input
                                        type="text"
                                        value={authConfig.token || ''}
                                        onChange={(e) => setAuthConfig({ ...authConfig, token: e.target.value })}
                                        placeholder="Enter Bearer Token"
                                        className="input-field font-mono text-sm"
                                    />
                                )}

                                {authType === 'basic' && (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={authConfig.username || ''}
                                            onChange={(e) => setAuthConfig({ ...authConfig, username: e.target.value })}
                                            placeholder="Username"
                                            className="input-field"
                                        />
                                        <input
                                            type="password"
                                            value={authConfig.password || ''}
                                            onChange={(e) => setAuthConfig({ ...authConfig, password: e.target.value })}
                                            placeholder="Password"
                                            className="input-field"
                                        />
                                    </div>
                                )}

                                {authType === 'apikey' && (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={authConfig.headerName || ''}
                                            onChange={(e) => setAuthConfig({ ...authConfig, headerName: e.target.value })}
                                            placeholder="Header Name (e.g., X-API-Key)"
                                            className="input-field"
                                        />
                                        <input
                                            type="text"
                                            value={authConfig.key || ''}
                                            onChange={(e) => setAuthConfig({ ...authConfig, key: e.target.value })}
                                            placeholder="API Key Value"
                                            className="input-field font-mono text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Response Viewer */}
                <div className="card flex flex-col min-h-0">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        Response
                        {response && !response.error && (
                            <div className="flex items-center gap-4 ml-auto text-sm">
                                <span className="flex items-center gap-1 text-slate-400">
                                    <FiClock className="text-xs" />
                                    {response.responseTime}ms
                                </span>
                                <span className="flex items-center gap-1 text-slate-400">
                                    <FiDatabase className="text-xs" />
                                    {(response.size / 1024).toFixed(2)} KB
                                </span>
                            </div>
                        )}
                    </h3>

                    <div className="flex-1 overflow-auto">
                        <ResponseViewer response={response} loading={loading} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RequestPage;
