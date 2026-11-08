import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import * as AuthContextModule from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn()
}));

describe('Rota Protegida (ProtectedRoute)', () => {
    it('deve exibir a Splash Screen oficial enquanto a autenticação estiver carregando', () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            user: null,
            loading: true
        });

        render(
            <MemoryRouter initialEntries={['/']}>
                <ProtectedRoute>
                    <div>Conteúdo Secreto</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
        expect(screen.getByText('Sua comanda, seu chopp, sem fila.')).toBeInTheDocument();
        expect(screen.queryByText('Conteúdo Secreto')).not.toBeInTheDocument();
    });

    it('deve redirecionar para /login quando o usuário não estiver autenticado', () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            user: null,
            loading: false
        });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/protected" element={
                        <ProtectedRoute>
                            <div>Conteúdo Secreto</div>
                        </ProtectedRoute>
                    } />
                    <Route path="/login" element={<div>Página de Login</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Página de Login')).toBeInTheDocument();
        expect(screen.queryByText('Conteúdo Secreto')).not.toBeInTheDocument();
    });

    it('deve renderizar o conteúdo filho quando o usuário estiver autenticado', () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            user: { id: 'user-123' },
            loading: false
        });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <ProtectedRoute>
                    <div>Conteúdo Liberado</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByText('Conteúdo Liberado')).toBeInTheDocument();
    });
});
