/**
 * Button.js
 * Componente de botón reutilizable
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\common\Button.js
 */

import React from 'react';
import '../../assets/styles/bot/Button.css';

const Button = ({
    children,
    type = 'button',
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    fullWidth = false,
    onClick,
    className = '',
    icon,
    iconPosition = 'left',
    ...props
}) => {
    // Determinar clases CSS
    const buttonClasses = [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth ? 'btn-full-width' : '',
        disabled ? 'btn-disabled' : '',
        loading ? 'btn-loading' : '',
        className
    ].filter(Boolean).join(' ');

    // Contenido del botón
    const buttonContent = (
        <>
            {icon && iconPosition === 'left' && !loading && (
                <span className="btn-icon left">{icon}</span>
            )}
            
            {loading && (
                <span className="btn-spinner">
                    <svg className="spinner" viewBox="0 0 50 50">
                        <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                    </svg>
                </span>
            )}
            
            {!loading && children}
            
            {icon && iconPosition === 'right' && !loading && (
                <span className="btn-icon right">{icon}</span>
            )}
        </>
    );

    // Renderizar como enlace o botón
    if (props.href) {
        return (
            <a
                href={props.href}
                className={buttonClasses}
                disabled={disabled || loading}
                onClick={onClick}
                {...props}
            >
                {buttonContent}
            </a>
        );
    }

    return (
        <button
            type={type}
            className={buttonClasses}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {buttonContent}
        </button>
    );
};

// Botón con variantes predefinidas
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const SuccessButton = (props) => <Button variant="success" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;
export const WarningButton = (props) => <Button variant="warning" {...props} />;
export const InfoButton = (props) => <Button variant="info" {...props} />;
export const LightButton = (props) => <Button variant="light" {...props} />;
export const DarkButton = (props) => <Button variant="dark" {...props} />;

// Botón con ícono
export const IconButton = ({ icon, ...props }) => (
    <Button icon={icon} {...props} />
);

// Botón de grupo
export const ButtonGroup = ({ children, vertical = false, className = '' }) => {
    const groupClasses = [
        'btn-group',
        vertical ? 'btn-group-vertical' : 'btn-group-horizontal',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={groupClasses} role="group">
            {children}
        </div>
    );
};

// Botón de dropdown
export const DropdownButton = ({ label, children, ...props }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="btn-dropdown">
            <Button
                onClick={() => setIsOpen(!isOpen)}
                icon="▼"
                iconPosition="right"
                {...props}
            >
                {label}
            </Button>
            
            {isOpen && (
                <div className="dropdown-menu">
                    {children}
                </div>
            )}
        </div>
    );
};

export default Button;