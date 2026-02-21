import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.copyright}>
          © {currentYear} Sistema de Inventarios Básicos. Todos los derechos reservados.
        </p>
        <div className={styles.links}>
          <a href="/terminos" className={styles.link}>Términos de uso</a>
          <a href="/privacidad" className={styles.link}>Política de privacidad</a>
          <a href="/contacto" className={styles.link}>Contacto</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;