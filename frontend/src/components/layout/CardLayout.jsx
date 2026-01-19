import React from 'react';
import '../../assets/styles/layout/layout.css';

const CardLayout = ({ 
  children, 
  title,
  subtitle,
  icon,
  actions,
  footer,
  hoverable = true,
  bordered = true,
  shadow = 'md',
  className = '',
  style = {}
}) => {
  const cardClass = `
    card 
    ${hoverable ? 'card-hoverable' : ''} 
    ${bordered ? 'card-bordered' : ''} 
    ${shadow ? `card-shadow-${shadow}` : ''} 
    ${className}
  `.trim();

  return (
    <div className={cardClass} style={style}>
      {(title || icon || actions) && (
        <div className="card-header">
          <div className="card-header-left">
            {icon && <span className="card-icon">{icon}</span>}
            <div className="card-header-content">
              {title && <h3 className="card-title">{title}</h3>}
              {subtitle && <p className="card-subtitle">{subtitle}</p>}
            </div>
          </div>
          
          {actions && (
            <div className="card-header-actions">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <div className="card-body">
        {children}
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`card-header ${className}`.trim()}>
    {children}
  </div>
);

const CardBody = ({ children, className = '', padding = true }) => (
  <div className={`card-body ${padding ? 'card-body-padding' : ''} ${className}`.trim()}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`card-footer ${className}`.trim()}>
    {children}
  </div>
);

export default CardLayout;
export { CardHeader, CardBody, CardFooter };