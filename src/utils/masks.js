export const normalizeClean = (value) => {
    if (!value) return '';
    return value.replace(/\D/g, ''); // Removes all non-numeric characters
};

export const maskCPF = (value) => {
    if (!value) return '';
    const clean = normalizeClean(value);

    // 000.000.000-00
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
};

export const maskPhoneByCountry = (value, countryCode = 'BR') => {
    if (!value) return '';
    const clean = normalizeClean(value);

    switch (countryCode) {
        case 'BR': {
            const limited = clean.slice(0, 11);
            if (limited.length <= 2) return `(${limited}`;
            if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
            if (limited.length <= 10) {
                return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
            }
            return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
        }
        case 'US':
        case 'CA': {
            const limited = clean.slice(0, 10);
            if (limited.length <= 3) return `(${limited}`;
            if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
            return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
        }
        case 'PT': {
            const limited = clean.slice(0, 9);
            if (limited.length <= 3) return limited;
            if (limited.length <= 6) return `${limited.slice(0, 3)} ${limited.slice(3)}`;
            return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
        }
        default: {
            const limited = clean.slice(0, 15);
            if (limited.length <= 4) return limited;
            if (limited.length <= 8) return `${limited.slice(0, 4)} ${limited.slice(4)}`;
            return `${limited.slice(0, 4)} ${limited.slice(4, 8)} ${limited.slice(8)}`;
        }
    }
};

export const maskPhone = (value) => maskPhoneByCountry(value, 'BR');
