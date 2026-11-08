import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import History from './History';
import { api } from '../services/api';

const mockUser = { id: 'u1', name: 'Victor Hugo' };
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ user: mockUser })
}));

vi.mock('../services/api', () => ({
    api: {
        getUserHistory: vi.fn()
    }
}));

describe('History Page (Integration)', () => {
    it('fetches and displays past orders grouped by date and establishment', async () => {
        api.getUserHistory.mockResolvedValue([
            {
                id: 'o-1',
                name: 'Burger Gourmet',
                price: 45,
                quantity: 1,
                status: 'paid',
                created_at: '2026-11-05T20:00:00Z',
                table: { establishment: { name: 'Hamburgueria Consagrado' } }
            }
        ]);

        render(
            <MemoryRouter>
                <History />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Hamburgueria Consagrado')).toBeInTheDocument();
            expect(screen.getByText(/1 itens/)).toBeInTheDocument();
        });

        // Click to open receipt modal
        fireEvent.click(screen.getByText('Hamburgueria Consagrado'));

        expect(screen.getByText('Pagamento Confirmado')).toBeInTheDocument();
        expect(screen.getByText('1x Burger Gourmet')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Fechar Recibo' })).toBeInTheDocument();
    });

    it('shows empty message when user has no order history', async () => {
        api.getUserHistory.mockResolvedValue([]);

        render(
            <MemoryRouter>
                <History />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Nenhum pedido anterior/)).toBeInTheDocument();
        });
    });
});
