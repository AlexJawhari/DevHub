import { useState } from 'react';
import { FiSave, FiUser, FiLock, FiBell, FiMoon, FiSun } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';

function SettingsPage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState('dark');
    const [notifications, setNotifications] = useState({
        email: true,
        browser: true,
        securityAlerts: true,
        monitoringAlerts: true
    });

    const handleSave = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        toast.success('Settings saved successfully');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Settings</h1>

            <div className="card space-y-8">
                {/* Profile Settings */}
                <section>
                    <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <FiUser /> Profile Settings
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                            <input
                                type="text"
                                value={user?.username || ''}
                                disabled
                                className="input-field opacity-50 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="input-field opacity-50 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </section>

                {/* Appearance */}
                <section>
                    <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                        {theme === 'dark' ? <FiMoon /> : <FiSun />} Appearance
                    </h2>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setTheme('dark')}
                            className={`flex-1 p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${theme === 'dark'
                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                    : 'border-slate-700 hover:border-slate-600'
                                }`}
                        >
                            <FiMoon className="text-xl" />
                            <span>Dark Mode</span>
                        </button>
                        <button
                            onClick={() => setTheme('light')}
                            className={`flex-1 p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${theme === 'light'
                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                    : 'border-slate-700 hover:border-slate-600'
                                }`}
                        >
                            <FiSun className="text-xl" />
                            <span>Light Mode</span>
                        </button>
                    </div>
                </section>

                {/* Notifications */}
                <section>
                    <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <FiBell /> Notifications
                    </h2>
                    <div className="space-y-3">
                        {Object.entries({
                            email: 'Email Notifications',
                            browser: 'Browser Push Notifications',
                            securityAlerts: 'Security Testing Alerts',
                            monitoringAlerts: 'Uptime Monitoring Alerts'
                        }).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                                <span>{label}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifications[key]}
                                        onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Security */}
                <section>
                    <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <FiLock /> Security
                    </h2>
                    <button className="btn-secondary w-full flex items-center justify-center gap-2">
                        Change Password
                    </button>
                </section>

                <div className="pt-4 border-t border-slate-700 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="btn-primary flex items-center gap-2 px-8"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <FiSave />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;
