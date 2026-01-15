import React from 'react';
import "../../assets/styles/layout/layout.css";

/**
 * Componente Footer - Pie de página de la aplicación
 * Incluye información de copyright y enlaces legales
 */
const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <div className="footer-content">
                <div className="footer-left">
                    <p className="copyright">
                        &copy; {currentYear} Sistema de Inventarios. Todos los derechos reservados.
                    </p>
                    <div className="footer-links">
                        <a href="/privacy" className="footer-link">Política de Privacidad</a>
                        <span className="link-separator">|</span>
                        <a href="/terms" className="footer-link">Términos de Servicio</a>
                        <span className="link-separator">|</span>
                        <a href="/help" className="footer-link">Ayuda</a>
                        <span className="link-separator">|</span>
                        <a href="/contact" className="footer-link">Contacto</a>
                    </div>
                </div>
                
                <div className="footer-right">
                    <div className="system-stats">
                        <div className="stat-item">
                            <span className="stat-label">Usuarios activos:</span>
                            <span className="stat-value">12</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Productos:</span>
                            <span className="stat-value">1,245</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Última actualización:</span>
                            <span className="stat-value">Hoy, 10:30 AM</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="footer-bottom">
                <div className="tech-info">
                    <span className="tech-label">Desarrollado con:</span>
                    <span className="tech-stack">React • Node.js • MongoDB</span>
                </div>
                <div className="environment-info">
                    <span className="env-badge production">Producción</span>
                    <span className="env-version">v1.0.0</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;