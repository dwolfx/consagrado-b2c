import React from 'react';

const PaymentSkeleton = () => (
    <div className="container fade-in">
        <style>{`
            @keyframes skeleton-pulse {
                0% { opacity: 0.6; }
                50% { opacity: 0.3; }
                100% { opacity: 0.6; }
            }
            .skeleton {
                background: var(--bg-tertiary);
                border-radius: 4px;
                animation: skeleton-pulse 1.5s ease-in-out infinite;
            }
        `}</style>

        {/* Header Skeleton */}
        <div style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
            <div className="skeleton" style={{ width: '150px', height: '32px' }} />
        </div>

        {/* Bill Card Skeleton */}
        <div className="card">
            <div className="skeleton" style={{ width: '100px', height: '24px', marginBottom: '1.5rem' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div className="skeleton" style={{ width: '120px', height: '20px' }} />
                <div className="skeleton" style={{ width: '80px', height: '20px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div className="skeleton" style={{ width: '140px', height: '20px' }} />
                <div className="skeleton" style={{ width: '60px', height: '20px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div className="skeleton" style={{ width: '100px', height: '20px' }} />
                <div className="skeleton" style={{ width: '90px', height: '20px' }} />
            </div>

            <div style={{ borderTop: '1px solid var(--bg-tertiary)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton" style={{ width: '60px', height: '28px' }} />
                <div className="skeleton" style={{ width: '100px', height: '28px' }} />
            </div>
        </div>

        {/* Payment Buttons Skeleton */}
        <div className="skeleton" style={{ width: '200px', height: '24px', marginBottom: '1rem', marginTop: '1rem' }} />
        <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '12px' }} />
            <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '12px' }} />
            <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '12px' }} />
        </div>
    </div>
);

export default PaymentSkeleton;
