import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApi } from './create';
import { statusApi } from './status';
import { supabase } from '../../supabase';

vi.mock('../../supabase', () => ({
    supabase: {
        from: vi.fn(),
    }
}));

describe('Orders Service Modules', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createApi.addOrder', () => {
        it('fetches establishment_id and inserts order with status occupied', async () => {
            const tableSingleMock = vi.fn().mockResolvedValue({
                data: { establishment_id: 'est-456' },
                error: null
            });
            const tableEqMock = vi.fn(() => ({ single: tableSingleMock }));
            const tableSelectMock = vi.fn(() => ({ eq: tableEqMock }));

            const orderSelectMock = vi.fn().mockResolvedValue({
                data: [{ id: 'order-1', name: 'Suco de Laranja' }],
                error: null
            });
            const orderInsertMock = vi.fn(() => ({ select: orderSelectMock }));

            const tableUpdateEqMock = vi.fn().mockResolvedValue({ error: null });
            const tableUpdateMock = vi.fn(() => ({ eq: tableUpdateEqMock }));

            supabase.from.mockImplementation((table) => {
                if (table === 'tables') {
                    return {
                        select: tableSelectMock,
                        update: tableUpdateMock
                    };
                }
                if (table === 'orders') {
                    return {
                        insert: orderInsertMock
                    };
                }
                return {};
            });

            const result = await createApi.addOrder('table-123', {
                productId: 'prod-1',
                name: 'Suco de Laranja',
                price: 15.5,
                quantity: 2,
                orderedBy: 'user-abc'
            });

            expect(result).toEqual({ id: 'order-1', name: 'Suco de Laranja' });
            expect(orderInsertMock).toHaveBeenCalledWith([
                expect.objectContaining({
                    establishment_id: 'est-456',
                    table_id: 'table-123',
                    name: 'Suco de Laranja',
                    price: 15.5,
                    quantity: 2,
                    ordered_by: 'user-abc',
                    status: 'pending'
                })
            ]);
            expect(tableUpdateMock).toHaveBeenCalledWith({ status: 'occupied' });
        });

        it('returns null if table/establishment is not found', async () => {
            supabase.from.mockReturnValue({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
                    }))
                }))
            });

            const result = await createApi.addOrder('table-invalid', { name: 'Item' });
            expect(result).toBeNull();
        });
    });

    describe('createApi.callWaiter', () => {
        it('creates a service call order with 0 price', async () => {
            const tableSelect = vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: { establishment_id: 'est-1' }, error: null })
                }))
            }));

            const orderInsert = vi.fn(() => ({
                select: vi.fn().mockResolvedValue({ data: [{ id: 'waiter-1', name: '🔔 CHAMAR GARÇOM' }], error: null })
            }));

            supabase.from.mockImplementation((table) => {
                if (table === 'tables') return { select: tableSelect };
                if (table === 'orders') return { insert: orderInsert };
                return {};
            });

            const result = await createApi.callWaiter('tbl-1', 'user-1');
            expect(result).toEqual([{ id: 'waiter-1', name: '🔔 CHAMAR GARÇOM' }]);
            expect(orderInsert).toHaveBeenCalledWith([
                expect.objectContaining({
                    name: '🔔 CHAMAR GARÇOM',
                    price: 0,
                    status: 'service_call',
                    ordered_by: 'user-1'
                })
            ]);
        });
    });

    describe('statusApi.checkUserHasActiveItems', () => {
        it('returns true if user has active unpaid items', async () => {
            const selectMock = vi.fn(() => ({
                eq: vi.fn(() => ({
                    neq: vi.fn(() => ({
                        neq: vi.fn().mockResolvedValue({ count: 2, error: null })
                    }))
                }))
            }));

            supabase.from.mockReturnValue({ select: selectMock });

            const hasActive = await statusApi.checkUserHasActiveItems('user-123');
            expect(hasActive).toBe(true);
        });

        it('returns false if user has 0 unpaid items', async () => {
            const selectMock = vi.fn(() => ({
                eq: vi.fn(() => ({
                    neq: vi.fn(() => ({
                        neq: vi.fn().mockResolvedValue({ count: 0, error: null })
                    }))
                }))
            }));

            supabase.from.mockReturnValue({ select: selectMock });

            const hasActive = await statusApi.checkUserHasActiveItems('user-123');
            expect(hasActive).toBe(false);
        });

        it('returns false if userId is empty', async () => {
            const hasActive = await statusApi.checkUserHasActiveItems(null);
            expect(hasActive).toBe(false);
        });
    });
});
