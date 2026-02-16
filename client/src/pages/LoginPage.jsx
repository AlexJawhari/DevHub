import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import EducationModal from '../components/common/EducationModal';

function LoginPage() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [showEducation, setShowEducation] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authAPI.login(formData);
            login(response.data.user, response.data.token);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            const message = error.response?.data?.error || 'Login failed';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative">
            <Link
                to="/"
                className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition-colors py-2 px-4 rounded-lg hover:bg-slate-800"
            >
                <span>←</span> Back to Home
            </Link>
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center space-x-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <FiShield className="text-white text-2xl" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            DevHub
                        </span>
                    </Link>
                    <h1 className="text-2xl font-bold">Welcome back</h1>
                    <p className="text-slate-400 mt-2">Sign in to your account</p>
                </div>

                <div className="card border-t-4 border-t-purple-500 shadow-xl shadow-purple-900/10">
                    <form onSubmit={handleSubmit} className="space-y-6 p-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-field pl-10"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input-field pl-10"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <FiArrowRight />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-400 hover:text-blue-300">
                            Sign up
                        </Link>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
                        <button
                            onClick={() => setShowEducation(true)}
                            className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1 mx-auto"
                        >
                            <FiShield className="text-xs" />
                            Why do I need an account?
                        </button>
                    </div>
                </div>
            </div>

            <EducationModal
                isOpen={showEducation}
                onClose={() => setShowEducation(false)}
                topic="api"
            />
        </div>
    );
}

export default LoginPage;
