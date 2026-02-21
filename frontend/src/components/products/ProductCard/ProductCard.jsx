import React from 'react';
import styles from './ProductCard.module.css';
import Card from '../../common/Card/Card';
import Button from '../../common/Button/Button';

const ProductCard = ({ product, onEdit, onDelete, onView, onGenerateQR }) => {
  const getStockStatus = () => {
    if (product.stock <= product.minStock) {
      return { label: 'Bajo stock', class: 'danger' };
    }
    if (product.stock <= product.optimalStock) {
      return { label: 'Stock óptimo', class: 'warning' };
    }
    return { label: 'Stock alto', class: 'success' };
  };

  const stockStatus = getStockStatus();

  return (
    <Card className={styles.productCard}>
      <div className={styles.header}>
        <h3 className={styles.name}>{product.name}</h3>
        <span className={`${styles.stockBadge} ${styles[stockStatus.class]}`}>
          {stockStatus.label}
        </span>
      </div>
      
      <p className={styles.description}>{product.description}</p>
      
      <div className={styles.details}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>SKU:</span>
          <span className={styles.detailValue}>{product.sku}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Categoría:</span>
          <span className={styles.detailValue}>{product.category}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Precio:</span>
          <span className={styles.detailValue}>${product.price}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Stock:</span>
          <span className={`${styles.detailValue} ${styles.stockValue}`}>
            {product.stock} unidades
          </span>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.qrSection}>
          {product.qrCode && (
            <img 
              src={product.qrCode} 
              alt="QR Code" 
              className={styles.qrCode}
              onClick={onGenerateQR}
            />
          )}
        </div>
        <div className={styles.actions}>
          <Button size="small" variant="outline" onClick={() => onView(product)}>
            Ver
          </Button>
          <Button size="small" variant="outline" onClick={() => onEdit(product)}>
            Editar
          </Button>
          <Button size="small" variant="danger" onClick={() => onDelete(product)}>
            Eliminar
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;