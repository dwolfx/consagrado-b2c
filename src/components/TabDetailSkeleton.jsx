import React from 'react';

const TabDetailSkeleton = () => (
    <div className="container" style={{ paddingBottom: '100px' }}>
        <style>{`
            @keyframes skeleton-pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }
            .skeleton { background: var(--bg-tertiary); border-radius: 4px; animation: skeleton-pulse 1.5s ease-in-out infinite; }
        `}</style>

        <div style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <div>
                <div className="skeleton" style={{ width: '150px', height: '20px', marginBottom: '4px' }} />
                <div className="skeleton" style={{ width: '80px', height: '14px' }} />
            </div>
        </div>

        <div style={{ marginBottom: '0.5rem', width: '200px', height: '16px' }} className="skeleton" />
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
            {[1, 2].map(i => (
                <div key={i} className="card" style={{ marginBottom: 0, borderLeft: '4px solid var(--bg-tertiary)' }}>
                    <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: '0.5rem' }} />
                    <div className="skeleton" style={{ width: '40%', height: '16px' }} />
                </div>
            ))}
        </div>
    </div>
);

export default TabDetailSkeleton;
