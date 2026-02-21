import React from 'react';
import styles from './ProductList.module.css';
import ProductCard from '../ProductCard/ProductCard';
import Table from '../../common/Table/Table';
import Button from '../../common/Button/Button';

const ProductList = ({ 
  products, 
  viewMode = 'grid', 
  onEdit, 
  onDelete, 
  onView,
  onGenerateQR 
}) => {
  const columns = [
    {
      key: 'sku',
      title: 'SKU',
    },
    {
      key: 'name',
      title: 'Nombre',
    },
    {
      key: 'category',
      title: 'Categoría',
    },
    {
      key: 'price',
      title: 'Precio',
      render: (value) => `$${value}`,
      align: 'right'
    },
    {
      key: 'stock',
      title: 'Stock',
      render: (value, record) => (
        <span className={`${styles.stockCell} ${value <= record.minStock ? styles.lowStock : ''}`}>
          {value}
        </span>
      ),
      align: 'right'
    },
    {
      key: 'actions',
      title: 'Acciones',
      render: (_, record) => (
        <div className={styles.actions}>
          <Button size="small" variant="outline" onClick={() => onView(record)}>
            Ver
          </Button>
          <Button size="small" variant="outline" onClick={() => onEdit(record)}>
            Editar
          </Button>
          <Button size="small" variant="danger" onClick={() => onDelete(record)}>
            Eliminar
          </Button>
          <Button size="small" variant="outline" onClick={() => onGenerateQR(record)}>
            QR
          </Button>
        </div>
      ),
    },
  ];

  if (viewMode === 'grid') {
    return (
      <div className={styles.grid}>
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            onGenerateQR={onGenerateQR}
          />
        ))}
        {products.length === 0 && (
          <p className={styles.empty}>No hay productos disponibles</p>
        )}
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <Table
        columns={columns}
        data={products}
        striped
        hoverable
      />
    </div>
  );
};

export default ProductList;