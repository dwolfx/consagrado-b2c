import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Badge from './Badge';
import Avatar from './Avatar';
import ToggleSwitch from './ToggleSwitch';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import AppHeader from './AppHeader';

describe('UI Primitives', () => {
    describe('Badge', () => {
        it('renders text with default styles', () => {
            render(<Badge>Aberta</Badge>);
            const badge = screen.getByText('Aberta');
            expect(badge).toBeInTheDocument();
            expect(badge.style.textTransform).toBe('uppercase');
        });

        it('applies custom background and color', () => {
            render(<Badge bg="red" color="white" size="xs">Pendente</Badge>);
            const badge = screen.getByText('Pendente');
            expect(badge.style.backgroundColor).toBe('red');
            expect(badge.style.color).toBe('white');
        });
    });

    describe('Avatar', () => {
        it('renders image with provided src and name', () => {
            render(<Avatar src="https://example.com/photo.jpg" name="Victor Hugo" size={48} />);
            const img = screen.getByAltText('Victor Hugo');
            expect(img).toBeInTheDocument();
            expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
        });

        it('renders fallback image when src is omitted', () => {
            render(<Avatar name="Victor Hugo" size={40} />);
            const img = screen.getByAltText('Victor Hugo');
            expect(img.getAttribute('src')).toContain('ui-avatars.com');
        });

        it('shows online indicator when isOnline is true', () => {
            render(<Avatar name="Maya" isOnline={true} />);
            expect(screen.getByTestId('online-indicator')).toBeInTheDocument();
        });

        it('triggers onClick handler when clicked', () => {
            const handleClick = vi.fn();
            render(<Avatar name="Victor" onClick={handleClick} />);
            fireEvent.click(screen.getByAltText('Victor'));
            expect(handleClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('ToggleSwitch', () => {
        it('renders with correct aria attributes and reacts to click', () => {
            const handleChange = vi.fn();
            render(<ToggleSwitch checked={false} onChange={handleChange} label="Notificações" />);

            const button = screen.getByRole('switch', { name: 'Notificações' });
            expect(button).toHaveAttribute('aria-checked', 'false');

            fireEvent.click(button);
            expect(handleChange).toHaveBeenCalledWith(true);
        });

        it('does not toggle when disabled', () => {
            const handleChange = vi.fn();
            render(<ToggleSwitch checked={true} onChange={handleChange} disabled={true} label="Bloqueado" />);

            const button = screen.getByRole('switch', { name: 'Bloqueado' });
            expect(button).toBeDisabled();
            fireEvent.click(button);
            expect(handleChange).not.toHaveBeenCalled();
        });
    });

    describe('Modal', () => {
        it('renders title and children when open', () => {
            render(
                <Modal isOpen={true} title="Título do Modal">
                    <p>Conteúdo interno</p>
                </Modal>
            );
            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('Título do Modal')).toBeInTheDocument();
            expect(screen.getByText('Conteúdo interno')).toBeInTheDocument();
        });

        it('does not render when isOpen is false', () => {
            render(
                <Modal isOpen={false} title="Escondido">
                    <p>Invisível</p>
                </Modal>
            );
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('calls onClose when close button is clicked', () => {
            const handleClose = vi.fn();
            render(
                <Modal isOpen={true} title="Teste" onClose={handleClose}>
                    <span>Modal Body</span>
                </Modal>
            );
            const closeBtn = screen.getByRole('button', { name: 'Fechar' });
            fireEvent.click(closeBtn);
            expect(handleClose).toHaveBeenCalledTimes(1);
        });

        it('calls onClose on Escape key press', () => {
            const handleClose = vi.fn();
            render(
                <Modal isOpen={true} title="Teste Escape" onClose={handleClose}>
                    <span>Escape</span>
                </Modal>
            );
            fireEvent.keyDown(window, { key: 'Escape' });
            expect(handleClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('LoadingSpinner', () => {
        it('renders with status role and custom size', () => {
            render(<LoadingSpinner size={40} color="red" />);
            const spinner = screen.getByRole('status', { name: 'Carregando' });
            expect(spinner).toBeInTheDocument();
            expect(spinner.style.width).toBe('40px');
            expect(spinner.style.height).toBe('40px');
        });
    });

    describe('AppHeader', () => {
        it('renders title, subtitle and triggers back button', () => {
            const handleBack = vi.fn();
            render(
                <MemoryRouter>
                    <AppHeader
                        title="Minha Página"
                        subtitle="Subtítulo Descritivo"
                        onBack={handleBack}
                    />
                </MemoryRouter>
            );

            expect(screen.getByText('Minha Página')).toBeInTheDocument();
            expect(screen.getByText('Subtítulo Descritivo')).toBeInTheDocument();

            const backBtn = screen.getByRole('button', { name: 'Voltar' });
            fireEvent.click(backBtn);
            expect(handleBack).toHaveBeenCalledTimes(1);
        });
    });
});
