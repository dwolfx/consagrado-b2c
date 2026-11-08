import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from './Profile';
import * as ProfileLogicModule from './Profile/hooks/useProfileLogic';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('Profile Page (Integration)', () => {
    it('renders profile details and allows toggling privacy and logging out', () => {
        const handleLogout = vi.fn();
        const togglePrivacy = vi.fn();

        vi.spyOn(ProfileLogicModule, 'useProfileLogic').mockReturnValue({
            user: { name: 'Victor Hugo', email: 'victor@consagrado.com', phone: '+5511999998888', country: 'BR', cpf: '12345678900' },
            navigate: mockNavigate,
            editing: null,
            tempValue: '',
            setTempValue: vi.fn(),
            saving: false,
            localCountry: 'BR',
            setLocalCountry: vi.fn(),
            hidePhone: false,
            togglePrivacyPhone: togglePrivacy,
            startEdit: vi.fn(),
            cancelEdit: vi.fn(),
            saveField: vi.fn(),
            handleLogout: handleLogout,
            handleDelete: vi.fn()
        });

        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        expect(screen.getByText('Victor Hugo')).toBeInTheDocument();
        expect(screen.getByText('Cliente Consagrado')).toBeInTheDocument();
        expect(screen.getByText('123.456.789-00')).toBeInTheDocument();
        expect(screen.getByText('victor@consagrado.com')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('switch', { name: 'Ocultar meu telefone' }));
        expect(togglePrivacy).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: /Sair da Conta/ }));
        expect(handleLogout).toHaveBeenCalledTimes(1);
    });
});
