import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TabDetail from './TabDetail';
import { api } from '../services/api';

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'u1', name: 'Victor Hugo' } })
}));

vi.mock('../hooks/useTablePresence', () => ({
    useTablePresence: () => ({ onlineUsers: [{ id: 'u1', name: 'Victor' }] })
}));

vi.mock('../context/ToastContext', () => ({
    useToast: () => ({ addToast: vi.fn() })
}));

vi.mock('../services/api', () => ({
    supabase: {
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnThis()
        })),
        removeChannel: vi.fn()
    },
    api: {
        getTable: vi.fn()
    }
}));

describe('TabDetail Page (Integration)', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders establishment and table orders', async () => {
        localStorage.setItem('my_table_id', 'tbl-tab-1');
        api.getTable.mockResolvedValue({
            number: 5,
            establishment: { name: 'Boteco Imperial' },
            orders: [
                { id: '1', name: 'Chopp Brahma', price: 12, quantity: 2, ordered_by: 'u1', status: 'pending' }
            ]
        });

        render(
            <MemoryRouter>
                <TabDetail />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Boteco Imperial')).toBeInTheDocument();
            expect(screen.getByText('Mesa 5')).toBeInTheDocument();
        });
    });
});
