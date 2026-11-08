import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import AuthHeader from './AuthHeader';
import SocialAuthButtons from './SocialAuthButtons';

describe('Auth Components', () => {
    it('renders AuthHeader with default and custom title', () => {
        const { rerender } = render(<AuthHeader />);
        expect(screen.getByText('Consagrado')).toBeInTheDocument();
        expect(screen.getByText('O seu parceiro de rolê')).toBeInTheDocument();

        rerender(<AuthHeader title="Cadastrar" subtitle="Preencha os campos" />);
        expect(screen.getByText('Cadastrar')).toBeInTheDocument();
        expect(screen.getByText('Preencha os campos')).toBeInTheDocument();
    });

    it('renders SocialAuthButtons and triggers google login', () => {
        const handleGoogle = vi.fn();
        render(<SocialAuthButtons onGoogleClick={handleGoogle} />);

        const googleBtn = screen.getByRole('button', { name: 'Entrar com Google' });
        fireEvent.click(googleBtn);
        expect(handleGoogle).toHaveBeenCalledTimes(1);

        const fbBtn = screen.getByRole('button', { name: 'Entrar com Facebook' });
        expect(fbBtn).toBeDisabled();
    });
});
