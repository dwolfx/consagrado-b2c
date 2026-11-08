import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Payment from './Payment';
import * as PaymentLogicModule from './Payment/hooks/usePaymentLogic';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('Payment Page (Integration)', () => {
    it('renders payment skeleton when loading', () => {
        vi.spyOn(PaymentLogicModule, 'usePaymentLogic').mockReturnValue({
            loading: true,
            success: false
        });

        const { container } = render(
            <MemoryRouter>
                <Payment />
            </MemoryRouter>
        );

        expect(container.querySelector('.container')).toBeInTheDocument();
    });

    it('renders success view when payment is confirmed', () => {
        vi.spyOn(PaymentLogicModule, 'usePaymentLogic').mockReturnValue({
            loading: false,
            success: true,
            setTableId: vi.fn()
        });

        render(
            <MemoryRouter>
                <Payment />
            </MemoryRouter>
        );

        expect(screen.getByText('Pagamento Confirmado!')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Voltar ao Início' })).toBeInTheDocument();
    });

    it('renders summary and allows initiating payment', () => {
        const handlePayment = vi.fn();

        vi.spyOn(PaymentLogicModule, 'usePaymentLogic').mockReturnValue({
            loading: false,
            success: false,
            subtotal: 100,
            myOrders: [],
            total: 110,
            serviceFeePercent: 10,
            setServiceFeePercent: vi.fn(),
            removeFeeReason: '',
            setRemoveFeeReason: vi.fn(),
            feeRemoved: false,
            showFeeInfo: false,
            setShowFeeInfo: vi.fn(),
            showItemsInfo: false,
            setShowItemsInfo: vi.fn(),
            showRemoveModal: false,
            setShowRemoveModal: vi.fn(),
            tipValue: 10,
            machineFeeValue: 4.4,
            operationalFeeValue: 6.39,
            applicableAppFee: 1.99,
            handleRemoveFee: vi.fn(),
            handlePayment: handlePayment,
            setTableId: vi.fn()
        });

        render(
            <MemoryRouter>
                <Payment />
            </MemoryRouter>
        );

        expect(screen.getByText('Pagamento')).toBeInTheDocument();
        expect(screen.getByText('R$ 100,00')).toBeInTheDocument();
        expect(screen.getByText('R$ 110,00')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'PIX' }));
        expect(handlePayment).toHaveBeenCalledTimes(1);
    });
});
