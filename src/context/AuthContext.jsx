import { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/api';

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
        };
        initSession();
    }, []);

    const login = async (email, password) => {
        try {
            // ---------------------------------------------------------
            // 1. DEMO BYPASS
            // ---------------------------------------------------------
            // ---------------------------------------------------------
            // 1. DEMO BYPASS (Universal for Sales Pitch)
            // ---------------------------------------------------------
            if (password === 'demo') {
                let targetDemoUser = null;

                // Main User
                if (email === 'demo@demo' || email === 'demo@demo.com') {
                    targetDemoUser = {
                        id: '00000000-0000-0000-0000-000000000000',
                        name: 'Demo User',
                        email: 'demo@demo',
                        role: 'customer',
                        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=demo&backgroundColor=b6e3f4'
                    };
                }
                // Friend User (Amiga)
                else if (email === 'amigo@demo' || email === 'amigo@demo.com') {
                    targetDemoUser = {
                        id: '22222222-2222-2222-2222-222222222222',
                        name: 'Amiga da Demo',
                        email: 'amigo@demo.com',
                        role: 'customer',
                        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Amiga&backgroundColor=ffdfbf'
                    };
                }

                if (targetDemoUser) {
                    // Try to find if user really exists in DB to use their REAL data (e.g. if they changed avatar)
                    // We use the ID to check because Email might vary in DB vs Bypass
                    const { data } = await supabase.from('users').select('*').eq('id', targetDemoUser.id).single();

                    if (data) {
                        setUser(data);
                        localStorage.setItem('garcom_user', JSON.stringify(data));
                        return true;
                    }

                    // Fallback to memory object
                    setUser(targetDemoUser);
                    localStorage.setItem('garcom_user', JSON.stringify(targetDemoUser));
                    return true;
                }
            }

            // ---------------------------------------------------------
            // 2. SUPABASE NATIVE AUTH
            // ---------------------------------------------------------
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                console.error('Auth Login failed:', authError.message);
                return false;
            }

            // 3. Fetch User Profile
            if (authData.user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single();

                // Fallback object if profile missing (shouldn't happen with correct flow)
                const userObj = profile || {
                    id: authData.user.id,
                    email: authData.user.email,
                    role: 'customer',
                    name: 'Usuário',
                    avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${authData.user.email}&backgroundColor=b6e3f4`
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
            await supabase
                .from('users')
                .update(updates)
                .eq('id', user.id);
        } catch (e) {
            console.error('Update failed', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
