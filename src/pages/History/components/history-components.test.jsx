import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import HistoryCard from './HistoryCard';
import ReceiptModal from './ReceiptModal';

describe('History Components', () => {
    const mockGroup = {
        id: 'group-1',
        place: 'Consagrado Gastrobar',
        date: '07/11/2026',
        items: [
            { name: 'Cerveja IPA', price: 20, quantity: 2 },
            { name: 'Porção de Pastel', price: 30, quantity: 1 }
        ]
    };

    describe('HistoryCard', () => {
        it('renders place, date, items count and calculated total', () => {
            const handleClick = vi.fn();
            render(<HistoryCard group={mockGroup} onClick={handleClick} />);

            expect(screen.getByText('Consagrado Gastrobar')).toBeInTheDocument();
            expect(screen.getByText(/07\/11\/2026 • 2 itens/)).toBeInTheDocument();

            // Subtotal: (20*2) + (30*1) = 70. Total: 70 * 1.04 + 1.99 = 74.79
            expect(screen.getByText('R$ 74,79')).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button'));
            expect(handleClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('ReceiptModal', () => {
        it('returns null if selectedOrder is null', () => {
            const { container } = render(<ReceiptModal selectedOrder={null} onClose={vi.fn()} />);
            expect(container.firstChild).toBeNull();
        });

        it('renders order receipt breakdown and total', () => {
            const handleClose = vi.fn();
            render(<ReceiptModal selectedOrder={mockGroup} onClose={handleClose} />);

            expect(screen.getByText('Pagamento Confirmado')).toBeInTheDocument();
            expect(screen.getByText('07/11/2026 • Consagrado Gastrobar')).toBeInTheDocument();
            expect(screen.getByText('2x Cerveja IPA')).toBeInTheDocument();
            expect(screen.getByText('1x Porção de Pastel')).toBeInTheDocument();
            expect(screen.getByText('Taxa do App')).toBeInTheDocument();
            expect(screen.getByText('R$ 74,79')).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: 'Fechar Recibo' }));
            expect(handleClose).toHaveBeenCalledTimes(1);
        });
    });
});
