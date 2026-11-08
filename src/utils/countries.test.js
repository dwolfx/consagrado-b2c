import { describe, it, expect } from 'vitest';
import { COUNTRIES, getCountryByDDI, getCountryByCode } from './countries';

describe('countries utility', () => {
    it('contains valid countries with code, label, ddi, and flag', () => {
        expect(Array.isArray(COUNTRIES)).toBe(true);
        expect(COUNTRIES.length).toBeGreaterThan(0);

        const brazil = COUNTRIES.find(c => c.code === 'BR');
        expect(brazil).toBeDefined();
        expect(brazil.label).toBe('Brasil');
        expect(brazil.ddi).toBe('+55');
        expect(brazil.flag).toBe('🇧🇷');
    });

    it('finds country by DDI correctly', () => {
        expect(getCountryByDDI('+55')?.code).toBe('BR');
        expect(getCountryByDDI('+1')?.code).toBe('US');
        expect(getCountryByDDI('+351')?.code).toBe('PT');
        expect(getCountryByDDI('+999999')).toBeUndefined();
    });

    it('finds country by Code correctly', () => {
        expect(getCountryByCode('BR')?.ddi).toBe('+55');
        expect(getCountryByCode('US')?.ddi).toBe('+1');
        expect(getCountryByCode('XX')).toBeUndefined();
    });
});
