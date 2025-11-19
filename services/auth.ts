import { createClient } from '@supabase/supabase-js';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export const login = async (email: string, password: string): Promise<{ user: AuthUser | null, error: string | null }> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  if (data.user) {
    // Fetch role from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

    const user: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        role: profile?.role || 'user'
    };
    
    // Cache for sync access in non-critical UI
    localStorage.setItem('mmcq_user', JSON.stringify(user));
    return { user, error: null };
  }

  return { user: null, error: 'Unknown error' };
};

/**
 * Registers a new user.
 * IMPORTANT: Uses a temporary client with no persistence to prevent 
 * the Admin's current session from being overwritten by the new user's session.
 */
export const registerUser = async (email: string, password: string) => {
    const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });

    const { data, error } = await tempClient.auth.signUp({
        email,
        password
    });

    return { data, error };
};

export const logout = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('mmcq_user');
};

export const getCurrentUser = (): AuthUser | null => {
    // For immediate UI rendering, we rely on localStorage cache 
    // but Supabase handles the real session
    const raw = localStorage.getItem('mmcq_user');
    return raw ? JSON.parse(raw) : null;
};

export const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('mmcq_user');
};

export const isAdmin = (): boolean => {
    const user = getCurrentUser();
    return user?.role === 'admin';
};