import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('ForgotPassword Page', () => {
    it('switches between email and cpf recovery modes and submits', () => {
        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );

        expect(screen.getByText('E-mail cadastrado')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'CPF' }));
        expect(screen.getByText('CPF cadastrado')).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('000.000.000-00'), {
            target: { value: '123.456.789-00' }
        });

        fireEvent.submit(screen.getByRole('button', { name: 'Enviar Link' }).closest('form'));
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
});
