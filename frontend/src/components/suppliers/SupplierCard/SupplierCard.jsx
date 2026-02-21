import React, { useState } from 'react';
import styles from './SupplierCard.module.css';

const SupplierCard = ({
  supplier,
  onEdit,
  onDelete,
  onToggleStatus,
  isSelected,
  onToggleSelect
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    id,
    nombre,
    contacto,
    email,
    telefono,
    direccion,
    ciudad,
    estado,
    productos,
    calificacion,
    fechaRegistro
  } = supplier;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (isDeleting) return;
    setIsDeleting(true);
    await onDelete(id);
    setIsDeleting(false);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(supplier);
  };

  const handleToggleStatus = (e) => {
    e.stopPropagation();
    onToggleStatus(id, estado === 'activo' ? 'inactivo' : 'activo');
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    onToggleSelect(id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push('★');
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push('½');
      } else {
        stars.push('☆');
      }
    }

    return stars;
  };

  return (
    <div
      className={`${styles.card} ${estado === 'inactivo' ? styles.inactive : ''} ${
        isSelected ? styles.selected : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={styles.checkboxWrapper} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
          className={styles.checkbox}
        />
      </div>

      <div className={styles.statusBadge}>
        <span className={`${styles.statusDot} ${styles[estado]}`}></span>
        <span className={styles.statusText}>
          {estado === 'activo' ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <div className={styles.cardHeader}>
        <div className={styles.avatar}>
          {getInitials(nombre)}
        </div>
        <div className={styles.headerInfo}>
          <h3 className={styles.name}>{nombre}</h3>
          <p className={styles.contact}>{contacto}</p>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>📧 Email</span>
            <span className={styles.infoValue}>{email}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>📞 Teléfono</span>
            <span className={styles.infoValue}>{telefono}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>📍 Dirección</span>
            <span className={styles.infoValue}>{direccion}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>🏙️ Ciudad</span>
            <span className={styles.infoValue}>{ciudad}</span>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{productos}</span>
            <span className={styles.statLabel}>Productos</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{calificacion}</span>
            <span className={styles.statLabel}>Calificación</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatDate(fechaRegistro)}</span>
            <span className={styles.statLabel}>Registro</span>
          </div>
        </div>

        <div className={styles.rating}>
          <div className={styles.stars}>
            {renderStars(calificacion).map((star, index) => (
              <span key={index} className={styles.star}>
                {star}
              </span>
            ))}
          </div>
          <span className={styles.ratingValue}>{calificacion.toFixed(1)}</span>
        </div>
      </div>

      <div className={`${styles.actions} ${showActions ? styles.visible : ''}`}>
        <button
          onClick={handleEdit}
          className={`${styles.actionButton} ${styles.editButton}`}
          title="Editar proveedor"
        >
          ✏️
        </button>
        
        <button
          onClick={handleToggleStatus}
          className={`${styles.actionButton} ${
            estado === 'activo' ? styles.deactivateButton : styles.activateButton
          }`}
          title={estado === 'activo' ? 'Desactivar' : 'Activar'}
        >
          {estado === 'activo' ? '🔴' : '🟢'}
        </button>
        
        <button
          onClick={handleDelete}
          className={`${styles.actionButton} ${styles.deleteButton}`}
          disabled={isDeleting}
          title="Eliminar proveedor"
        >
          {isDeleting ? '⏳' : '🗑️'}
        </button>
      </div>
    </div>
  );
};

export default SupplierCard;