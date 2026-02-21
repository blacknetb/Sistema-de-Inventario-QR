import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

const NotFoundPage = () => {
    return (
        <div className={styles.notFound}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <h1 className={styles.errorCode}>404</h1>
                    <h2 className={styles.title}>Página No Encontrada</h2>
                    <p className={styles.message}>
                        Lo sentimos, la página que estás buscando no existe o ha sido movida.
                    </p>
                    
                    <div className={styles.illustration}>
                        <svg viewBox="0 0 200 120" className={styles.svg}>
                            <circle cx="100" cy="60" r="40" fill="#F3F4F6" />
                            <circle cx="80" cy="50" r="5" fill="#9CA3AF" />
                            <circle cx="120" cy="50" r="5" fill="#9CA3AF" />
                            <path d="M80 75 Q100 85, 120 75" stroke="#6B7280" strokeWidth="3" fill="none" />
                            <rect x="90" y="30" width="20" height="15" fill="#E5E7EB" rx="3" />
                            <text x="95" y="42" fontSize="8" fill="#9CA3AF">404</text>
                        </svg>
                    </div>

                    <div className={styles.actions}>
                        <Link to="/" className={`${styles.button} ${styles.primaryButton}`}>
                            Ir al Dashboard
                        </Link>
                        <button 
                            onClick={() => window.history.back()}
                            className={`${styles.button} ${styles.secondaryButton}`}
                        >
                            Volver Atrás
                        </button>
                    </div>

                    <div className={styles.helpLinks}>
                        <p className={styles.helpTitle}>Puedes intentar:</p>
                        <ul className={styles.linkList}>
                            <li>
                                <Link to="/products" className={styles.link}>
                                    Ver productos
                                </Link>
                            </li>
                            <li>
                                <Link to="/categories" className={styles.link}>
                                    Explorar categorías
                                </Link>
                            </li>
                            <li>
                                <Link to="/reports" className={styles.link}>
                                    Generar reportes
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;