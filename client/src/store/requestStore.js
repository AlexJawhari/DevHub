import { create } from 'zustand';

export const useRequestStore = create((set, get) => ({
    // Current request state
    method: 'GET',
    url: '',
    headers: [{ key: '', value: '', enabled: true }],
    body: '',
    bodyType: 'json', // json, form, raw
    queryParams: [{ key: '', value: '', enabled: true }],
    authType: 'none', // none, bearer, basic, apikey
    authConfig: {},

    // Response state
    response: null,
    loading: false,
    error: null,

    // Actions
    setMethod: (method) => set({ method }),
    setUrl: (url) => set({ url }),
    setHeaders: (headers) => set({ headers }),
    setBody: (body) => set({ body }),
    setBodyType: (bodyType) => set({ bodyType }),
    setQueryParams: (queryParams) => set({ queryParams }),
    setAuthType: (authType) => set({ authType }),
    setAuthConfig: (authConfig) => set({ authConfig }),
    setResponse: (response) => set({ response }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    addHeader: () => set((state) => ({
        headers: [...state.headers, { key: '', value: '', enabled: true }]
    })),

    removeHeader: (index) => set((state) => ({
        headers: state.headers.filter((_, i) => i !== index)
    })),

    updateHeader: (index, field, value) => set((state) => ({
        headers: state.headers.map((h, i) =>
            i === index ? { ...h, [field]: value } : h
        )
    })),

    addQueryParam: () => set((state) => ({
        queryParams: [...state.queryParams, { key: '', value: '', enabled: true }]
    })),

    removeQueryParam: (index) => set((state) => ({
        queryParams: state.queryParams.filter((_, i) => i !== index)
    })),

    updateQueryParam: (index, field, value) => set((state) => ({
        queryParams: state.queryParams.map((p, i) =>
            i === index ? { ...p, [field]: value } : p
        )
    })),

    reset: () => set({
        method: 'GET',
        url: '',
        headers: [{ key: '', value: '', enabled: true }],
        body: '',
        bodyType: 'json',
        queryParams: [{ key: '', value: '', enabled: true }],
        authType: 'none',
        authConfig: {},
        response: null,
        loading: false,
        error: null
    }),

    // Load saved request
    loadRequest: (request) => set({
        method: request.method || 'GET',
        url: request.url || '',
        headers: request.headers ? Object.entries(request.headers).map(([key, value]) => ({
            key, value, enabled: true
        })) : [{ key: '', value: '', enabled: true }],
        body: request.body || '',
        queryParams: request.query_params ? Object.entries(request.query_params).map(([key, value]) => ({
            key, value, enabled: true
        })) : [{ key: '', value: '', enabled: true }],
        authType: request.auth_type || 'none',
        authConfig: request.auth_config || {}
    }),

    // Build request for API
    buildRequest: () => {
        const state = get();

        // Build headers object from array
        const headers = {};
        state.headers.filter(h => h.enabled && h.key).forEach(h => {
            headers[h.key] = h.value;
        });

        // Add auth headers
        if (state.authType === 'bearer' && state.authConfig.token) {
            headers['Authorization'] = `Bearer ${state.authConfig.token}`;
        } else if (state.authType === 'basic' && state.authConfig.username) {
            const base64 = btoa(`${state.authConfig.username}:${state.authConfig.password || ''}`);
            headers['Authorization'] = `Basic ${base64}`;
        } else if (state.authType === 'apikey' && state.authConfig.key) {
            headers[state.authConfig.headerName || 'X-API-Key'] = state.authConfig.key;
        }

        // Build query params
        const params = new URLSearchParams();
        state.queryParams.filter(p => p.enabled && p.key).forEach(p => {
            params.append(p.key, p.value);
        });

        let fullUrl = state.url;
        const paramString = params.toString();
        if (paramString) {
            fullUrl += (fullUrl.includes('?') ? '&' : '?') + paramString;
        }

        return {
            method: state.method,
            url: fullUrl,
            headers,
            body: ['POST', 'PUT', 'PATCH'].includes(state.method) ? state.body : undefined
        };
    }
}));
