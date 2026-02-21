import React from 'react';
import styles from './ProductDetail.module.css';
import Card from '../../common/Card/Card';
import Button from '../../common/Button/Button';

const ProductDetail = ({ product, onClose, onEdit, onDelete }) => {
  if (!product) return null;

  return (
    <div className={styles.overlay}>
      <Card className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{product.name}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.grid}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Información General</h3>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>SKU:</span>
                  <span className={styles.value}>{product.sku}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Categoría:</span>
                  <span className={styles.value}>{product.category}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Descripción:</span>
                  <span className={styles.value}>{product.description}</span>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Stock y Precios</h3>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Stock actual:</span>
                  <span className={`${styles.value} ${styles.stockValue}`}>
                    {product.stock} unidades
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Stock mínimo:</span>
                  <span className={styles.value}>{product.minStock} unidades</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Stock óptimo:</span>
                  <span className={styles.value}>{product.optimalStock} unidades</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Precio:</span>
                  <span className={styles.value}>${product.price}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Costo:</span>
                  <span className={styles.value}>${product.cost}</span>
                </div>
              </div>
            </div>

            {product.qrCode && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Código QR</h3>
                <div className={styles.qrContainer}>
                  <img src={product.qrCode} alt="QR Code" className={styles.qrCode} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <div className={styles.actions}>
            <Button variant="outline" onClick={() => onEdit(product)}>
              Editar
            </Button>
            <Button variant="danger" onClick={() => onDelete(product)}>
              Eliminar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductDetail;