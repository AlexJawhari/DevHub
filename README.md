# DevHub - API Security Testing Platform

A comprehensive platform for testing, monitoring, and securing APIs. Built with React, Node.js, and Supabase.

![DevHub Banner](https://via.placeholder.com/800x400/1e293b/3b82f6?text=DevHub)

## ✨ Features

### 🔍 API Testing
- Send HTTP requests with custom headers, body, and authentication
- Support for GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS methods
- Query parameter builder with enable/disable toggle
- Multiple authentication methods (Bearer, Basic, API Key)
- Formatted JSON response viewer

### 🛡️ Security Scanning
- OWASP Top 10 vulnerability detection
- Security header analysis
- SSL/TLS certificate validation
- SQL injection and XSS testing
- Sensitive data exposure detection
- CORS configuration analysis
- JWT token analysis

### 📊 Uptime Monitoring
- 24/7 endpoint monitoring
- Response time tracking
- Uptime percentage calculations
- Real-time status updates via WebSocket
- Customizable check intervals

### 📄 Reports
- Comprehensive security reports
- PDF and JSON export options
- Risk scoring and prioritization
- Remediation recommendations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AlexJawhari/DevHub.git
   cd DevHub
   ```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the schema from `database/schema.sql` in the SQL editor
   - Copy your project URL and anon key

3. **Configure environment variables**
   ```bash
   # Server
   cp server/.env.example server/.env
   # Edit server/.env with your Supabase credentials
   
   # Client
   cp client/.env.example client/.env
   # Edit client/.env if needed
   ```

4. **Install dependencies**
   ```bash
   # Backend
   cd server
   npm install
   
   # Frontend
   cd ../client
   npm install
   ```

5. **Run the application**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev
   
   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

6. **Open the app**
   Navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
DevHub/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   └── store/          # Zustand state management
│   └── ...
├── server/                 # Node.js backend
│   ├── config/             # Database configuration
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── jobs/               # Cron jobs
├── database/               # Database schema
└── README.md
```

## 🔧 Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Routing
- **Recharts** - Charts
- **Socket.io Client** - Real-time updates

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Supabase** - Database (PostgreSQL)
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **PDFKit** - PDF generation

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requests/proxy` | Execute HTTP request |
| GET | `/api/requests` | Get saved requests |
| POST | `/api/requests` | Save a request |
| GET | `/api/requests/history` | Get request history |

### Security
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/security/scan` | Run security scan |
| GET | `/api/security/scans` | Get scan history |
| POST | `/api/security/jwt` | Analyze JWT token |

### Monitoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/monitoring/endpoints` | Get monitored endpoints |
| POST | `/api/monitoring/endpoints` | Add endpoint |
| GET | `/api/monitoring/stats/:id` | Get uptime stats |

## 🔐 Security Features

- **Input Validation** - All inputs sanitized with express-validator
- **Rate Limiting** - Protection against brute force attacks
- **SSRF Prevention** - Validates proxy URLs against private networks
- **Helmet** - Security headers on all responses
- **Password Hashing** - bcrypt with 12 rounds
- **JWT Authentication** - Stateless auth with expiration

## 📦 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository
2. Set build command: `cd client && npm run build`
3. Set output directory: `client/dist`
4. Add environment variables

### Backend (Render)
1. Create a new Web Service
2. Set build command: `cd server && npm install`
3. Set start command: `cd server && npm start`
4. Add environment variables

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

### 🐛 Troubleshooting
- **Render Build Failed?** Ensure **Root Directory** is set to `server`.
- **Vercel Build Failed?** Ensure you are using the latest `main` branch with `@tailwindcss/postcss`.
- **Database Errors?** Run `database/policies.sql` to apply RLS policies safely.


## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ by Alex Jawhari
