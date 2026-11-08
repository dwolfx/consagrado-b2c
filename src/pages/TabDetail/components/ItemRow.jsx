import React from 'react';

const formatPrice = (val) =>
    Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const getDisplayPrice = (item) => {
    if (!item) return 0;
    if (item.metadata?.my_parts && item.split_parts > 1 && item.original_price > 0) {
        return (Number(item.original_price) / item.split_parts) * Number(item.metadata.my_parts);
    }
    const nameMatch = (item.name || '').match(/^(\d+)\s*\/\s*(\d+)/);
    if (nameMatch && item.original_price > 0) {
        const num = parseInt(nameMatch[1], 10);
        const den = parseInt(nameMatch[2], 10);
        if (den > 0) {
            return (Number(item.original_price) / den) * num;
        }
    }
    if (item.price != null && !isNaN(item.price)) {
        return Number(item.price);
    }
    if (item.is_split && item.split_parts > 1 && item.original_price > 0) {
        return Number(item.original_price) / item.split_parts;
    }
    return Number(item.price || 0);
};

const ItemRow = ({ item }) => {
    const SPLIT_PREFIX = /^(\d+)\s*\/\s*(\d+)\s+(.*)/;
    const nameMatch = (item.name || '').match(SPLIT_PREFIX);
    const isSplitFlag = !!(item.is_split && item.split_parts > 1);
    const isSplitName = !isSplitFlag && !!nameMatch;
    const isSplit = isSplitFlag || isSplitName;

    const splitParts = isSplitFlag
        ? item.split_parts
        : nameMatch
          ? parseInt(nameMatch[2], 10)
          : 1;

    const myParts =
        item.metadata?.my_parts || (nameMatch ? parseInt(nameMatch[1], 10) : 1);

    const cleanName = isSplit
        ? nameMatch
            ? nameMatch[3]
            : item.name.replace(/^\d+\s*\/\s*\d+\s+/, '')
        : item.name;

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.45rem 0',
                borderBottom: '1px solid var(--bg-tertiary)'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: 1,
                    minWidth: 0
                }}
            >
                <span
                    style={{
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        flexShrink: 0
                    }}
                >
                    {item.quantity}x
                </span>
                {isSplit && (
                    <span
                        style={{
                            fontSize: '0.62rem',
                            background: '#374151',
                            color: '#f9fafb',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: '16px',
                            flexShrink: 0
                        }}
                    >
                        {myParts}/{splitParts}
                    </span>
                )}
                <span
                    style={{
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {cleanName}
                </span>
            </div>
            <span
                style={{
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    flexShrink: 0,
                    marginLeft: '8px'
                }}
            >
                {formatPrice(getDisplayPrice(item) * item.quantity)}
            </span>
        </div>
    );
};

export default ItemRow;
