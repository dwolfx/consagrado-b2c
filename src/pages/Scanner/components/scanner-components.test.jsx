import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import ScannerCameraView from './ScannerCameraView';
import ScannerManualInput from './ScannerManualInput';

describe('Scanner Components', () => {
    describe('ScannerCameraView', () => {
        it('renders scan target and triggers simulation and manual input switch', () => {
            const handleSimulate = vi.fn();
            const handleManual = vi.fn();

            render(
                <ScannerCameraView
                    onSimulateScan={handleSimulate}
                    onOpenManualInput={handleManual}
                />
            );

            expect(screen.getByText('Aponte para o QR Code')).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: 'Simular leitura de QR Code' }));
            expect(handleSimulate).toHaveBeenCalledTimes(1);

            fireEvent.click(screen.getByRole('button', { name: 'Inserir código da mesa' }));
            expect(handleManual).toHaveBeenCalledTimes(1);
        });
    });

    describe('ScannerManualInput', () => {
        it('renders input, handles typing, submit, and error display', () => {
            const setCode = vi.fn();
            const handleSubmit = vi.fn((e) => e.preventDefault());
            const handleBack = vi.fn();

            render(
                <ScannerManualInput
                    manualCode="AA0001"
                    setManualCode={setCode}
                    onSubmit={handleSubmit}
                    onBackToCamera={handleBack}
                    error="Mesa não encontrada"
                />
            );

            expect(screen.getByText('Código da Mesa')).toBeInTheDocument();
            expect(screen.getByDisplayValue('AA0001')).toBeInTheDocument();
            expect(screen.getByText('Mesa não encontrada')).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: 'Entrar na Mesa' }));
            expect(handleSubmit).toHaveBeenCalledTimes(1);

            fireEvent.click(screen.getByRole('button', { name: 'Voltar para Camera' }));
            expect(handleBack).toHaveBeenCalledTimes(1);
        });
    });
});
