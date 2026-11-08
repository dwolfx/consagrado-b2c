import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock window.scrollTo & Element.prototype.scrollTo
window.scrollTo = vi.fn();
Element.prototype.scrollTo = vi.fn();

// Mock window.alert & confirm
window.alert = vi.fn();
window.confirm = vi.fn(() => true);

// Clean up mocks after each test
afterEach(() => {
    vi.clearAllMocks();
});
