import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,

            login: (user, token) => set({ user, token }),

            logout: () => {
                supabase?.auth.signOut();
                set({ user: null, token: null });
            },

            updateUser: (updates) => set((state) => ({
                user: { ...state.user, ...updates }
            }))
        }),
        {
            name: 'devhub-auth',
            partialize: (state) => ({ token: state.token, user: state.user })
        }
    )
);

const toUser = (u) => ({
    id: u.id,
    email: u.email,
    username: u.user_metadata?.user_name || u.user_metadata?.name || u.email?.split('@')[0]
});

/** Mirrors the Supabase session (sign-in, refresh, sign-out) into the store. Call once at startup. */
export function syncSupabaseSession() {
    if (!supabase) return;
    supabase.auth.onAuthStateChange((_event, session) => {
        useAuthStore.setState(session
            ? { user: toUser(session.user), token: session.access_token }
            : { user: null, token: null });
    });
}
