import React from 'react';

const TipSelector = ({ serviceFeePercent, onSelectPercent }) => {
    const percentages = [8, 10, 13];

    return (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {percentages.map((pct) => {
                const isSelected = serviceFeePercent === pct;
                return (
                    <button
                        key={pct}
                        type="button"
                        onClick={() => onSelectPercent(pct)}
                        className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            fontSize: '0.9rem',
                            background: isSelected ? 'var(--primary)' : 'var(--bg-tertiary)',
                            color: isSelected ? 'white' : 'var(--text-secondary)',
                            border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                            justifyContent: 'center'
                        }}
                    >
                        {pct}%
                    </button>
                );
            })}
        </div>
    );
};

export default TipSelector;
