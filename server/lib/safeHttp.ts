import axios from 'axios';
import http from 'node:http';
import https from 'node:https';
import { assertPublicHost, assertPublicUrl, safeLookup } from './egressGuard';

/** The only HTTP client for requests to user-supplied URLs (proxy, scanner, monitor). */
export const safeHttp = axios.create({
    httpAgent: new http.Agent({ lookup: safeLookup }),
    httpsAgent: new https.Agent({ lookup: safeLookup }),
    proxy: false, // an HTTP_PROXY env var would bypass the connect-time check
    maxRedirects: 5,
    maxContentLength: 5 * 1024 * 1024,
    // IP-literal redirect targets skip DNS lookup, so each hop is checked here.
    beforeRedirect: (options) => assertPublicHost(String(options.hostname ?? options.host))
});

safeHttp.interceptors.request.use((config) => {
    assertPublicUrl(safeHttp.getUri(config));
    return config;
});
