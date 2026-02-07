import { Link } from 'react-router-dom';
import { FiSend, FiShield, FiActivity, FiZap, FiLock, FiTrendingUp } from 'react-icons/fi';

const features = [
    {
        icon: FiSend,
        title: 'API Testing',
        description: 'Send HTTP requests with custom headers, body, and authentication. View formatted responses with syntax highlighting.',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        icon: FiShield,
        title: 'Security Scanning',
        description: 'Detect vulnerabilities including SQL injection, XSS, and security header misconfigurations. Get OWASP-mapped findings.',
        color: 'from-purple-500 to-pink-500'
    },
    {
        icon: FiActivity,
        title: 'Uptime Monitoring',
        description: 'Monitor your APIs 24/7. Track response times, uptime percentages, and get instant alerts on downtime.',
        color: 'from-green-500 to-emerald-500'
    },
    {
        icon: FiLock,
        title: 'SSL Analysis',
        description: 'Validate SSL certificates, check expiration dates, and analyze TLS configuration for security weaknesses.',
        color: 'from-amber-500 to-orange-500'
    },
    {
        icon: FiZap,
        title: 'JWT Analysis',
        description: 'Decode and analyze JWT tokens. Check for security issues like missing expiration or weak algorithms.',
        color: 'from-red-500 to-rose-500'
    },
    {
        icon: FiTrendingUp,
        title: 'Security Reports',
        description: 'Generate comprehensive security reports with risk scores, prioritized findings, and remediation advice.',
        color: 'from-indigo-500 to-violet-500'
    }
];

const stats = [
    { value: '10,000+', label: 'Security Scans' },
    { value: '200+', label: 'APIs Tested' },
    { value: '94%', label: 'Detection Accuracy' },
    { value: '3.2s', label: 'Avg Scan Time' }
];

function Home() {
    return (
        <div className="max-w-6xl mx-auto space-y-16">
            {/* Hero Section */}
            <section className="text-center py-12 animate-slide-up">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-6">
                    <span className="text-sm text-blue-400">API Security Made Simple</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold mb-6">
                    <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                        Test, Monitor & Secure
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Your APIs
                    </span>
                </h1>

                <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
                    DevHub combines powerful API testing with automated security scanning.
                    Detect vulnerabilities, monitor uptime, and generate comprehensive security reports.
                </p>

                <div className="flex justify-center gap-4">
                    <Link to="/request" className="btn-primary flex items-center gap-2">
                        <FiSend />
                        Start Testing
                    </Link>
                    <Link to="/security" className="btn-secondary flex items-center gap-2">
                        <FiShield />
                        Security Scan
                    </Link>
                </div>
            </section>

            {/* Stats Section */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="card text-center py-6"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            {stat.value}
                        </div>
                        <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
                    </div>
                ))}
            </section>

            {/* Features Grid */}
            <section>
                <h2 className="text-3xl font-bold text-center mb-8">
                    Everything You Need for API Security
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="card group hover:border-slate-600 transition-all duration-300 animate-slide-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <feature.icon className="text-white text-xl" />
                            </div>

                            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                            <p className="text-slate-400 text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="card gradient-border text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Ready to secure your APIs?</h2>
                <p className="text-slate-400 mb-6">
                    Start scanning for vulnerabilities in seconds. No signup required for basic scans.
                </p>
                <Link to="/security" className="btn-primary inline-flex items-center gap-2">
                    <FiShield />
                    Run Free Security Scan
                </Link>
            </section>
        </div>
    );
}

export default Home;
