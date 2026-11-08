import { createContext, useState, useContext, useEffect } from 'react';
import { api, supabase } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext();

// Mapeamento entre o banco (avatar_url) e o app interno (avatar)
// Centralizado aqui para não vazar detalhes do schema pro resto do app
const dbToUser = (profile) => {
    if (!profile) return null;
    const { avatar_url, ...rest } = profile;
    return { ...rest, avatar: avatar_url || null };
};

const userToDb = (updates) => {
    if (!updates) return updates;
    const { avatar, ...rest } = updates;
    const db = { ...rest };
    if ('avatar' in updates) db.avatar_url = avatar;
    return db;
};

export const AuthProvider = ({ children }) => {
    const { addToast } = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initSession = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    console.warn('⚠️ Sessão anterior inválida ou expirada:', error.message);
                    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
                    localStorage.removeItem('b2c_user');
                    setUser(null);
                    return;
                }

                const session = data?.session;

            if (session) {
                // Always re-fetch from DB to get the freshest profile data
                // (localStorage may be stale if another device or session updated it)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    const meta = session.user.user_metadata || session.user.raw_user_meta_data || {};
                    const fallbackPhone = meta.phone || session.user.phone || null;
                    const fallbackCpf = meta.cpf || meta.document || null;

                    const mergedProfile = {
                        ...(profile || {}),
                        id: session.user.id,
                        email: session.user.email,
                        name: profile?.name || meta.name || 'Usuário',
                        phone: profile?.phone || fallbackPhone,
                        cpf: profile?.cpf || fallbackCpf,
                        avatar_url: profile?.avatar_url || meta.avatar_url || null,
                    };

                    const mapped = dbToUser(mergedProfile);
                    setUser(mapped);
                    localStorage.setItem('b2c_user', JSON.stringify(mapped));

                    // Garante que o banco herde CPF/celular do cadastro caso estejam ausentes na tabela
                    if ((!profile.cpf && fallbackCpf) || (!profile.phone && fallbackPhone)) {
                        supabase.from('profiles').update({
                            cpf: profile.cpf || fallbackCpf,
                            phone: profile.phone || fallbackPhone
                        }).eq('id', session.user.id).then();
                    }
                } else {
                    // Perfil não encontrado — usa localStorage como fallback temporário
                    const storedUser = localStorage.getItem('b2c_user');
                    if (storedUser) setUser(JSON.parse(storedUser));
                }
            } else {
                const guestUser = localStorage.getItem('b2c_guest_user');
                if (guestUser) {
                    try {
                        setUser(JSON.parse(guestUser));
                    } catch (e) {
                        setUser(null);
                        localStorage.removeItem('b2c_user');
                    }
                } else {
                    setUser(null);
                    localStorage.removeItem('b2c_user');
                }
            }
            } catch (err) {
                console.warn('⚠️ Falha ao inicializar autenticação:', err);
                await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
                localStorage.removeItem('b2c_user');
                setUser(null);
            } finally {
                setLoading(false);
                localStorage.setItem('lastActivity', Date.now());
            }
        };
        initSession();
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
             if (!session) {
                 setUser(null);
                 localStorage.removeItem('b2c_user');
             }
        });
        
        return () => subscription.unsubscribe();
    }, []);

    const loginAsGuest = (guestName) => {
        const cleanName = (guestName || '').trim() || 'Convidado';
        const guestObj = {
            id: 'guest_' + Date.now(),
            name: cleanName,
            email: 'convidado@consagrado.app',
            is_guest: true,
            avatar: null,
            phone: null,
            cpf: null,
        };
        setUser(guestObj);
        localStorage.setItem('b2c_user', JSON.stringify(guestObj));
        localStorage.setItem('b2c_guest_user', JSON.stringify(guestObj));
        return true;
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut({ scope: 'local' });
        } catch (e) {
            console.warn('⚠️ Erro ao deslogar no Supabase:', e);
        } finally {
            setUser(null);
            localStorage.removeItem('b2c_user');
            localStorage.removeItem('b2c_guest_user');
        }
    };

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
                    addToast("Sessão expirada por inatividade.", "warning");
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
                    .from('profiles')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single();

                const meta = authData.user.user_metadata || {};
                const mergedProfile = {
                    ...(profile || {}),
                    id: authData.user.id,
                    email: authData.user.email,
                    name: profile?.name || meta.name || 'Usuário',
                    phone: profile?.phone || meta.phone || null,
                    cpf: profile?.cpf || meta.cpf || null,
                    avatar_url: profile?.avatar_url || meta.avatar_url || null,
                };

                // Perfil não encontrado no banco — cria agora com dados herdados do cadastro
                if (!profile) {
                    console.warn('Perfil ausente, criando com dados do cadastro...');
                    const defaultAvatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${authData.user.email}&eyes=default&mouth=default&eyebrows=default`;
                    const newProfileDb = {
                        id: authData.user.id,
                        email: authData.user.email,
                        role: 'customer',
                        name: mergedProfile.name,
                        phone: mergedProfile.phone,
                        cpf: mergedProfile.cpf,
                        avatar_url: defaultAvatar,
                    };

                    const { error: insertError } = await supabase
                        .from('profiles')
                        .insert([newProfileDb]);

                    if (insertError) {
                        console.error('Falha ao criar perfil:', insertError);
                    }
                    mergedProfile.avatar_url = defaultAvatar;
                } else if ((!profile.cpf && meta.cpf) || (!profile.phone && meta.phone)) {
                    await supabase.from('profiles').update({
                        cpf: profile.cpf || meta.cpf,
                        phone: profile.phone || meta.phone
                    }).eq('id', authData.user.id);
                }

                const userObj = dbToUser(mergedProfile);
                setUser(userObj);
                localStorage.setItem('b2c_user', JSON.stringify(userObj));
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
            const cleanDigits = phone ? phone.replace(/\D/g, '') : '';
            const standardizedPhone = cleanDigits.length >= 10 && !phone.startsWith('+') ? `+55${cleanDigits}` : phone;

            // 1. Create Auth User (Triggers Email and stores user_metadata)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        phone: standardizedPhone,
                        cpf,
                    }
                }
            });

            if (authError) return { error: authError.message };
            if (!authData.user) return { error: 'Erro desconhecido ao criar auth.' };

            // 2. Create Public Profile linked to Auth ID
            // Using UPSERT to handle race conditions or re-registrations
            const { error: dbError } = await supabase
                .from('profiles')
                .upsert([{
                    id: authData.user.id,
                    name,
                    email,
                    phone: standardizedPhone,
                    cpf,
                    role: 'customer',
                    avatar_url: `https://api.dicebear.com/9.x/avataaars/svg?seed=${email}&backgroundColor=b6e3f4`
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

    

    const resetPassword = async (email) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password', // Can be handled later
            });
            if (error) return { error: error.message };
            return { success: true };
        } catch (e) {
            return { error: e.message };
        }
    };

    const updateUser = async (updates) => {
        if (!user) return { error: 'No user' };

        // Se o usuário já possui CPF, o CPF é imutável e tentativas de alteração são descartadas.
        // Se a conta ainda não possui CPF gravado, permite preencher e salvar permanentemente!
        let safeUpdates = { ...updates };
        if (user.cpf && updates.cpf && updates.cpf !== user.cpf) {
            console.warn('CPF já cadastrado e imutável');
            delete safeUpdates.cpf;
        }

        // Atualização otimista: reflete na UI imediatamente
        const updatedUser = { ...user, ...safeUpdates };
        setUser(updatedUser);
        localStorage.setItem('b2c_user', JSON.stringify(updatedUser));

        // Converte campos internos do app (avatar) para nomes reais do banco (avatar_url)
        const dbUpdates = userToDb(safeUpdates);

        try {
            const { error, data } = await supabase
                .from('profiles')
                .update(dbUpdates)
                .eq('id', user.id)
                .select();

            if (error) {
                console.error('Falha ao salvar perfil:', error.message, error.details);
                addToast(`Erro ao salvar: ${error.message}`, 'error');
                return { error };
            }

            // Se atualizou telefone, CPF ou nome, sincroniza também no auth metadata
            if (safeUpdates.phone || safeUpdates.cpf || safeUpdates.name) {
                const authMetaUpdates = {};
                if (safeUpdates.phone) authMetaUpdates.phone = safeUpdates.phone;
                if (safeUpdates.cpf) authMetaUpdates.cpf = safeUpdates.cpf;
                if (safeUpdates.name) authMetaUpdates.name = safeUpdates.name;
                supabase.auth.updateUser({ data: authMetaUpdates }).catch(() => {});
            }

            if (!data || data.length === 0) {
                // 0 linhas atualizadas — perfil não existe ou RLS bloqueou
                // Fallback: upsert
                const { error: upsertErr, data: upsertData } = await supabase
                    .from('profiles')
                    .upsert([{
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role || 'customer',
                        ...dbUpdates
                    }], { onConflict: 'id' })
                    .select();

                if (upsertErr) {
                    console.warn('Upsert de perfil falhou:', upsertErr.message);
                    return {};
                }

                if (upsertData?.[0]) {
                    const mapped = dbToUser(upsertData[0]);
                    const safeUserObj = {
                        ...mapped,
                        cpf: upsertData[0].cpf || updatedUser.cpf,
                        phone: upsertData[0].phone || updatedUser.phone
                    };
                    setUser(safeUserObj);
                    localStorage.setItem('b2c_user', JSON.stringify(safeUserObj));
                }
                return {};
            }

            // Sincroniza com a resposta exata do banco preservando dados cadastrais
            if (data[0]) {
                const mapped = dbToUser(data[0]);
                const safeUserObj = {
                    ...mapped,
                    cpf: data[0].cpf || updatedUser.cpf,
                    phone: data[0].phone || updatedUser.phone
                };
                setUser(safeUserObj);
                localStorage.setItem('b2c_user', JSON.stringify(safeUserObj));
            }
            return {};
        } catch (e) {
            console.error('Update exception', e);
            return { error: e };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loginAsGuest, updateUser, register, resetPassword, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
