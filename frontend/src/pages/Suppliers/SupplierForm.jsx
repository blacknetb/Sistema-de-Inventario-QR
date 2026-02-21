import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import suppliersApi from '../../api/suppliersApi';
import styles from './SuppliersPage.module.css';

const SupplierForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();

    const [formData, setFormData] = useState({
        name: '',
        businessName: '',
        rfc: '',
        email: '',
        phone: '',
        website: '',
        address: {
            street: '',
            colony: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'México'
        },
        notes: '',
        isActive: true
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const isEditing = Boolean(id);

    useEffect(() => {
        if (isEditing) {
            loadSupplier();
        }
    }, [id]);

    const loadSupplier = async () => {
        try {
            const response = await withLoading(suppliersApi.getSupplierById(id));
            if (response.success) {
                const supplier = response.data;
                setFormData({
                    name: supplier.name || '',
                    businessName: supplier.businessName || '',
                    rfc: supplier.rfc || '',
                    email: supplier.email || '',
                    phone: supplier.phone || '',
                    website: supplier.website || '',
                    address: supplier.address || {
                        street: '',
                        colony: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        country: 'México'
                    },
                    notes: supplier.notes || '',
                    isActive: supplier.isActive !== false
                });
            }
        } catch (error) {
            showNotification('Error al cargar el proveedor', 'error');
            navigate('/suppliers');
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'El email no es válido';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'El teléfono es requerido';
        } else if (!/^\d{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = 'El teléfono debe tener entre 10 y 15 dígitos';
        }

        if (formData.rfc && !/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(formData.rfc)) {
            newErrors.rfc = 'El RFC no es válido';
        }

        if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
            newErrors.website = 'La URL no es válida (debe incluir http:// o https://)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
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
            let response;
            if (isEditing) {
                response = await withLoading(suppliersApi.updateSupplier(id, formData));
            } else {
                response = await withLoading(suppliersApi.createSupplier(formData));
            }

            if (response.success) {
                showNotification(
                    isEditing ? 'Proveedor actualizado exitosamente' : 'Proveedor creado exitosamente',
                    'success'
                );
                navigate('/suppliers');
            }
        } catch (error) {
            showNotification(error.message || 'Error al guardar el proveedor', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/suppliers');
    };

    return (
        <div className={styles.supplierForm}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                    <div className={styles.formSection}>
                        <h3>Información General</h3>
                        
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
                                placeholder="Nombre del proveedor"
                                maxLength={100}
                            />
                            {errors.name && (
                                <span className={styles.errorMessage}>{errors.name}</span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="businessName" className={styles.label}>
                                Razón Social
                            </label>
                            <input
                                type="text"
                                id="businessName"
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Razón social (si es diferente)"
                                maxLength={100}
                            />
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="rfc" className={styles.label}>
                                    RFC
                                </label>
                                <input
                                    type="text"
                                    id="rfc"
                                    name="rfc"
                                    value={formData.rfc}
                                    onChange={handleChange}
                                    className={`${styles.input} ${errors.rfc ? styles.inputError : ''}`}
                                    placeholder="ABC123456XYZ"
                                    maxLength={13}
                                    style={{ textTransform: 'uppercase' }}
                                />
                                {errors.rfc && (
                                    <span className={styles.errorMessage}>{errors.rfc}</span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="website" className={styles.label}>
                                    Sitio Web
                                </label>
                                <input
                                    type="url"
                                    id="website"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className={`${styles.input} ${errors.website ? styles.inputError : ''}`}
                                    placeholder="https://ejemplo.com"
                                />
                                {errors.website && (
                                    <span className={styles.errorMessage}>{errors.website}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <h3>Información de Contacto</h3>
                        
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="email" className={styles.label}>
                                    Email <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                                    placeholder="contacto@proveedor.com"
                                />
                                {errors.email && (
                                    <span className={styles.errorMessage}>{errors.email}</span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="phone" className={styles.label}>
                                    Teléfono <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                                    placeholder="5512345678"
                                />
                                {errors.phone && (
                                    <span className={styles.errorMessage}>{errors.phone}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <h3>Dirección</h3>
                        
                        <div className={styles.formGroup}>
                            <label htmlFor="address.street" className={styles.label}>
                                Calle y Número
                            </label>
                            <input
                                type="text"
                                id="address.street"
                                name="address.street"
                                value={formData.address.street}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Av. Principal #123"
                            />
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="address.colony" className={styles.label}>
                                    Colonia
                                </label>
                                <input
                                    type="text"
                                    id="address.colony"
                                    name="address.colony"
                                    value={formData.address.colony}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="Centro"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="address.city" className={styles.label}>
                                    Ciudad
                                </label>
                                <input
                                    type="text"
                                    id="address.city"
                                    name="address.city"
                                    value={formData.address.city}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="Ciudad de México"
                                />
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="address.state" className={styles.label}>
                                    Estado
                                </label>
                                <input
                                    type="text"
                                    id="address.state"
                                    name="address.state"
                                    value={formData.address.state}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="CDMX"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="address.zipCode" className={styles.label}>
                                    Código Postal
                                </label>
                                <input
                                    type="text"
                                    id="address.zipCode"
                                    name="address.zipCode"
                                    value={formData.address.zipCode}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="12345"
                                    maxLength={5}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="address.country" className={styles.label}>
                                    País
                                </label>
                                <input
                                    type="text"
                                    id="address.country"
                                    name="address.country"
                                    value={formData.address.country}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="México"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <h3>Notas</h3>
                        
                        <div className={styles.formGroup}>
                            <label htmlFor="notes" className={styles.label}>
                                Notas adicionales
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className={styles.textarea}
                                placeholder="Información adicional sobre el proveedor..."
                                rows={4}
                                maxLength={500}
                            />
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
                                <span>Proveedor activo</span>
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

export default SupplierForm;