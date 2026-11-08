import { describe, it, expect } from 'vitest';
import { maskCPF, maskPhone, maskPhoneByCountry, normalizeClean } from './masks';

describe('Utilitário de Máscaras', () => {
    describe('normalizeClean', () => {
        it('remove caracteres não numéricos corretamente', () => {
            expect(normalizeClean('123.456.789-00')).toBe('12345678900');
            expect(normalizeClean('(11) 98765-4321')).toBe('11987654321');
            expect(normalizeClean('')).toBe('');
            expect(normalizeClean(null)).toBe('');
        });
    });

    describe('maskCPF', () => {
        it('aplica máscara em CPF completo', () => {
            expect(maskCPF('12345678900')).toBe('123.456.789-00');
        });

        it('lida com máscara progressiva parcial de CPF', () => {
            expect(maskCPF('123')).toBe('123');
            expect(maskCPF('1234')).toBe('123.4');
            expect(maskCPF('1234567')).toBe('123.456.7');
            expect(maskCPF('1234567890')).toBe('123.456.789-0');
        });

        it('lida com valores nulos ou vazios', () => {
            expect(maskCPF('')).toBe('');
            expect(maskCPF(null)).toBe('');
        });
    });

    describe('maskPhone & maskPhoneByCountry', () => {
        it('formata celular brasileiro com 11 dígitos corretamente', () => {
            expect(maskPhone('11987654321')).toBe('(11) 98765-4321');
            expect(maskPhoneByCountry('11987654321', 'BR')).toBe('(11) 98765-4321');
        });

        it('formata telefone fixo brasileiro com 10 dígitos corretamente', () => {
            expect(maskPhone('1133334444')).toBe('(11) 3333-4444');
            expect(maskPhoneByCountry('1133334444', 'BR')).toBe('(11) 3333-4444');
        });

        it('formata telefone dos Estados Unidos (NANP) com 10 dígitos', () => {
            expect(maskPhoneByCountry('4155552671', 'US')).toBe('(415) 555-2671');
            expect(maskPhoneByCountry('415', 'US')).toBe('(415');
            expect(maskPhoneByCountry('415555', 'US')).toBe('(415) 555');
        });

        it('formata telefone de Portugal com 9 dígitos', () => {
            expect(maskPhoneByCountry('912345678', 'PT')).toBe('912 345 678');
        });

        it('formata telefone internacional genérico', () => {
            expect(maskPhoneByCountry('123456789012', 'FR')).toBe('1234 5678 9012');
        });

        it('lida com valores vazios e nulos', () => {
            expect(maskPhoneByCountry('', 'BR')).toBe('');
            expect(maskPhoneByCountry(null, 'US')).toBe('');
        });
    });
});
