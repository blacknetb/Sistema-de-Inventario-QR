import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../assets/styles/AUTH/auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        confirmPassword: '',
        telefono: '',
        rol: 'usuario'
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

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
        
        // Limpiar mensaje de éxito
        if (successMessage) setSuccessMessage('');
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }
        
        if (!formData.apellido.trim()) {
            newErrors.apellido = 'El apellido es requerido';
        }
        
        if (!formData.email) {
            newErrors.email = 'El correo electrónico es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Correo electrónico inválido';
        }
        
        if (!formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }
        
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirma tu contraseña';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }
        
        if (formData.telefono && !/^\d{10}$/.test(formData.telefono)) {
            newErrors.telefono = 'Teléfono inválido (10 dígitos)';
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
            // Preparar datos para enviar (sin confirmPassword)
            const { confirmPassword, ...dataToSend } = formData;
            
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setSuccessMessage('¡Registro exitoso! Redirigiendo al login...');
                setErrors({});
                
                // Esperar 2 segundos y redirigir al login
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setErrors({ general: data.message || 'Error al registrar usuario' });
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
                    <h2>Crear Cuenta</h2>
                    <p>Regístrate para acceder al sistema</p>
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
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="nombre">Nombre</label>
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Juan"
                                className={errors.nombre ? 'input-error' : ''}
                            />
                            {errors.nombre && <span className="error-message">{errors.nombre}</span>}
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="apellido">Apellido</label>
                            <input
                                type="text"
                                id="apellido"
                                name="apellido"
                                value={formData.apellido}
                                onChange={handleChange}
                                placeholder="Pérez"
                                className={errors.apellido ? 'input-error' : ''}
                            />
                            {errors.apellido && <span className="error-message">{errors.apellido}</span>}
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="email">Correo Electrónico</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="usuario@ejemplo.com"
                            className={errors.email ? 'input-error' : ''}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="telefono">Teléfono (Opcional)</label>
                        <input
                            type="tel"
                            id="telefono"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            placeholder="5551234567"
                            className={errors.telefono ? 'input-error' : ''}
                        />
                        {errors.telefono && <span className="error-message">{errors.telefono}</span>}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="rol">Rol</label>
                        <select
                            id="rol"
                            name="rol"
                            value={formData.rol}
                            onChange={handleChange}
                        >
                            <option value="usuario">Usuario</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">Contraseña</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className={errors.password ? 'input-error' : ''}
                            />
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className={errors.confirmPassword ? 'input-error' : ''}
                            />
                            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                        </div>
                    </div>
                    
                    <div className="terms-agreement">
                        <input type="checkbox" id="terms" required />
                        <label htmlFor="terms">
                            Acepto los <Link to="/terms">Términos y Condiciones</Link> y la <Link to="/privacy">Política de Privacidad</Link>
                        </label>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="btn btn-primary btn-block"
                        disabled={loading}
                    >
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>
                
                <div className="auth-footer">
                    <p>
                        ¿Ya tienes una cuenta? 
                        <Link to="/login" className="auth-link">Inicia sesión aquí</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;