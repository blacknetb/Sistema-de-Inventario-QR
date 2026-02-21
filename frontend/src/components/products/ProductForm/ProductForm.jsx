import React, { useState, useEffect } from 'react';
import styles from './ProductForm.module.css';
import Input from '../../common/Input/Input';
import Button from '../../common/Button/Button';

const ProductForm = ({ product, onSubmit, onCancel, categories = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    optimalStock: '',
    ...product
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = 'El nombre es requerido';
    if (!formData.sku) newErrors.sku = 'El SKU es requerido';
    if (!formData.category) newErrors.category = 'La categoría es requerida';
    if (!formData.price) newErrors.price = 'El precio es requerido';
    if (formData.price && formData.price < 0) newErrors.price = 'El precio no puede ser negativo';
    if (!formData.stock) newErrors.stock = 'El stock es requerido';
    if (formData.stock && formData.stock < 0) newErrors.stock = 'El stock no puede ser negativo';

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Información Básica</h3>
        <div className={styles.grid}>
          <Input
            label="Nombre del producto"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />
          
          <Input
            label="SKU"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            error={errors.sku}
            required
          />

          <div className={styles.selectField}>
            <label className={styles.label}>
              Categoría <span className={styles.required}>*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`${styles.select} ${errors.category ? styles.error : ''}`}
            >
              <option value="">Seleccionar categoría</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && (
              <p className={styles.errorText}>{errors.category}</p>
            )}
          </div>

          <div className={styles.fullWidth}>
            <Input
              label="Descripción"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción del producto"
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Precios y Costos</h3>
        <div className={styles.grid}>
          <Input
            type="number"
            label="Precio de venta"
            name="price"
            value={formData.price}
            onChange={handleChange}
            error={errors.price}
            required
          />
          
          <Input
            type="number"
            label="Costo"
            name="cost"
            value={formData.cost}
            onChange={handleChange}
            error={errors.cost}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Control de Stock</h3>
        <div className={styles.grid}>
          <Input
            type="number"
            label="Stock actual"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            error={errors.stock}
            required
          />
          
          <Input
            type="number"
            label="Stock mínimo"
            name="minStock"
            value={formData.minStock}
            onChange={handleChange}
            error={errors.minStock}
          />
          
          <Input
            type="number"
            label="Stock óptimo"
            name="optimalStock"
            value={formData.optimalStock}
            onChange={handleChange}
            error={errors.optimalStock}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {product ? 'Actualizar Producto' : 'Crear Producto'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;