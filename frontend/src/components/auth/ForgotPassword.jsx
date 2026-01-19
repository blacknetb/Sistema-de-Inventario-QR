import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../assets/styles/AUTH/auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        setEmail(e.target.value);
        if (errors.email) {
            setErrors({ ...errors, email: '' });
        }
        if (successMessage) setSuccessMessage('');
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!email) {
            newErrors.email = 'El correo electrónico es requerido';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Correo electrónico inválido';
        }
        
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setSuccessMessage('Se ha enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada.');
                setErrors({});
                setEmail('');
            } else {
                setErrors({ general: data.message || 'Error al enviar el enlace de recuperación' });
            }
        } catch (error) {
            setErrors({ general: 'Error de conexión con el servidor' });
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Recuperar Contraseña</h2>
                    <p>Ingresa tu correo electrónico para restablecer tu contraseña</p>
                </div>
                
                {errors.general && (
                    <div className="alert alert-error">
                        {errors.general}
                    </div>
                )}
                
                {successMessage && (
                    <div className="alert alert-success">
                        {successMessage}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Correo Electrónico</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={handleChange}
                            placeholder="usuario@ejemplo.com"
                            className={errors.email ? 'input-error' : ''}
                            disabled={!!successMessage}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                    
                    <button 
                        type="submit" 
                        className="btn btn-primary btn-block"
                        disabled={loading || !!successMessage}
                    >
                        {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                    </button>
                </form>
                
                <div className="auth-footer">
                    <p>
                        <Link to="/login" className="auth-link">Volver al inicio de sesión</Link>
                    </p>
                    <p>
                        ¿No tienes una cuenta? 
                        <Link to="/register" className="auth-link">Regístrate aquí</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;