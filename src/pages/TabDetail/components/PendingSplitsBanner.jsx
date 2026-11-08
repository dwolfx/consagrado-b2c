import React from 'react';
import { Clock, Check, X, Users } from 'lucide-react';

const formatPrice = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PendingSplitsBanner = ({
    pendingGroups = [],
    onAccept,
    onDecline,
    onAcceptAll
}) => {
    if (!pendingGroups || pendingGroups.length === 0) return null;

    const totalCount = pendingGroups.reduce((acc, g) => acc + (g.items?.length || 1), 0);

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.06) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '16px',
            padding: '1rem',
            marginBottom: '1.25rem',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.1)',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'rgba(245, 158, 11, 0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Clock size={18} color="#f59e0b" />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f59e0b' }}>
                            Solicitações de Divisão Pendentes
                        </h4>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {totalCount} {totalCount === 1 ? 'item esperando' : 'itens esperando'} sua aprovação
                        </span>
                    </div>
                </div>

                {pendingGroups.length > 1 && onAcceptAll && (
                    <button
                        onClick={onAcceptAll}
                        className="btn btn-primary"
                        style={{
                            fontSize: '0.78rem', padding: '6px 12px',
                            background: '#22c55e', borderColor: '#22c55e', color: 'white'
                        }}
                    >
                        Aceitar Todos
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingGroups.map((group) => {
                    const pendingData = group.pendingData;
                    const requesterName = (pendingData?.requesterName || 'Alguém').split(' ')[0];
                    const totalParts = pendingData?.totalParts || 2;
                    const groupTotal = group.items.reduce((acc, it) => {
                        const bp = it.original_price ? Number(it.original_price) : Number(it.price);
                        return acc + bp * (it.quantity || 1);
                    }, 0);
                    const myShare = groupTotal / totalParts;

                    const title = group.items.length === 1
                        ? (group.items[0].name ? group.items[0].name.replace(/^[\d.]+\/[\d.]+\s/, '') : 'Item')
                        : `${group.items.length} itens do pedido`;

                    return (
                        <div
                            key={group.key}
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                padding: '0.75rem 1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>
                                    {title}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{requesterName}</span> quer dividir com você · Sua parte: <strong style={{ color: '#22c55e' }}>{formatPrice(myShare)}</strong>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    onClick={() => onDecline(group)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        color: '#ef4444',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '8px',
                                        padding: '6px 10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.78rem',
                                        fontWeight: 600
                                    }}
                                    title="Recusar"
                                >
                                    <X size={14} /> Recusar
                                </button>
                                <button
                                    onClick={() => onAccept(group)}
                                    style={{
                                        background: '#22c55e',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '6px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.78rem',
                                        fontWeight: 700
                                    }}
                                    title="Aceitar"
                                >
                                    <Check size={14} /> Aceitar
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PendingSplitsBanner;
