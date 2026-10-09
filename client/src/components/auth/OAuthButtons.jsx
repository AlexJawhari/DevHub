import { FiGithub } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';

const PROVIDERS = [
    { id: 'github', label: 'Continue with GitHub', Icon: FiGithub },
    { id: 'google', label: 'Continue with Google', Icon: FcGoogle }
];

/** GitHub/Google sign-in; renders nothing until Supabase is configured. */
function OAuthButtons() {
    if (!supabase) return null;

    const signIn = async (provider) => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: `${window.location.origin}/dashboard` }
        });
        if (error) toast.error(error.message);
    };

    return (
        <div className="space-y-3 p-2 pb-0">
            {PROVIDERS.map(({ id, label, Icon }) => (
                <button
                    key={id}
                    type="button"
                    onClick={() => signIn(id)}
                    className="w-full btn-secondary flex items-center justify-center gap-3 py-3"
                >
                    <Icon className="text-xl" />
                    {label}
                </button>
            ))}
            <div className="flex items-center gap-3 text-xs text-slate-400 pt-2">
                <div className="flex-1 border-t border-slate-700" />
                or use email
                <div className="flex-1 border-t border-slate-700" />
            </div>
        </div>
    );
}

export default OAuthButtons;
