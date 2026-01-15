import React, { useState, useEffect } from 'react';
import '../../assets/styles/products.css';

/**
 * Componente ProductForm - Formulario para crear/editar productos
 * Incluye validación y manejo de errores
 */
const ProductForm = ({ product, onSubmit, onCancel, categories, suppliers }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        sku: '',
        category: '',
        price: '',
        cost: '',
        stock: '',
        minStock: '',
        supplier: '',
        status: 'available',
        image: null
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Categorías y proveedores por defecto
    const defaultCategories = ['Electrónicos', 'Oficina', 'Hogar', 'Ropa', 'Alimentos', 'Herramientas', 'Juguetes', 'Salud'];
    const defaultSuppliers = ['Dell Technologies', 'Apple Inc.', 'OfficeMax', 'Samsung', 'LG', 'Sony', 'HP', 'Lenovo'];

    const categoriesList = categories || defaultCategories;
    const suppliersList = suppliers || defaultSuppliers;

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                sku: product.sku || '',
                category: product.category || '',
                price: product.price || '',
                cost: product.cost || '',
                stock: product.stock || '',
                minStock: product.minStock || '',
                supplier: product.supplier || '',
                status: product.status || 'available',
                image: product.image || null
            });
        } else {
            // Generar SKU automático
            const autoSKU = `PROD-${Date.now().toString().slice(-6)}`;
            setFormData(prev => ({ ...prev, sku: autoSKU }));
        }
    }, [product]);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
        if (!formData.sku.trim()) newErrors.sku = 'El SKU es requerido';
        if (!formData.category) newErrors.category = 'La categoría es requerida';
        
        const price = parseFloat(formData.price);
        if (isNaN(price) || price <= 0) newErrors.price = 'Precio inválido';
        
        const stock = parseInt(formData.stock);
        if (isNaN(stock) || stock < 0) newErrors.stock = 'Stock inválido';
        
        const minStock = parseInt(formData.minStock);
        if (isNaN(minStock) || minStock < 0) newErrors.minStock = 'Stock mínimo inválido';
        
        if (!formData.supplier) newErrors.supplier = 'El proveedor es requerido';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        
        if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        // Limpiar error del campo modificado
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // Preparar datos para enviar al backend
            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                cost: formData.cost ? parseFloat(formData.cost) : null,
                stock: parseInt(formData.stock),
                minStock: parseInt(formData.minStock)
            };
            
            if (onSubmit) {
                await onSubmit(productData);
            }
            
            // Reset form after successful submission
            if (!product) {
                setFormData({
                    name: '',
                    description: '',
                    sku: `PROD-${Date.now().toString().slice(-6)}`,
                    category: '',
                    price: '',
                    cost: '',
                    stock: '',
                    minStock: '',
                    supplier: '',
                    status: 'available',
                    image: null
                });
            }
            
        } catch (error) {
            console.error('Error al guardar producto:', error);
            setErrors({ submit: 'Error al guardar el producto. Intenta nuevamente.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateSKU = () => {
        const prefix = formData.category ? formData.category.substring(0, 3).toUpperCase() : 'PROD';
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        const newSKU = `${prefix}-${random}`;
        setFormData(prev => ({ ...prev, sku: newSKU }));
    };

    return (
        <div className="product-form-container">
            <h2 className="form-title">
                {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            
            {errors.submit && (
                <div className="alert alert-error">
                    <i className="alert-icon">⚠️</i>
                    <span>{errors.submit}</span>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="product-form">
                <div className="form-grid">
                    {/* Columna izquierda */}
                    <div className="form-column">
                        <div className="form-group">
                            <label htmlFor="name" className="form-label required">
                                Nombre del Producto
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`form-input ${errors.name ? 'error' : ''}`}
                                placeholder="Ej: Laptop Dell XPS 13"
                                maxLength="100"
                            />
                            {errors.name && (
                                <span className="error-message">{errors.name}</span>
                            )}
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="description" className="form-label">
                                Descripción
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="form-textarea"
                                placeholder="Describe el producto..."
                                rows="4"
                                maxLength="500"
                            />
                            <div className="char-counter">
                                {formData.description.length}/500 caracteres
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="sku" className="form-label required">
                                    SKU
                                </label>
                                <div className="input-with-action">
                                    <input
                                        type="text"
                                        id="sku"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleChange}
                                        className={`form-input ${errors.sku ? 'error' : ''}`}
                                        placeholder="Ej: PROD-ABC123"
                                    />
                                    <button 
                                        type="button"
                                        className="input-action-btn"
                                        onClick={generateSKU}
                                        title="Generar SKU automático"
                                    >
                                        🔄
                                    </button>
                                </div>
                                {errors.sku && (
                                    <span className="error-message">{errors.sku}</span>
                                )}
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="category" className="form-label required">
                                    Categoría
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className={`form-select ${errors.category ? 'error' : ''}`}
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {categoriesList.map((category, index) => (
                                        <option key={index} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                                {errors.category && (
                                    <span className="error-message">{errors.category}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Columna derecha */}
                    <div className="form-column">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="price" className="form-label required">
                                    Precio de Venta ($)
                                </label>
                                <div className="input-with-prefix">
                                    <span className="input-prefix">$</span>
                                    <input
                                        type="number"
                                        id="price"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className={`form-input ${errors.price ? 'error' : ''}`}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                {errors.price && (
                                    <span className="error-message">{errors.price}</span>
                                )}
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="cost" className="form-label">
                                    Costo ($)
                                </label>
                                <div className="input-with-prefix">
                                    <span className="input-prefix">$</span>
                                    <input
                                        type="number"
                                        id="cost"
                                        name="cost"
                                        value={formData.cost}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="stock" className="form-label required">
                                    Stock Actual
                                </label>
                                <input
                                    type="number"
                                    id="stock"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    className={`form-input ${errors.stock ? 'error' : ''}`}
                                    placeholder="0"
                                    min="0"
                                />
                                {errors.stock && (
                                    <span className="error-message">{errors.stock}</span>
                                )}
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="minStock" className="form-label required">
                                    Stock Mínimo
                                </label>
                                <input
                                    type="number"
                                    id="minStock"
                                    name="minStock"
                                    value={formData.minStock}
                                    onChange={handleChange}
                                    className={`form-input ${errors.minStock ? 'error' : ''}`}
                                    placeholder="0"
                                    min="0"
                                />
                                {errors.minStock && (
                                    <span className="error-message">{errors.minStock}</span>
                                )}
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="supplier" className="form-label required">
                                Proveedor
                            </label>
                            <select
                                id="supplier"
                                name="supplier"
                                value={formData.supplier}
                                onChange={handleChange}
                                className={`form-select ${errors.supplier ? 'error' : ''}`}
                            >
                                <option value="">Seleccionar proveedor</option>
                                {suppliersList.map((supplier, index) => (
                                    <option key={index} value={supplier}>
                                        {supplier}
                                    </option>
                                ))}
                            </select>
                            {errors.supplier && (
                                <span className="error-message">{errors.supplier}</span>
                            )}
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="status" className="form-label">
                                Estado
                            </label>
                            <div className="status-options">
                                <label className="status-option">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="available"
                                        checked={formData.status === 'available'}
                                        onChange={handleChange}
                                    />
                                    <span className="status-badge available">Disponible</span>
                                </label>
                                <label className="status-option">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="low-stock"
                                        checked={formData.status === 'low-stock'}
                                        onChange={handleChange}
                                    />
                                    <span className="status-badge low-stock">Stock Bajo</span>
                                </label>
                                <label className="status-option">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="out-of-stock"
                                        checked={formData.status === 'out-of-stock'}
                                        onChange={handleChange}
                                    />
                                    <span className="status-badge out-of-stock">Agotado</span>
                                </label>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="image" className="form-label">
                                Imagen del Producto
                            </label>
                            <div className="file-upload">
                                <input
                                    type="file"
                                    id="image"
                                    name="image"
                                    onChange={handleChange}
                                    className="file-input"
                                    accept="image/*"
                                />
                                <label htmlFor="image" className="file-label">
                                    <i className="file-icon">📷</i>
                                    <span>{formData.image ? 'Cambiar imagen' : 'Subir imagen'}</span>
                                </label>
                                {formData.image && (
                                    <div className="file-preview">
                                        {typeof formData.image === 'string' ? (
                                            <img 
                                                src={formData.image} 
                                                alt="Vista previa" 
                                                className="preview-image"
                                            />
                                        ) : (
                                            <span className="preview-text">
                                                {formData.image.name}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner"></span>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <i className="btn-icon">✓</i>
                                {product ? 'Actualizar Producto' : 'Guardar Producto'}
                            </>
                        )}
                    </button>
                </div>
            </form>
            
            <div className="form-help">
                <h4>📝 Notas:</h4>
                <ul>
                    <li>Los campos marcados con <span className="required-marker">*</span> son obligatorios.</li>
                    <li>El SKU debe ser único para cada producto.</li>
                    <li>El stock mínimo activa alertas cuando el stock cae por debajo de este valor.</li>
                    <li>Las imágenes recomendadas son de 500x500px en formato JPG o PNG.</li>
                </ul>
            </div>
        </div>
    );
};

export default ProductForm;