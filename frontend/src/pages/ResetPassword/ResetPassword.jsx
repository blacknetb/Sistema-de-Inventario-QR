import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import authApi from '../../api/authApi';
import styles from './ResetPassword.module.css';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();

    const [token, setToken] = useState('');
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidToken, setIsValidToken] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
            validateToken(tokenParam);
        } else {
            setIsValidToken(false);
            showNotification('Token no proporcionado', 'error');
        }
    }, [searchParams]);

    useEffect(() => {
        // Calculate password strength
        if (formData.password) {
            let strength = 0;
            if (formData.password.length >= 8) strength += 25;
            if (/[A-Z]/.test(formData.password)) strength += 25;
            if (/[a-z]/.test(formData.password)) strength += 25;
            if (/[0-9]/.test(formData.password)) strength += 15;
            if (/[^A-Za-z0-9]/.test(formData.password)) strength += 10;
            setPasswordStrength(Math.min(strength, 100));
        } else {
            setPasswordStrength(0);
        }
    }, [formData.password]);

    const validateToken = async (token) => {
        try {
            // You might want to add an endpoint to validate token
            // For now, we'll assume it's valid if it exists
            setIsValidToken(true);
        } catch (error) {
            setIsValidToken(false);
            showNotification('Token inválido o expirado', 'error');
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 8) {
            newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
        } else if (!/[A-Z]/.test(formData.password)) {
            newErrors.password = 'La contraseña debe incluir al menos una mayúscula';
        } else if (!/[a-z]/.test(formData.password)) {
            newErrors.password = 'La contraseña debe incluir al menos una minúscula';
        } else if (!/[0-9]/.test(formData.password)) {
            newErrors.password = 'La contraseña debe incluir al menos un número';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirma tu contraseña';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showNotification('Por favor, corrige los errores en el formulario', 'warning');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await withLoading(
                authApi.resetPassword(token, formData.password)
            );

            if (response.success) {
                showNotification(
                    'Contraseña restablecida exitosamente. Ahora puedes iniciar sesión.',
                    'success'
                );
                
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (error) {
            showNotification(error.message || 'Error al restablecer la contraseña', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStrengthColor = () => {
        if (passwordStrength < 50) return styles.weak;
        if (passwordStrength < 75) return styles.medium;
        return styles.strong;
    };

    const getStrengthText = () => {
        if (passwordStrength < 50) return 'Débil';
        if (passwordStrength < 75) return 'Media';
        return 'Fuerte';
    };

    if (!isValidToken) {
        return (
            <div className={styles.resetPassword}>
                <div className={styles.errorContainer}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <h2 className={styles.errorTitle}>Token Inválido</h2>
                    <p className={styles.errorMessage}>
                        El enlace para restablecer la contraseña no es válido o ha expirado.
                    </p>
                    <div className={styles.actions}>
                        <Link to="/forgot-password" className={styles.primaryButton}>
                            Solicitar nuevo enlace
                        </Link>
                        <Link to="/login" className={styles.secondaryButton}>
                            Volver al login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.resetPassword}>
            <h2 className={styles.title}>Restablecer Contraseña</h2>
            
            <p className={styles.description}>
                Ingresa tu nueva contraseña. Asegúrate de que sea segura y fácil de recordar.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="password" className={styles.label}>
                        Nueva Contraseña
                    </label>
                    <div className={styles.passwordInput}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                            placeholder="••••••••"
                            disabled={isSubmitting}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={styles.togglePassword}
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                    {errors.password && (
                        <span className={styles.errorMessage}>{errors.password}</span>
                    )}
                    
                    {formData.password && (
                        <div className={styles.strengthMeter}>
                            <div className={styles.strengthBar}>
                                <div 
                                    className={`${styles.strengthFill} ${getStrengthColor()}`}
                                    style={{ width: `${passwordStrength}%` }}
                                ></div>
                            </div>
                            <span className={`${styles.strengthText} ${getStrengthColor()}`}>
                                {getStrengthText()}
                            </span>
                        </div>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="confirmPassword" className={styles.label}>
                        Confirmar Contraseña
                    </label>
                    <div className={styles.passwordInput}>
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                            placeholder="••••••••"
                            disabled={isSubmitting}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className={styles.togglePassword}
                        >
                            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <span className={styles.errorMessage}>{errors.confirmPassword}</span>
                    )}
                </div>

                <div className={styles.passwordRequirements}>
                    <p className={styles.requirementsTitle}>Tu contraseña debe tener:</p>
                    <ul className={styles.requirementsList}>
                        <li className={formData.password.length >= 8 ? styles.valid : ''}>
                            {formData.password.length >= 8 ? '✅' : '○'} Al menos 8 caracteres
                        </li>
                        <li className={/[A-Z]/.test(formData.password) ? styles.valid : ''}>
                            {/[A-Z]/.test(formData.password) ? '✅' : '○'} Una letra mayúscula
                        </li>
                        <li className={/[a-z]/.test(formData.password) ? styles.valid : ''}>
                            {/[a-z]/.test(formData.password) ? '✅' : '○'} Una letra minúscula
                        </li>
                        <li className={/[0-9]/.test(formData.password) ? styles.valid : ''}>
                            {/[0-9]/.test(formData.password) ? '✅' : '○'} Un número
                        </li>
                        <li className={/[^A-Za-z0-9]/.test(formData.password) ? styles.valid : ''}>
                            {/[^A-Za-z0-9]/.test(formData.password) ? '✅' : '○'} Un carácter especial (opcional)
                        </li>
                    </ul>
                </div>

                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Restableciendo...' : 'Restablecer Contraseña'}
                </button>
            </form>

            <div className={styles.links}>
                <Link to="/login" className={styles.link}>
                    ← Volver al inicio de sesión
                </Link>
            </div>
        </div>
    );
};

export default ResetPassword;