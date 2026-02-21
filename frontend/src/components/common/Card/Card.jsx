import React from 'react';
import styles from './Card.module.css';

const Card = ({ 
  children, 
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  noPadding = false,
  bordered = true,
  hoverable = false
}) => {
  const cardClasses = [
    styles.card,
    bordered ? styles.bordered : '',
    hoverable ? styles.hoverable : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {(title || subtitle || headerAction) && (
        <div className={styles.header}>
          <div className={styles.headerContent}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {headerAction && (
            <div className={styles.headerAction}>{headerAction}</div>
          )}
        </div>
      )}
      
      <div className={`${styles.content} ${noPadding ? styles.noPadding : ''}`}>
        {children}
      </div>
      
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};

export default Card;