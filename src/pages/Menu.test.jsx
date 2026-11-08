import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Menu from './Menu';
import * as MenuLogicModule from './Menu/hooks/useMenuLogic';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'u1', name: 'Victor Hugo' }
    })
}));

vi.mock('../context/ToastContext', () => ({
    useToast: () => ({
        addToast: vi.fn()
    })
}));

describe('Página de Cardápio — Menu (Integração)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve exibir a Splash Screen oficial enquanto os dados do cardápio estiverem carregando', () => {
        vi.spyOn(MenuLogicModule, 'useMenuLogic').mockReturnValue({
            branding: { establishmentName: '', loading: true },
            categories: { list: [], selected: '', select: vi.fn() },
            products: { list: [] },
            onlineUsers: [],
            cart: { data: {}, count: 0, total: 0, addItem: vi.fn(), update: vi.fn() },
            order: { sending: false, handleSend: vi.fn() },
            split: { splittingItem: null, setSplittingItem: vi.fn(), waitStatus: 'idle', responderName: '', reset: vi.fn(), continueAlone: vi.fn(), handleSplitConfirm: vi.fn() },
            pizza: { confirm: vi.fn() }
        });

        render(
            <MemoryRouter>
                <Menu />
            </MemoryRouter>
        );

        expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
    });

    it('deve renderizar o cardápio sem a seção "O de sempre?", filtrar por busca e permitir finalizar o pedido', () => {
        const handleSend = vi.fn();
        const selectCategory = vi.fn();

        vi.spyOn(MenuLogicModule, 'useMenuLogic').mockReturnValue({
            branding: { establishmentName: 'Bar Hexa', loading: false },
            categories: {
                list: ['Cervejas', 'Petiscos', 'Drinks'],
                selected: 'Cervejas',
                select: selectCategory
            },
            products: {
                list: [
                    {
                        id: 'p1',
                        name: 'Chopp Heineken 500ml',
                        description: 'Puro malte tirado na pressão',
                        price: 16.0,
                        category: 'Cervejas'
                    },
                    {
                        id: 'p2',
                        name: 'Batata Crocante',
                        description: 'Porção 500g especial',
                        price: 28.0,
                        category: 'Petiscos'
                    }
                ]
            },
            onlineUsers: [{ id: 'u1', name: 'Victor' }, { id: 'u2', name: 'Maya' }],
            cart: {
                data: { u1: { p1: 2 } },
                count: 2,
                total: 32.0,
                addItem: vi.fn(),
                update: vi.fn()
            },
            order: { sending: false, handleSend },
            split: { splittingItem: null, setSplittingItem: vi.fn(), waitStatus: 'idle', responderName: '', reset: vi.fn(), continueAlone: vi.fn(), handleSplitConfirm: vi.fn() },
            pizza: { confirm: vi.fn() }
        });

        render(
            <MemoryRouter>
                <Menu />
            </MemoryRouter>
        );

        expect(screen.queryByText(/O de sempre\?/i)).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText('Buscar em Bar Hexa...')).toBeInTheDocument();
        expect(screen.getByText('Chopp Heineken 500ml')).toBeInTheDocument();
        expect(screen.getByText('Toque no item p/ dividir')).toBeInTheDocument();

        // Filtra pelo campo de busca
        fireEvent.change(screen.getByPlaceholderText('Buscar em Bar Hexa...'), {
            target: { value: 'Batata' }
        });
        expect(screen.getByText('Batata Crocante')).toBeInTheDocument();

        // Envia o pedido pela barra flutuante
        fireEvent.click(screen.getByText('Fazer pedido'));
        expect(handleSend).toHaveBeenCalledTimes(1);
    });
});
