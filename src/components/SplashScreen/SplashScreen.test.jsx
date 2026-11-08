import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import SplashScreen from './SplashScreen';
import { useAppBootSplash } from './useAppBootSplash';

describe('SplashScreen (Tela Oficial de Loading)', () => {
    it('deve renderizar a marca CONSAgrado, o subtítulo padrão e o indicador de carregamento', () => {
        render(<SplashScreen />);

        const statusElement = screen.getByRole('status', { name: 'Carregando' });
        expect(statusElement).toBeInTheDocument();
        expect(screen.getByText('CONSA')).toBeInTheDocument();
        expect(screen.getByText('grado')).toBeInTheDocument();
        expect(screen.getByText('Sua comanda, seu chopp, sem fila.')).toBeInTheDocument();
    });

    it('deve permitir personalizar a frase de subtítulo e aplicar a classe de saída suave (fade-out)', () => {
        render(<SplashScreen tagline="Preparando sua mesa..." isExiting={true} />);

        const statusElement = screen.getByRole('status', { name: 'Carregando' });
        expect(statusElement).toHaveClass('splash-screen-overlay--exiting');
        expect(screen.getByText('Preparando sua mesa...')).toBeInTheDocument();
    });
});

describe('Hook useAppBootSplash (Controle de Transição da Splash Screen)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('deve manter a Splash Screen visível pelo tempo mínimo ideal (950ms) e executar fade-out suave (350ms)', () => {
        const { result, rerender } = renderHook(({ loading }) => useAppBootSplash(loading), {
            initialProps: { loading: true }
        });

        expect(result.current.showSplash).toBe(true);
        expect(result.current.isExiting).toBe(false);

        rerender({ loading: false });

        act(() => {
            vi.advanceTimersByTime(950);
        });

        expect(result.current.showSplash).toBe(true);
        expect(result.current.isExiting).toBe(true);

        act(() => {
            vi.advanceTimersByTime(350);
        });

        expect(result.current.showSplash).toBe(false);
    });
});
