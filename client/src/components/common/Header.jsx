import { Link } from 'react-router-dom';
import { FiShield, FiUser, FiLogOut } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';

function Header() {
    const { user, logout } = useAuthStore();

    return (
        <header className="glass border-b border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <FiShield className="text-white text-xl" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        DevHub
                    </span>
                </Link>

                <nav className="hidden md:flex items-center space-x-6">
                    <Link to="/request" className="text-slate-300 hover:text-white transition-colors">
                        API Tester
                    </Link>
                    <Link to="/security" className="text-slate-300 hover:text-white transition-colors">
                        Security Scanner
                    </Link>
                    <Link to="/monitoring" className="text-slate-300 hover:text-white transition-colors">
                        Monitoring
                    </Link>
                </nav>

                <div className="flex items-center space-x-4">
                    {user ? (
                        <div className="flex items-center space-x-4">
                            <Link to="/dashboard" className="flex items-center space-x-2 text-slate-300 hover:text-white">
                                <FiUser />
                                <span>{user.username}</span>
                            </Link>
                            <button
                                onClick={logout}
                                className="flex items-center space-x-2 text-slate-400 hover:text-red-400 transition-colors"
                            >
                                <FiLogOut />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-6">
                            <Link to="/login" className="text-slate-300 hover:text-white transition-colors">
                                Login
                            </Link>
                            <Link to="/register" className="btn-primary">
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
