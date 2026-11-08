import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePaymentLogic } from './usePaymentLogic';
import { api } from '../../../services/api';

vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'u1', name: 'Victor Hugo' } })
}));

const mockSetTableId = vi.fn();
vi.mock('../../../context/TableContext', () => ({
    useTableContext: () => ({ setTableId: mockSetTableId })
}));

vi.mock('../../../services/api', () => ({
    api: {
        getTable: vi.fn(),
        payUserOrders: vi.fn().mockResolvedValue(true)
    }
}));

describe('usePaymentLogic', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('calculates subtotal, fees, and total accurately', async () => {
        localStorage.setItem('my_table_id', 'tbl-1');
        api.getTable.mockResolvedValue({
            orders: [
                { ordered_by: 'u1', status: 'pending', name: 'Drink', price: 50, quantity: 2, is_split: false },
                { ordered_by: 'u2', status: 'pending', name: 'Outro', price: 30, quantity: 1, is_split: false },
                { ordered_by: 'u1', status: 'paid', name: 'Pago', price: 20, quantity: 1 }
            ]
        });

        const { result } = renderHook(() => usePaymentLogic());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.subtotal).toBe(100);
        expect(result.current.myOrders.length).toBe(1);
        expect(result.current.tipValue).toBe(10);
        expect(result.current.applicableAppFee).toBe(1.99);
        expect(result.current.machineFeeValue).toBeCloseTo(4.40, 2);
        expect(result.current.operationalFeeValue).toBeCloseTo(6.39, 2);
        expect(result.current.total).toBeCloseTo(116.39, 2);
    });

    it('removes tip fee when valid reason is given', async () => {
        localStorage.setItem('my_table_id', 'tbl-1');
        api.getTable.mockResolvedValue({
            orders: [{ ordered_by: 'u1', status: 'pending', price: 100, quantity: 1 }]
        });

        const { result } = renderHook(() => usePaymentLogic());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        let success;
        act(() => {
            success = result.current.handleRemoveFee('Atendimento muito ruim');
        });

        expect(success).toBe(true);
        expect(result.current.feeRemoved).toBe(true);
        expect(result.current.displayedTip).toBe(0);
    });

    it('executes payment and marks success', async () => {
        localStorage.setItem('my_table_id', 'tbl-1');
        api.getTable.mockResolvedValue({
            orders: [{ ordered_by: 'u1', status: 'pending', price: 50, quantity: 1 }]
        });

        const { result } = renderHook(() => usePaymentLogic());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.handlePayment();
        });

        await waitFor(() => {
            expect(result.current.success).toBe(true);
        });

        expect(api.payUserOrders).toHaveBeenCalledWith('tbl-1', 'u1');
    });
});
