import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// null until the env vars are set; pages then fall back to the legacy login.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
