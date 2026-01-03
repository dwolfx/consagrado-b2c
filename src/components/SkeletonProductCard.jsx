import React from 'react';

const SkeletonProductCard = () => {
    return (
        <div
            className="card"
            style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 0,
                gap: '1rem',
                opacity: 0.7,
                animation: 'pulse 1.5s infinite ease-in-out'
            }}
        >
            <style>
                {`
                    @keyframes pulse {
                        0% { opacity: 0.6; }
                        50% { opacity: 0.8; }
                        100% { opacity: 0.6; }
                    }
                `}
            </style>

            {/* Image Skeleton */}
            <div style={{ flexShrink: 0 }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-tertiary)'
                }} />
            </div>

            {/* Text Content Skeleton */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Title */}
                <div style={{
                    height: '1.2rem',
                    width: '70%',
                    backgroundColor: 'var(--bg-tertiary)',
                    marginBottom: '0.5rem',
                    borderRadius: '4px'
                }} />

                {/* Description - 2 lines */}
                <div style={{
                    height: '0.9rem',
                    width: '90%',
                    backgroundColor: 'var(--bg-tertiary)',
                    marginBottom: '0.3rem',
                    borderRadius: '4px',
                    opacity: 0.7
                }} />
                <div style={{
                    height: '0.9rem',
                    width: '60%',
                    backgroundColor: 'var(--bg-tertiary)',
                    marginBottom: '0.5rem',
                    borderRadius: '4px',
                    opacity: 0.7
                }} />

                {/* Price */}
                <div style={{
                    height: '1rem',
                    width: '40px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '4px',
                    marginTop: '0.5rem'
                }} />
            </div>

            {/* Button Skeleton */}
            <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-tertiary)'
            }} />
        </div>
    );
};

export default SkeletonProductCard;
