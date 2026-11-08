import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SplitItemModal from './SplitItemModal';
import SplitRequestModal from './SplitRequestModal';

describe('Split Modals', () => {
    describe('SplitItemModal', () => {
        const mockItem = {
            id: 'item-1',
            name: 'Picanha na Chapa',
            price: 120
        };

        const mockCurrentUser = { id: 'user-me', name: 'Victor Hugo' };
        const mockOnlineUsers = [
            { id: 'user-me', name: 'Victor Hugo' },
            { id: 'user-2', name: 'Maya' },
            { id: 'user-3', name: 'Amigo' }
        ];

        it('renders item name and initial calculated price per person', () => {
            render(
                <SplitItemModal
                    item={mockItem}
                    currentUser={mockCurrentUser}
                    onlineUsers={mockOnlineUsers}
                    onClose={vi.fn()}
                    onConfirm={vi.fn()}
                />
            );

            expect(screen.getByText('Picanha na Chapa')).toBeInTheDocument();
            expect(screen.getByText('Dividir com quem?')).toBeInTheDocument();
            expect(screen.getByText('Eu')).toBeInTheDocument();
            expect(screen.getByText('Maya')).toBeInTheDocument();
        });

        it('updates per-person price when toggling another user', () => {
            render(
                <SplitItemModal
                    item={mockItem}
                    currentUser={mockCurrentUser}
                    onlineUsers={mockOnlineUsers}
                    onClose={vi.fn()}
                    onConfirm={vi.fn()}
                />
            );

            // Click on Maya to include her
            const mayaUser = screen.getByText('Maya');
            fireEvent.click(mayaUser);

            // After selecting 2 people, R$ 60,00 badge appears for Maya
            const sixtyElements = screen.getAllByText('R$ 60,00');
            expect(sixtyElements.length).toBeGreaterThan(0);
        });

        it('calls onConfirm with selected user ids when clicking submit', () => {
            const handleConfirm = vi.fn();
            render(
                <SplitItemModal
                    item={mockItem}
                    currentUser={mockCurrentUser}
                    onlineUsers={mockOnlineUsers}
                    onClose={vi.fn()}
                    onConfirm={handleConfirm}
                />
            );

            // Select Maya
            fireEvent.click(screen.getByText('Maya'));

            // Click Dividir Item button
            const confirmBtn = screen.getByRole('button', { name: /Dividir Item/ });
            fireEvent.click(confirmBtn);

            expect(handleConfirm).toHaveBeenCalledWith(
                mockItem,
                ['user-me', 'user-2']
            );
        });

        it('returns null if item is null', () => {
            const { container } = render(
                <SplitItemModal
                    item={null}
                    currentUser={mockCurrentUser}
                    onlineUsers={mockOnlineUsers}
                />
            );
            expect(container.firstChild).toBeNull();
        });
    });

    describe('SplitRequestModal', () => {
        const mockRequest = {
            requesterName: 'Maya',
            itemName: 'Porção de Batata Frita'
        };

        it('renders request details and handles accept/decline buttons', () => {
            const handleAccept = vi.fn();
            const handleDecline = vi.fn();

            render(
                <SplitRequestModal
                    request={mockRequest}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                />
            );

            expect(screen.getByText('Dividir Conta?')).toBeInTheDocument();
            expect(screen.getByText('Maya')).toBeInTheDocument();
            expect(screen.getByText('Porção de Batata Frita')).toBeInTheDocument();

            fireEvent.click(screen.getByText('Aceitar Divisão'));
            expect(handleAccept).toHaveBeenCalledTimes(1);

            fireEvent.click(screen.getByText('Recusar'));
            expect(handleDecline).toHaveBeenCalledTimes(1);
        });

        it('returns null if request is null', () => {
            const { container } = render(<SplitRequestModal request={null} />);
            expect(container.firstChild).toBeNull();
        });
    });
});
