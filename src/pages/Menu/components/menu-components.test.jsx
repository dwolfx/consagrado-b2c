import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import MenuHeader from './MenuHeader';
import CategoryTabs from './CategoryTabs';
import ProductCard from './ProductCard';
import ProductGrid from './ProductGrid';
import CartFooter from './CartFooter';
import SplitStatusModal from './SplitStatusModal';
import PizzaBuilderModal from './PizzaBuilderModal';

describe('Componentes da Tela de Cardápio (Menu)', () => {
    describe('MenuHeader', () => {
        it('deve renderizar o campo de busca com o nome do bar, acionar voltar e abrir o modal de pessoas na mesa', () => {
            const aoVoltar = vi.fn();
            const aoBuscar = vi.fn();
            const aoAbrirPessoas = vi.fn();

            render(
                <MenuHeader
                    establishmentName="Bar Hexa"
                    searchTerm=""
                    onSearchChange={aoBuscar}
                    onlineUsersCount={2}
                    onOpenUsersModal={aoAbrirPessoas}
                    onBack={aoVoltar}
                />
            );

            expect(screen.getByPlaceholderText('Buscar em Bar Hexa...')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();

            fireEvent.change(screen.getByPlaceholderText('Buscar em Bar Hexa...'), {
                target: { value: 'Heineken' }
            });
            expect(aoBuscar).toHaveBeenCalledWith('Heineken');

            fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
            expect(aoVoltar).toHaveBeenCalledTimes(1);

            fireEvent.click(screen.getByRole('button', { name: 'Pessoas na mesa' }));
            expect(aoAbrirPessoas).toHaveBeenCalledTimes(1);
        });
    });

    describe('CategoryTabs', () => {
        it('deve renderizar a lista de categorias em squircles com ícones e disparar a troca de categoria', () => {
            const aoSelecionar = vi.fn();

            render(
                <CategoryTabs
                    categories={['Cervejas', 'Drinks', 'Petiscos']}
                    selectedCategory="Cervejas"
                    onSelectCategory={aoSelecionar}
                />
            );

            expect(screen.getByText('Cervejas')).toBeInTheDocument();
            expect(screen.getByText('Drinks')).toBeInTheDocument();
            expect(screen.getByText('Petiscos')).toBeInTheDocument();

            fireEvent.click(screen.getByText('Drinks'));
            expect(aoSelecionar).toHaveBeenCalledWith('Drinks');
        });
    });

    describe('ProductCard', () => {
        const mockItem = {
            id: 'p1',
            name: 'Chopp Heineken 500ml',
            description: 'Puro malte tirado na pressão',
            price: 16.0,
            category: 'Cervejas',
            image_url: 'https://example.com/chopp.jpg'
        };

        it('deve renderizar os detalhes do item e adicionar ao carrinho quando a quantidade for 0', () => {
            const aoAdicionar = vi.fn();

            render(
                <ProductCard
                    item={mockItem}
                    quantityInCart={0}
                    isFeatured={true}
                    onAdd={aoAdicionar}
                />
            );

            expect(screen.getByText('Quem conhece, pede')).toBeInTheDocument();
            expect(screen.getByText('Chopp Heineken 500ml')).toBeInTheDocument();
            expect(screen.getByText('Puro malte tirado na pressão')).toBeInTheDocument();
            expect(screen.getByText(/R\$\s*16,00/)).toBeInTheDocument();

            const btnAdd = screen.getByRole('button', { name: 'Adicionar Chopp Heineken 500ml ao carrinho' });
            fireEvent.click(btnAdd);
            expect(aoAdicionar).toHaveBeenCalledWith(mockItem);
        });

        it('deve exibir o controle stepper (- 2 +) quando o item já estiver no carrinho', () => {
            const aoAdicionar = vi.fn();
            const aoRemover = vi.fn();

            render(
                <ProductCard
                    item={mockItem}
                    quantityInCart={2}
                    onAdd={aoAdicionar}
                    onRemove={aoRemover}
                />
            );

            expect(screen.getByText('2')).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: 'Diminuir Chopp Heineken 500ml do carrinho' }));
            expect(aoRemover).toHaveBeenCalledWith(mockItem);

            fireEvent.click(screen.getByRole('button', { name: 'Aumentar Chopp Heineken 500ml no carrinho' }));
            expect(aoAdicionar).toHaveBeenCalledWith(mockItem);
        });

        it('deve exibir a tag "Em falta" e bloquear clique quando o item estiver esgotado', () => {
            const aoClicar = vi.fn();

            render(
                <ProductCard
                    item={{ ...mockItem, is_out_of_stock: true }}
                    quantityInCart={0}
                    onItemClick={aoClicar}
                />
            );

            expect(screen.getByText('Em falta')).toBeInTheDocument();
            fireEvent.click(screen.getByText('Chopp Heineken 500ml'));
            expect(aoClicar).not.toHaveBeenCalled();
        });
    });

    describe('ProductGrid', () => {
        it('deve renderizar o cabeçalho da categoria com a dica de divisão e a lista de produtos', () => {
            const aoAtualizarCarrinho = vi.fn();
            const itens = [
                { id: '1', name: 'Chopp Heineken 500ml', price: 16.0, category: 'Cervejas' },
                { id: '2', name: 'Chopp IPA Artesanal 500ml', price: 19.9, category: 'Cervejas' }
            ];

            render(
                <ProductGrid
                    items={itens}
                    cart={{ u1: { '1': 2 } }}
                    userId="u1"
                    selectedCategory="Cervejas"
                    searchTerm=""
                    onItemClick={vi.fn()}
                    onUpdateCart={aoAtualizarCarrinho}
                    onOpenPizzaBuilder={vi.fn()}
                />
            );

            expect(screen.getByText('Cervejas')).toBeInTheDocument();
            expect(screen.getByText('Toque no item p/ dividir')).toBeInTheDocument();
            expect(screen.getByText('Chopp Heineken 500ml')).toBeInTheDocument();
            expect(screen.getByText('Chopp IPA Artesanal 500ml')).toBeInTheDocument();
        });
    });

    describe('CartFooter', () => {
        it('deve retornar nulo quando a quantidade de itens no carrinho for 0', () => {
            const { container } = render(<CartFooter count={0} total={0} onCheckout={vi.fn()} />);
            expect(container.firstChild).toBeNull();
        });

        it('deve renderizar o contador, o total formatado e acionar o envio do pedido', () => {
            const aoEnviar = vi.fn();

            render(
                <CartFooter
                    count={2}
                    total={32.0}
                    sending={false}
                    onCheckout={aoEnviar}
                />
            );

            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('Fazer pedido')).toBeInTheDocument();
            expect(screen.getByText(/R\$\s*32,00/)).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button'));
            expect(aoEnviar).toHaveBeenCalledTimes(1);
        });

        it('deve desabilitar o botão e exibir "Enviando..." durante o envio', () => {
            render(
                <CartFooter
                    count={2}
                    total={32.0}
                    sending={true}
                    onCheckout={vi.fn()}
                />
            );

            expect(screen.getByText('Enviando...')).toBeInTheDocument();
            expect(screen.getByRole('button')).toBeDisabled();
        });
    });

    describe('Modais Auxiliares (SplitStatusModal e PizzaBuilderModal)', () => {
        it('deve exibir o estado de espera ou recusa no SplitStatusModal', () => {
            const aoCancelar = vi.fn();
            const aoContinuarSo = vi.fn();

            render(
                <SplitStatusModal
                    status="rejected"
                    responderName="Carlos"
                    onCancel={aoCancelar}
                    onContinueAlone={aoContinuarSo}
                />
            );

            expect(screen.getByText('Carlos preferiu não dividir.')).toBeInTheDocument();
            fireEvent.click(screen.getByText('Continuar'));
            expect(aoContinuarSo).toHaveBeenCalledTimes(1);
        });

        it('deve permitir escolher 2 sabores no PizzaBuilderModal e confirmar pelo maior valor', () => {
            const aoConfirmar = vi.fn();
            const sabores = [
                { id: 'pz1', name: 'Calabresa', price: 50, category: 'Pizzas' },
                { id: 'pz2', name: 'Portuguesa', price: 62, category: 'Pizzas' }
            ];

            render(
                <PizzaBuilderModal
                    isOpen={true}
                    onClose={vi.fn()}
                    products={sabores}
                    category="Pizzas"
                    onConfirm={aoConfirmar}
                />
            );

            fireEvent.click(screen.getByText('Calabresa'));
            fireEvent.click(screen.getByText('Portuguesa'));

            fireEvent.click(screen.getByRole('button', { name: 'Confirmar Pizza' }));
            expect(aoConfirmar).toHaveBeenCalledWith(sabores[0], sabores[1]);
        });
    });
});
