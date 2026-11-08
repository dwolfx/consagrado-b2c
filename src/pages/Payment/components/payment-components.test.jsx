import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import PaymentSuccessView from './PaymentSuccessView';
import PaymentSummary from './PaymentSummary';
import TipSelector from './TipSelector';
import FeeInfoModal from './FeeInfoModal';
import ItemsInfoModal from './ItemsInfoModal';
import RemoveFeeModal from './RemoveFeeModal';

describe('Payment Subcomponents', () => {
    describe('PaymentSuccessView', () => {
        it('renders confirmation message, receipt hash and handles back button', () => {
            const handleBack = vi.fn();
            render(<PaymentSuccessView receiptHash="TEST1234" onBackToHome={handleBack} />);

            expect(screen.getByText('Pagamento Confirmado!')).toBeInTheDocument();
            expect(screen.getByText('#TEST1234')).toBeInTheDocument();

            const backBtn = screen.getByRole('button', { name: 'Voltar ao Início' });
            fireEvent.click(backBtn);
            expect(handleBack).toHaveBeenCalledTimes(1);
        });
    });

    describe('TipSelector', () => {
        it('renders 8%, 10%, 13% buttons and selects percentage', () => {
            const handleSelect = vi.fn();
            render(<TipSelector serviceFeePercent={10} onSelectPercent={handleSelect} />);

            expect(screen.getByText('8%')).toBeInTheDocument();
            expect(screen.getByText('10%')).toBeInTheDocument();
            expect(screen.getByText('13%')).toBeInTheDocument();

            fireEvent.click(screen.getByText('13%'));
            expect(handleSelect).toHaveBeenCalledWith(13);
        });
    });

    describe('PaymentSummary', () => {
        it('renders subtotal, fee, total and triggers modals and payment', () => {
            const handleShowItems = vi.fn();
            const handleShowFees = vi.fn();
            const handleShowRemove = vi.fn();
            const handlePayment = vi.fn();

            render(
                <PaymentSummary
                    subtotal={100}
                    operationalFeeValue={5.99}
                    tipValue={10}
                    total={115.99}
                    serviceFeePercent={10}
                    setServiceFeePercent={vi.fn()}
                    feeRemoved={false}
                    onShowItemsInfo={handleShowItems}
                    onShowFeeInfo={handleShowFees}
                    onShowRemoveModal={handleShowRemove}
                    onPayment={handlePayment}
                />
            );

            expect(screen.getByText('R$ 100,00')).toBeInTheDocument();
            expect(screen.getByText('R$ 5,99')).toBeInTheDocument();
            expect(screen.getByText('R$ 115,99')).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes dos itens' }));
            expect(handleShowItems).toHaveBeenCalledTimes(1);

            fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes das taxas' }));
            expect(handleShowFees).toHaveBeenCalledTimes(1);

            fireEvent.click(screen.getByText('Não quero pagar a gratificação'));
            expect(handleShowRemove).toHaveBeenCalledTimes(1);

            fireEvent.click(screen.getByRole('button', { name: 'PIX' }));
            expect(handlePayment).toHaveBeenCalledTimes(1);
        });
    });

    describe('FeeInfoModal', () => {
        it('renders machine and app fee breakdown', () => {
            const handleClose = vi.fn();
            render(
                <FeeInfoModal
                    machineFeeValue={4.0}
                    applicableAppFee={1.99}
                    operationalFeeValue={5.99}
                    onClose={handleClose}
                />
            );

            expect(screen.getByText('Entenda as Taxas')).toBeInTheDocument();
            expect(screen.getByText('Taxa Maquininha (4%)')).toBeInTheDocument();
            expect(screen.getByText('Taxa do App (Fixo)')).toBeInTheDocument();
            expect(screen.getByText('R$ 5,99')).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: 'Entendi' }));
            expect(handleClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('ItemsInfoModal', () => {
        it('renders list of consumed items and subtotal', () => {
            const handleClose = vi.fn();
            const orders = [
                { name: 'Burger Especial', price: 35, quantity: 2 },
                { name: 'Refrigerante Lata', price: 8, quantity: 1 }
            ];

            render(<ItemsInfoModal myOrders={orders} subtotal={78} onClose={handleClose} />);

            expect(screen.getByText('Seu Consumo')).toBeInTheDocument();
            expect(screen.getByText('Burger Especial')).toBeInTheDocument();
            expect(screen.getByText('2x')).toBeInTheDocument();
            expect(screen.getByText('R$ 78,00')).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
            expect(handleClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('RemoveFeeModal', () => {
        it('renders reason textarea and handles confirm button', () => {
            const handleConfirm = vi.fn();
            const setReason = vi.fn();
            const handleClose = vi.fn();

            render(
                <RemoveFeeModal
                    removeFeeReason=""
                    setRemoveFeeReason={setReason}
                    onConfirm={handleConfirm}
                    onClose={handleClose}
                />
            );

            expect(screen.getByText('Remover Gratificação')).toBeInTheDocument();

            const textarea = screen.getByRole('textbox');
            fireEvent.change(textarea, { target: { value: 'Atendimento demorado' } });
            expect(setReason).toHaveBeenCalledWith('Atendimento demorado');

            fireEvent.click(screen.getByRole('button', { name: 'Confirmar Remoção' }));
            expect(handleConfirm).toHaveBeenCalledTimes(1);
        });
    });
});
