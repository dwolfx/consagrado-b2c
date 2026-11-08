import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContext';

const TestComponent = () => {
    const { addToast } = useToast();
    return (
        <div>
            <button onClick={() => addToast('Operação realizada com sucesso!', 'success')}>
                Disparar Sucesso
            </button>
            <button onClick={() => addToast('Ocorreu um erro.', 'error')}>
                Disparar Erro
            </button>
        </div>
    );
};

describe('ToastContext', () => {
    it('throws error when useToast is used outside provider', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<TestComponent />)).toThrow('useToast must be used within a ToastProvider');
        consoleError.mockRestore();
    });

    it('displays toast message when addToast is triggered and closes when clicking X', () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        fireEvent.click(screen.getByText('Disparar Sucesso'));
        expect(screen.getByText('Operação realizada com sucesso!')).toBeInTheDocument();

        // Close button
        const closeBtn = screen.getByRole('button', { name: '' });
        fireEvent.click(closeBtn);
        expect(screen.queryByText('Operação realizada com sucesso!')).not.toBeInTheDocument();
    });

    it('auto-removes toast after timeout', () => {
        vi.useFakeTimers();

        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        fireEvent.click(screen.getByText('Disparar Erro'));
        expect(screen.getByText('Ocorreu um erro.')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(3500);
        });

        expect(screen.queryByText('Ocorreu um erro.')).not.toBeInTheDocument();
        vi.useRealTimers();
    });
});
