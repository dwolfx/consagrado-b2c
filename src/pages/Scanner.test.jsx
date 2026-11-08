import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Scanner from './Scanner';
import { api } from '../services/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

const mockSetTableId = vi.fn();
vi.mock('../context/TableContext', () => ({
    useTableContext: () => ({ setTableId: mockSetTableId })
}));

const mockAddToast = vi.fn();
vi.mock('../context/ToastContext', () => ({
    useToast: () => ({ addToast: mockAddToast })
}));

vi.mock('../services/api', () => ({
    api: {
        getTables: vi.fn(),
        getTableByCode: vi.fn()
    }
}));

describe('Scanner Page', () => {
    it('simulates scan and redirects to home with tableId', async () => {
        api.getTables.mockResolvedValue([{ id: 'table-real-123' }]);

        render(
            <MemoryRouter>
                <Scanner />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Simular leitura de QR Code' }));

        await waitFor(() => {
            expect(mockSetTableId).toHaveBeenCalledWith('table-real-123');
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('submits manual code successfully', async () => {
        api.getTableByCode.mockResolvedValue({ id: 'table-code-99' });

        render(
            <MemoryRouter>
                <Scanner />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Inserir código da mesa' }));
        fireEvent.change(screen.getByPlaceholderText('Ex: AA0001'), { target: { value: 'AA0001' } });

        fireEvent.click(screen.getByRole('button', { name: 'Entrar na Mesa' }));

        await waitFor(() => {
            expect(api.getTableByCode).toHaveBeenCalledWith('AA0001');
            expect(mockSetTableId).toHaveBeenCalledWith('table-code-99');
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });
});
