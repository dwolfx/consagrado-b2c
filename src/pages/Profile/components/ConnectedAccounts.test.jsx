import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConnectedAccounts from './ConnectedAccounts';

describe('ConnectedAccounts', () => {
    it('renders social providers list with connect buttons', () => {
        render(<ConnectedAccounts />);

        expect(screen.getByText('Contas Conectadas')).toBeInTheDocument();
        expect(screen.getByText('Google')).toBeInTheDocument();
        expect(screen.getByText('Facebook')).toBeInTheDocument();
        expect(screen.getByText('Apple')).toBeInTheDocument();

        const connectButtons = screen.getAllByText('Conectar');
        expect(connectButtons.length).toBe(3);
    });
});
