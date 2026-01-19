import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/styles/pages/pages.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Limpiar error al escribir
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Por favor ingresa un email válido');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Simular autenticación
    setTimeout(() => {
      // En un caso real, aquí harías una petición a tu API
      if (formData.email === 'admin@empresa.com' && formData.password === 'admin123') {
        // Guardar token de sesión
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', formData.email);
        
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        // Redirigir al dashboard
        navigate('/dashboard');
      } else {
        setError('Credenciales incorrectas. Intenta con admin@empresa.com / admin123');
      }
      setLoading(false);
    }, 1500);
  };

  const handleForgotPassword = () => {
    const email = prompt('Ingresa tu email para recuperar la contraseña:');
    if (email) {
      alert(`Se ha enviado un enlace de recuperación a ${email}`);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">📦</div>
          <h1 className="auth-title">Inventario Pro</h1>
          <p className="auth-subtitle">Inicia sesión en tu cuenta</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={loading}
              />
              Recordarme
            </label>
            
            <button
              type="button"
              className="btn btn-link"
              onClick={handleForgotPassword}
              style={{ padding: 0, background: 'none', border: 'none', color: '#3498db', cursor: 'pointer' }}
            >
              ¿Olvidaste tu contraseña?
            </button>
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
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>

          <div className="form-group" style={{ textAlign: 'center' }}>
            <p style={{ color: '#7f8c8d' }}>
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="auth-link">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </form>

        <div className="auth-footer">
          <p style={{ fontSize: '0.9rem', color: '#95a5a6' }}>
            Usa las credenciales de demo: admin@empresa.com / admin123
          </p>
          <p style={{ fontSize: '0.8rem', color: '#bdc3c7', marginTop: '20px' }}>
            © 2024 Inventario Pro. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;