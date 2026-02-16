import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiArrowRight, FiShield, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

function RegisterPage() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    // Password strength checks
    const passwordChecks = {
        length: formData.password.length >= 8,
        lowercase: /[a-z]/.test(formData.password),
        uppercase: /[A-Z]/.test(formData.password),
        number: /[0-9]/.test(formData.password)
    };

    const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (passwordStrength < 4) {
            toast.error('Please meet all password requirements');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.register({
                username: formData.username,
                email: formData.email,
                password: formData.password
            });
            login(response.data.user, response.data.token);
            toast.success('Account created successfully!');
            navigate('/dashboard');
        } catch (error) {
            const message = error.response?.data?.error || 'Registration failed';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
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
                    <h1 className="text-2xl font-bold">Create your account</h1>
                    <p className="text-slate-400 mt-2">Start securing your APIs today</p>
                </div>

                <div className="card border-t-4 border-t-blue-500 shadow-xl shadow-blue-900/10">
                    <form onSubmit={handleSubmit} className="space-y-5 p-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="input-field pl-10"
                                    placeholder="johndoe"
                                    required
                                    minLength={3}
                                    maxLength={30}
                                />
                            </div>
                        </div>

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

                            {/* Password strength indicator */}
                            <div className="mt-2 space-y-1">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength >= i
                                                ? passwordStrength === 4 ? 'bg-green-500' : 'bg-amber-500'
                                                : 'bg-slate-700'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                    {Object.entries({
                                        length: '8+ characters',
                                        lowercase: 'Lowercase letter',
                                        uppercase: 'Uppercase letter',
                                        number: 'Number'
                                    }).map(([key, label]) => (
                                        <div key={key} className="flex items-center gap-1">
                                            {passwordChecks[key] ? (
                                                <FiCheck className="text-green-500" />
                                            ) : (
                                                <FiX className="text-slate-500" />
                                            )}
                                            <span className={passwordChecks[key] ? 'text-green-500' : 'text-slate-500'}>
                                                {label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                                    Create Account
                                    <FiArrowRight />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
