import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import PaymentSkeleton from './PaymentSkeleton';
import SkeletonProductCard from './SkeletonProductCard';
import TabDetailSkeleton from './TabDetailSkeleton';

describe('Skeleton Components', () => {
    it('renders PaymentSkeleton without error', () => {
        const { container } = render(<PaymentSkeleton />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('renders SkeletonProductCard without error', () => {
        const { container } = render(<SkeletonProductCard />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('renders TabDetailSkeleton without error', () => {
        const { container } = render(<TabDetailSkeleton />);
        expect(container.firstChild).toBeInTheDocument();
    });
});
