import React, { useState, useEffect } from 'react';
import ProductImages from './ProductImages';
import ProductVariants from './ProductVariants';
import ProductPricing from './ProductPricing';
import ProductStock from './ProductStock';
import '../../assets/styles/Products/products.CSS';

const ProductForm = ({ product, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    // Información básica
    sku: '',
    name: '',
    description: '',
    category: '',
    subcategory: '',
    brand: '',
    supplier: '',
    unit: 'Unidad',
    weight: '',
    dimensions: '',
    barcode: '',
    
    // Precios
    cost: '',
    price: '',
    salePrice: '',
    taxRate: 16,
    
    // Stock
    stock: 0,
    minStock: 0,
    maxStock: 0,
    stockStatus: 'in-stock',
    
    // Estado
    status: 'active',
    
    // Etiquetas y características
    tags: [],
    features: [],
    
    // Especificaciones
    specifications: {},
    
    // Imágenes y variantes
    images: [],
    variants: [],
    
    // Notas
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Inicializar con datos del producto si existe
  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        brand: product.brand || '',
        supplier: product.supplier || '',
        unit: product.unit || 'Unidad',
        weight: product.weight || '',
        dimensions: product.dimensions || '',
        barcode: product.barcode || '',
        cost: product.cost || '',
        price: product.price || '',
        salePrice: product.salePrice || '',
        taxRate: product.taxRate || 16,
        stock: product.stock || 0,
        minStock: product.minStock || 0,
        maxStock: product.maxStock || 0,
        stockStatus: product.stockStatus || 'in-stock',
        status: product.status || 'active',
        tags: product.tags || [],
        features: product.features || [],
        specifications: product.specifications || {},
        images: product.images || [],
        variants: product.variants || [],
        notes: product.notes || ''
      });
    } else {
      // Generar SKU automático
      generateSKU();
    }
  }, [product]);

  const generateSKU = () => {
    const prefix = 'PROD';
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setFormData(prev => ({
      ...prev,
      sku: `${prefix}-${random}`
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleNestedChange = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones básicas
    if (!formData.sku.trim()) newErrors.sku = 'El SKU es requerido';
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.category) newErrors.category = 'La categoría es requerida';
    if (!formData.price || formData.price <= 0) newErrors.price = 'El precio debe ser mayor a 0';
    if (!formData.cost || formData.cost < 0) newErrors.cost = 'El costo no puede ser negativo';
    
    if (formData.cost > formData.price) {
      newErrors.cost = 'El costo no puede ser mayor al precio';
    }

    if (formData.minStock > formData.maxStock && formData.maxStock > 0) {
      newErrors.minStock = 'El stock mínimo no puede ser mayor al máximo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Calcular automáticamente el estado del stock
    const calculatedStockStatus = calculateStockStatus(formData.stock, formData.minStock);
    
    const productData = {
      ...formData,
      stockStatus: calculatedStockStatus,
      // Convertir números
      cost: parseFloat(formData.cost) || 0,
      price: parseFloat(formData.price) || 0,
      salePrice: parseFloat(formData.salePrice) || parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 0,
      maxStock: parseInt(formData.maxStock) || 0,
      weight: parseFloat(formData.weight) || 0,
      taxRate: parseFloat(formData.taxRate) || 0
    };

    onSave(productData);
  };

  const calculateStockStatus = (stock, minStock) => {
    if (stock <= 0) return 'out-of-stock';
    if (stock <= minStock) return 'low-stock';
    return 'in-stock';
  };

  const tabs = [
    { id: 'basic', label: 'Información Básica', icon: '📝' },
    { id: 'images', label: 'Imágenes', icon: '🖼️' },
    { id: 'pricing', label: 'Precios', icon: '💰' },
    { id: 'stock', label: 'Stock', icon: '📦' },
    { id: 'variants', label: 'Variantes', icon: '🔄' },
    { id: 'specs', label: 'Especificaciones', icon: '📋' },
    { id: 'advanced', label: 'Avanzado', icon: '⚙️' }
  ];

  const categories = [
    'Electrónica', 'Accesorios', 'Oficina', 'Almacenamiento', 
    'Redes', 'Mobiliario', 'Herramientas', 'Consumibles'
  ];

  const suppliers = [
    'Dell Technologies', 'Logitech Inc', 'Samsung Electronics', 
    'Razer Inc', 'HP Inc', 'Apple', 'Microsoft', 'Anker'
  ];

  const units = ['Unidad', 'Paquete', 'Caja', 'Metro', 'Kilogramo', 'Litro'];

  return (
    <div className="product-form">
      <div className="form-header">
        <h2>{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="form-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-content">
          {activeTab === 'basic' && (
            <div className="tab-content">
              <div className="form-section">
                <h3>Información Básica</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      SKU *
                      {errors.sku && <span className="error-message">{errors.sku}</span>}
                    </label>
                    <div className="input-with-action">
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleChange}
                        placeholder="Ej: PROD-001"
                        className={errors.sku ? 'error' : ''}
                      />
                      <button 
                        type="button" 
                        className="action-btn"
                        onClick={generateSKU}
                      >
                        Generar
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      Nombre *
                      {errors.name && <span className="error-message">{errors.name}</span>}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nombre del producto"
                      className={errors.name ? 'error' : ''}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Descripción detallada del producto..."
                    rows="4"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Categoría *
                      {errors.category && <span className="error-message">{errors.category}</span>}
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={errors.category ? 'error' : ''}
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Subcategoría</label>
                    <input
                      type="text"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleChange}
                      placeholder="Ej: Laptops, Monitores"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Marca</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="Ej: Dell, Samsung"
                    />
                  </div>

                  <div className="form-group">
                    <label>Proveedor</label>
                    <select
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                    >
                      <option value="">Seleccionar proveedor</option>
                      {suppliers.map(sup => (
                        <option key={sup} value={sup}>{sup}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Unidad y Medidas</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Unidad de medida</label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Peso (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Dimensiones (LxAxH cm)</label>
                    <input
                      type="text"
                      name="dimensions"
                      value={formData.dimensions}
                      onChange={handleChange}
                      placeholder="30x20x10"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Código de barras</label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder="1234567890123"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="tab-content">
              <ProductImages
                images={formData.images}
                onImagesChange={(images) => handleNestedChange('images', images)}
              />
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="tab-content">
              <ProductPricing
                pricing={formData}
                onPricingChange={handleNestedChange}
                errors={errors}
              />
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="tab-content">
              <ProductStock
                stockData={formData}
                onStockChange={handleNestedChange}
                errors={errors}
              />
            </div>
          )}

          {activeTab === 'variants' && (
            <div className="tab-content">
              <ProductVariants
                variants={formData.variants}
                onVariantsChange={(variants) => handleNestedChange('variants', variants)}
              />
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="tab-content">
              <div className="form-section">
                <h3>Especificaciones Técnicas</h3>
                <div className="specifications-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Procesador</label>
                      <input
                        type="text"
                        name="spec_processor"
                        value={formData.specifications?.processor || ''}
                        onChange={(e) => handleNestedChange('specifications', {
                          ...formData.specifications,
                          processor: e.target.value
                        })}
                        placeholder="Ej: Intel Core i7"
                      />
                    </div>
                    <div className="form-group">
                      <label>RAM</label>
                      <input
                        type="text"
                        name="spec_ram"
                        value={formData.specifications?.ram || ''}
                        onChange={(e) => handleNestedChange('specifications', {
                          ...formData.specifications,
                          ram: e.target.value
                        })}
                        placeholder="Ej: 16GB"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Almacenamiento</label>
                      <input
                        type="text"
                        name="spec_storage"
                        value={formData.specifications?.storage || ''}
                        onChange={(e) => handleNestedChange('specifications', {
                          ...formData.specifications,
                          storage: e.target.value
                        })}
                        placeholder="Ej: 512GB SSD"
                      />
                    </div>
                    <div className="form-group">
                      <label>Pantalla</label>
                      <input
                        type="text"
                        name="spec_display"
                        value={formData.specifications?.display || ''}
                        onChange={(e) => handleNestedChange('specifications', {
                          ...formData.specifications,
                          display: e.target.value
                        })}
                        placeholder="Ej: 13.4'' FHD+"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Características</label>
                    <div className="tags-input">
                      {formData.features.map((feature, index) => (
                        <span key={index} className="tag">
                          {feature}
                          <button
                            type="button"
                            className="tag-remove"
                            onClick={() => {
                              const newFeatures = formData.features.filter((_, i) => i !== index);
                              handleNestedChange('features', newFeatures);
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Agregar característica y presiona Enter"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            e.preventDefault();
                            handleNestedChange('features', [...formData.features, e.target.value.trim()]);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Etiquetas</label>
                    <div className="tags-input">
                      {formData.tags.map((tag, index) => (
                        <span key={index} className="tag">
                          {tag}
                          <button
                            type="button"
                            className="tag-remove"
                            onClick={() => {
                              const newTags = formData.tags.filter((_, i) => i !== index);
                              handleNestedChange('tags', newTags);
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Agregar etiqueta y presiona Enter"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            e.preventDefault();
                            handleNestedChange('tags', [...formData.tags, e.target.value.trim()]);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="tab-content">
              <div className="form-section">
                <h3>Configuración Avanzada</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Estado del producto</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="draft">Borrador</option>
                      <option value="archived">Archivado</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Estado del stock</label>
                    <select
                      name="stockStatus"
                      value={formData.stockStatus}
                      onChange={handleChange}
                    >
                      <option value="in-stock">En stock</option>
                      <option value="low-stock">Stock bajo</option>
                      <option value="out-of-stock">Agotado</option>
                      <option value="backorder">Pedido especial</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notas internas</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Notas internas para el producto..."
                    rows="4"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="form-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            {product ? 'Actualizar Producto' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;