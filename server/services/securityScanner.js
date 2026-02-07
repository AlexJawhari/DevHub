const axios = require('axios');
const tls = require('tls');
const { URL } = require('url');

// Security header checks with severity and recommendations
const SECURITY_HEADERS = {
    'strict-transport-security': {
        name: 'Strict-Transport-Security (HSTS)',
        severity: 'high',
        recommendation: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains',
        description: 'Missing HSTS header - site may be vulnerable to protocol downgrade attacks'
    },
    'content-security-policy': {
        name: 'Content-Security-Policy (CSP)',
        severity: 'high',
        recommendation: 'Add a Content-Security-Policy header to prevent XSS attacks',
        description: 'Missing CSP header - site may be vulnerable to cross-site scripting'
    },
    'x-frame-options': {
        name: 'X-Frame-Options',
        severity: 'medium',
        recommendation: 'Add: X-Frame-Options: DENY or SAMEORIGIN',
        description: 'Missing X-Frame-Options - site may be vulnerable to clickjacking'
    },
    'x-content-type-options': {
        name: 'X-Content-Type-Options',
        severity: 'medium',
        recommendation: 'Add: X-Content-Type-Options: nosniff',
        description: 'Missing X-Content-Type-Options - browser may MIME-sniff content'
    },
    'referrer-policy': {
        name: 'Referrer-Policy',
        severity: 'low',
        recommendation: 'Add: Referrer-Policy: strict-origin-when-cross-origin',
        description: 'Missing Referrer-Policy - referrer information may leak to third parties'
    },
    'permissions-policy': {
        name: 'Permissions-Policy',
        severity: 'low',
        recommendation: 'Add a Permissions-Policy header to control browser features',
        description: 'Missing Permissions-Policy - browser features not explicitly controlled'
    },
    'x-xss-protection': {
        name: 'X-XSS-Protection',
        severity: 'info',
        recommendation: 'Add: X-XSS-Protection: 1; mode=block (legacy browsers only)',
        description: 'Missing X-XSS-Protection - legacy XSS filter not enabled'
    }
};

// SQL injection test payloads
const SQL_PAYLOADS = [
    "' OR '1'='1",
    "1' UNION SELECT NULL--",
    "admin'--",
    "' OR 1=1--",
    "'; DROP TABLE users--"
];

// XSS test payloads
const XSS_PAYLOADS = [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "javascript:alert('XSS')",
    "<svg onload=alert('XSS')>"
];

// Patterns for sensitive data detection
const SENSITIVE_PATTERNS = [
    { name: 'API Key', pattern: /api[_-]?key["\s:=]+["']?([a-zA-Z0-9_-]{20,})/gi },
    { name: 'Stripe Key', pattern: /sk_live_[a-zA-Z0-9]{24,}/gi },
    { name: 'AWS Key', pattern: /AKIA[0-9A-Z]{16}/gi },
    { name: 'Private Key', pattern: /-----BEGIN (?:RSA )?PRIVATE KEY-----/gi },
    { name: 'Password Field', pattern: /["']password["']\s*:\s*["'][^"']+["']/gi },
    { name: 'Secret Token', pattern: /secret[_-]?token["\s:=]+["']?([a-zA-Z0-9_-]{20,})/gi }
];

/**
 * Analyze security headers for a given URL
 */
async function checkSecurityHeaders(url) {
    const findings = [];

    try {
        const response = await axios.get(url, {
            timeout: 10000,
            validateStatus: () => true,
            maxRedirects: 3
        });

        const headers = response.headers;

        for (const [headerKey, info] of Object.entries(SECURITY_HEADERS)) {
            const headerValue = headers[headerKey];

            if (!headerValue) {
                findings.push({
                    category: 'security_headers',
                    severity: info.severity,
                    title: `Missing ${info.name}`,
                    description: info.description,
                    recommendation: info.recommendation,
                    owasp_category: 'A05'
                });
            } else {
                // Check for weak configurations
                if (headerKey === 'strict-transport-security') {
                    const maxAge = parseInt(headerValue.match(/max-age=(\d+)/)?.[1] || '0');
                    if (maxAge < 31536000) {
                        findings.push({
                            category: 'security_headers',
                            severity: 'medium',
                            title: 'Weak HSTS Configuration',
                            description: `HSTS max-age is ${maxAge} seconds. Recommended minimum is 1 year (31536000)`,
                            recommendation: 'Increase max-age to at least 31536000',
                            owasp_category: 'A05'
                        });
                    }
                }

                if (headerKey === 'x-frame-options' && headerValue.toLowerCase() === 'allow-from') {
                    findings.push({
                        category: 'security_headers',
                        severity: 'medium',
                        title: 'Deprecated X-Frame-Options Value',
                        description: 'ALLOW-FROM is deprecated and not supported by modern browsers',
                        recommendation: 'Use CSP frame-ancestors directive instead',
                        owasp_category: 'A05'
                    });
                }
            }
        }

        // Check for server information disclosure
        if (headers['server']) {
            findings.push({
                category: 'information_disclosure',
                severity: 'info',
                title: 'Server Header Present',
                description: `Server header reveals: ${headers['server']}`,
                recommendation: 'Consider removing or obfuscating the Server header',
                owasp_category: 'A05'
            });
        }

        if (headers['x-powered-by']) {
            findings.push({
                category: 'information_disclosure',
                severity: 'low',
                title: 'X-Powered-By Header Present',
                description: `Technology disclosed: ${headers['x-powered-by']}`,
                recommendation: 'Remove the X-Powered-By header',
                owasp_category: 'A05'
            });
        }

        return { success: true, findings, headers };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            findings: [{
                category: 'connection',
                severity: 'critical',
                title: 'Connection Failed',
                description: `Unable to connect: ${error.message}`,
                recommendation: 'Verify the URL is accessible'
            }]
        };
    }
}

/**
 * Validate SSL/TLS certificate
 */
async function validateSSL(hostname, port = 443) {
    return new Promise((resolve) => {
        const findings = [];

        try {
            const socket = tls.connect(port, hostname, {
                rejectUnauthorized: false,
                servername: hostname
            }, () => {
                const cert = socket.getPeerCertificate();
                const protocol = socket.getProtocol();
                const cipher = socket.getCipher();
                const authorized = socket.authorized;

                const now = new Date();
                const validFrom = new Date(cert.valid_from);
                const validTo = new Date(cert.valid_to);
                const daysUntilExpiry = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

                // Certificate trust
                if (!authorized) {
                    findings.push({
                        category: 'ssl',
                        severity: 'critical',
                        title: 'Untrusted Certificate',
                        description: 'Certificate is not trusted by certificate authorities',
                        recommendation: 'Use a certificate from a trusted CA'
                    });
                }

                // Expiration check
                if (daysUntilExpiry < 0) {
                    findings.push({
                        category: 'ssl',
                        severity: 'critical',
                        title: 'Certificate Expired',
                        description: `Certificate expired ${Math.abs(daysUntilExpiry)} days ago`,
                        recommendation: 'Renew the SSL certificate immediately'
                    });
                } else if (daysUntilExpiry < 7) {
                    findings.push({
                        category: 'ssl',
                        severity: 'critical',
                        title: 'Certificate Expiring Very Soon',
                        description: `Certificate expires in ${daysUntilExpiry} days`,
                        recommendation: 'Renew the SSL certificate immediately'
                    });
                } else if (daysUntilExpiry < 30) {
                    findings.push({
                        category: 'ssl',
                        severity: 'high',
                        title: 'Certificate Expiring Soon',
                        description: `Certificate expires in ${daysUntilExpiry} days`,
                        recommendation: 'Schedule certificate renewal'
                    });
                }

                // Protocol version check
                const weakProtocols = ['TLSv1', 'TLSv1.1', 'SSLv3'];
                if (weakProtocols.includes(protocol)) {
                    findings.push({
                        category: 'ssl',
                        severity: 'high',
                        title: 'Weak TLS Version',
                        description: `Using ${protocol}. This version has known vulnerabilities`,
                        recommendation: 'Upgrade to TLS 1.2 or TLS 1.3'
                    });
                }

                // Cipher strength
                if (cipher && cipher.name) {
                    const weakCiphers = ['DES', 'RC4', 'MD5', 'NULL', 'EXPORT'];
                    if (weakCiphers.some(weak => cipher.name.includes(weak))) {
                        findings.push({
                            category: 'ssl',
                            severity: 'high',
                            title: 'Weak Cipher Suite',
                            description: `Using weak cipher: ${cipher.name}`,
                            recommendation: 'Configure server to use strong cipher suites'
                        });
                    }
                }

                socket.end();

                resolve({
                    success: true,
                    certificate: {
                        issuer: cert.issuer,
                        subject: cert.subject,
                        validFrom: validFrom.toISOString(),
                        validTo: validTo.toISOString(),
                        daysUntilExpiry,
                        fingerprint: cert.fingerprint,
                        serialNumber: cert.serialNumber
                    },
                    connection: {
                        protocol,
                        cipher: cipher?.name,
                        authorized
                    },
                    findings
                });
            });

            socket.setTimeout(10000);

            socket.on('timeout', () => {
                socket.destroy();
                resolve({
                    success: false,
                    error: 'Connection timeout',
                    findings: [{
                        category: 'ssl',
                        severity: 'critical',
                        title: 'SSL Connection Timeout',
                        description: 'Could not establish SSL connection within timeout',
                        recommendation: 'Check if the server supports HTTPS'
                    }]
                });
            });

            socket.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message,
                    findings: [{
                        category: 'ssl',
                        severity: 'critical',
                        title: 'SSL Connection Failed',
                        description: error.message,
                        recommendation: 'Verify HTTPS is configured correctly'
                    }]
                });
            });
        } catch (error) {
            resolve({
                success: false,
                error: error.message,
                findings: [{
                    category: 'ssl',
                    severity: 'critical',
                    title: 'SSL Validation Error',
                    description: error.message,
                    recommendation: 'Check SSL configuration'
                }]
            });
        }
    });
}

/**
 * Scan for common vulnerabilities
 */
async function scanVulnerabilities(url) {
    const findings = [];
    const parsed = new URL(url);

    // SQL Injection tests
    for (const payload of SQL_PAYLOADS) {
        try {
            const testUrl = `${url}${url.includes('?') ? '&' : '?'}id=${encodeURIComponent(payload)}`;
            const response = await axios.get(testUrl, {
                timeout: 5000,
                validateStatus: () => true
            });

            const body = String(response.data).toLowerCase();
            const sqlErrors = ['sql', 'mysql', 'syntax error', 'ora-', 'postgresql', 'sqlite'];

            if (sqlErrors.some(err => body.includes(err))) {
                findings.push({
                    category: 'sql_injection',
                    severity: 'critical',
                    title: 'Possible SQL Injection Vulnerability',
                    description: 'Application may be vulnerable to SQL injection attacks',
                    evidence: `Payload: ${payload}`,
                    recommendation: 'Use parameterized queries and input validation',
                    owasp_category: 'A03',
                    cwe_id: 'CWE-89'
                });
                break; // One finding is enough
            }
        } catch {
            // Continue with next payload
        }
    }

    // XSS tests
    for (const payload of XSS_PAYLOADS) {
        try {
            const testUrl = `${url}${url.includes('?') ? '&' : '?'}q=${encodeURIComponent(payload)}`;
            const response = await axios.get(testUrl, {
                timeout: 5000,
                validateStatus: () => true
            });

            // Check if payload is reflected without encoding
            if (String(response.data).includes(payload)) {
                findings.push({
                    category: 'xss',
                    severity: 'high',
                    title: 'Possible Cross-Site Scripting (XSS)',
                    description: 'User input is reflected without proper encoding',
                    evidence: `Payload: ${payload}`,
                    recommendation: 'Encode all user input before rendering',
                    owasp_category: 'A03',
                    cwe_id: 'CWE-79'
                });
                break;
            }
        } catch {
            // Continue
        }
    }

    // Sensitive data exposure check
    try {
        const response = await axios.get(url, { timeout: 5000, validateStatus: () => true });
        const body = String(response.data);

        for (const { name, pattern } of SENSITIVE_PATTERNS) {
            if (pattern.test(body)) {
                findings.push({
                    category: 'sensitive_data_exposure',
                    severity: 'critical',
                    title: `${name} Possibly Exposed`,
                    description: `Response may contain sensitive data: ${name}`,
                    recommendation: 'Remove sensitive data from responses and use environment variables',
                    owasp_category: 'A01',
                    cwe_id: 'CWE-200'
                });
            }
        }
    } catch {
        // Continue
    }

    // Common sensitive endpoints check
    const sensitiveEndpoints = [
        '/.env', '/.git/config', '/config.json', '/wp-config.php',
        '/admin', '/debug', '/.htaccess', '/backup.sql'
    ];

    for (const endpoint of sensitiveEndpoints) {
        try {
            const testUrl = `${parsed.origin}${endpoint}`;
            const response = await axios.get(testUrl, {
                timeout: 3000,
                validateStatus: () => true
            });

            if (response.status === 200 && response.data) {
                findings.push({
                    category: 'security_misconfiguration',
                    severity: 'high',
                    title: 'Sensitive Endpoint Accessible',
                    description: `${endpoint} is publicly accessible`,
                    recommendation: 'Restrict access to sensitive endpoints',
                    owasp_category: 'A05'
                });
            }
        } catch {
            // Expected - endpoint blocked or not found
        }
    }

    return findings;
}

/**
 * Analyze JWT token
 */
function analyzeJWT(token) {
    const findings = [];

    try {
        // Split token
        const parts = token.split('.');
        if (parts.length !== 3) {
            return {
                success: false,
                error: 'Invalid JWT format - expected 3 parts',
                findings: [{
                    category: 'jwt',
                    severity: 'info',
                    title: 'Invalid JWT Format',
                    description: 'Token does not have the expected header.payload.signature format'
                }]
            };
        }

        // Decode header and payload (base64url)
        const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

        // Check algorithm
        if (header.alg === 'none') {
            findings.push({
                category: 'jwt',
                severity: 'critical',
                title: 'JWT Algorithm "none" Detected',
                description: 'Token uses "none" algorithm, making signature verification bypassable',
                recommendation: 'Never accept tokens with "none" algorithm'
            });
        }

        if (header.alg === 'HS256') {
            findings.push({
                category: 'jwt',
                severity: 'low',
                title: 'Symmetric Algorithm Used',
                description: 'HS256 is symmetric - consider RS256 for better security',
                recommendation: 'Consider using RS256 for production environments'
            });
        }

        // Check expiration
        if (!payload.exp) {
            findings.push({
                category: 'jwt',
                severity: 'high',
                title: 'No Expiration Set',
                description: 'JWT does not have an expiration time, tokens never expire',
                recommendation: 'Always set an expiration time for JWT tokens'
            });
        } else {
            const exp = new Date(payload.exp * 1000);
            const now = new Date();

            if (exp < now) {
                findings.push({
                    category: 'jwt',
                    severity: 'info',
                    title: 'Token Expired',
                    description: `Token expired on ${exp.toISOString()}`
                });
            }

            // Check if expiration is too long (> 24 hours)
            const hoursUntilExpiry = (exp - now) / (1000 * 60 * 60);
            if (hoursUntilExpiry > 24) {
                findings.push({
                    category: 'jwt',
                    severity: 'low',
                    title: 'Long Token Lifetime',
                    description: `Token valid for ${Math.round(hoursUntilExpiry)} hours`,
                    recommendation: 'Consider shorter token lifetimes (1-24 hours) with refresh tokens'
                });
            }
        }

        // Check for missing iat
        if (!payload.iat) {
            findings.push({
                category: 'jwt',
                severity: 'low',
                title: 'Missing Issued At (iat)',
                description: 'Token does not have iat claim',
                recommendation: 'Include iat claim for token tracking'
            });
        }

        return {
            success: true,
            decoded: { header, payload },
            findings
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            findings: [{
                category: 'jwt',
                severity: 'info',
                title: 'JWT Decode Error',
                description: error.message
            }]
        };
    }
}

/**
 * Analyze CORS configuration
 */
async function analyzeCORS(url) {
    const findings = [];

    try {
        // Send preflight request
        const response = await axios.options(url, {
            headers: {
                'Origin': 'https://evil-attacker.com',
                'Access-Control-Request-Method': 'GET'
            },
            timeout: 5000,
            validateStatus: () => true
        });

        const acao = response.headers['access-control-allow-origin'];
        const acac = response.headers['access-control-allow-credentials'];

        if (acao === '*') {
            if (acac === 'true') {
                findings.push({
                    category: 'cors',
                    severity: 'critical',
                    title: 'Dangerous CORS Configuration',
                    description: 'Wildcard origin (*) with credentials allowed',
                    recommendation: 'Never use wildcard with credentials=true',
                    owasp_category: 'A05'
                });
            } else {
                findings.push({
                    category: 'cors',
                    severity: 'medium',
                    title: 'Wildcard CORS Origin',
                    description: 'Access-Control-Allow-Origin is set to *',
                    recommendation: 'Specify explicit allowed origins instead of wildcard'
                });
            }
        }

        if (acao === 'https://evil-attacker.com') {
            findings.push({
                category: 'cors',
                severity: 'critical',
                title: 'CORS Reflects Origin',
                description: 'Server reflects any origin, allowing cross-origin requests from anywhere',
                recommendation: 'Validate origins against a whitelist',
                owasp_category: 'A05'
            });
        }

        return { success: true, findings, headers: response.headers };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            findings: []
        };
    }
}

/**
 * Calculate overall security score
 */
function calculateSecurityScore(findings) {
    if (!findings || findings.length === 0) return 100;

    let score = 100;

    for (const finding of findings) {
        switch (finding.severity) {
            case 'critical': score -= 25; break;
            case 'high': score -= 15; break;
            case 'medium': score -= 8; break;
            case 'low': score -= 3; break;
            case 'info': score -= 1; break;
        }
    }

    return Math.max(0, score);
}

module.exports = {
    checkSecurityHeaders,
    validateSSL,
    scanVulnerabilities,
    analyzeJWT,
    analyzeCORS,
    calculateSecurityScore
};
