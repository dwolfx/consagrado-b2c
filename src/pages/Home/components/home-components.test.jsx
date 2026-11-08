import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import HomeHeader from './HomeHeader';
import TableHeroCard from './TableHeroCard';
import FeaturedCarouselMD from './FeaturedCarouselMD';
import UsualOrdersCarouselSM from './UsualOrdersCarouselSM';
import ProductQuickAddModal from './ProductQuickAddModal';
import PrimaryActionsRow from './PrimaryActionsRow';
import OrderStatusDock from './OrderStatusDock';
import NoTableSection from './NoTableSection';
import ProfileMenuModal from './ProfileMenuModal';
import LogoutConfirmModal from './LogoutConfirmModal';

describe('Componentes da Tela Inicial (Home)', () => {
    describe('HomeHeader', () => {
        it('deve renderizar o primeiro nome do usuário e acionar o menu de perfil ao clicar', () => {
            const aoAlternarMenu = vi.fn();

            render(
                <HomeHeader
                    user={{ name: 'Victor Hugo', avatar: 'https://example.com/avatar.jpg' }}
                    userFirstName="Victor"
                    onToggleProfileMenu={aoAlternarMenu}
                />
            );

            expect(screen.getByText('Victor')).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: 'Perfil do usuário' }));
            expect(aoAlternarMenu).toHaveBeenCalledTimes(1);
        });

        it('deve exibir as iniciais quando o usuário não possuir foto de avatar', () => {
            render(
                <HomeHeader
                    user={{ name: 'Victor Hugo' }}
                    userFirstName="Victor"
                    onToggleProfileMenu={vi.fn()}
                />
            );

            expect(screen.getByText('VH')).toBeInTheDocument();
        });
    });

    describe('TableHeroCard', () => {
        it('deve exibir o nome do bar, o número da mesa e abrir o modal de usuários', () => {
            const aoAbrirModal = vi.fn();

            render(
                <TableHeroCard
                    establishment={{ name: 'Bar Hexa' }}
                    table={{ number: 1 }}
                    onlineUsers={[{ id: '1', name: 'Victor' }, { id: '2', name: 'Maya' }]}
                    onOpenUsersModal={aoAbrirModal}
                />
            );

            expect(screen.getByText('Bar Hexa')).toBeInTheDocument();
            expect(screen.getByText('Mesa 1')).toBeInTheDocument();
            expect(screen.getByText(/2 na mesa/)).toBeInTheDocument();

            fireEvent.click(screen.getByText('Mesa 1'));
            expect(aoAbrirModal).toHaveBeenCalledTimes(1);
        });
    });

    describe('FeaturedCarouselMD (Carrossel Médio)', () => {
        const produtosMD = [
            {
                id: 'p1',
                name: 'Batata Crocante',
                description: 'Porção 500g especial',
                price: 28.0,
                image_url: 'https://example.com/batata.jpg'
            },
            {
                id: 'p2',
                name: 'Isca de Frango',
                description: 'Empanada crocante',
                price: 38.0,
                image_url: 'https://example.com/isca.jpg'
            }
        ];

        it('deve renderizar o título contextual, os cards médios e abrir o modal de adição rápida ao clicar no item', () => {
            const aoNavegarCardapio = vi.fn();
            const aoSelecionarProduto = vi.fn();

            render(
                <FeaturedCarouselMD
                    title="Quem conhece, pede"
                    products={produtosMD}
                    onSelectProduct={aoSelecionarProduto}
                    onNavigateMenu={aoNavegarCardapio}
                />
            );

            expect(screen.getByText('Quem conhece, pede')).toBeInTheDocument();
            expect(screen.getByText('Batata Crocante')).toBeInTheDocument();
            expect(screen.getByText('Porção 500g especial')).toBeInTheDocument();
            expect(screen.getByText(/R\$\s*28,00/)).toBeInTheDocument();

            fireEvent.click(screen.getByText('Batata Crocante'));
            expect(aoSelecionarProduto).toHaveBeenCalledWith(produtosMD[0]);

            fireEvent.click(screen.getByText('Ver cardápio +'));
            expect(aoNavegarCardapio).toHaveBeenCalledTimes(1);
        });
    });

    describe('UsualOrdersCarouselSM (Carrossel Compacto — O de sempre?)', () => {
        const produtosSM = [
            {
                id: 'u1',
                name: 'Chopp Heineken',
                price: 16.0,
                image_url: 'https://example.com/chopp.jpg'
            },
            {
                id: 'u2',
                name: 'Pastel Misto',
                price: 22.0,
                image_url: 'https://example.com/pastel.jpg'
            }
        ];

        it('deve renderizar a seção "O de sempre?" com fotos reais dos itens e acionar o modal ao clicar', () => {
            const aoSelecionarProduto = vi.fn();

            render(
                <UsualOrdersCarouselSM
                    products={produtosSM}
                    onSelectProduct={aoSelecionarProduto}
                />
            );

            expect(screen.getByText('O de sempre?')).toBeInTheDocument();
            expect(screen.getByText('Na casa ✓')).toBeInTheDocument();
            expect(screen.getByText('Chopp Heineken')).toBeInTheDocument();
            expect(screen.getByText(/R\$\s*16,00/)).toBeInTheDocument();
            expect(screen.getByText('Pastel Misto')).toBeInTheDocument();

            const imgChopp = screen.getByAltText('Chopp Heineken');
            expect(imgChopp).toBeInTheDocument();
            expect(imgChopp).toHaveAttribute('src', 'https://example.com/chopp.jpg');

            fireEvent.click(screen.getByText('Chopp Heineken'));
            expect(aoSelecionarProduto).toHaveBeenCalledWith(produtosSM[0]);
        });
    });

    describe('ProductQuickAddModal (Modal de Adição Rápida ao Carrinho)', () => {
        const produtoMock = {
            id: 'p1',
            name: 'Batata Crocante',
            description: 'Porção 500g especial com cheddar e bacon',
            price: 28.0,
            image_url: 'https://example.com/batata.jpg'
        };

        it('deve permitir alterar a quantidade e adicionar o produto ao carrinho', () => {
            const aoFechar = vi.fn();
            const aoAdicionar = vi.fn();

            render(
                <ProductQuickAddModal
                    product={produtoMock}
                    onClose={aoFechar}
                    onAddToCart={aoAdicionar}
                />
            );

            expect(screen.getByText('Batata Crocante')).toBeInTheDocument();
            expect(screen.getByText('Porção 500g especial com cheddar e bacon')).toBeInTheDocument();

            const botaoMais = screen.getByRole('button', { name: 'Aumentar quantidade' });
            fireEvent.click(botaoMais);
            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText(/R\$\s*56,00/)).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: /Adicionar/i }));
            expect(aoAdicionar).toHaveBeenCalledWith(produtoMock, 2);
        });
    });

    describe('PrimaryActionsRow', () => {
        it('deve exibir os botões "Fazer Pedido" (com contador de carrinho) e "Garçom" lado a lado e disparar os cliques', () => {
            const aoPedir = vi.fn();
            const aoChamarGarcom = vi.fn();

            render(
                <PrimaryActionsRow
                    onNavigateMenu={aoPedir}
                    onCallWaiter={aoChamarGarcom}
                    waiterCooldown={0}
                    cartCount={3}
                />
            );

            expect(screen.getByText('3 no carrinho')).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: /Fazer Pedido/i }));
            expect(aoPedir).toHaveBeenCalledTimes(1);

            fireEvent.click(screen.getByRole('button', { name: /Garçom/i }));
            expect(aoChamarGarcom).toHaveBeenCalledTimes(1);
        });

        it('deve desabilitar o botão de garçom e mostrar contagem regressiva durante o cooldown', () => {
            render(
                <PrimaryActionsRow
                    onNavigateMenu={vi.fn()}
                    onCallWaiter={vi.fn()}
                    waiterCooldown={30}
                />
            );

            const botaoGarcom = screen.getByRole('button', { name: /30s/i });
            expect(botaoGarcom).toBeDisabled();
        });
    });

    describe('OrderStatusDock (Rodapé Informal de Status)', () => {
        it('deve exibir "Cadê meu pedido?", o status do último pedido sem valores ou quantidades, e o botão "Fechar a conta >"', () => {
            const aoAbrirComanda = vi.fn();
            const aoFecharConta = vi.fn();

            render(
                <OrderStatusDock
                    statusBadge={{ label: 'Em preparo', variant: 'preparing' }}
                    onNavigateTab={aoAbrirComanda}
                    onNavigatePayment={aoFecharConta}
                />
            );

            expect(screen.getByText(/Cadê meu pedido\?/i)).toBeInTheDocument();
            expect(screen.getByText('Em preparo')).toBeInTheDocument();
            expect(screen.queryByText(/itens pedidos/i)).not.toBeInTheDocument();

            fireEvent.click(screen.getByText('Em preparo'));
            expect(aoAbrirComanda).toHaveBeenCalledTimes(1);

            fireEvent.click(screen.getByRole('button', { name: /Fechar a conta >/i }));
            expect(aoFecharConta).toHaveBeenCalledTimes(1);
        });
    });

    describe('NoTableSection', () => {
        it('deve permitir alternar o campo de código manual e enviar o código da mesa', () => {
            const setShowManualInput = vi.fn();
            const setManualCode = vi.fn();
            const onManualSubmit = vi.fn().mockResolvedValue({ success: true });

            const { rerender } = render(
                <NoTableSection
                    showManualInput={false}
                    setShowManualInput={setShowManualInput}
                    manualCode=""
                    setManualCode={setManualCode}
                    onManualSubmit={onManualSubmit}
                    onNavigateScanner={vi.fn()}
                    onNavigateHistory={vi.fn()}
                />
            );

            fireEvent.click(screen.getByRole('button', { name: /Digitar Código da Mesa/i }));
            expect(setShowManualInput).toHaveBeenCalledWith(true);

            rerender(
                <NoTableSection
                    showManualInput={true}
                    setShowManualInput={setShowManualInput}
                    manualCode="IM0001"
                    setManualCode={setManualCode}
                    onManualSubmit={onManualSubmit}
                    onNavigateScanner={vi.fn()}
                    onNavigateHistory={vi.fn()}
                />
            );

            fireEvent.click(screen.getByRole('button', { name: /Entrar na Mesa/i }));
            expect(onManualSubmit).toHaveBeenCalledTimes(1);
        });
    });

    describe('ProfileMenuModal e LogoutConfirmModal', () => {
        it('deve navegar para perfil, histórico ou solicitar desconexão no menu de perfil', () => {
            const onClose = vi.fn();
            const onNavigateProfile = vi.fn();
            const onNavigateHistory = vi.fn();
            const onRequestLogout = vi.fn();

            render(
                <ProfileMenuModal
                    user={{ email: 'victor9009@gmail.com' }}
                    userFirstName="Victor"
                    onClose={onClose}
                    onNavigateProfile={onNavigateProfile}
                    onNavigateHistory={onNavigateHistory}
                    onRequestLogout={onRequestLogout}
                />
            );

            fireEvent.click(screen.getByText('Meu Perfil'));
            expect(onNavigateProfile).toHaveBeenCalledTimes(1);

            fireEvent.click(screen.getByText('Sair da Conta'));
            expect(onRequestLogout).toHaveBeenCalledTimes(1);
        });

        it('deve confirmar ou cancelar a saída da conta no modal de confirmação', () => {
            const onCancel = vi.fn();
            const onConfirm = vi.fn();

            render(<LogoutConfirmModal onCancel={onCancel} onConfirm={onConfirm} />);

            fireEvent.click(screen.getByText(/Continuar no Rolê/i));
            expect(onCancel).toHaveBeenCalledTimes(1);

            fireEvent.click(screen.getByText(/Sim, desconectar/i));
            expect(onConfirm).toHaveBeenCalledTimes(1);
        });
    });
});
