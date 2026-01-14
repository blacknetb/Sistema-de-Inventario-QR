import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useInventory } from '../context/InventoryContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import logger from '../utils/logger';
import api from '../utils/api';
import PropTypes from 'prop-types';

const Admin = () => {
    const { user, logout } = useAuth();
    const { showNotification } = useNotification();
    const { refreshInventory } = useInventory();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        users: 0,
        products: 0,
        categories: 0,
        suppliers: 0,
        transactions: 0,
        lowStock: 0,
        outOfStock: 0
    });
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        if (user?.role !== 'admin') {
            showNotification(
                'Acceso denegado. Se requieren permisos de administrador.',
                'error'
            );
            navigate('/dashboard');
        }
    }, [user, navigate, showNotification]);

    const loadAdminData = useCallback(async () => {
        if (user?.role !== 'admin') return;

        try {
            setLoading(true);

            const statsResponse = await api.get('/admin/stats');
            if (statsResponse.success) {
                setStats(statsResponse.data);
            }

            const usersResponse = await api.get('/admin/users');
            if (usersResponse.success) {
                setUsers(usersResponse.data);
            }

            const logsResponse = await api.get('/admin/audit-logs');
            if (logsResponse.success) {
                setLogs(logsResponse.data);
            }

        } catch (error) {
            logger.error('Error cargando datos de administración:', error);
            showNotification('Error cargando datos de administración', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, showNotification]);

    useEffect(() => {
        loadAdminData();
    }, [loadAdminData]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return users;

        const term = searchTerm.toLowerCase();
        return users.filter(user =>
            user.name?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            user.role?.toLowerCase().includes(term)
        );
    }, [users, searchTerm]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredUsers, currentPage, itemsPerPage]);

    const handleCreateUser = useCallback(async (userData) => {
        try {
            const response = await api.post('/admin/users', userData);

            if (response.success) {
                showNotification('Usuario creado exitosamente', 'success');
                setShowUserModal(false);
                loadAdminData();
            } else {
                showNotification(response.message || 'Error creando usuario', 'error');
            }
        } catch (error) {
            logger.error('Error creando usuario:', error);
            showNotification('Error creando usuario', 'error');
        }
    }, [showNotification, loadAdminData]);

    const handleUpdateUser = useCallback(async (userId, userData) => {
        try {
            const response = await api.put(`/admin/users/${userId}`, userData);

            if (response.success) {
                showNotification('Usuario actualizado exitosamente', 'success');
                setSelectedUser(null);
                loadAdminData();
            } else {
                showNotification(response.message || 'Error actualizando usuario', 'error');
            }
        } catch (error) {
            logger.error('Error actualizando usuario:', error);
            showNotification('Error actualizando usuario', 'error');
        }
    }, [showNotification, loadAdminData]);

    const handleDeleteUser = useCallback(async (userId) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await api.delete(`/admin/users/${userId}`);

            if (response.success) {
                showNotification('Usuario eliminado exitosamente', 'success');
                loadAdminData();
            } else {
                showNotification(response.message || 'Error eliminando usuario', 'error');
            }
        } catch (error) {
            logger.error('Error eliminando usuario:', error);
            showNotification('Error eliminando usuario', 'error');
        }
    }, [showNotification, loadAdminData]);

    const handleClearCache = useCallback(async () => {
        if (!window.confirm('¿Estás seguro de limpiar la caché? Esto puede afectar el rendimiento temporalmente.')) {
            return;
        }

        try {
            const response = await api.post('/admin/clear-cache');

            if (response.success) {
                showNotification('Caché limpiada exitosamente', 'success');
                refreshInventory();
            } else {
                showNotification(response.message || 'Error limpiando caché', 'error');
            }
        } catch (error) {
            logger.error('Error limpiando caché:', error);
            showNotification('Error limpiando caché', 'error');
        }
    }, [showNotification, refreshInventory]);

    const handleBackupData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/backup', { responseType: 'blob' });

            if (response) {
                const url = window.URL.createObjectURL(new Blob([response]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `backup-${new Date().toISOString().split('T')[0]}.zip`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);

                showNotification('Backup creado exitosamente', 'success');
            }
        } catch (error) {
            logger.error('Error creando backup:', error);
            showNotification('Error creando backup', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const userColumns = useMemo(() => [
        { key: 'name', label: 'Nombre', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'role', label: 'Rol', sortable: true },
        { key: 'status', label: 'Estado', sortable: true },
        { key: 'lastLogin', label: 'Último Acceso', sortable: true },
        { key: 'createdAt', label: 'Fecha Creación', sortable: true }
    ], []);

    const statCards = useMemo(() => [
        { title: 'Total Usuarios', value: stats.users, icon: '👥', color: 'primary' },
        { title: 'Total Productos', value: stats.products, icon: '📦', color: 'success' },
        { title: 'Categorías', value: stats.categories, icon: '🏷️', color: 'info' },
        { title: 'Proveedores', value: stats.suppliers, icon: '🏢', color: 'warning' },
        { title: 'Transacciones', value: stats.transactions, icon: '💰', color: 'secondary' },
        { title: 'Stock Bajo', value: stats.lowStock, icon: '📉', color: 'danger' },
        { title: 'Sin Stock', value: stats.outOfStock, icon: '❌', color: 'dark' }
    ], [stats]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'users':
                return (
                    <div className="admin-users-section">
                        <div className="admin-section-header">
                            <h3>Gestión de Usuarios</h3>
                            <Button
                                variant="primary"
                                onClick={() => setShowUserModal(true)}
                                icon="➕"
                            >
                                Nuevo Usuario
                            </Button>
                        </div>

                        <div className="admin-search-bar">
                            <input
                                type="text"
                                placeholder="Buscar usuarios..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <span className="search-results">
                                {filteredUsers.length} usuarios encontrados
                            </span>
                        </div>

                        <DataTable
                            columns={userColumns}
                            data={paginatedUsers}
                            onRowClick={(user) => setSelectedUser(user)}
                            actions={[
                                {
                                    label: 'Editar',
                                    onClick: (user) => setSelectedUser(user),
                                    icon: '✏️'
                                },
                                {
                                    label: 'Eliminar',
                                    onClick: (user) => handleDeleteUser(user._id),
                                    icon: '🗑️',
                                    variant: 'danger'
                                }
                            ]}
                            pagination={{
                                currentPage,
                                totalItems: filteredUsers.length,
                                itemsPerPage,
                                onPageChange: setCurrentPage
                            }}
                        />
                    </div>
                );

            case 'logs':
                return (
                    <div className="admin-logs-section">
                        <div className="admin-section-header">
                            <h3>Registros de Auditoría</h3>
                            <Button
                                variant="secondary"
                                onClick={() => setShowLogsModal(true)}
                                icon="📋"
                            >
                                Ver Detalles
                            </Button>
                        </div>

                        <div className="logs-list">
                            {logs.slice(0, 10).map((log) => (
                                <div key={log.id} className="log-item">
                                    <div className="log-header">
                                        <span className="log-action">{log.action}</span>
                                        <span className="log-timestamp">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="log-details">
                                        <span className="log-user">{log.userName}</span>
                                        <span className="log-ip">{log.ipAddress}</span>
                                    </div>
                                    <div className="log-message">{log.message}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'tools':
                return (
                    <div className="admin-tools-section">
                        <h3>Herramientas de Administración</h3>
                        <div className="tools-grid">
                            <Card
                                title="Limpieza de Caché"
                                description="Elimina datos en caché para liberar memoria"
                                icon="🧹"
                                actions={
                                    <Button
                                        variant="warning"
                                        onClick={handleClearCache}
                                        fullWidth
                                    >
                                        Limpiar Caché
                                    </Button>
                                }
                            />

                            <Card
                                title="Backup de Datos"
                                description="Crea una copia de seguridad de todos los datos"
                                icon="💾"
                                actions={
                                    <Button
                                        variant="info"
                                        onClick={handleBackupData}
                                        fullWidth
                                        disabled={loading}
                                    >
                                        {loading ? 'Creando Backup...' : 'Crear Backup'}
                                    </Button>
                                }
                            />

                            <Card
                                title="Regenerar QR"
                                description="Regenera códigos QR para todos los productos"
                                icon="🔄"
                                actions={
                                    <Button
                                        variant="secondary"
                                        onClick={() => showNotification('Función en desarrollo', 'info')}
                                        fullWidth
                                    >
                                        Regenerar QR
                                    </Button>
                                }
                            />

                            <Card
                                title="Optimizar Base de Datos"
                                description="Optimiza el rendimiento de la base de datos"
                                icon="⚡"
                                actions={
                                    <Button
                                        variant="success"
                                        onClick={() => showNotification('Función en desarrollo', 'info')}
                                        fullWidth
                                    >
                                        Optimizar BD
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="admin-dashboard">
                        <h3>Dashboard de Administración</h3>
                        <div className="stats-grid">
                            {statCards.map((stat) => (
                                <Card
                                    key={`${stat.title}-${stat.color}`}
                                    className={`stat-card stat-card-${stat.color}`}
                                >
                                    <div className="stat-content">
                                        <div className="stat-icon">{stat.icon}</div>
                                        <div className="stat-info">
                                            <h4>{stat.title}</h4>
                                            <p className="stat-value">{stat.value.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <div className="admin-quick-actions">
                            <h4>Acciones Rápidas</h4>
                            <div className="quick-actions-grid">
                                <Button
                                    variant="primary"
                                    onClick={() => setActiveTab('users')}
                                    icon="👥"
                                >
                                    Gestionar Usuarios
                                </Button>
                                <Button
                                    variant="info"
                                    onClick={() => setActiveTab('logs')}
                                    icon="📋"
                                >
                                    Ver Registros
                                </Button>
                                <Button
                                    variant="warning"
                                    onClick={handleClearCache}
                                    icon="🧹"
                                >
                                    Limpiar Caché
                                </Button>
                                <Button
                                    variant="success"
                                    onClick={handleBackupData}
                                    icon="💾"
                                    disabled={loading}
                                >
                                    Backup
                                </Button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    if (loading && activeTab === 'dashboard') {
        return (
            <div className="admin-container">
                <div className="admin-loading">
                    <LoadingSpinner />
                    <p>Cargando datos de administración...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Panel de Administración</h1>
                <div className="admin-user-info">
                    <span className="admin-welcome">
                        Bienvenido, <strong>{user?.name}</strong>
                    </span>
                    <Button
                        variant="outline-danger"
                        onClick={logout}
                        size="sm"
                    >
                        Cerrar Sesión
                    </Button>
                </div>
            </div>

            <div className="admin-tabs">
                {['dashboard', 'users', 'logs', 'tools'].map((tab) => (
                    <button
                        key={tab}
                        className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'dashboard' && '📊 Dashboard'}
                        {tab === 'users' && '👥 Usuarios'}
                        {tab === 'logs' && '📋 Registros'}
                        {tab === 'tools' && '🛠️ Herramientas'}
                    </button>
                ))}
            </div>

            <div className="admin-content">
                {renderTabContent()}
            </div>

            {showUserModal && (
                <UserModal
                    user={selectedUser}
                    onClose={() => {
                        setShowUserModal(false);
                        setSelectedUser(null);
                    }}
                    onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
                />
            )}

            {showLogsModal && (
                <LogsModal
                    logs={logs}
                    onClose={() => setShowLogsModal(false)}
                />
            )}
        </div>
    );
};

const UserModal = ({ user, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || 'user',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
        if (!formData.email.trim()) newErrors.email = 'El email es requerido';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';

        if (!user && !formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const userData = {
                name: formData.name,
                email: formData.email,
                role: formData.role
            };

            if (formData.password) {
                userData.password = formData.password;
            }

            const userId = user?._id;
            if (userId) {
                await onSubmit(userId, userData);
            } else {
                await onSubmit(userData);
            }
        } catch (error) {
            console.error('Error submitting user form:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    return (
        <Modal
            title={user ? 'Editar Usuario' : 'Nuevo Usuario'}
            onClose={onClose}
            size="md"
        >
            <form onSubmit={handleSubmit} className="user-form">
                <div className="form-group">
                    <label htmlFor="name">Nombre *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={errors.name ? 'error' : ''}
                        disabled={submitting}
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? 'error' : ''}
                        disabled={submitting}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="role">Rol</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        disabled={submitting}
                    >
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                        <option value="manager">Gerente</option>
                    </select>
                </div>

                {!user && (
                    <>
                        <div className="form-group">
                            <label htmlFor="password">Contraseña *</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={errors.password ? 'error' : ''}
                                disabled={submitting}
                            />
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={errors.confirmPassword ? 'error' : ''}
                                disabled={submitting}
                            />
                            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                        </div>
                    </>
                )}

                <div className="modal-actions">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={submitting}
                    >
                        {submitting ? 'Guardando...' : user ? 'Actualizar' : 'Crear'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

UserModal.propTypes = {
    user: PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
        email: PropTypes.string,
        role: PropTypes.string
    }),
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};

UserModal.defaultProps = {
    user: null
};

const LogsModal = ({ logs, onClose }) => {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filteredLogs = logs.filter(log => {
        if (filter !== 'all' && log.action !== filter) return false;
        if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <Modal
            title="Registros de Auditoría Detallados"
            onClose={onClose}
            size="lg"
        >
            <div className="logs-modal">
                <div className="logs-filters">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Todas las acciones</option>
                        <option value="login">Login</option>
                        <option value="logout">Logout</option>
                        <option value="create">Crear</option>
                        <option value="update">Actualizar</option>
                        <option value="delete">Eliminar</option>
                        <option value="export">Exportar</option>
                        <option value="import">Importar</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Buscar en mensajes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="logs-table-container">
                    <table className="logs-table">
                        <thead>
                            <tr>
                                <th>Fecha/Hora</th>
                                <th>Usuario</th>
                                <th>Acción</th>
                                <th>IP</th>
                                <th>Mensaje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log, index) => (
                                <tr key={index}>
                                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td>{log.userName}</td>
                                    <td>
                                        <span className={`log-action-badge action-${log.action}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td>{log.ipAddress}</td>
                                    <td className="log-message-cell">{log.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="logs-summary">
                    <p>Mostrando {filteredLogs.length} de {logs.length} registros</p>
                </div>
            </div>
        </Modal>
    );
};

LogsModal.propTypes = {
    logs: PropTypes.array.isRequired,
    onClose: PropTypes.func.isRequired
};

export default Admin;