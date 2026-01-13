import { useState } from 'react';
import { supabase } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const useProfileLogic = () => {
    const navigate = useNavigate();
    const { user, login, logout } = useAuth();

    // UI State
    const [editing, setEditing] = useState(null);
    const [tempValue, setTempValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [hidePhone, setHidePhone] = useState(user?.settings?.privacy_phone || false);

    // Local state for country (defaults to user's country or BR)
    const [localCountry, setLocalCountry] = useState(user?.country || 'BR');

    const startEdit = (field, currentVal) => {
        setEditing(field);
        setTempValue(currentVal || '');
        if (field === 'phone') {
            setLocalCountry(user?.country || 'BR');
        }
    };

    const cancelEdit = () => {
        setEditing(null);
        setTempValue('');
    };

    const saveField = async () => {
        if (!user?.id) return;
        setSaving(true);
        try {
            let updateData = { [editing]: tempValue };

            // Sync country if phone changed
            if (editing === 'phone') {
                updateData.country = localCountry;
            }

            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;

            // Refresh session/user data
            await login();
            // Optional: window.location.reload(); if context doesn't auto-update largely enough
            window.location.reload();

        } catch (err) {
            console.error(err);
            alert('Erro ao atualizar: ' + err.message);
        } finally {
            setSaving(false);
            setEditing(null);
        }
    };

    const togglePrivacyPhone = async () => {
        const newValue = !hidePhone;
        setHidePhone(newValue);
        const newSettings = { ...(user?.settings || {}), privacy_phone: newValue };
        await supabase.from('users').update({ settings: newSettings }).eq('id', user.id);

        // Reload to ensure deep state sync
        window.location.reload();
    };

    const handleLogout = () => { logout(); navigate('/login'); };
    const handleDelete = () => { if (confirm("Tem certeza?")) { alert("Conta agendada."); handleLogout(); } };

    return {
        user, navigate,
        editing, tempValue, setTempValue, saving,
        localCountry, setLocalCountry,
        hidePhone, togglePrivacyPhone,
        startEdit, cancelEdit, saveField,
        handleLogout, handleDelete
    };
};
