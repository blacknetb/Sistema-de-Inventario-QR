import React, { useState } from 'react';
import styles from './ProductFilters.module.css';
import Input from '../../common/Input/Input';
import Button from '../../common/Button/Button';

const ProductFilters = ({ onFilter, categories = [] }) => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    stockStatus: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  const handleReset = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      stockStatus: ''
    });
    onFilter({});
  };

  return (
    <div className={styles.filters}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.searchSection}>
          <Input
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Buscar por nombre o SKU..."
            icon="🔍"
          />
        </div>

        <div className={styles.filterGrid}>
          <select
            name="category"
            value={filters.category}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            name="stockStatus"
            value={filters.stockStatus}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="">Todos los stocks</option>
            <option value="low">Bajo stock</option>
            <option value="optimal">Stock óptimo</option>
            <option value="high">Stock alto</option>
          </select>

          <div className={styles.priceRange}>
            <Input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleChange}
              placeholder="Precio mín."
            />
            <span className={styles.separator}>-</span>
            <Input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleChange}
              placeholder="Precio máx."
            />
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="submit" variant="primary">
            Aplicar Filtros
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            Limpiar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductFilters;