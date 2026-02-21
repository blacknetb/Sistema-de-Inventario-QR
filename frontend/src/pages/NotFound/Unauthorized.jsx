import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

const Unauthorized = () => {
    return (
        <div className={styles.notFound}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <h1 className={`${styles.errorCode} ${styles.error403}`}>403</h1>
                    <h2 className={styles.title}>Acceso No Autorizado</h2>
                    <p className={styles.message}>
                        No tienes permisos suficientes para acceder a esta página.
                    </p>
                    
                    <div className={styles.illustration}>
                        <svg viewBox="0 0 200 120" className={styles.svg}>
                            <circle cx="100" cy="60" r="40" fill="#FEF3C7" />
                            <circle cx="80" cy="50" r="5" fill="#F59E0B" />
                            <circle cx="120" cy="50" r="5" fill="#F59E0B" />
                            <path d="M80 75 Q100 85, 120 75" stroke="#D97706" strokeWidth="3" fill="none" />
                            <rect x="90" y="30" width="20" height="15" fill="#FDE68A" rx="3" />
                            <text x="95" y="42" fontSize="8" fill="#D97706">403</text>
                            <line x1="85" y1="30" x2="115" y2="45" stroke="#D97706" strokeWidth="2" />
                            <line x1="115" y1="30" x2="85" y2="45" stroke="#D97706" strokeWidth="2" />
                        </svg>
                    </div>

                    <div className={styles.actions}>
                        <Link to="/" className={`${styles.button} ${styles.primaryButton}`}>
                            Ir al Dashboard
                        </Link>
                        <Link to="/login" className={`${styles.button} ${styles.secondaryButton}`}>
                            Iniciar Sesión
                        </Link>
                    </div>

                    <div className={styles.helpLinks}>
                        <p className={styles.helpTitle}>Si crees que esto es un error:</p>
                        <ul className={styles.linkList}>
                            <li>
                                <Link to="/profile" className={styles.link}>
                                    Verificar tu perfil
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className={styles.link}>
                                    Contactar al administrador
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;