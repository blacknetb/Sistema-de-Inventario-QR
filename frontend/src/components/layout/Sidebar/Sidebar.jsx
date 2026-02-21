import React from 'react';
import styles from './Sidebar.module.css';

const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { icon: '📊', label: 'Dashboard', path: '/' },
    { icon: '📦', label: 'Productos', path: '/productos' },
    { icon: '🏷️', label: 'Categorías', path: '/categorias' },
    { icon: '📥', label: 'Entradas', path: '/entradas' },
    { icon: '📤', label: 'Salidas', path: '/salidas' },
    { icon: '📈', label: 'Reportes', path: '/reportes' },
    { icon: '📱', label: 'QR Scanner', path: '/qr-scanner' },
    { icon: '⚙️', label: 'Configuración', path: '/configuracion' },
  ];

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Menú</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <nav className={styles.nav}>
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.path}
              className={styles.menuItem}
              onClick={onClose}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;