import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import usersApi from '../../api/usersApi';
import { USER_STATUS_LABELS } from '../../utils/constants';
import styles from './Users.module.css';

const UserDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();

    const [user, setUser] = useState(null);
    const [activityLogs, setActivityLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('info');
    const [activityPagination, setActivityPagination] = useState({
        page: 1,
        limit: 10,
        total: 0
    });

    useEffect(() => {
        loadUserData();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'activity') {
            loadActivityLogs();
        }
    }, [activeTab, activityPagination.page]);

    const loadUserData = async () => {
        try {
            const response = await withLoading(usersApi.getUserById(id));
            if (response.success) {
                setUser(response.data);
            }
        } catch (error) {
            showNotification('Error al cargar los datos del usuario', 'error');
            navigate('/users');
        }
    };

    const loadActivityLogs = async () => {
        try {
            const response = await withLoading(
                usersApi.getUserActivityLogs(id, {
                    page: activityPagination.page,
                    limit: activityPagination.limit
                })
            );

            if (response.success) {
                setActivityLogs(response.data);
                setActivityPagination(prev => ({
                    ...prev,
                    total: response.total
                }));
            }
        } catch (error) {
            showNotification('Error al cargar el historial de actividad', 'error');
        }
    };

    const handleEdit = () => {
        navigate(`/users/${id}/edit`);
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

        try {
            const response = await withLoading(usersApi.deleteUser(id));
            if (response.success) {
                showNotification('Usuario eliminado exitosamente', 'success');
                navigate('/users');
            }
        } catch (error) {
            showNotification(error.message || 'Error al eliminar el usuario', 'error');
        }
    };

    const handleToggleStatus = async () => {
        try {
            const newStatus = user.status === 'active' ? 'inactive' : 'active';
            const response = await withLoading(
                usersApi.toggleUserStatus(id, newStatus)
            );
            if (response.success) {
                setUser(prev => ({ ...prev, status: newStatus }));
                showNotification(
                    `Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'} exitosamente`,
                    'success'
                );
            }
        } catch (error) {
            showNotification('Error al cambiar el estado del usuario', 'error');
        }
    };

    const handleActivityPageChange = (newPage) => {
        setActivityPagination(prev => ({
            ...prev,
            page: newPage
        }));
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'active':
                return styles.statusActive;
            case 'inactive':
                return styles.statusInactive;
            case 'blocked':
                return styles.statusBlocked;
            case 'pending':
                return styles.statusPending;
            default:
                return '';
        }
    };

    if (!user) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Cargando usuario...</p>
            </div>
        );
    }

    return (
        <div className={styles.userDetail}>
            <div className={styles.header}>
                <div className={styles.userHeader}>
                    <div className={styles.userAvatar}>
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                        ) : (
                            <span className={styles.avatarPlaceholder}>
                                {getInitials(user.name)}
                            </span>
                        )}
                    </div>
                    <div className={styles.userTitle}>
                        <h1 className={styles.title}>{user.name}</h1>
                        <p className={styles.userEmail}>{user.email}</p>
                        <p className={styles.userUsername}>@{user.username}</p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button
                        onClick={handleEdit}
                        className={`${styles.actionButton} ${styles.editButton}`}
                    >
                        ✏️ Editar
                    </button>
                    <button
                        onClick={handleToggleStatus}
                        className={`${styles.actionButton} ${
                            user.status === 'active' ? styles.deactivateButton : styles.activateButton
                        }`}
                    >
                        {user.status === 'active' ? '🔴 Desactivar' : '🟢 Activar'}
                    </button>
                    <button
                        onClick={handleDelete}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        disabled={user.id === 1}
                    >
                        🗑️ Eliminar
                    </button>
                </div>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'info' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('info')}
                >
                    Información General
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'roles' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('roles')}
                >
                    Roles y Permisos
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'activity' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('activity')}
                >
                    Actividad
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'info' && (
                    <div className={styles.infoGrid}>
                        <div className={styles.infoCard}>
                            <h3>Información Personal</h3>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Nombre completo:</span>
                                <span className={styles.infoValue}>{user.name}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Email:</span>
                                <span className={styles.infoValue}>
                                    <a href={`mailto:${user.email}`}>{user.email}</a>
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Usuario:</span>
                                <span className={styles.infoValue}>@{user.username}</span>
                            </div>
                            {user.phone && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Teléfono:</span>
                                    <span className={styles.infoValue}>
                                        <a href={`tel:${user.phone}`}>{user.phone}</a>
                                    </span>
                                </div>
                            )}
                            {user.department && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Departamento:</span>
                                    <span className={styles.infoValue}>{user.department}</span>
                                </div>
                            )}
                            {user.position && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Puesto:</span>
                                    <span className={styles.infoValue}>{user.position}</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.infoCard}>
                            <h3>Estado de la Cuenta</h3>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Estado:</span>
                                <span className={`${styles.status} ${getStatusClass(user.status)}`}>
                                    {USER_STATUS_LABELS[user.status] || user.status}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Email verificado:</span>
                                <span className={styles.infoValue}>
                                    {user.emailVerified ? '✅ Sí' : '❌ No'}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>2FA activado:</span>
                                <span className={styles.infoValue}>
                                    {user.twoFactorEnabled ? '✅ Sí' : '❌ No'}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Último acceso:</span>
                                <span className={styles.infoValue}>
                                    {user.lastLogin 
                                        ? new Date(user.lastLogin).toLocaleString()
                                        : 'Nunca'
                                    }
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>IP último acceso:</span>
                                <span className={styles.infoValue}>{user.lastLoginIp || 'N/A'}</span>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <h3>Fechas</h3>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Fecha de registro:</span>
                                <span className={styles.infoValue}>
                                    {new Date(user.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Última actualización:</span>
                                <span className={styles.infoValue}>
                                    {new Date(user.updatedAt).toLocaleString()}
                                </span>
                            </div>
                            {user.emailVerifiedAt && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Email verificado:</span>
                                    <span className={styles.infoValue}>
                                        {new Date(user.emailVerifiedAt).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'roles' && (
                    <div className={styles.rolesSection}>
                        <div className={styles.rolesCard}>
                            <h3>Roles Asignados</h3>
                            <div className={styles.rolesList}>
                                {user.roles?.map(role => (
                                    <div key={role.id} className={styles.roleItem}>
                                        <span className={styles.roleName}>{role.label || role.name}</span>
                                        <span className={styles.roleDescription}>{role.description}</span>
                                    </div>
                                ))}
                                {(!user.roles || user.roles.length === 0) && (
                                    <p className={styles.noData}>No tiene roles asignados</p>
                                )}
                            </div>
                        </div>

                        <div className={styles.permissionsCard}>
                            <h3>Permisos</h3>
                            <div className={styles.permissionsGrid}>
                                {user.permissions?.map(permission => (
                                    <div key={permission.id} className={styles.permissionItem}>
                                        <span className={styles.permissionName}>{permission.name}</span>
                                        <span className={styles.permissionModule}>{permission.module}</span>
                                    </div>
                                ))}
                                {(!user.permissions || user.permissions.length === 0) && (
                                    <p className={styles.noData}>No tiene permisos específicos</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className={styles.activitySection}>
                        <h3>Historial de Actividad</h3>
                        
                        {activityLogs.length > 0 ? (
                            <>
                                <div className={styles.timeline}>
                                    {activityLogs.map(log => (
                                        <div key={log.id} className={styles.timelineItem}>
                                            <div className={styles.timelineDot}></div>
                                            <div className={styles.timelineContent}>
                                                <div className={styles.timelineHeader}>
                                                    <span className={styles.timelineAction}>{log.action}</span>
                                                    <span className={styles.timelineTime}>
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className={styles.timelineDescription}>{log.description}</p>
                                                {log.details && (
                                                    <pre className={styles.timelineDetails}>
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                )}
                                                <span className={styles.timelineIp}>IP: {log.ipAddress}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {activityPagination.total > activityPagination.limit && (
                                    <div className={styles.pagination}>
                                        <button
                                            onClick={() => handleActivityPageChange(activityPagination.page - 1)}
                                            disabled={activityPagination.page === 1}
                                            className={styles.pageButton}
                                        >
                                            Anterior
                                        </button>
                                        <span className={styles.pageInfo}>
                                            Página {activityPagination.page} de {
                                                Math.ceil(activityPagination.total / activityPagination.limit)
                                            }
                                        </span>
                                        <button
                                            onClick={() => handleActivityPageChange(activityPagination.page + 1)}
                                            disabled={
                                                activityPagination.page === 
                                                Math.ceil(activityPagination.total / activityPagination.limit)
                                            }
                                            className={styles.pageButton}
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className={styles.emptyState}>
                                <p>No hay actividad registrada</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDetail;