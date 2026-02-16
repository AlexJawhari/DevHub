import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiBook, FiShield, FiGlobe, FiDatabase } from 'react-icons/fi';

const educationalContent = {
    api: {
        title: "What is an API?",
        icon: FiGlobe,
        content: (
            <div className="space-y-4">
                <p>
                    <strong>API (Application Programming Interface)</strong> is a way for two computer programs to talk to each other.
                    Think of it like a waiter in a restaurant: you (the client) tell the waiter (the API) what you want,
                    and they bring back the food (the data) from the kitchen (the server).
                </p>
                <div className="bg-slate-800 p-4 rounded-lg text-sm font-mono text-slate-300">
                    <span className="text-purple-400">GET</span> /api/users <span className="text-slate-500">→ I want a list of users</span><br />
                    <span className="text-blue-400">POST</span> /api/users <span className="text-slate-500">→ I want to create a user</span>
                </div>
            </div>
        )
    },
    owasp: {
        title: "OWASP Top 10 (2025)",
        icon: FiShield,
        content: (
            <div className="space-y-4">
                <p>
                    The <strong>OWASP Top 10</strong> is a standard awareness document for developers and web application security.
                    It represents a broad consensus about the most critical security risks to web applications.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
                    <li><strong>A01 Broken Access Control:</strong> Users acting outside of their intended permissions.</li>
                    <li><strong>A02 Security Misconfiguration:</strong> Insecure defaults, incomplete configurations (e.g., missing headers).</li>
                    <li><strong>A03 Software Supply Chain Failures:</strong> Using vulnerable third-party libraries.</li>
                    <li><strong>A05 Injection:</strong> Untrusted data sent to an interpreter (SQLi, XSS).</li>
                    <li><strong>A07 Authentication Failures:</strong> Allowing easy password guessing or session hijacking.</li>
                </ul>
            </div>
        )
    },
    rest: {
        title: "RESTful Architecture",
        icon: FiDatabase,
        content: (
            <div className="space-y-4">
                <p>
                    <strong>REST (Representational State Transfer)</strong> is an architectural style for providing standards between computer systems on the web, making it easier for systems to communicate with each other.
                </p>
                <p>
                    RESTful systems are <strong>stateless</strong> (the server doesn't remember previous requests) and separate the concerns of client and server.
                </p>
            </div>
        )
    }
};

function EducationModal({ isOpen, onClose, topic }) {
    if (!isOpen || !educationalContent[topic]) return null;

    const { title, icon: Icon, content } = educationalContent[topic];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                <Icon className="text-xl" />
                            </div>
                            <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            <FiX />
                        </button>
                    </div>

                    <div className="p-6 text-slate-300 leading-relaxed">
                        {content}
                    </div>

                    <div className="p-4 bg-slate-800/30 border-t border-slate-700/50 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                        >
                            Got it
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default EducationModal;
