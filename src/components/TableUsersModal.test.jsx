import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TableUsersModal from './TableUsersModal';

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'u1', name: 'Victor Hugo' }
    })
}));

describe('TableUsersModal', () => {
    const mockUsers = [
        { id: 'u1', name: 'Victor Hugo', avatar_url: 'https://example.com/vh.jpg', phone: '+5511999998888' },
        { id: 'u2', name: 'Maya', avatar_url: 'https://example.com/maya.jpg', phone: '+5511977776666' }
    ];

    it('renders connected users count and user names in list view', () => {
        render(<TableUsersModal users={mockUsers} onClose={vi.fn()} />);

        expect(screen.getByText('2 pessoas conectadas')).toBeInTheDocument();
        expect(screen.getByText('Victor Hugo')).toBeInTheDocument();
        expect(screen.getByText('VOCÊ')).toBeInTheDocument();
        expect(screen.getByText('Maya')).toBeInTheDocument();
    });

    it('opens user detail when user is clicked and allows going back', () => {
        render(<TableUsersModal users={mockUsers} onClose={vi.fn()} />);

        fireEvent.click(screen.getByText('Maya'));

        expect(screen.getByText('Detalhes')).toBeInTheDocument();
        expect(screen.getByText('Cliente Consagrado')).toBeInTheDocument();

        // Back button
        const backBtn = screen.getByRole('button', { name: 'Voltar para lista de usuários' });
        fireEvent.click(backBtn);

        expect(screen.getByText('A Mesa')).toBeInTheDocument();
    });

    it('calls onClose when clicking close button', () => {
        const handleClose = vi.fn();
        render(<TableUsersModal users={mockUsers} onClose={handleClose} />);

        const closeBtn = screen.getByRole('button', { name: 'Fechar modal' });
        fireEvent.click(closeBtn);

        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
