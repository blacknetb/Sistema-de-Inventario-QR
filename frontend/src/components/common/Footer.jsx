/**
 * Footer.js
 * Componente de pie de página para la aplicación
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\common\Footer.js
 */

import React from 'react';
import { Link } from 'react-router-dom';
import '../../assets/styles/common/Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    // Enlaces del footer
    const companyLinks = [
        { path: '/about', label: 'Sobre Nosotros' },
        { path: '/contact', label: 'Contacto' },
        { path: '/careers', label: 'Carreras' },
        { path: '/blog', label: 'Blog' },
    ];

    const productLinks = [
        { path: '/features', label: 'Características' },
        { path: '/pricing', label: 'Precios' },
        { path: '/demo', label: 'Demo' },
        { path: '/api', label: 'API' },
    ];

    const supportLinks = [
        { path: '/help', label: 'Centro de Ayuda' },
        { path: '/docs', label: 'Documentación' },
        { path: '/community', label: 'Comunidad' },
        { path: '/status', label: 'Estado del Sistema' },
    ];

    const legalLinks = [
        { path: '/privacy', label: 'Privacidad' },
        { path: '/terms', label: 'Términos' },
        { path: '/security', label: 'Seguridad' },
        { path: '/cookies', label: 'Cookies' },
    ];

    return (
        <footer className="app-footer">
            <div className="footer-container">
                {/* Sección principal */}
                <div className="footer-main">
                    {/* Logo y descripción */}
                    <div className="footer-brand">
                        <div className="footer-logo">
                            📦
                            <span className="logo-text">InventarioPro</span>
                        </div>
                        <p className="footer-description">
                            Sistema de gestión de inventario completo y profesional. 
                            Optimiza tu negocio con nuestras herramientas avanzadas.
                        </p>
                        
                        {/* Redes sociales */}
                        <div className="social-links">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link">
                                <span className="social-icon">📘</span>
                                <span className="sr-only">Facebook</span>
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link">
                                <span className="social-icon">🐦</span>
                                <span className="sr-only">Twitter</span>
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link">
                                <span className="social-icon">💼</span>
                                <span className="sr-only">LinkedIn</span>
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link">
                                <span className="social-icon">🐙</span>
                                <span className="sr-only">GitHub</span>
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-link">
                                <span className="social-icon">📺</span>
                                <span className="sr-only">YouTube</span>
                            </a>
                        </div>
                    </div>

                    {/* Enlaces rápidos */}
                    <div className="footer-links">
                        <div className="link-column">
                            <h3 className="link-title">Empresa</h3>
                            <ul className="link-list">
                                {companyLinks.map(link => (
                                    <li key={link.path}>
                                        <Link to={link.path} className="footer-link">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="link-column">
                            <h3 className="link-title">Producto</h3>
                            <ul className="link-list">
                                {productLinks.map(link => (
                                    <li key={link.path}>
                                        <Link to={link.path} className="footer-link">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="link-column">
                            <h3 className="link-title">Soporte</h3>
                            <ul className="link-list">
                                {supportLinks.map(link => (
                                    <li key={link.path}>
                                        <Link to={link.path} className="footer-link">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="link-column">
                            <h3 className="link-title">Legal</h3>
                            <ul className="link-list">
                                {legalLinks.map(link => (
                                    <li key={link.path}>
                                        <Link to={link.path} className="footer-link">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div className="newsletter">
                        <h3 className="newsletter-title">Suscríbete a nuestro boletín</h3>
                        <p className="newsletter-description">
                            Recibe las últimas actualizaciones y consejos sobre gestión de inventario.
                        </p>
                        
                        <form className="newsletter-form">
                            <div className="form-group">
                                <input
                                    type="email"
                                    placeholder="Tu correo electrónico"
                                    className="newsletter-input"
                                    required
                                />
                                <button type="submit" className="newsletter-btn">
                                    Suscribirse
                                </button>
                            </div>
                            <p className="newsletter-note">
                                Nosotros respetamos tu privacidad. Puedes cancelar la suscripción en cualquier momento.
                            </p>
                        </form>
                    </div>
                </div>

                {/* Línea divisoria */}
                <div className="footer-divider"></div>

                {/* Sección inferior */}
                <div className="footer-bottom">
                    <div className="copyright">
                        <p>© {currentYear} InventarioPro. Todos los derechos reservados.</p>
                        <p className="version">v1.0.0</p>
                    </div>

                    {/* Métodos de pago */}
                    <div className="payment-methods">
                        <span className="payment-icon">💳</span>
                        <span className="payment-icon">📱</span>
                        <span className="payment-icon">🏦</span>
                        <span className="payment-icon">🔒</span>
                    </div>

                    {/* Enlaces adicionales */}
                    <div className="additional-links">
                        <Link to="/sitemap" className="additional-link">
                            Mapa del sitio
                        </Link>
                        <span className="link-separator">•</span>
                        <Link to="/accessibility" className="additional-link">
                            Accesibilidad
                        </Link>
                        <span className="link-separator">•</span>
                        <a href="mailto:soporte@inventariopro.com" className="additional-link">
                            soporte@inventariopro.com
                        </a>
                    </div>
                </div>

                {/* Información adicional */}
                <div className="footer-info">
                    <p className="disclaimer">
                        InventarioPro es una herramienta de gestión de inventario profesional. 
                        Los precios y características están sujetos a cambios sin previo aviso.
                    </p>
                    <div className="certifications">
                        <span className="cert-badge">ISO 27001</span>
                        <span className="cert-badge">GDPR Compliant</span>
                        <span className="cert-badge">SSL Secure</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;