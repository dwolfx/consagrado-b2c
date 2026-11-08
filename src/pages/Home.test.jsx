import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import * as HomeLogicModule from './Home/hooks/useHomeLogic';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('Página Inicial — Home (Integração)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o estado sem mesa quando o cliente não estiver vinculado a uma mesa', () => {
        vi.spyOn(HomeLogicModule, 'useHomeLogic').mockReturnValue({
            user: { id: 'u1', name: 'Victor Hugo' },
            logout: vi.fn(),
            userFirstName: 'Victor',
            tableId: null,
            table: null,
            establishment: null,
            onlineUsers: [],
            statusBadge: null,
            showManualInput: false,
            setShowManualInput: vi.fn(),
            manualCode: '',
            setManualCode: vi.fn(),
            showUsersModal: false,
            setShowUsersModal: vi.fn(),
            showLogoutConfirm: false,
            setShowLogoutConfirm: vi.fn(),
            confirmLogout: vi.fn(),
            handleManualSubmit: vi.fn(),
            waiterCooldown: 0,
            handleCallWaiter: vi.fn(),
            contextualTitle: 'Quem conhece, pede',
            featuredProducts: [],
            usualProducts: [],
            selectedQuickProduct: null,
            setSelectedQuickProduct: vi.fn(),
            cartCount: 0,
            handleAddToCart: vi.fn()
        });

        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        expect(screen.getByText('Você não está em uma mesa')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Ler QR Code da Mesa/i })).toBeInTheDocument();
    });

    it('deve renderizar a mesa ativa com carrossel MD ("Quem conhece, pede"), carrossel SM com fotos ("O de sempre?"), modal rápido de carrinho e rodapé "Cadê meu pedido?"', () => {
        const handleCallWaiter = vi.fn();
        const setSelectedQuickProduct = vi.fn();
        const handleAddToCart = vi.fn();

        const prodDestaque = {
            id: 'f1',
            name: 'Batata Crocante',
            description: 'Porção 500g especial',
            price: 28.0,
            image_url: 'https://example.com/batata.jpg'
        };

        vi.spyOn(HomeLogicModule, 'useHomeLogic').mockReturnValue({
            user: { id: 'u1', name: 'Victor Hugo' },
            logout: vi.fn(),
            userFirstName: 'Victor',
            tableId: '1',
            table: { number: 1 },
            establishment: { name: 'Bar Hexa' },
            onlineUsers: [{ id: 'u1', name: 'Victor' }],
            statusBadge: { label: 'Em preparo', variant: 'preparing' },
            showManualInput: false,
            setShowManualInput: vi.fn(),
            manualCode: '',
            setManualCode: vi.fn(),
            showUsersModal: false,
            setShowUsersModal: vi.fn(),
            showLogoutConfirm: false,
            setShowLogoutConfirm: vi.fn(),
            confirmLogout: vi.fn(),
            handleManualSubmit: vi.fn(),
            waiterCooldown: 0,
            handleCallWaiter,
            contextualTitle: 'Quem conhece, pede',
            featuredProducts: [prodDestaque],
            usualProducts: [
                {
                    id: 'u1',
                    name: 'Chopp Heineken',
                    price: 16.0,
                    image_url: 'https://example.com/chopp.jpg'
                }
            ],
            selectedQuickProduct: prodDestaque,
            setSelectedQuickProduct,
            cartCount: 1,
            handleAddToCart
        });

        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        expect(screen.getByText('Bar Hexa')).toBeInTheDocument();
        expect(screen.getByText('Mesa 1')).toBeInTheDocument();
        expect(screen.getByText('Quem conhece, pede')).toBeInTheDocument();
        expect(screen.getByText('O de sempre?')).toBeInTheDocument();
        expect(screen.getByText('Chopp Heineken')).toBeInTheDocument();
        expect(screen.getByText('1 no carrinho')).toBeInTheDocument();
        expect(screen.getByText(/Cadê meu pedido\?/i)).toBeInTheDocument();
        expect(screen.getByText('Em preparo')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Adicionar/i }));
        expect(handleAddToCart).toHaveBeenCalledWith(prodDestaque, 1);

        fireEvent.click(screen.getByRole('button', { name: /Garçom/i }));
        expect(handleCallWaiter).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: /Fechar a conta >/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/payment');
    });
});
