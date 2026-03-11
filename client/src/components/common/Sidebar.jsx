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
        <aside className="w-20 lg:w-64 glass border-r border-slate-700 flex flex-col py-8 shrink-0">
            <nav className="flex-1 space-y-2.5 px-3 pt-2">
                {visibleItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center lg:justify-start justify-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium transition-all ${isActive
                                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-l-2 border-blue-500 shadow-sm'
                                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                            }`
                        }
                    >
                        <item.icon className="text-2xl shrink-0" />
                        <span className="hidden lg:block">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {token && (
                <div className="px-3 mt-auto pt-4 border-t border-slate-700/60">
                    <NavLink
                        to="/settings"
                        className="flex items-center lg:justify-start justify-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
                    >
                        <FiSettings className="text-2xl shrink-0" />
                        <span className="hidden lg:block">Settings</span>
                    </NavLink>
                </div>
            )}
        </aside>
    );
}

export default Sidebar;
