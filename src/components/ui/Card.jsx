import React from 'react';
import './Card.css';

const Card = ({
    children,
    clickable = false,
    selected = false,
    elevation = 'sm',
    onClick,
    className = '',
    ...rest
}) => {
    const isInteractive = clickable || !!onClick;

    return (
        <div
            className={`ui-card ui-card-elevation-${elevation} ${isInteractive ? 'ui-card-clickable' : ''} ${selected ? 'ui-card-selected' : ''} ${className}`}
            onClick={onClick}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            onKeyDown={isInteractive ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick && onClick(e);
                }
            } : undefined}
            {...rest}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = '', ...rest }) => (
    <div className={`ui-card-header ${className}`} {...rest}>
        {children}
    </div>
);

export const CardBody = ({ children, className = '', ...rest }) => (
    <div className={`ui-card-body ${className}`} {...rest}>
        {children}
    </div>
);

export const CardFooter = ({ children, className = '', ...rest }) => (
    <div className={`ui-card-footer ${className}`} {...rest}>
        {children}
    </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
