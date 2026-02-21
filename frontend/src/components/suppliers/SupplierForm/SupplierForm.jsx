import React, { useState, useEffect } from 'react';
import styles from './SupplierForm.module.css';

const SupplierForm = ({ supplier, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    estado: 'activo',
    calificacion: 0
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (supplier) {
      setFormData({
        nombre: supplier.nombre || '',
        contacto: supplier.contacto || '',
        email: supplier.email || '',
        telefono: supplier.telefono || '',
        direccion: supplier.direccion || '',
        ciudad: supplier.ciudad || '',
        estado: supplier.estado || 'activo',
        calificacion: supplier.calificacion || 0
      });
    }
  }, [supplier]);

  const validateField = (name, value) => {
    switch (name) {
      case 'nombre':
        if (!value.trim()) return 'El nombre es requerido';
        if (value.length < 3) return 'Mínimo 3 caracteres';
        if (value.length > 100) return 'Máximo 100 caracteres';
        return '';
      
      case 'contacto':
        if (!value.trim()) return 'El contacto es requerido';
        if (value.length < 3) return 'Mínimo 3 caracteres';
        return '';
      
      case 'email':
        if (!value.trim()) return 'El email es requerido';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
        return '';
      
      case 'telefono':
        if (!value.trim()) return 'El teléfono es requerido';
        if (!/^[\d\s\+\-\(\)]{7,20}$/.test(value)) return 'Teléfono inválido';
        return '';
      
      case 'ciudad':
        if (!value.trim()) return 'La ciudad es requerida';
        return '';
      
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSave(formData);
    } catch (error) {
      setErrors({ submit: 'Error al guardar' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>{supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
        <button
          type="button"
          onClick={onCancel}
          className={styles.closeButton}
          disabled={isSubmitting}
        >
          ✕
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nombre">
            Nombre de la empresa <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ej: Distribuidora ABC"
            className={errors.nombre ? styles.inputError : ''}
            disabled={isSubmitting}
          />
          {errors.nombre && (
            <span className={styles.errorMessage}>{errors.nombre}</span>
          )}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="contacto">
              Contacto <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="contacto"
              name="contacto"
              value={formData.contacto}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Nombre del contacto"
              className={errors.contacto ? styles.inputError : ''}
              disabled={isSubmitting}
            />
            {errors.contacto && (
              <span className={styles.errorMessage}>{errors.contacto}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">
              Email <span className={styles.required}>*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="contacto@empresa.com"
              className={errors.email ? styles.inputError : ''}
              disabled={isSubmitting}
            />
            {errors.email && (
              <span className={styles.errorMessage}>{errors.email}</span>
            )}
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="telefono">
              Teléfono <span className={styles.required}>*</span>
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="555-0101"
              className={errors.telefono ? styles.inputError : ''}
              disabled={isSubmitting}
            />
            {errors.telefono && (
              <span className={styles.errorMessage}>{errors.telefono}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="ciudad">
              Ciudad <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="ciudad"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ciudad"
              className={errors.ciudad ? styles.inputError : ''}
              disabled={isSubmitting}
            />
            {errors.ciudad && (
              <span className={styles.errorMessage}>{errors.ciudad}</span>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="direccion">Dirección</label>
          <textarea
            id="direccion"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Dirección completa"
            className={errors.direccion ? styles.inputError : ''}
            disabled={isSubmitting}
            rows="3"
          />
          {errors.direccion && (
            <span className={styles.errorMessage}>{errors.direccion}</span>
          )}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              disabled={isSubmitting}
              className={styles.select}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="calificacion">Calificación</label>
            <select
              id="calificacion"
              name="calificacion"
              value={formData.calificacion}
              onChange={handleChange}
              disabled={isSubmitting}
              className={styles.select}
            >
              <option value="0">0 estrellas</option>
              <option value="1">1 estrella</option>
              <option value="2">2 estrellas</option>
              <option value="3">3 estrellas</option>
              <option value="4">4 estrellas</option>
              <option value="5">5 estrellas</option>
            </select>
          </div>
        </div>

        {errors.submit && (
          <div className={styles.submitError}>
            {errors.submit}
          </div>
        )}

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner}></span>
                Guardando...
              </>
            ) : (
              supplier ? 'Actualizar' : 'Crear'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;