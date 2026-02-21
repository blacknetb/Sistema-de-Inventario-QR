import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import productsApi from '../../api/productsApi';
import categoriesApi from '../../api/categoriesApi';
import suppliersApi from '../../api/suppliersApi';
import styles from './ProductsPage.module.css';

const ProductForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        barcode: '',
        description: '',
        price: '',
        purchasePrice: '',
        stock: '',
        minStock: '',
        maxStock: '',
        categoryId: '',
        supplierId: '',
        location: '',
        expiryDate: '',
        isActive: true,
        images: []
    });

    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    
    const isEditing = Boolean(id);

    useEffect(() => {
        loadSelectOptions();
        if (isEditing) {
            loadProduct();
        }
    }, [id]);

    const loadSelectOptions = async () => {
        try {
            const [categoriesRes, suppliersRes] = await withLoading(
                Promise.all([
                    categoriesApi.getAllCategories(),
                    suppliersApi.getAllSuppliers()
                ])
            );

            if (categoriesRes.success) {
                setCategories(categoriesRes.data);
            }
            if (suppliersRes.success) {
                setSuppliers(suppliersRes.data);
            }
        } catch (error) {
            showNotification('Error al cargar opciones', 'error');
        }
    };

    const loadProduct = async () => {
        try {
            const response = await withLoading(productsApi.getProductById(id));
            if (response.success) {
                const product = response.data;
                setFormData({
                    name: product.name || '',
                    sku: product.sku || '',
                    barcode: product.barcode || '',
                    description: product.description || '',
                    price: product.price || '',
                    purchasePrice: product.purchasePrice || '',
                    stock: product.stock || '',
                    minStock: product.minStock || '',
                    maxStock: product.maxStock || '',
                    categoryId: product.categoryId || '',
                    supplierId: product.supplierId || '',
                    location: product.location || '',
                    expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
                    isActive: product.isActive !== false,
                    images: product.images || []
                });
                if (product.image) {
                    setImagePreview(product.image);
                }
            }
        } catch (error) {
            showNotification('Error al cargar el producto', 'error');
            navigate('/products');
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }

        if (!formData.price) {
            newErrors.price = 'El precio es requerido';
        } else if (isNaN(formData.price) || parseFloat(formData.price) < 0) {
            newErrors.price = 'El precio debe ser un número válido mayor o igual a 0';
        }

        if (formData.stock && (isNaN(formData.stock) || parseInt(formData.stock) < 0)) {
            newErrors.stock = 'El stock debe ser un número válido mayor o igual a 0';
        }

        if (formData.sku && formData.sku.length > 50) {
            newErrors.sku = 'El SKU no puede tener más de 50 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                images: [file]
            }));
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showNotification('Por favor, corrige los errores en el formulario', 'warning');
            return;
        }

        setIsSubmitting(true);

        try {
            const submitData = {
                ...formData,
                price: parseFloat(formData.price),
                purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
                stock: formData.stock ? parseInt(formData.stock) : 0,
                minStock: formData.minStock ? parseInt(formData.minStock) : 0,
                maxStock: formData.maxStock ? parseInt(formData.maxStock) : null
            };

            let response;
            if (isEditing) {
                response = await withLoading(productsApi.updateProduct(id, submitData));
            } else {
                response = await withLoading(productsApi.createProduct(submitData));
            }

            if (response.success) {
                showNotification(
                    isEditing ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente',
                    'success'
                );
                navigate('/products');
            }
        } catch (error) {
            showNotification(error.message || 'Error al guardar el producto', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/products');
    };

    return (
        <div className={styles.productForm}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                    <div className={styles.formSection}>
                        <h3>Información Básica</h3>
                        
                        <div className={styles.formGroup}>
                            <label htmlFor="name" className={styles.label}>
                                Nombre <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                                placeholder="Nombre del producto"
                                maxLength={100}
                            />
                            {errors.name && (
                                <span className={styles.errorMessage}>{errors.name}</span>
                            )}
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="sku" className={styles.label}>SKU</label>
                                <input
                                    type="text"
                                    id="sku"
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    className={`${styles.input} ${errors.sku ? styles.inputError : ''}`}
                                    placeholder="SKU-001"
                                    maxLength={50}
                                />
                                {errors.sku && (
                                    <span className={styles.errorMessage}>{errors.sku}</span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="barcode" className={styles.label}>
                                    Código de Barras
                                </label>
                                <input
                                    type="text"
                                    id="barcode"
                                    name="barcode"
                                    value={formData.barcode}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="1234567890123"
                                    maxLength={20}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="description" className={styles.label}>
                                Descripción
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className={styles.textarea}
                                placeholder="Descripción del producto"
                                rows={4}
                                maxLength={500}
                            />
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <h3>Precios y Stock</h3>
                        
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="price" className={styles.label}>
                                    Precio de Venta <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className={`${styles.input} ${errors.price ? styles.inputError : ''}`}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />
                                {errors.price && (
                                    <span className={styles.errorMessage}>{errors.price}</span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="purchasePrice" className={styles.label}>
                                    Precio de Compra
                                </label>
                                <input
                                    type="number"
                                    id="purchasePrice"
                                    name="purchasePrice"
                                    value={formData.purchasePrice}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="stock" className={styles.label}>Stock</label>
                                <input
                                    type="number"
                                    id="stock"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    className={`${styles.input} ${errors.stock ? styles.inputError : ''}`}
                                    placeholder="0"
                                    min="0"
                                    step="1"
                                />
                                {errors.stock && (
                                    <span className={styles.errorMessage}>{errors.stock}</span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="minStock" className={styles.label}>
                                    Stock Mínimo
                                </label>
                                <input
                                    type="number"
                                    id="minStock"
                                    name="minStock"
                                    value={formData.minStock}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="maxStock" className={styles.label}>
                                    Stock Máximo
                                </label>
                                <input
                                    type="number"
                                    id="maxStock"
                                    name="maxStock"
                                    value={formData.maxStock}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <h3>Categoría y Proveedor</h3>
                        
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="categoryId" className={styles.label}>
                                    Categoría
                                </label>
                                <select
                                    id="categoryId"
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    className={styles.select}
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="supplierId" className={styles.label}>
                                    Proveedor
                                </label>
                                <select
                                    id="supplierId"
                                    name="supplierId"
                                    value={formData.supplierId}
                                    onChange={handleChange}
                                    className={styles.select}
                                >
                                    <option value="">Seleccionar proveedor</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="location" className={styles.label}>
                                Ubicación en Almacén
                            </label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Aisle-1, Shelf-2"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="expiryDate" className={styles.label}>
                                Fecha de Vencimiento
                            </label>
                            <input
                                type="date"
                                id="expiryDate"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleChange}
                                className={styles.input}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <h3>Imagen del Producto</h3>
                        
                        <div className={styles.formGroup}>
                            <label htmlFor="image" className={styles.label}>
                                Imagen
                            </label>
                            <input
                                type="file"
                                id="image"
                                name="image"
                                onChange={handleImageChange}
                                accept="image/*"
                                className={styles.fileInput}
                            />
                            {imagePreview && (
                                <div className={styles.imagePreview}>
                                    <img src={imagePreview} alt="Preview" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <div className={styles.formGroup}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className={styles.checkbox}
                                />
                                <span>Producto activo</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className={styles.formActions}>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className={`${styles.button} ${styles.cancelButton}`}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className={`${styles.button} ${styles.submitButton}`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;