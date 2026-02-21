import React from 'react';
import styles from './QuickActions.module.css';
import Card from '../../common/Card/Card';
import Button from '../../common/Button/Button';

const QuickActions = () => {
  const actions = [
    { label: 'Agregar Producto', icon: '➕', variant: 'primary' },
    { label: 'Escanear QR', icon: '📱', variant: 'secondary' },
    { label: 'Generar Reporte', icon: '📊', variant: 'outline' },
    { label: 'Registrar Entrada', icon: '📥', variant: 'outline' },
    { label: 'Registrar Salida', icon: '📤', variant: 'outline' },
    { label: 'Configuración', icon: '⚙️', variant: 'outline' },
  ];

  return (
    <Card title="Acciones Rápidas">
      <div className={styles.grid}>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            className={styles.actionButton}
            fullWidth
          >
            <span className={styles.actionIcon}>{action.icon}</span>
            <span className={styles.actionLabel}>{action.label}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;