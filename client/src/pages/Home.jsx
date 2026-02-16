import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSend, FiShield, FiActivity, FiZap, FiLock, FiTrendingUp, FiArrowRight, FiBook, FiDatabase } from 'react-icons/fi';
import EducationModal from '../components/common/EducationModal';

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
    const [educationTopic, setEducationTopic] = useState(null);

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 px-4">
                <div className="absolute inset-0 bg-blue-500/5 radial-gradient pointer-events-none" />
                <div className="max-w-7xl mx-auto text-center relative z-10 animate-slide-up">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 backdrop-blur-sm mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                        <span className="text-sm text-slate-300">DevHub v1.0 • Now with OWASP 2025</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                        <span className="bg-gradient-to-r from-white via-blue-100 to-slate-300 bg-clip-text text-transparent">
                            Master Your API's
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Security & Performance
                        </span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        The all-in-one developer platform for testing endpoints, detecting vulnerabilities,
                        and monitoring uptime. No complex setup required.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/request" className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-lg">
                            <FiSend />
                            Start Testing
                        </Link>
                        <Link to="/security" className="btn-secondary flex items-center justify-center gap-2 px-8 py-4 text-lg">
                            <FiShield />
                            Run Security Scan
                        </Link>
                    </div>
                </div>
            </section>

            {/* Quick Start Cards */}
            <section className="py-12 px-4 bg-slate-900/30 border-y border-slate-800/50">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '1',
                                icon: FiSend,
                                title: 'Test',
                                desc: 'Send requests to any endpoint. Debug headers, auth, and payloads instantly.',
                                link: '/request',
                                cta: 'Open Tester',
                                color: 'blue'
                            },
                            {
                                step: '2',
                                icon: FiShield,
                                title: 'Scan',
                                desc: 'Check for OWASP vulnerabilities and security misconfigurations.',
                                link: '/security',
                                cta: 'Start Scan',
                                color: 'purple'
                            },
                            {
                                step: '3',
                                icon: FiActivity,
                                title: 'Monitor',
                                desc: 'Get notified immediately when your API goes down or becomes slow.',
                                link: '/monitoring',
                                cta: 'Set Up Monitor',
                                color: 'green'
                            }
                        ].map((item) => (
                            <Link
                                key={item.step}
                                to={item.link}
                                className="group relative p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800 transition-all duration-300"
                            >
                                <div className={`absolute top-0 right-0 p-4 opacity-10 text-9xl font-bold text-${item.color}-500 group-hover:scale-110 transition-transform select-none`}>
                                    {item.step}
                                </div>
                                <div className={`w-12 h-12 rounded-xl bg-${item.color}-500/20 text-${item.color}-400 flex items-center justify-center text-2xl mb-4`}>
                                    <item.icon />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p className="text-slate-400 mb-4 h-12">{item.desc}</p>
                                <span className={`inline-flex items-center gap-1 text-sm font-medium text-${item.color}-400 group-hover:underline`}>
                                    {item.cta} <FiArrowRight />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Educational Spotlight */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="flex-1 space-y-6">
                            <h2 className="text-3xl font-bold">Why Security Matters</h2>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                Modern applications rely heavily on APIs. A single vulnerability can expose database credentials,
                                user data, or sensitive business logic. DevHub helps you stay ahead of threats.
                            </p>

                            <div className="grid gap-4">
                                <button
                                    onClick={() => setEducationTopic('api')}
                                    className="text-left p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all flex items-center gap-4 group"
                                >
                                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <FiBook />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">What is an API?</h4>
                                        <p className="text-sm text-slate-400">Learn the basics of Application Programming Interfaces.</p>
                                    </div>
                                    <FiArrowRight className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>

                                <button
                                    onClick={() => setEducationTopic('owasp')}
                                    className="text-left p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 hover:bg-slate-800 transition-all flex items-center gap-4 group"
                                >
                                    <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                        <FiShield />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">OWASP Top 10</h4>
                                        <p className="text-sm text-slate-400">Understand the most critical security risks in 2025.</p>
                                    </div>
                                    <FiArrowRight className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 w-full relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                            <div className="relative card gradient-border p-8 bg-slate-900/90 backdrop-blur-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <FiActivity className="text-green-400" />
                                        Platform Stats
                                    </h3>
                                    <span className="text-xs text-slate-500 px-2 py-1 rounded bg-slate-800">Live</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {stats.map((stat, index) => (
                                        <div key={index} className="p-4 rounded-lg bg-slate-800/50 text-center">
                                            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                                            <div className="text-xs text-slate-400">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-4 bg-slate-900/50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-4">
                        Everything You Need
                    </h2>
                    <p className="text-slate-400 text-center max-w-2xl mx-auto mb-16">
                        A complete suite of tools designed for the modern developer workflow.
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800 hover:border-slate-600 transition-all duration-300"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg transform group-hover:-translate-y-1 transition-transform`}>
                                    <feature.icon className="text-white text-2xl" />
                                </div>

                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-sm">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Spacer */}
            <div className="h-24"></div>

            {/* CTA */}
            <section className="py-24 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="card gradient-border p-12 bg-gradient-to-b from-slate-800 to-slate-900">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to secure your APIs?</h2>
                        <Link to="/security" className="inline-flex items-center gap-2 btn-primary px-8 py-4 text-lg transform hover:scale-105 transition-transform">
                            <FiShield />
                            Run Free Security Scan
                        </Link>
                    </div>
                </div>
            </section>

            <EducationModal
                isOpen={!!educationTopic}
                onClose={() => setEducationTopic(null)}
                topic={educationTopic}
            />
        </div>
    );
}

export default Home;
