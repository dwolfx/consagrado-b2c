import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';
import * as AuthContextModule from '../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('Register Page', () => {
    it('shows error if password confirmation does not match', async () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ register: vi.fn() });

        render(
            <MemoryRouter>
                <Register />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('Nome Completo'), { target: { value: 'Victor Hugo' } });
        fireEvent.change(screen.getByPlaceholderText('CPF'), { target: { value: '12345678900' } });
        fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'victor@teste.com' } });
        fireEvent.change(screen.getByPlaceholderText('Celular (WhatsApp)'), { target: { value: '11999998888' } });
        fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: '123456' } });
        fireEvent.change(screen.getByPlaceholderText('Confirmar Senha'), { target: { value: '654321' } });

        fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

        await waitFor(() => {
            expect(screen.getByText('Senhas não conferem.')).toBeInTheDocument();
        });
    });

    it('submits registration successfully when inputs are valid', async () => {
        const mockRegister = vi.fn().mockResolvedValue({ success: true });
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ register: mockRegister });

        render(
            <MemoryRouter>
                <Register />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('Nome Completo'), { target: { value: 'Victor Hugo' } });
        fireEvent.change(screen.getByPlaceholderText('CPF'), { target: { value: '12345678900' } });
        fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'victor@teste.com' } });
        fireEvent.change(screen.getByPlaceholderText('Celular (WhatsApp)'), { target: { value: '11999998888' } });
        fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: '123456' } });
        fireEvent.change(screen.getByPlaceholderText('Confirmar Senha'), { target: { value: '123456' } });

        fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith(
                'Victor Hugo',
                'victor@teste.com',
                '123456',
                '(11) 99999-8888',
                '123.456.789-00'
            );
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });
});
