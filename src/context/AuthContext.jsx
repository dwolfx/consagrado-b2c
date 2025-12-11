import { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial load from local storage
    useEffect(() => {
        const storedUser = localStorage.getItem('garcom_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            // ---------------------------------------------------------
            // 1. DEMO BYPASS (Guaranteed Access)
            // ---------------------------------------------------------
            if (email === 'demo@demo' && password === 'demo') {
                const { data } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', 'demo@demo')
                    .single();

                if (data) {
                    console.log("Demo user found in DB. Logging in...");
                    setUser(data);
                    localStorage.setItem('garcom_user', JSON.stringify(data));
                    return true;
                }

                // Fallback if not in DB yet (Offline / First Run)
                console.log("Demo user not in DB. Using local fallback.");
                const demoUser = {
                    id: 'demo-user-id',
                    name: 'Demo User',
                    email: 'demo@demo',
                    role: 'customer',
                    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=demo&backgroundColor=b6e3f4'
                };
                setUser(demoUser);
                localStorage.setItem('garcom_user', JSON.stringify(demoUser));
                return true;
            }

            // ---------------------------------------------------------
            // 2. REAL DB LOGIN
            // ---------------------------------------------------------
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('password', password) // Start with plain match for existing data
                .single();

            if (data) {
                setUser(data);
                localStorage.setItem('garcom_user', JSON.stringify(data));
                return true;
            } else {
                console.error('Login failed:', error?.message);
                return false;
            }
        } catch (e) {
            console.error('Login exception:', e);
            return false;
        }
    };

    const register = async (name, email, password, phone, cpf) => {
        try {
            // Check if exists
            const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
            if (existing) return { error: 'Email já cadastrado.' };

            const { data, error } = await supabase
                .from('users')
                .insert([{
                    name,
                    email,
                    password, // Plain text for demo
                    phone,
                    cpf, // Pass CPF to DB
                    role: 'customer',
                    avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${email}&backgroundColor=b6e3f4`
                }])
                .select()
                .single();

            if (data) {
                setUser(data);
                localStorage.setItem('garcom_user', JSON.stringify(data));
                return { success: true };
            }
            return { error: error?.message };
        } catch (e) {
            return { error: e.message };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('garcom_user');
    };

    const updateUser = async (updates) => {
        if (!user) return;

        // 1. Optimistic Update
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('garcom_user', JSON.stringify(updatedUser));

        // 2. Real Database Update
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
