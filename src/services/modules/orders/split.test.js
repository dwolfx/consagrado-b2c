import { describe, it, expect, vi, beforeEach } from 'vitest';
import { splitApi } from './split';
import { supabase } from '../../supabase';
import * as channelModule from './channel';

vi.mock('../../supabase', () => ({
    supabase: {
        from: vi.fn(),
        auth: {
            getUser: vi.fn()
        }
    }
}));

vi.mock('./channel', () => ({
    getOrJoinTableChannel: vi.fn(() => ({})),
    getOrJoinUserChannel: vi.fn(() => ({})),
    sendBroadcast: vi.fn(() => Promise.resolve(true)),
    _channelCache: new Map()
}));

describe('splitApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('requestSplit', () => {
        it('broadcasts request_split to table channel', async () => {
            const orderItem = { id: 'ord-1', table_id: 'tbl-123', name: 'Pizza Grande' };
            const targetUserIds = ['user-1', 'user-2'];

            const result = await splitApi.requestSplit(orderItem, targetUserIds, 'Victor Hugo', 'user-master');
            expect(result).toBe(true);
            expect(channelModule.sendBroadcast).toHaveBeenCalledWith(
                expect.anything(),
                'request_split',
                {
                    orderId: 'ord-1',
                    itemName: 'Pizza Grande',
                    targetIds: targetUserIds,
                    requesterName: 'Victor Hugo',
                    requesterId: 'user-master'
                },
                'table_notifications:tbl-123',
                0
            );
        });
    });

    describe('splitOrder', () => {
        it('correctly updates master order and inserts new split parts', async () => {
            const originalOrder = {
                id: 'order-10',
                name: 'Hambúrguer Artesanal',
                price: 60,
                original_price: null,
                quantity: 1,
                status: 'pending',
                ordered_by: 'user-1',
                table_id: 'table-1',
                establishment_id: 'est-1',
                product_id: 'prod-1'
            };

            const targetUserIds = ['user-1', 'user-2', 'user-3'];

            // Mock update chain
            const selectMock = vi.fn().mockResolvedValue({
                data: [{ id: 'order-10', price: 20 }],
                error: null
            });
            const eqMock = vi.fn(() => ({ select: selectMock }));
            const updateMock = vi.fn(() => ({ eq: eqMock }));

            // Mock insert chain
            const insertMock = vi.fn().mockResolvedValue({ error: null });

            supabase.from.mockImplementation((table) => {
                if (table === 'orders') {
                    return {
                        update: updateMock,
                        insert: insertMock
                    };
                }
                return {};
            });

            const success = await splitApi.splitOrder(originalOrder, targetUserIds);

            expect(success).toBe(true);
            expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
                name: '1/3 Hambúrguer Artesanal',
                price: 20,
                is_split: true,
                split_parts: 3,
                original_price: 60
            }));

            expect(insertMock).toHaveBeenCalledWith([
                expect.objectContaining({ ordered_by: 'user-2', price: 20, name: '1/3 Hambúrguer Artesanal' }),
                expect.objectContaining({ ordered_by: 'user-3', price: 20, name: '1/3 Hambúrguer Artesanal' })
            ]);
        });
    });

    describe('redistributeOrder', () => {
        it('updates existing orders, inserts new user orders, and deletes removed users', async () => {
            const relatedOrders = [
                { id: 'o-1', name: '1/2 Pizza', ordered_by: 'user-1', original_price: 80, price: 40, quantity: 1, table_id: 't-1' },
                { id: 'o-2', name: '1/2 Pizza', ordered_by: 'user-2', original_price: 80, price: 40, quantity: 1, table_id: 't-1' }
            ];

            // New targets: user-2 stays, user-1 is removed, user-3 is newly added (total: 2 users, 40 each)
            const targetUserIds = ['user-2', 'user-3'];

            const updateEqMock = vi.fn().mockResolvedValue({ error: null });
            const updateMock = vi.fn(() => ({ eq: updateEqMock }));
            const insertMock = vi.fn().mockResolvedValue({ error: null });
            const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
            const deleteMock = vi.fn(() => ({ eq: deleteEqMock }));

            supabase.from.mockReturnValue({
                update: updateMock,
                insert: insertMock,
                delete: deleteMock
            });

            const success = await splitApi.redistributeOrder(relatedOrders, targetUserIds);

            expect(success).toBe(true);
            // user-2 updated
            expect(updateMock).toHaveBeenCalled();
            // user-3 inserted
            expect(insertMock).toHaveBeenCalled();
            // user-1 deleted
            expect(deleteMock).toHaveBeenCalled();
        });
    });
});
