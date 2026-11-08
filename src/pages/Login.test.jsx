import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import * as AuthContextModule from '../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('Login Page', () => {
    it('submits login form with valid credentials', async () => {
        const mockLogin = vi.fn().mockResolvedValue(true);
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ login: mockLogin });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'victor@consagrado.com' } });
        fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'senha123' } });

        fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('victor@consagrado.com', 'senha123');
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('shows error message on failed login', async () => {
        const mockLogin = vi.fn().mockResolvedValue(false);
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ login: mockLogin });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'errado@email.com' } });
        fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: '123' } });

        fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

        await waitFor(() => {
            expect(screen.getByText('Credenciais inválidas.')).toBeInTheDocument();
        });
    });

    it('supports demo login shortcut', async () => {
        const mockLogin = vi.fn().mockResolvedValue(true);
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ login: mockLogin });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Entrar com Google' }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('demo@demo', 'demo');
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });
});
