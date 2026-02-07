import { NavLink } from 'react-router-dom';
import {
    FiHome,
    FiSend,
    FiShield,
    FiActivity,
    FiFileText,
    FiFolder,
    FiSettings
} from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';

const navItems = [
    { path: '/', icon: FiHome, label: 'Home', public: true },
    { path: '/request', icon: FiSend, label: 'API Tester', public: true },
    { path: '/security', icon: FiShield, label: 'Security', public: true },
    { path: '/monitoring', icon: FiActivity, label: 'Monitoring', public: false },
    { path: '/reports', icon: FiFileText, label: 'Reports', public: false },
    { path: '/dashboard', icon: FiFolder, label: 'Collections', public: false }
];

function Sidebar() {
    const { token } = useAuthStore();

    const visibleItems = navItems.filter(item => item.public || token);

    return (
        <aside className="w-16 lg:w-56 glass border-r border-slate-700 flex flex-col py-4 shrink-0">
            <nav className="flex-1 space-y-1 px-2">
                {visibleItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${isActive
                                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-l-2 border-blue-500'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`
                        }
                    >
                        <item.icon className="text-xl shrink-0" />
                        <span className="hidden lg:block">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {token && (
                <div className="px-2 mt-auto">
                    <NavLink
                        to="/settings"
                        className="flex items-center space-x-3 px-3 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                    >
                        <FiSettings className="text-xl shrink-0" />
                        <span className="hidden lg:block">Settings</span>
                    </NavLink>
                </div>
            )}
        </aside>
    );
}

export default Sidebar;
