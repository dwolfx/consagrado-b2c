import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

const PizzaBuilderModal = ({ isOpen, onClose, products, category, onConfirm }) => {
    const [flavor1, setFlavor1] = useState(null);
    const [flavor2, setFlavor2] = useState(null);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setFlavor1(null);
            setFlavor2(null);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (flavor1 && flavor2) {
            onConfirm(flavor1, flavor2);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9000,
            display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s'
        }}>
            <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--bg-tertiary)' }}>
                <button onClick={onClose} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft />
                </button>
                <div>
                    <h3 style={{ margin: 0 }}>Pizza Meio a Meio</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Escolha 2 sabores</p>
                </div>
            </div>

            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>

                {/* Selections Preview */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{
                        padding: '1rem', borderRadius: '12px',
                        border: flavor1 ? '2px solid var(--primary)' : '2px dashed var(--bg-tertiary)',
                        background: flavor1 ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        textAlign: 'center'
                    }}>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Sabor 1</span>
                        <div style={{ fontWeight: 'bold' }}>{flavor1 ? flavor1.name : 'Selecionar...'}</div>
                        {flavor1 && <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{flavor1.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>}
                    </div>
                    <div style={{
                        padding: '1rem', borderRadius: '12px',
                        border: flavor2 ? '2px solid var(--primary)' : '2px dashed var(--bg-tertiary)',
                        background: flavor2 ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        textAlign: 'center'
                    }}>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Sabor 2</span>
                        <div style={{ fontWeight: 'bold' }}>{flavor2 ? flavor2.name : 'Selecionar...'}</div>
                        {flavor2 && <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{flavor2.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>}
                    </div>
                </div>

                {/* List - Filtered by SELECTED CATEGORY */}
                <h4 style={{ marginBottom: '1rem' }}>Sabores em {category}</h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {products
                        .filter(p => !p.isComposite && p.category === category) // EXACT MATCH CATEGORY
                        .map(pizza => {
                            const isSelected1 = flavor1?.id === pizza.id;
                            const isSelected2 = flavor2?.id === pizza.id;
                            const isSelected = isSelected1 || isSelected2;

                            return (
                                <div
                                    key={pizza.id}
                                    onClick={() => {
                                        if (isSelected1) setFlavor1(null);
                                        else if (isSelected2) setFlavor2(null);
                                        else if (!flavor1) setFlavor1(pizza);
                                        else if (!flavor2) setFlavor2(pizza);
                                    }}
                                    className="card"
                                    style={{
                                        marginBottom: 0, padding: '1rem',
                                        border: isSelected ? '2px solid var(--primary)' : '1px solid transparent',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 'bold' }}>{pizza.name}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            {pizza.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                    {/* Status Indicator */}
                                    {isSelected && (
                                        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                            <span style={{
                                                fontSize: '0.75rem', color: 'white', fontWeight: 'bold',
                                                background: 'var(--primary)', padding: '2px 8px', borderRadius: '12px'
                                            }}>
                                                {isSelected1 ? 'METADE 1' : 'METADE 2'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    }
                </div>
            </div>

            {/* Footer Action */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--bg-tertiary)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span>Preço Final (Maior Valor)</span>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>
                        {Math.max(flavor1?.price || 0, flavor2?.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
                <button
                    disabled={!flavor1 || !flavor2}
                    onClick={handleConfirm}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', opacity: (!flavor1 || !flavor2) ? 0.5 : 1 }}
                >
                    Confirmar Pizza
                </button>
            </div>
        </div>
    );
};

export default PizzaBuilderModal;
