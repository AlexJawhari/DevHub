# 🛡️ DevHub — API Security & Monitoring Platform

[![Status](https://img.shields.io/badge/Status-Live-brightgreen)](https://devhub-steel.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?logo=socket.io)](https://socket.io)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)

**DevHub** is an API testing and security-scanning platform: send requests like you would in Postman, then scan a site for common misconfigurations and OWASP-mapped issues.

🔗 **[Live Demo](https://devhub-steel.vercel.app)** (the backend runs on a free tier, so the first request after idle can take ~30s)

> Only scan sites you own or are authorized to test.

---

## ✨ Features

- **API Request Builder**: all HTTP methods, headers, query params, body and auth, with saved requests and environments.
- **Security Scanner**: checks security headers, SSL/TLS, exposed sensitive files and endpoints, verbose errors, JWT weaknesses, and basic SQLi/XSS reflection signals. Findings are mapped to OWASP categories. These are heuristics, not a substitute for a professional penetration test.
- **Scheduled Scans and Uptime Monitoring**: recurring checks (every few minutes for monitoring) with response-time charts and live updates over WebSockets.
- **Reports**: export scan results as PDF or JSON with severity ratings and remediation steps.

---

## 🏗️ Technical Stack

### **Frontend**
- **React 19 + Vite**
- **Tailwind CSS v4**
- **Zustand**: Lightweight, persistent global state management.
- **Socket.io Client**: Real-time subscriptions for instant server health alerts.
- **Recharts**: Dynamic data visualization for API performance metrics.

### **Backend**
- **Node.js + Express**: REST API.
- **Supabase (PostgreSQL)**: Managed database with advanced RLS security policies.
- **Node-Cron**: Reliable background task scheduling for monitoring jobs.
- **Helmet + JWT**: Security headers and token-based authentication.
- **Express-Validator**: Multi-layer input sanitization for preventing injection attacks.

---

## 🔒 Security

- **SSRF protection**: outbound requests to user-supplied URLs are blocked from private, loopback and link-local addresses, checked at connect time so DNS rebinding does not bypass it.
- **Row Level Security** policies in `database/policies.sql` scope data per user.
- **Input validation** with `express-validator`, rate limiting, and Helmet/CSP/HSTS headers.

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- A [Supabase](https://supabase.com) project

### Installation
1. `git clone https://github.com/AlexJawhari/DevHub.git`
2. `cd DevHub`
3. `cd server && npm install && cd ../client && npm install`
4. Configure `.env` using `.env.example` templates.
5. Apply SQL schema from `/database` to Supabase.
6. `npm run dev` in both directories.

---

## 📄 License

MIT

---
