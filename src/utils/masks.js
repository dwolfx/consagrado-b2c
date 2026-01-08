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

export const maskPhone = (value) => {
    if (!value) return '';
    // If international (starts with +), just return as is (maybe add spacing?)
    if (value.startsWith('+')) return value;

    const clean = normalizeClean(value);

    // If it doesn't look like a BR number (10 or 11 digits), return original or clean
    // Allow partial masking for typing
    if (clean.length > 11) return value; // Too long for BR, likely intl without +

    // Limit to 11 chars
    const limited = clean.slice(0, 11);

    // (00) 00000-0000
    if (limited.length <= 2) return `(${limited}`;
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
};
