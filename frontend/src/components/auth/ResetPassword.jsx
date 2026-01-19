import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import '../../assets/styles/AUTH/auth.css';

const ResetPassword = () => {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [token, setToken] = useState('');
    const [validToken, setValidToken] = useState(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
            // Aquí podrías validar el token con el backend
            setValidToken(true);
        } else {
            setErrors({ general: 'Token no válido o expirado' });
            setValidToken(false);
        }
    }, [searchParams]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
        
        if (successMessage) setSuccessMessage('');
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.password) {
            newErrors.password = 'La nueva contraseña es requerida';
        } else if (formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }
        
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirma tu contraseña';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
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
        
        if (!token) {
            setErrors({ general: 'Token no válido' });
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await fetch('http://localhost:3000/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    password: formData.password
                }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setSuccessMessage('¡Contraseña restablecida exitosamente! Redirigiendo al login...');
                setErrors({});
                setFormData({ password: '', confirmPassword: '' });
                
                // Esperar 3 segundos y redirigir al login
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setErrors({ general: data.message || 'Error al restablecer la contraseña' });
            }
        } catch (error) {
            setErrors({ general: 'Error de conexión con el servidor' });
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (validToken === false) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2>Token Inválido</h2>
                    </div>
                    
                    <div className="alert alert-error">
                        El enlace de recuperación no es válido o ha expirado.
                    </div>
                    
                    <div className="auth-footer">
                        <p>
                            <Link to="/forgot-password" className="btn btn-secondary btn-block">
                                Solicitar nuevo enlace
                            </Link>
                        </p>
                        <p>
                            <Link to="/login" className="auth-link">Volver al inicio de sesión</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Restablecer Contraseña</h2>
                    <p>Ingresa tu nueva contraseña</p>
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
                        <label htmlFor="password">Nueva Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className={errors.password ? 'input-error' : ''}
                            disabled={!!successMessage}
                        />
                        {errors.password && <span className="error-message">{errors.password}</span>}
                        <small className="form-help">Mínimo 6 caracteres</small>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className={errors.confirmPassword ? 'input-error' : ''}
                            disabled={!!successMessage}
                        />
                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>
                    
                    <button 
                        type="submit" 
                        className="btn btn-primary btn-block"
                        disabled={loading || !!successMessage}
                    >
                        {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                    </button>
                </form>
                
                <div className="auth-footer">
                    <p>
                        <Link to="/login" className="auth-link">Volver al inicio de sesión</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;