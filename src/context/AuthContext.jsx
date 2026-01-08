import { createContext, useState, useContext, useEffect } from 'react';
import { api, supabase } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Init session from local storage or Supabase session
        const initSession = async () => {
            const storedUser = localStorage.getItem('garcom_user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
            setLoading(false);
            localStorage.setItem('lastActivity', Date.now()); // Reset on load
        };
        initSession();
    }, []);

    // AUTO-LOGOUT LOGIC
    useEffect(() => {
        if (!user) return;

        const TIMEOUT_MS = 3 * 60 * 60 * 1000; // 3 Hours
        // const TIMEOUT_MS = 10000; // Debug: 10 seconds

        const updateActivity = () => {
            localStorage.setItem('lastActivity', Date.now());
        };

        const checkInactivity = async () => {
            const lastActivity = parseInt(localStorage.getItem('lastActivity') || Date.now());
            const now = Date.now();

            if (now - lastActivity > TIMEOUT_MS) {
                console.log("⏰ Inactivity detected. Checking status...");
                // Check if user has active/unpaid orders
                const hasActive = await api.checkUserHasActiveItems(user.id);

                if (hasActive) {
                    console.log("🛡️ Auto-logout blocked: User has active orders/debt.");
                } else {
                    console.log("👋 Auto-logout triggering.");
                    logout();
                    alert("Sessão expirada por inatividade.");
                }
            }
        };

        // Listeners for activity
        window.addEventListener('mousemove', updateActivity);
        window.addEventListener('keydown', updateActivity);
        window.addEventListener('touchstart', updateActivity);
        window.addEventListener('scroll', updateActivity);
        window.addEventListener('click', updateActivity);

        // Check every 1 minute
        const interval = setInterval(checkInactivity, 60 * 1000);

        return () => {
            window.removeEventListener('mousemove', updateActivity);
            window.removeEventListener('keydown', updateActivity);
            window.removeEventListener('touchstart', updateActivity);
            window.removeEventListener('scroll', updateActivity);
            window.removeEventListener('click', updateActivity);
            clearInterval(interval);
        };
    }, [user]);

    const login = async (email, password) => {
        try {
            // SUPABASE NATIVE AUTH (Secure Beta Environment)
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                console.error('Auth Login failed:', authError.message);
                return false;
            }

            if (authData.user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single();

                let userObj = profile;

                // 2026-01-06: Fix - If public profile missing, create it immediately.
                if (!userObj) {
                    console.warn('Profile missing for user, creating now...');
                    const newProfile = {
                        id: authData.user.id,
                        email: authData.user.email,
                        role: 'customer',
                        name: authData.user.user_metadata?.name || 'Usuário',
                        // Use updated transparent/default avatar logic for new profiles
                        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${authData.user.email}&eyes=default&mouth=default&eyebrows=default`
                    };

                    const { error: insertError } = await supabase
                        .from('users')
                        .insert([newProfile]);

                    if (insertError) {
                        console.error('Failed to create missing profile:', insertError);
                        // Fallback to memory, but warn this will not persist updates
                    } else {
                        userObj = newProfile;
                    }
                }

                // Fallback struct if insert failed or just safety
                userObj = userObj || {
                    id: authData.user.id,
                    email: authData.user.email,
                    role: 'customer',
                    name: 'Usuário',
                    avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${authData.user.email}&eyes=default&mouth=default&eyebrows=default`
                };

                setUser(userObj);
                localStorage.setItem('garcom_user', JSON.stringify(userObj));
                return true;
            }
            return false;

        } catch (e) {
            console.error('Login exception:', e);
            return false;
        }
    };

    const register = async (name, email, password, phone, cpf) => {
        try {
            // 1. Create Auth User (Triggers Email)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) return { error: authError.message };
            if (!authData.user) return { error: 'Erro desconhecido ao criar auth.' };

            // 2. Create Public Profile linked to Auth ID
            // Using UPSERT to handle race conditions or re-registrations
            const { error: dbError } = await supabase
                .from('users')
                .upsert([{
                    id: authData.user.id, // CRITICAL: Must match Auth ID
                    name,
                    email,
                    phone,
                    cpf,
                    role: 'customer',
                    avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${email}&backgroundColor=b6e3f4`
                }]);

            if (dbError) {
                console.error('Profile DB Error:', dbError.message);
                // Non-blocking in worst case, but ideally we want profile
            }

            return { success: true, user: authData.user };

        } catch (e) {
            return { error: e.message };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem('garcom_user');
    };

    const updateUser = async (updates) => {
        if (!user) return;

        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('garcom_user', JSON.stringify(updatedUser));

        try {
            const { error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', user.id);

            if (error) {
                console.error('CRITICAL: Supabase update failed:', error.message, error.details, error.hint);
                alert(`Erro ao salvar no banco: ${error.message}`); // Temporary alert to notify user immediately
            } else {
                console.log('Supabase update successful for:', user.id);
            }
        } catch (e) {
            console.error('Update exception', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
