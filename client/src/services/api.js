import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Critical Check: Detect if user accidentally set API_URL to the GitHub repo
if (API_URL.includes('github.com')) {
    console.error('CRITICAL MISCONFIGURATION: VITE_API_URL is set to a GitHub URL instead of your backend!');
    setTimeout(() => {
        // Use a simple alert or toast if available (we'll import toast in a sec)
        // For now, console error is key, but let's try to notify user visibly
        import('react-toastify').then(({ toast }) => {
            toast.error(
                'CRITICAL: API Configuration Error. You are pointing to GitHub, not your backend. Please check Vercel settings.',
                { autoClose: false, closeOnClick: false }
            );
        });
    }, 1000);
}

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me')
};

// Request API
export const requestAPI = {
    proxy: (data) => api.post('/requests/proxy', data),
    getAll: () => api.get('/requests'),
    save: (data) => api.post('/requests', data),
    update: (id, data) => api.put(`/requests/${id}`, data),
    delete: (id) => api.delete(`/requests/${id}`),
    getHistory: () => api.get('/requests/history')
};

// Collections API
export const collectionsAPI = {
    getAll: () => api.get('/collections'),
    create: (data) => api.post('/collections', data),
    update: (id, data) => api.put(`/collections/${id}`, data),
    delete: (id) => api.delete(`/collections/${id}`),
    export: (id) => api.get(`/collections/${id}/export`),
    import: (data) => api.post('/collections/import', data)
};

// Monitoring API
export const monitoringAPI = {
    getEndpoints: () => api.get('/monitoring/endpoints'),
    addEndpoint: (data) => api.post('/monitoring/endpoints', data),
    updateEndpoint: (id, data) => api.put(`/monitoring/endpoints/${id}`, data),
    deleteEndpoint: (id) => api.delete(`/monitoring/endpoints/${id}`),
    getResults: (endpointId, params) => api.get(`/monitoring/results/${endpointId}`, { params }),
    getStats: (endpointId) => api.get(`/monitoring/stats/${endpointId}`)
};

// Security API
export const securityAPI = {
    scan: (data) => api.post('/security/scan', data),
    getScans: () => api.get('/security/scans'),
    getScan: (id) => api.get(`/security/scans/${id}`),
    checkHeaders: (data) => api.post('/security/headers', data),
    checkSSL: (data) => api.post('/security/ssl', data),
    analyzeJWT: (data) => api.post('/security/jwt', data),
    analyzeCORS: (data) => api.post('/security/cors', data)
};

// Reports API
export const reportsAPI = {
    get: (scanId) => api.get(`/reports/${scanId}`),
    downloadPDF: (scanId) => api.get(`/reports/${scanId}/pdf`, { responseType: 'blob' }),
    downloadJSON: (scanId) => api.get(`/reports/${scanId}/json`)
};

// Environments API
export const environmentsAPI = {
    getAll: () => api.get('/environments'),
    create: (data) => api.post('/environments', data),
    update: (id, data) => api.put(`/environments/${id}`, data),
    delete: (id) => api.delete(`/environments/${id}`),
    activate: (id) => api.post(`/environments/${id}/activate`)
};

export default api;
