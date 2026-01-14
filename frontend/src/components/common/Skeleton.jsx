import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import '../../assets/styles/variables.css';
import '../../assets/styles/global.css';
import '../../assets/styles/base.css';
import '../../assets/styles/animations.css';

/**
 * ✅ COMPONENTE SKELETON OPTIMIZADO
 */

// ✅ COMPONENTE PRINCIPAL CON REF FORWARDING
const Skeleton = React.forwardRef(({
  type = 'text',
  width,
  height,
  size = 'md',
  variant = 'primary',
  count = 1,
  rounded = 'md',
  className = '',
  animated = true,
  pulse = false,
  children,
  ...props
}, ref) => {
  
  // ✅ CLASES CSS OPTIMIZADAS
  const skeletonClasses = useMemo(() => {
    return clsx(
      'skeleton',
      `skeleton-${type}`,
      `skeleton-size-${size}`,
      `skeleton-variant-${variant}`,
      `skeleton-rounded-${rounded}`,
      {
        'skeleton-animated': animated,
        'skeleton-pulse': pulse && !animated,
        'skeleton-static': !animated && !pulse,
        'skeleton-has-width': !!width,
        'skeleton-has-height': !!height
      },
      className
    );
  }, [type, size, variant, rounded, animated, pulse, className, width, height]);
  
  // ✅ ESTILOS INLINE OPTIMIZADOS
  const inlineStyles = useMemo(() => {
    const styles = {};
    
    if (width) {
      styles.width = typeof width === 'number' ? `${width}px` : width;
    }
    
    if (height) {
      styles.height = typeof height === 'number' ? `${height}px` : height;
    }
    
    return styles;
  }, [width, height]);
  
  // ✅ RENDERIZAR SKELETONS INDIVIDUALES
  const renderSkeleton = useMemo(() => (index = 0) => {
    const skeletonKey = `skeleton-${type}-${size}-${index}`;
    
    return (
      <div
        key={skeletonKey}
        ref={index === 0 ? ref : null}
        className={skeletonClasses}
        style={inlineStyles}
        aria-label="Contenido cargando"
        aria-busy="true"
        role="status"
        {...props}
      >
        <span className="sr-only">Cargando contenido...</span>
        {children}
      </div>
    );
  }, [type, size, skeletonClasses, inlineStyles, ref, children, props]);
  
  // ✅ COMPONENTE CARD SKELETON
  if (type === 'card') {
    const skeletons = [];
    const skeletonCount = Math.max(1, Math.min(count, 20));
    
    for (let i = 0; i < skeletonCount; i++) {
      skeletons.push(renderSkeleton(i));
    }
    
    return (
      <div className="skeleton-card-wrapper">
        {skeletons}
      </div>
    );
  }
  
  // ✅ MÚLTIPLES SKELETONS
  if (count > 1) {
    const skeletons = [];
    const skeletonCount = Math.max(1, Math.min(count, 50));
    
    for (let i = 0; i < skeletonCount; i++) {
      skeletons.push(renderSkeleton(i));
    }
    
    return (
      <div className="skeleton-group">
        {skeletons}
      </div>
    );
  }
  
  // ✅ SKELETON ÚNICO
  return renderSkeleton();
});

Skeleton.displayName = 'Skeleton';

// ✅ SKELETON PARA TABLAS - OPTIMIZADO
export const TableSkeleton = React.memo(({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  ...props 
}) => {
  const rowCount = Math.max(1, Math.min(rows, 100));
  const columnCount = Math.max(1, Math.min(columns, 10));
  
  return (
    <div className="table-skeleton" role="status" aria-label="Tabla cargando">
      {showHeader && (
        <div className="table-skeleton-header">
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <Skeleton
              key={`table-header-${colIndex}`}
              type="text"
              height="24px"
              width={`${Math.max(80, 100 / columnCount)}%`}
              variant="secondary"
              className="table-skeleton-header-cell"
              {...props}
            />
          ))}
        </div>
      )}
      
      <div className="table-skeleton-body">
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <div key={`table-row-${rowIndex}`} className="table-skeleton-row">
            {Array.from({ length: columnCount }).map((_, colIndex) => (
              <Skeleton
                key={`table-cell-${rowIndex}-${colIndex}`}
                type="text"
                height="20px"
                width={`${Math.max(60, 100 / columnCount)}%`}
                className="table-skeleton-cell"
                {...props}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

TableSkeleton.displayName = 'TableSkeleton';

// ✅ SKELETON PARA CARDS DE PRODUCTO
export const ProductCardSkeleton = React.memo(({ 
  count = 1, 
  showActions = true,
  ...props 
}) => {
  const cardCount = Math.max(1, Math.min(count, 12));
  
  const cards = [];
  for (let i = 0; i < cardCount; i++) {
    cards.push(
      <div key={`product-card-${i}`} className="product-card-skeleton">
        <Skeleton
          type="rect"
          height="200px"
          width="100%"
          rounded="lg"
          className="product-card-skeleton-image"
          {...props}
        />
        
        <div className="product-card-skeleton-content">
          <Skeleton
            type="text"
            height="24px"
            width="80%"
            className="product-card-skeleton-title"
            {...props}
          />
          
          <Skeleton
            type="text"
            height="16px"
            width="60%"
            className="product-card-skeleton-sku"
            {...props}
          />
          
          <div className="product-card-skeleton-details">
            <Skeleton
              type="text"
              height="20px"
              width="30%"
              className="product-card-skeleton-price"
              {...props}
            />
            
            <Skeleton
              type="text"
              height="20px"
              width="40%"
              className="product-card-skeleton-stock"
              {...props}
            />
          </div>
          
          {showActions && (
            <div className="product-card-skeleton-actions">
              <Skeleton
                type="rect"
                height="36px"
                width="100px"
                rounded="lg"
                className="product-card-skeleton-button"
                {...props}
              />
              <Skeleton
                type="rect"
                height="36px"
                width="100px"
                rounded="lg"
                className="product-card-skeleton-button"
                {...props}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return <div className="product-card-skeleton-container">{cards}</div>;
});

ProductCardSkeleton.displayName = 'ProductCardSkeleton';

// ✅ SKELETON PARA FORMULARIOS
export const FormSkeleton = React.memo(({ 
  fields = 3, 
  showTitle = true,
  showActions = true,
  ...props 
}) => {
  const fieldCount = Math.max(1, Math.min(fields, 10));
  
  return (
    <div className="form-skeleton" role="status" aria-label="Formulario cargando">
      {showTitle && (
        <Skeleton
          type="text"
          height="32px"
          width="60%"
          className="form-skeleton-title"
          {...props}
        />
      )}
      
      <div className="form-skeleton-fields">
        {Array.from({ length: fieldCount }).map((_, index) => (
          <div key={`form-field-${index}`} className="form-skeleton-field">
            <Skeleton
              type="text"
              height="20px"
              width="30%"
              className="form-skeleton-label"
              {...props}
            />
            <Skeleton
              type="rect"
              height="40px"
              width="100%"
              rounded="md"
              className="form-skeleton-input"
              {...props}
            />
          </div>
        ))}
      </div>
      
      {showActions && (
        <div className="form-skeleton-actions">
          <Skeleton
            type="rect"
            height="44px"
            width="120px"
            rounded="lg"
            className="form-skeleton-button"
            {...props}
          />
          <Skeleton
            type="rect"
            height="44px"
            width="120px"
            rounded="lg"
            className="form-skeleton-button"
            {...props}
          />
        </div>
      )}
    </div>
  );
});

FormSkeleton.displayName = 'FormSkeleton';

// ✅ ASIGNACIÓN DE COMPONENTES
Skeleton.Table = TableSkeleton;
Skeleton.ProductCard = ProductCardSkeleton;
Skeleton.Form = FormSkeleton;

// ✅ PROPTYPES COMPLETOS
Skeleton.propTypes = {
  type: PropTypes.oneOf(['text', 'circle', 'rect', 'card', 'avatar']),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'light', 'dark']),
  count: PropTypes.number,
  rounded: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'full']),
  className: PropTypes.string,
  animated: PropTypes.bool,
  pulse: PropTypes.bool,
  children: PropTypes.node
};

// ✅ VALORES POR DEFECTO
Skeleton.defaultProps = {
  type: 'text',
  size: 'md',
  variant: 'primary',
  count: 1,
  rounded: 'md',
  className: '',
  animated: true,
  pulse: false
};

export default Skeleton;