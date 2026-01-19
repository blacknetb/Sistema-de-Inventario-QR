import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/styles/pages/pages.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: '',
    acceptTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Limpiar error al escribir
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'El nombre de la empresa es requerido';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Debes aceptar los términos y condiciones';
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
    
    // Simular registro
    setTimeout(() => {
      // En un caso real, aquí harías una petición a tu API
      console.log('Usuario registrado:', formData);
      
      // Mostrar mensaje de éxito
      alert('¡Registro exitoso! Por favor inicia sesión.');
      
      // Redirigir al login
      navigate('/login');
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">📦</div>
          <h1 className="auth-title">Crear Cuenta</h1>
          <p className="auth-subtitle">Regístrate para comenzar a usar el sistema</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre Completo *</label>
            <input
              type="text"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              placeholder="Juan Pérez"
              disabled={loading}
            />
            {errors.name && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.name}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                disabled={loading}
              />
              {errors.email && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.email}</div>}
            </div>
            
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567 8900"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Empresa *</label>
            <input
              type="text"
              name="company"
              className="form-control"
              value={formData.company}
              onChange={handleChange}
              placeholder="Nombre de tu empresa"
              disabled={loading}
            />
            {errors.company && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.company}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contraseña *</label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
              />
              {errors.password && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.password}</div>}
            </div>
            
            <div className="form-group">
              <label className="form-label">Confirmar Contraseña *</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
              />
              {errors.confirmPassword && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.confirmPassword}</div>}
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                disabled={loading}
                style={{ marginTop: '3px' }}
              />
              <span>
                Acepto los{' '}
                <Link to="/terms" style={{ color: '#3498db' }}>
                  Términos y Condiciones
                </Link>{' '}
                y la{' '}
                <Link to="/privacy" style={{ color: '#3498db' }}>
                  Política de Privacidad
                </Link>
              </span>
            </label>
            {errors.acceptTerms && <div className="alert alert-danger" style={{ marginTop: '5px', padding: '8px' }}>{errors.acceptTerms}</div>}
          </div>

          <div className="form-group" style={{ marginTop: '25px' }}>
            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: '20px', height: '20px', marginRight: '10px' }}></div>
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </div>

          <div className="form-group" style={{ textAlign: 'center' }}>
            <p style={{ color: '#7f8c8d' }}>
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="auth-link">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>

        <div className="auth-footer">
          <p style={{ fontSize: '0.8rem', color: '#bdc3c7', marginTop: '20px' }}>
            Al registrarte, aceptas nuestros términos y condiciones.
            <br />
            © 2024 Inventario Pro. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;