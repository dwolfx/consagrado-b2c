import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSplitLogic } from './useSplitLogic';
import { api } from '../../../services/api';

const mockAddToast = vi.fn();
vi.mock('../../../context/ToastContext', () => ({
    useToast: () => ({ addToast: mockAddToast })
}));

vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'user-1', name: 'Victor Hugo' } })
}));

vi.mock('../../../services/api', () => ({
    api: {
        splitOrder: vi.fn(),
        redistributeOrder: vi.fn(),
        requestSplit: vi.fn(),
        deleteOrder: vi.fn()
    },
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
                        }))
                    }))
                }))
            }))
        }))
    }
}));

describe('useSplitLogic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('opens modal on item click and initializes selected users with current user', () => {
        const { result } = renderHook(() => useSplitLogic([]));

        const item = { id: 'order-1', name: 'Petisco', price: 50, is_split: false };

        act(() => {
            result.current.handleItemClick(item);
        });

        expect(result.current.splitItem).toEqual(item);
        expect(result.current.selectedUsersToSplit).toEqual(['user-1']);
        expect(result.current.isEditingSplit).toBe(false);
    });

    it('does nothing if clicked item is already paid', () => {
        const { result } = renderHook(() => useSplitLogic([]));
        const paidItem = { id: 'order-paid', name: 'Petisco', status: 'paid' };

        act(() => {
            result.current.handleItemClick(paidItem);
        });

        expect(result.current.splitItem).toBeNull();
    });

    it('splits order and triggers success toast when more than 1 user selected', async () => {
        api.splitOrder.mockResolvedValue(true);

        const { result } = renderHook(() => useSplitLogic([]));
        const item = { id: 'order-1', name: 'Petisco', price: 50 };

        act(() => {
            result.current.handleItemClick(item);
        });

        await act(async () => {
            await result.current.handleModalConfirm(item, ['user-1', 'user-2']);
        });

        expect(api.splitOrder).toHaveBeenCalledWith(item, ['user-1', 'user-2']);
        expect(mockAddToast).toHaveBeenCalledWith('Pedido dividido com sucesso!', 'success');
        expect(result.current.splitItem).toBeNull();
    });

    it('alerts if user tries to confirm split with only 1 user', async () => {
        const { result } = renderHook(() => useSplitLogic([]));
        const item = { id: 'order-1', name: 'Petisco' };

        act(() => {
            result.current.handleItemClick(item);
        });

        await act(async () => {
            await result.current.handleModalConfirm(item, ['user-1']);
        });

        expect(api.splitOrder).not.toHaveBeenCalled();
        expect(mockAddToast).toHaveBeenCalledWith('Selecione mais pessoas na mesa para dividir.', 'info');
    });

    it('closes modal and resets state on closeSplitModal', () => {
        const { result } = renderHook(() => useSplitLogic([]));
        const item = { id: 'order-1', name: 'Petisco' };

        act(() => {
            result.current.handleItemClick(item);
        });
        expect(result.current.splitItem).not.toBeNull();

        act(() => {
            result.current.closeSplitModal();
        });
        expect(result.current.splitItem).toBeNull();
    });
});
