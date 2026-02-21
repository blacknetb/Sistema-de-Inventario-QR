import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './Auth.module.css';

const AuthLayout = () => {
    return (
        <div className={styles.authLayout}>
            <div className={styles.container}>
                <div className={styles.leftPanel}>
                    <div className={styles.branding}>
                        <img 
                            src="/logo-white.svg" 
                            alt="Inventory QR System" 
                            className={styles.logo}
                        />
                        <h1 className={styles.title}>Inventory QR System</h1>
                        <p className={styles.subtitle}>
                            Gestión inteligente de inventarios con tecnología QR
                        </p>
                    </div>
                    
                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>📦</span>
                            <span>Control de inventario en tiempo real</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>🔍</span>
                            <span>Escaneo QR instantáneo</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>📊</span>
                            <span>Reportes automatizados</span>
                        </div>
                    </div>
                </div>
                
                <div className={styles.rightPanel}>
                    <div className={styles.formContainer}>
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;