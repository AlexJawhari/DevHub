# DevHub - API Security & Monitoring Platform

**DevHub** is a comprehensive solution for developers to test, monitor, and secure their APIs. It helps catch vulnerabilities early and ensures your endpoints are always up and running.

![DevHub Dashboard](https://via.placeholder.com/1200x600/0f172a/3b82f6?text=DevHub+Dashboard)

## 🚀 Key Features

*   **API Request Builder:** sophisticated HTTP client (like Postman) for testing endpoints with support for all methods, headers, and body types.
*   **Security Scanner:** Automated analysis of API endpoints for OWASP vulnerabilities, SSL issues, and missing security headers.
*   **Real-time Monitoring:** 24/7 uptime tracking with global availability checks and incident alerting.
*   **Detailed Reporting:** Export comprehensive PDF and JSON security reports for compliance and auditing.
*   **Team Collections:** Organize and share API requests and environments.

## 🛠️ Technical Architecture

DevHub is built with a modern, scalable stack designed for performance and security.

### Frontend
*   **Framework:** React 19 + Vite (SPA)
*   **Styling:** Tailwind CSS v4 + PostCSS
*   **State Management:** Zustand (Persistent Store)
*   **Real-time:** Socket.io Client
*   **Visualization:** Recharts

### Backend
*   **Runtime:** Node.js + Express
*   **Database:** Supabase (PostgreSQL)
*   **Security:** Helmet, Rate-Limiting, Bcrypt, JWT
*   **Scanning Engine:** Custom Node.js security analysis modules
*   **Background Jobs:** Node-Cron for monitoring tasks

### Infrastructure
*   **Backend Hosting:** Render
*   **Frontend Hosting:** Vercel
*   **Database:** Supabase Cloud

## 🔒 Security First

Security is at the core of DevHub. The platform itself implements:
*   **Row Level Security (RLS):** Strict database policies ensure users can only access their own data.
*   **SSRF Protection:** Proxy services validate all outgoing requests to prevent internal network scanning.
*   **Secure Headers:** Comprehensive HTTP security headers (HSTS, CSP, X-Frame-Options).
*   **Input Validation:** Strict sanitization of all user inputs using `express-validator`.

## 📸 Screenshots

| Dashboard | Request Builder |
|-----------|----------------|
| ![Dashboard](https://via.placeholder.com/600x400/1e293b/3b82f6?text=Dashboard) | ![Builder](https://via.placeholder.com/600x400/1e293b/3b82f6?text=Request+Builder) |

| Security Report | Monitoring |
|-----------------|------------|
| ![Report](https://via.placeholder.com/600x400/1e293b/3b82f6?text=Security+Report) | ![Monitoring](https://via.placeholder.com/600x400/1e293b/3b82f6?text=Uptime+Monitor) |

---

*Built by [Alex Jawhari](https://github.com/AlexJawhari)*
