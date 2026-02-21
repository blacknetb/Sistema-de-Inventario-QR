import React, { useState } from 'react';
import styles from './CategoryCard.module.css';

const CategoryCard = ({
  category,
  onEdit,
  onDelete,
  onToggleStatus,
  isSelected,
  onToggleSelect
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    id,
    nombre,
    descripcion,
    color = '#3498db',
    icono = '📁',
    totalProductos = 0,
    fechaCreacion,
    fechaActualizacion,
    estado = 'activo',
    imagen
  } = category;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (isDeleting) return;
    
    setIsDeleting(true);
    await onDelete(id);
    setIsDeleting(false);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(category);
  };

  const handleToggleStatus = (e) => {
    e.stopPropagation();
    const newStatus = estado === 'activo' ? 'inactivo' : 'activo';
    onToggleStatus(id, newStatus);
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    onToggleSelect(id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return formatDate(dateString);
  };

  return (
    <div
      className={`${styles.card} ${estado === 'inactivo' ? styles.inactive : ''} ${
        isSelected ? styles.selected : ''
      }`}
      style={{ '--card-color': color }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Checkbox de selección */}
      <div className={styles.checkboxWrapper} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
          className={styles.checkbox}
        />
      </div>

      {/* Estado de la categoría */}
      <div className={styles.statusBadge}>
        <span className={`${styles.statusDot} ${styles[estado]}`}></span>
        <span className={styles.statusText}>
          {estado === 'activo' ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Contenido principal */}
      <div className={styles.cardContent}>
        {/* Icono o imagen */}
        <div
          className={styles.iconContainer}
          style={{ backgroundColor: `${color}20` }}
        >
          {imagen && !imageError ? (
            <img
              src={imagen}
              alt={nombre}
              className={styles.categoryImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <span className={styles.icon}>{icono}</span>
          )}
        </div>

        {/* Información */}
        <div className={styles.info}>
          <h3 className={styles.title}>{nombre}</h3>
          {descripcion && (
            <p className={styles.description}>{descripcion}</p>
          )}
          
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Productos:</span>
              <span className={styles.statValue}>{totalProductos}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Creado:</span>
              <span className={styles.statValue} title={formatDate(fechaCreacion)}>
                {getTimeAgo(fechaCreacion)}
              </span>
            </div>
          </div>

          {/* Barra de progreso (ejemplo) */}
          {totalProductos > 0 && (
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.min((totalProductos / 100) * 100, 100)}%`,
                  backgroundColor: color
                }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className={`${styles.actions} ${showActions ? styles.visible : ''}`}>
        <button
          onClick={handleEdit}
          className={`${styles.actionButton} ${styles.editButton}`}
          title="Editar categoría"
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
          title="Eliminar categoría"
        >
          {isDeleting ? '⏳' : '🗑️'}
        </button>
      </div>

      {/* Fecha de actualización */}
      {fechaActualizacion && (
        <div className={styles.updateInfo} title={formatDate(fechaActualizacion)}>
          Actualizado: {getTimeAgo(fechaActualizacion)}
        </div>
      )}
    </div>
  );
};

export default CategoryCard;