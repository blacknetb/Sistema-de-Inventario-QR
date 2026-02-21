import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import authApi from '../../api/authApi';
import styles from './ForgotPassword.module.css';

const ForgotPassword = () => {
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();
    
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const validateForm = () => {
        const newErrors = {};

        if (!email) {
            newErrors.email = 'El correo electrónico es requerido';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'El correo electrónico no es válido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const startCountdown = () => {
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showNotification('Por favor, corrige los errores en el formulario', 'warning');
            return;
        }

        try {
            const response = await withLoading(authApi.forgotPassword(email));
            
            if (response.success) {
                setIsSubmitted(true);
                startCountdown();
                showNotification(
                    'Se ha enviado un correo con instrucciones para restablecer tu contraseña',
                    'success'
                );
            }
        } catch (error) {
            showNotification(error.message || 'Error al procesar la solicitud', 'error');
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;

        try {
            const response = await withLoading(authApi.forgotPassword(email));
            
            if (response.success) {
                startCountdown();
                showNotification('Correo reenviado exitosamente', 'success');
            }
        } catch (error) {
            showNotification(error.message || 'Error al reenviar el correo', 'error');
        }
    };

    return (
        <div className={styles.forgotPassword}>
            <h2 className={styles.title}>Recuperar Contraseña</h2>
            
            {!isSubmitted ? (
                <>
                    <p className={styles.description}>
                        Ingresa tu correo electrónico y te enviaremos instrucciones
                        para restablecer tu contraseña.
                    </p>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.label}>
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) {
                                        setErrors({ ...errors, email: null });
                                    }
                                }}
                                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                                placeholder="ejemplo@correo.com"
                                disabled={isSubmitted}
                            />
                            {errors.email && (
                                <span className={styles.errorMessage}>{errors.email}</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isSubmitted}
                        >
                            Enviar Instrucciones
                        </button>
                    </form>
                </>
            ) : (
                <div className={styles.successContainer}>
                    <div className={styles.successIcon}>✉️</div>
                    <h3 className={styles.successTitle}>¡Correo Enviado!</h3>
                    <p className={styles.successMessage}>
                        Hemos enviado instrucciones para restablecer tu contraseña a:
                    </p>
                    <p className={styles.successEmail}>{email}</p>
                    <p className={styles.successNote}>
                        Revisa tu bandeja de entrada y sigue las instrucciones del correo.
                        Si no lo recibes en unos minutos, revisa tu carpeta de spam.
                    </p>

                    <button
                        onClick={handleResend}
                        disabled={countdown > 0}
                        className={styles.resendButton}
                    >
                        {countdown > 0 
                            ? `Reenviar en ${countdown}s` 
                            : 'Reenviar correo'
                        }
                    </button>
                </div>
            )}

            <div className={styles.links}>
                <Link to="/login" className={styles.link}>
                    ← Volver al inicio de sesión
                </Link>
            </div>
        </div>
    );
};

export default ForgotPassword;