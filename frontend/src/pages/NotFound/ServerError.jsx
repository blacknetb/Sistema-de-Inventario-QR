import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

const ServerError = () => {
    return (
        <div className={styles.notFound}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <h1 className={`${styles.errorCode} ${styles.error500}`}>500</h1>
                    <h2 className={styles.title}>Error del Servidor</h2>
                    <p className={styles.message}>
                        Lo sentimos, ha ocurrido un error en el servidor.
                        Estamos trabajando para solucionarlo.
                    </p>
                    
                    <div className={styles.illustration}>
                        <svg viewBox="0 0 200 120" className={styles.svg}>
                            <circle cx="100" cy="60" r="40" fill="#FEE2E2" />
                            <circle cx="80" cy="50" r="5" fill="#EF4444" />
                            <circle cx="120" cy="50" r="5" fill="#EF4444" />
                            <path d="M80 75 Q100 95, 120 75" stroke="#DC2626" strokeWidth="3" fill="none" />
                            <rect x="90" y="30" width="20" height="15" fill="#FECACA" rx="3" />
                            <text x="95" y="42" fontSize="8" fill="#DC2626">500</text>
                        </svg>
                    </div>

                    <div className={styles.actions}>
                        <Link to="/" className={`${styles.button} ${styles.primaryButton}`}>
                            Ir al Dashboard
                        </Link>
                        <button 
                            onClick={() => window.location.reload()}
                            className={`${styles.button} ${styles.secondaryButton}`}
                        >
                            Reintentar
                        </button>
                    </div>

                    <div className={styles.supportInfo}>
                        <p className={styles.supportText}>
                            Si el problema persiste, contacta al soporte técnico
                        </p>
                        <p className={styles.supportEmail}>
                            soporte@inventory-qr-system.com
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServerError;