import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import usersApi from '../../api/usersApi';
import { USER_ROLES, USER_ROLES_LABELS } from '../../utils/constants';
import styles from './Users.module.css';

const UserForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: USER_ROLES.VIEWER,
        phone: '',
        department: '',
        position: '',
        isActive: true,
        sendInvitation: true
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    
    const isEditing = Boolean(id);

    useEffect(() => {
        if (isEditing) {
            loadUser();
        }
    }, [id]);

    const loadUser = async () => {
        try {
            const response = await withLoading(usersApi.getUserById(id));
            if (response.success) {
                const user = response.data;
                setFormData({
                    name: user.name || '',
                    username: user.username || '',
                    email: user.email || '',
                    password: '',
                    confirmPassword: '',
                    role: user.role || USER_ROLES.VIEWER,
                    phone: user.phone || '',
                    department: user.department || '',
                    position: user.position || '',
                    isActive: user.isActive !== false,
                    sendInvitation: false
                });
                if (user.avatar) {
                    setAvatarPreview(user.avatar);
                }
            }
        } catch (error) {
            showNotification('Error al cargar el usuario', 'error');
            navigate('/users');
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'El nombre de usuario es requerido';
        } else if (formData.username.length < 3) {
            newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            newErrors.username = 'Solo puede contener letras, números y guión bajo';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'El email no es válido';
        }

        if (!isEditing) {
            if (!formData.password) {
                newErrors.password = 'La contraseña es requerida';
            } else if (formData.password.length < 8) {
                newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
            }

            if (!formData.confirmPassword) {
                newErrors.confirmPassword = 'Confirma tu contraseña';
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Las contraseñas no coinciden';
            }
        }

        if (formData.phone && !/^\d{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = 'El teléfono debe tener entre 10 y 15 dígitos';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
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
            const submitData = new FormData();
            
            // Append all form fields
            Object.keys(formData).forEach(key => {
                if (key !== 'confirmPassword' && formData[key] !== undefined) {
                    submitData.append(key, formData[key]);
                }
            });

            // Append avatar if selected
            if (avatarFile) {
                submitData.append('avatar', avatarFile);
            }

            let response;
            if (isEditing) {
                response = await withLoading(usersApi.updateUser(id, submitData));
            } else {
                response = await withLoading(usersApi.createUser(submitData));
            }

            if (response.success) {
                showNotification(
                    isEditing ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente',
                    'success'
                );
                navigate('/users');
            }
        } catch (error) {
            showNotification(error.message || 'Error al guardar el usuario', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/users');
    };

    return (
        <div className={styles.userForm}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                    <div className={styles.formSection}>
                        <h3>Información Personal</h3>
                        
                        <div className={styles.avatarSection}>
                            <div className={styles.avatarPreview}>
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar preview" />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        {formData.name ? formData.name.charAt(0).toUpperCase() : '👤'}
                                    </div>
                                )}
                            </div>
                            <div className={styles.avatarUpload}>
                                <label htmlFor="avatar" className={styles.avatarLabel}>
                                    Seleccionar imagen
                                </label>
                                <input
                                    type="file"
                                    id="avatar"
                                    name="avatar"
                                    onChange={handleAvatarChange}
                                    accept="image/*"
                                    className={styles.avatarInput}
                                />
                                <small>PNG, JPG hasta 2MB</small>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="name" className={styles.label}>
                                Nombre completo <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                                placeholder="Juan Pérez"
                                maxLength={100}
                            />
                            {errors.name && (
                                <span className={styles.errorMessage}>{errors.name}</span>
                            )}
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="username" className={styles.label}>
                                    Usuario <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
                                    placeholder="juan.perez"
                                />
                                {errors.username && (
                                    <span className={styles.errorMessage}>{errors.username}</span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="email" className={styles.label}>
                                    Email <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                                    placeholder="juan@ejemplo.com"
                                />
                                {errors.email && (
                                    <span className={styles.errorMessage}>{errors.email}</span>
                                )}
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="phone" className={styles.label}>
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                                    placeholder="5512345678"
                                />
                                {errors.phone && (
                                    <span className={styles.errorMessage}>{errors.phone}</span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="role" className={styles.label}>
                                    Rol
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className={styles.select}
                                >
                                    {Object.entries(USER_ROLES_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {!isEditing && (
                        <div className={styles.formSection}>
                            <h3>Contraseña</h3>
                            
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="password" className={styles.label}>
                                        Contraseña <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                                        placeholder="••••••••"
                                    />
                                    {errors.password && (
                                        <span className={styles.errorMessage}>{errors.password}</span>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="confirmPassword" className={styles.label}>
                                        Confirmar contraseña <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                                        placeholder="••••••••"
                                    />
                                    {errors.confirmPassword && (
                                        <span className={styles.errorMessage}>{errors.confirmPassword}</span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.passwordHint}>
                                <p>La contraseña debe tener al menos 8 caracteres</p>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        name="sendInvitation"
                                        checked={formData.sendInvitation}
                                        onChange={handleChange}
                                        className={styles.checkbox}
                                    />
                                    <span>Enviar correo de invitación</span>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className={styles.formSection}>
                        <h3>Información Laboral</h3>
                        
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="department" className={styles.label}>
                                    Departamento
                                </label>
                                <input
                                    type="text"
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="TI, Ventas, etc."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="position" className={styles.label}>
                                    Puesto
                                </label>
                                <input
                                    type="text"
                                    id="position"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="Desarrollador, Gerente, etc."
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <h3>Configuración de la Cuenta</h3>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className={styles.checkbox}
                                />
                                <span>Usuario activo</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className={styles.formActions}>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className={`${styles.button} ${styles.cancelButton}`}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className={`${styles.button} ${styles.submitButton}`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserForm;