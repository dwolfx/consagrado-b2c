import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    Input,
    PhoneInput,
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Select,
    EmptyState,
    PriceDisplay,
    Carousel
} from './index';

describe('Design System - Componentes de UI Reutilizáveis', () => {
    describe('Input Component', () => {
        it('renderiza rótulo, texto de ajuda e gerencia digitação', async () => {
            const handleChange = vi.fn();
            render(
                <Input
                    label="Nome de Usuário"
                    placeholder="Digite seu nome"
                    helperText="Mínimo 3 caracteres"
                    onChange={handleChange}
                />
            );

            expect(screen.getByText('Nome de Usuário')).toBeInTheDocument();
            expect(screen.getByText('Mínimo 3 caracteres')).toBeInTheDocument();

            const input = screen.getByPlaceholderText('Digite seu nome');
            await userEvent.type(input, 'Victor');
            expect(handleChange).toHaveBeenCalled();
        });

        it('exibe mensagem de erro acessível com role alert', () => {
            render(
                <Input
                    label="E-mail"
                    error="E-mail inválido"
                />
            );

            const alert = screen.getByRole('alert');
            expect(alert).toHaveTextContent('E-mail inválido');
        });

        it('renderiza ícones à esquerda e à direita', () => {
            render(
                <Input
                    placeholder="Busca"
                    leftIcon={<span data-testid="left-icon">🔍</span>}
                    rightIcon={<span data-testid="right-icon">✖</span>}
                />
            );

            expect(screen.getByTestId('left-icon')).toBeInTheDocument();
            expect(screen.getByTestId('right-icon')).toBeInTheDocument();
        });
    });

    describe('PhoneInput Component (Internacional com Brasil Padrão)', () => {
        it('inicia com Brasil (+55) como padrão e aplica máscara brasileira', async () => {
            const Wrapper = () => {
                const [phone, setPhone] = useState('');
                return (
                    <PhoneInput
                        label="Celular"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                );
            };

            render(<Wrapper />);

            expect(screen.getByText('+55')).toBeInTheDocument();
            expect(screen.getByText('🇧🇷')).toBeInTheDocument();

            const input = screen.getByPlaceholderText('(11) 99999-9999');
            await userEvent.type(input, '11987654321');

            expect(input).toHaveValue('(11) 98765-4321');
        });

        it('permite abrir o seletor, buscar e trocar para Estados Unidos (+1) adaptando a máscara', async () => {
            const Wrapper = () => {
                const [phone, setPhone] = useState('');
                return (
                    <PhoneInput
                        label="Telefone Internacional"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                );
            };

            render(<Wrapper />);

            // Clica no botão de país para abrir o dropdown
            const countryBtn = screen.getByRole('button', { name: /País selecionado/i });
            fireEvent.click(countryBtn);

            // Busca por Estados Unidos
            const searchInput = screen.getByPlaceholderText('Buscar país ou DDI...');
            await userEvent.type(searchInput, 'Estados Unidos');

            // Clica na opção dos EUA
            const usOption = screen.getByRole('option', { name: /Estados Unidos/i });
            fireEvent.click(usOption);

            // DDI atualizado
            expect(screen.getByText('+1')).toBeInTheDocument();
            expect(screen.getByText('🇺🇸')).toBeInTheDocument();

            // Digita número americano
            const input = screen.getByPlaceholderText('(555) 123-4567');
            await userEvent.type(input, '4155552671');
            expect(input).toHaveValue('(415) 555-2671');
        });
    });

    describe('Button Component', () => {
        it('renderiza variantes, tamanhos e dispara evento de clique', () => {
            const handleClick = vi.fn();
            render(
                <Button variant="primary" size="lg" onClick={handleClick}>
                    Confirmar Pedido
                </Button>
            );

            const btn = screen.getByRole('button', { name: 'Confirmar Pedido' });
            expect(btn).toHaveClass('ui-button-primary');
            expect(btn).toHaveClass('ui-button-lg');

            fireEvent.click(btn);
            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('exibe indicador de carregamento e bloqueia cliques quando loading=true', () => {
            const handleClick = vi.fn();
            render(
                <Button loading onClick={handleClick}>
                    Salvar
                </Button>
            );

            const btn = screen.getByRole('button');
            expect(btn).toBeDisabled();
            expect(screen.getByRole('status')).toBeInTheDocument();

            fireEvent.click(btn);
            expect(handleClick).not.toHaveBeenCalled();
        });
    });

    describe('Card Component', () => {
        it('renderiza estrutura completa com Header, Body e Footer e responde a cliques', () => {
            const handleClick = vi.fn();
            render(
                <Card clickable onClick={handleClick}>
                    <CardHeader><h3>Mesa 04</h3></CardHeader>
                    <CardBody><p>4 pessoas ativas</p></CardBody>
                    <CardFooter><span>Total: R$ 120,00</span></CardFooter>
                </Card>
            );

            expect(screen.getByText('Mesa 04')).toBeInTheDocument();
            expect(screen.getByText('4 pessoas ativas')).toBeInTheDocument();
            expect(screen.getByText('Total: R$ 120,00')).toBeInTheDocument();

            const card = screen.getByRole('button');
            fireEvent.click(card);
            expect(handleClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('Select Component', () => {
        it('renderiza opções e aciona callback ao alterar valor', () => {
            const handleChange = vi.fn();
            render(
                <Select
                    label="Forma de Pagamento"
                    options={[
                        { value: 'pix', label: 'Pix Instantâneo' },
                        { value: 'credit', label: 'Cartão de Crédito' }
                    ]}
                    onChange={handleChange}
                />
            );

            expect(screen.getByText('Forma de Pagamento')).toBeInTheDocument();
            const select = screen.getByRole('combobox');
            fireEvent.change(select, { target: { value: 'pix' } });

            expect(handleChange).toHaveBeenCalled();
        });
    });

    describe('EmptyState Component', () => {
        it('renderiza estado vazio com ícone, mensagem e botão de ação', () => {
            const handleAction = vi.fn();
            render(
                <EmptyState
                    icon={<span data-testid="empty-icon">🍽️</span>}
                    title="Nenhum item adicionado"
                    description="Seu carrinho está vazio no momento."
                    actionLabel="Ver Cardápio"
                    onAction={handleAction}
                />
            );

            expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
            expect(screen.getByText('Nenhum item adicionado')).toBeInTheDocument();
            expect(screen.getByText('Seu carrinho está vazio no momento.')).toBeInTheDocument();

            const btn = screen.getByRole('button', { name: 'Ver Cardápio' });
            fireEvent.click(btn);
            expect(handleAction).toHaveBeenCalledTimes(1);
        });
    });

    describe('PriceDisplay Component', () => {
        it('formata valor monetário em Real (BRL) e calcula divisão por pessoa', () => {
            render(
                <PriceDisplay
                    value={50}
                    originalValue={60}
                    splitParts={2}
                    color="success"
                />
            );

            expect(screen.getByText(/50,00/)).toBeInTheDocument();
            expect(screen.getByText(/60,00/)).toBeInTheDocument();
            expect(screen.getByText('/ 2 pessoas')).toBeInTheDocument();
        });
    });

    describe('Carousel Component', () => {
        it('renderiza slides e permite navegar pelos botões anterior e próximo', () => {
            const items = [
                { id: 1, title: 'Super Promoção de Chopp' },
                { id: 2, title: 'Rodízio de Petiscos' }
            ];

            render(
                <Carousel
                    items={items}
                    renderItem={(item) => <div>{item.title}</div>}
                />
            );

            expect(screen.getByText('Super Promoção de Chopp')).toBeInTheDocument();
            expect(screen.getByText('Rodízio de Petiscos')).toBeInTheDocument();

            const nextBtn = screen.getByRole('button', { name: 'Próximo slide' });
            const prevBtn = screen.getByRole('button', { name: 'Slide anterior' });

            fireEvent.click(nextBtn);
            fireEvent.click(prevBtn);
        });
    });
});
