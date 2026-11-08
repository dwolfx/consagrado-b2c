import React from 'react';
import Button from './Button';
import './EmptyState.css';

const EmptyState = ({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    className = ''
}) => {
    return (
        <div className={`ui-empty-state ${className}`} role="status">
            {icon && <div className="ui-empty-state-icon">{icon}</div>}
            {title && <h3 className="ui-empty-state-title">{title}</h3>}
            {description && <p className="ui-empty-state-description">{description}</p>}
            {actionLabel && onAction && (
                <Button variant="primary" size="sm" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
