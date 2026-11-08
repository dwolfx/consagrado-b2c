import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHomeLogic, resolveContextualTitle } from './useHomeLogic';
import { api } from '../../../services/api';

const mockLogout = vi.fn();
vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'u1', name: 'Victor Hugo' },
        logout: mockLogout
    })
}));

const mockSetTableId = vi.fn();
vi.mock('../../../context/TableContext', () => ({
    useTableContext: () => ({
        tableId: 'tbl-1',
        table: { number: 1 },
        establishment: { id: 'est-1', name: 'Bar Hexa' },
        onlineUsers: [{ id: 'u1', name: 'Victor' }],
        setTableId: mockSetTableId
    })
}));

const mockAddToast = vi.fn();
vi.mock('../../../context/ToastContext', () => ({
    useToast: () => ({ addToast: mockAddToast })
}));

vi.mock('../../../services/api', () => ({
    supabase: {
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnThis()
        })),
        removeChannel: vi.fn()
    },
    api: {
        getTableByCode: vi.fn(),
        getEstablishmentByEntryCode: vi.fn(),
        getProducts: vi.fn().mockResolvedValue([]),
        getTable: vi.fn().mockResolvedValue({ orders: [] }),
        callWaiter: vi.fn().mockResolvedValue(true)
    }
}));

describe('Hook useHomeLogic (Lógica da Tela Inicial)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    it('deve extrair corretamente o primeiro nome do usuário e definir o título contextual', () => {
        const { result } = renderHook(() => useHomeLogic());
        expect(result.current.userFirstName).toBe('Victor');
        expect(result.current.contextualTitle).toBe('Quem conhece, pede');
    });

    it('deve retornar "Pra não ter erro" quando o usuário for visitante sem ID', () => {
        window.sessionStorage.clear();
        expect(resolveContextualTitle(null)).toBe('Pra não ter erro');
    });

    it('deve validar o código manual da mesa com sucesso', async () => {
        api.getEstablishmentByEntryCode.mockResolvedValue(null);
        api.getTableByCode.mockResolvedValue({ id: 'tbl-found', establishment_id: 'est-1' });

        const { result } = renderHook(() => useHomeLogic());

        act(() => {
            result.current.setManualCode('IM0001');
        });

        await act(async () => {
            await result.current.handleManualSubmit();
        });

        expect(api.getTableByCode).toHaveBeenCalledWith('IM0001');
        expect(mockSetTableId).toHaveBeenCalledWith('tbl-found');
    });

    it('deve exibir aviso de erro quando o código manual da mesa não for encontrado', async () => {
        api.getEstablishmentByEntryCode.mockResolvedValue(null);
        api.getTableByCode.mockResolvedValue(null);

        const { result } = renderHook(() => useHomeLogic());

        act(() => {
            result.current.setManualCode('INVALID');
        });

        await act(async () => {
            await result.current.handleManualSubmit();
        });

        expect(mockAddToast).toHaveBeenCalledWith('Código não encontrado!', 'error');
        expect(mockSetTableId).not.toHaveBeenCalled();
    });

    it('deve chamar o garçom e iniciar o tempo de espera (cooldown)', async () => {
        const { result } = renderHook(() => useHomeLogic());

        await act(async () => {
            await result.current.handleCallWaiter();
        });

        expect(api.callWaiter).toHaveBeenCalledWith('tbl-1', 'u1');
        expect(result.current.waiterCooldown).toBe(45);
    });

    it('deve adicionar produto ao carrinho compartilhado (b2c_shared_cart) e atualizar o contador', () => {
        const { result } = renderHook(() => useHomeLogic());
        const produto = { id: 'p1', name: 'Chopp Heineken', price: 16.0 };

        act(() => {
            result.current.handleAddToCart(produto, 2);
        });

        expect(result.current.cartCount).toBe(2);
        expect(mockAddToast).toHaveBeenCalledWith('2x Chopp Heineken adicionado ao carrinho! 🛒', 'success');

        const salvo = JSON.parse(window.localStorage.getItem('b2c_shared_cart'));
        expect(salvo).toEqual({ u1: { p1: 2 } });
    });
});
