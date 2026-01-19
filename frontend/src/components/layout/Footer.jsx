import React from 'react';
import '../../assets/styles/layout/layout.css';

const Footer = ({ companyName, version, copyrightYear }) => {
  const currentYear = copyrightYear || new Date().getFullYear();

  const quickLinks = [
    { label: 'Documentación', href: '/docs' },
    { label: 'Soporte', href: '/support' },
    { label: 'Términos', href: '/terms' },
    { label: 'Privacidad', href: '/privacy' }
  ];

  const socialLinks = [
    { icon: '📘', label: 'Facebook', href: 'https://facebook.com' },
    { icon: '🐦', label: 'Twitter', href: 'https://twitter.com' },
    { icon: '💼', label: 'LinkedIn', href: 'https://linkedin.com' },
    { icon: '📷', label: 'Instagram', href: 'https://instagram.com' }
  ];

  const systemStats = {
    uptime: '99.8%',
    responseTime: '120ms',
    users: '45',
    lastBackup: 'Hace 2 horas'
  };

  return (
    <footer className="app-footer">
      <div className="footer-top">
        <div className="footer-section">
          <h4 className="footer-title">{companyName}</h4>
          <p className="footer-description">
            Sistema de gestión de inventario completo para optimizar tu negocio.
            Monitorea, analiza y controla tu stock en tiempo real.
          </p>
          <div className="version-info">
            <span className="version-label">Versión:</span>
            <span className="version-value">{version}</span>
          </div>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Enlaces Rápidos</h4>
          <ul className="footer-links">
            {quickLinks.map((link, index) => (
              <li key={index}>
                <a href={link.href} className="footer-link">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Estadísticas del Sistema</h4>
          <div className="system-stats">
            <div className="stat-item">
              <span className="stat-label">Tiempo Activo:</span>
              <span className="stat-value success">{systemStats.uptime}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Respuesta:</span>
              <span className="stat-value">{systemStats.responseTime}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Usuarios:</span>
              <span className="stat-value">{systemStats.users}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Último Backup:</span>
              <span className="stat-value">{systemStats.lastBackup}</span>
            </div>
          </div>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Conectar</h4>
          <div className="social-links">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                className="social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
              >
                <span className="social-icon">{social.icon}</span>
              </a>
            ))}
          </div>
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-icon">📧</span>
              <span className="contact-text">soporte@inventariopro.com</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <span className="contact-text">+1 (555) 123-4567</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <div className="copyright">
            © {currentYear} {companyName}. Todos los derechos reservados.
          </div>
          
          <div className="footer-actions">
            <button className="footer-action-btn" onClick={() => window.print()}>
              <span className="action-icon">🖨️</span>
              <span className="action-text">Imprimir</span>
            </button>
            <button className="footer-action-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <span className="action-icon">⬆️</span>
              <span className="action-text">Volver arriba</span>
            </button>
            <button 
              className="footer-action-btn" 
              onClick={() => document.documentElement.classList.toggle('dark-mode')}
            >
              <span className="action-icon">🌙</span>
              <span className="action-text">Modo oscuro</span>
            </button>
          </div>

          <div className="technical-info">
            <span className="browser-info">
              {navigator.userAgent.includes('Chrome') ? 'Chrome' : 
               navigator.userAgent.includes('Firefox') ? 'Firefox' : 
               navigator.userAgent.includes('Safari') ? 'Safari' : 'Browser'} compatible
            </span>
            <span className="resolution-info">
              {window.innerWidth}x{window.innerHeight}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;