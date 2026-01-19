import React from 'react';
import '../../assets/styles/Common/common.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    const quickLinks = [
        { label: 'Inicio', path: '/' },
        { label: 'Productos', path: '/products' },
        { label: 'Categorías', path: '/categories' },
        { label: 'Proveedores', path: '/suppliers' },
        { label: 'Reportes', path: '/reports' },
        { label: 'Ayuda', path: '/help' }
    ];

    const contactInfo = [
        { icon: 'fas fa-envelope', value: 'soporte@inventariobasico.com' },
        { icon: 'fas fa-phone', value: '+52 55 1234 5678' },
        { icon: 'fas fa-map-marker-alt', value: 'Ciudad de México, México' }
    ];

    const socialLinks = [
        { icon: 'fab fa-facebook', url: '#', label: 'Facebook' },
        { icon: 'fab fa-twitter', url: '#', label: 'Twitter' },
        { icon: 'fab fa-linkedin', url: '#', label: 'LinkedIn' },
        { icon: 'fab fa-instagram', url: '#', label: 'Instagram' }
    ];

    return (
        <footer className="footer">
            <div className="footer-container">
                {/* Sección principal */}
                <div className="footer-main">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <i className="fas fa-boxes"></i>
                            <span>Inventario Básico</span>
                        </div>
                        <p className="footer-description">
                            Sistema de gestión de inventario completo y eficiente 
                            para pequeñas y medianas empresas.
                        </p>
                        <div className="footer-social">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url}
                                    className="social-link"
                                    aria-label={social.label}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className={social.icon}></i>
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="footer-links">
                        <h4>Enlaces Rápidos</h4>
                        <ul>
                            {quickLinks.map((link, index) => (
                                <li key={index}>
                                    <a href={link.path}>{link.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="footer-contact">
                        <h4>Contacto</h4>
                        <ul>
                            {contactInfo.map((info, index) => (
                                <li key={index}>
                                    <i className={info.icon}></i>
                                    <span>{info.value}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="footer-newsletter">
                        <h4>Suscríbete</h4>
                        <p>Recibe actualizaciones y noticias importantes.</p>
                        <form className="newsletter-form">
                            <input
                                type="email"
                                placeholder="Tu correo electrónico"
                                className="newsletter-input"
                            />
                            <button type="submit" className="btn btn-primary">
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Línea divisoria */}
                <div className="footer-divider"></div>

                {/* Información inferior */}
                <div className="footer-bottom">
                    <div className="copyright">
                        &copy; {currentYear} Inventario Básico. Todos los derechos reservados.
                    </div>
                    
                    <div className="footer-legal">
                        <a href="/privacy">Política de Privacidad</a>
                        <a href="/terms">Términos de Servicio</a>
                        <a href="/cookies">Política de Cookies</a>
                    </div>
                    
                    <div className="footer-stats">
                        <div className="stat-item">
                            <i className="fas fa-users"></i>
                            <span>1,250+ Usuarios</span>
                        </div>
                        <div className="stat-item">
                            <i className="fas fa-database"></i>
                            <span>99.9% Uptime</span>
                        </div>
                        <div className="stat-item">
                            <i className="fas fa-shield-alt"></i>
                            <span>Seguro</span>
                        </div>
                    </div>
                </div>

                {/* Información técnica */}
                <div className="footer-tech">
                    <div className="tech-info">
                        <span>v2.5.1</span>
                        <span className="divider">•</span>
                        <span>Última actualización: 15/03/2024</span>
                        <span className="divider">•</span>
                        <span className="status online">
                            <i className="fas fa-circle"></i>
                            Sistema en línea
                        </span>
                    </div>
                    <div className="back-to-top">
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="btn-back-to-top"
                        >
                            <i className="fas fa-arrow-up"></i>
                            Volver arriba
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;