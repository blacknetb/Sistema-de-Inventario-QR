import React from 'react';
import { Outlet } from 'react-router-dom';
import '../../assets/styles/AUTH/auth.css';

const AuthLayout = () => {
    return (
        <div className="auth-layout">
            <div className="auth-background">
                <div className="auth-brand">
                    <h1>Inventarios Basicos</h1>
                    <p>Sistema de gestión de inventario</p>
                </div>
                
                <div className="auth-features">
                    <div className="feature">
                        <div className="feature-icon">📊</div>
                        <h3>Gestión Completa</h3>
                        <p>Controla tu inventario de manera eficiente</p>
                    </div>
                    
                    <div className="feature">
                        <div className="feature-icon">🔒</div>
                        <h3>Seguridad Total</h3>
                        <p>Tus datos protegidos con encriptación</p>
                    </div>
                    
                    <div className="feature">
                        <div className="feature-icon">⚡</div>
                        <h3>Rápido y Fiable</h3>
                        <p>Interfaz optimizada para máxima productividad</p>
                    </div>
                </div>
            </div>
            
            <div className="auth-content">
                <Outlet />
            </div>
        </div>
    );
};

export default AuthLayout;