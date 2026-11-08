import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

const PizzaBuilderModal = ({ isOpen, onClose, products = [], category, onConfirm }) => {
    const [flavor1, setFlavor1] = useState(null);
    const [flavor2, setFlavor2] = useState(null);

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

    const finalPrice = Math.max(flavor1?.price || 0, flavor2?.price || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    return (
        <div className="menu-pizza-modal">
            <div className="menu-pizza-header">
                <button type="button" onClick={onClose} className="menu-pizza-back" aria-label="Fechar">
                    <ArrowLeft />
                </button>
                <div>
                    <h3 className="menu-pizza-title">Pizza Meio a Meio</h3>
                    <p className="menu-pizza-subtitle">Escolha 2 sabores</p>
                </div>
            </div>

            <div className="menu-pizza-body">
                <div className="menu-pizza-slots">
                    <div className={flavor1 ? 'menu-pizza-slot menu-pizza-slot--filled' : 'menu-pizza-slot'}>
                        <span className="menu-pizza-slot-label">Sabor 1</span>
                        <div className="menu-pizza-slot-name">
                            {flavor1 ? flavor1.name : 'Selecionar...'}
                        </div>
                        {flavor1 && (
                            <div className="menu-pizza-slot-price">
                                {flavor1.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        )}
                    </div>
                    <div className={flavor2 ? 'menu-pizza-slot menu-pizza-slot--filled' : 'menu-pizza-slot'}>
                        <span className="menu-pizza-slot-label">Sabor 2</span>
                        <div className="menu-pizza-slot-name">
                            {flavor2 ? flavor2.name : 'Selecionar...'}
                        </div>
                        {flavor2 && (
                            <div className="menu-pizza-slot-price">
                                {flavor2.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        )}
                    </div>
                </div>

                <h4 className="menu-pizza-list-title">Sabores em {category}</h4>
                <div className="menu-pizza-flavors">
                    {products
                        .filter((p) => !p.isComposite && p.category === category)
                        .map((pizza) => {
                            const isSelected1 = flavor1?.id === pizza.id;
                            const isSelected2 = flavor2?.id === pizza.id;
                            const isSelected = isSelected1 || isSelected2;
                            const cardClass = isSelected
                                ? 'menu-pizza-flavor-card menu-pizza-flavor-card--selected'
                                : 'menu-pizza-flavor-card';

                            return (
                                <div
                                    key={pizza.id}
                                    onClick={() => {
                                        if (isSelected1) setFlavor1(null);
                                        else if (isSelected2) setFlavor2(null);
                                        else if (!flavor1) setFlavor1(pizza);
                                        else if (!flavor2) setFlavor2(pizza);
                                    }}
                                    className={cardClass}
                                >
                                    <div className="menu-pizza-flavor-row">
                                        <span className="menu-pizza-flavor-name">{pizza.name}</span>
                                        <span className="menu-pizza-flavor-price">
                                            {pizza.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <div className="menu-pizza-badge-row">
                                            <span className="menu-pizza-half-badge">
                                                {isSelected1 ? 'METADE 1' : 'METADE 2'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>

            <div className="menu-pizza-footer">
                <div className="menu-pizza-total-row">
                    <span>Preço Final (Maior Valor)</span>
                    <span className="menu-pizza-total-val">{finalPrice}</span>
                </div>
                <button
                    type="button"
                    disabled={!flavor1 || !flavor2}
                    onClick={handleConfirm}
                    className="btn btn-primary menu-pizza-confirm-btn"
                >
                    Confirmar Pizza
                </button>
            </div>
        </div>
    );
};

export default PizzaBuilderModal;
