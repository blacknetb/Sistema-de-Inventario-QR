import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import usersApi from '../../api/usersApi';
import { USER_ROLES, USER_ROLES_LABELS, USER_STATUS, USER_STATUS_LABELS } from '../../utils/constants';
import styles from './Users.module.css';

const UsersPage = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();
    
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    useEffect(() => {
        loadUsers();
        loadRoles();
    }, [pagination.page, roleFilter, statusFilter]);

    useEffect(() => {
        filterUsers();
    }, [searchTerm, users]);

    const loadUsers = async () => {
        try {
            const response = await withLoading(
                usersApi.getUsers({
                    page: pagination.page,
                    limit: pagination.limit,
                    role: roleFilter,
                    status: statusFilter
                })
            );
            
            if (response.success) {
                setUsers(response.data);
                setPagination({
                    ...pagination,
                    total: response.total,
                    totalPages: response.totalPages
                });
            }
        } catch (error) {
            showNotification(error.message || 'Error al cargar usuarios', 'error');
        }
    };

    const loadRoles = async () => {
        try {
            // This would come from an API endpoint
            setAvailableRoles([
                { id: 1, name: USER_ROLES.ADMIN, label: USER_ROLES_LABELS[USER_ROLES.ADMIN] },
                { id: 2, name: USER_ROLES.MANAGER, label: USER_ROLES_LABELS[USER_ROLES.MANAGER] },
                { id: 3, name: USER_ROLES.SUPERVISOR, label: USER_ROLES_LABELS[USER_ROLES.SUPERVISOR] },
                { id: 4, name: USER_ROLES.OPERATOR, label: USER_ROLES_LABELS[USER_ROLES.OPERATOR] },
                { id: 5, name: USER_ROLES.VIEWER, label: USER_ROLES_LABELS[USER_ROLES.VIEWER] }
            ]);
        } catch (error) {
            console.error('Error loading roles:', error);
        }
    };

    const filterUsers = () => {
        if (!searchTerm.trim()) {
            setFilteredUsers(users);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = users.filter(user => 
            user.name.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            user.username?.toLowerCase().includes(term)
        );
        
        setFilteredUsers(filtered);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleRoleFilterChange = (e) => {
        setRoleFilter(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const clearFilters = () => {
        setRoleFilter('');
        setStatusFilter('');
        setSearchTerm('');
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleCreate = () => {
        navigate('/users/create');
    };

    const handleEdit = (id) => {
        navigate(`/users/${id}/edit`);
    };

    const handleView = (id) => {
        navigate(`/users/${id}`);
    };

    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedUser) return;

        try {
            const response = await withLoading(
                usersApi.deleteUser(selectedUser.id)
            );
            
            if (response.success) {
                showNotification('Usuario eliminado exitosamente', 'success');
                loadUsers();
                setShowDeleteModal(false);
                setSelectedUser(null);
            }
        } catch (error) {
            showNotification(error.message || 'Error al eliminar usuario', 'error');
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setSelectedUser(null);
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const response = await withLoading(
                usersApi.toggleUserStatus(id, currentStatus === USER_STATUS.ACTIVE ? USER_STATUS.INACTIVE : USER_STATUS.ACTIVE)
            );
            
            if (response.success) {
                showNotification(
                    `Usuario ${currentStatus === USER_STATUS.ACTIVE ? 'desactivado' : 'activado'} exitosamente`,
                    'success'
                );
                loadUsers();
            }
        } catch (error) {
            showNotification('Error al cambiar estado del usuario', 'error');
        }
    };

    const handleManageRoles = (user) => {
        setSelectedUser(user);
        setSelectedRoles(user.roles?.map(r => r.id) || []);
        setShowRoleModal(true);
    };

    const handleRoleToggle = (roleId) => {
        setSelectedRoles(prev => {
            if (prev.includes(roleId)) {
                return prev.filter(id => id !== roleId);
            } else {
                return [...prev, roleId];
            }
        });
    };

    const handleSaveRoles = async () => {
        if (!selectedUser) return;

        try {
            const response = await withLoading(
                usersApi.assignRoles(selectedUser.id, selectedRoles)
            );
            
            if (response.success) {
                showNotification('Roles asignados exitosamente', 'success');
                loadUsers();
                setShowRoleModal(false);
                setSelectedUser(null);
                setSelectedRoles([]);
            }
        } catch (error) {
            showNotification('Error al asignar roles', 'error');
        }
    };

    const handleExport = async () => {
        try {
            const blob = await withLoading(usersApi.exportUsers('csv', {
                role: roleFilter,
                status: statusFilter
            }));
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showNotification('Usuarios exportados exitosamente', 'success');
        } catch (error) {
            showNotification('Error al exportar usuarios', 'error');
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({
            ...prev,
            page: newPage
        }));
    };

    const getStatusClass = (status) => {
        switch (status) {
            case USER_STATUS.ACTIVE:
                return styles.statusActive;
            case USER_STATUS.INACTIVE:
                return styles.statusInactive;
            case USER_STATUS.BLOCKED:
                return styles.statusBlocked;
            case USER_STATUS.PENDING:
                return styles.statusPending;
            default:
                return '';
        }
    };

    const getStatusText = (status) => {
        return USER_STATUS_LABELS[status] || status;
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className={styles.usersPage}>
            <div className={styles.header}>
                <h1 className={styles.title}>Usuarios</h1>
                <div className={styles.headerActions}>
                    <button 
                        className={styles.exportButton}
                        onClick={handleExport}
                    >
                        📥 Exportar
                    </button>
                    <button 
                        className={styles.createButton}
                        onClick={handleCreate}
                    >
                        <span className={styles.buttonIcon}>+</span>
                        Nuevo Usuario
                    </button>
                </div>
            </div>

            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="Buscar usuarios por nombre, email..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className={styles.searchInput}
                    />
                    <span className={styles.searchIcon}>🔍</span>
                </div>

                <div className={styles.filterGroup}>
                    <select
                        value={roleFilter}
                        onChange={handleRoleFilterChange}
                        className={styles.filterSelect}
                    >
                        <option value="">Todos los roles</option>
                        {Object.entries(USER_ROLES_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        className={styles.filterSelect}
                    >
                        <option value="">Todos los estados</option>
                        {Object.entries(USER_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>

                    {(roleFilter || statusFilter || searchTerm) && (
                        <button
                            onClick={clearFilters}
                            className={styles.clearFilters}
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Último acceso</th>
                            <th>Fecha registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <tr key={user.id} className={styles.tableRow}>
                                    <td>
                                        <div className={styles.userCell}>
                                            <div className={styles.userAvatar}>
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt={user.name} />
                                                ) : (
                                                    <span className={styles.avatarPlaceholder}>
                                                        {getInitials(user.name)}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <div className={styles.userName}>{user.name}</div>
                                                <div className={styles.userUsername}>@{user.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <a href={`mailto:${user.email}`} className={styles.emailLink}>
                                            {user.email}
                                        </a>
                                    </td>
                                    <td>
                                        <div className={styles.rolesList}>
                                            {user.roles?.map(role => (
                                                <span key={role.id} className={styles.roleBadge}>
                                                    {role.label || role.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.status} ${getStatusClass(user.status)}`}>
                                            {getStatusText(user.status)}
                                        </span>
                                    </td>
                                    <td>
                                        {user.lastLogin ? (
                                            <span title={new Date(user.lastLogin).toLocaleString()}>
                                                {new Date(user.lastLogin).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            <span className={styles.neverLogged}>Nunca</span>
                                        )}
                                    </td>
                                    <td>
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={`${styles.actionButton} ${styles.viewButton}`}
                                                onClick={() => handleView(user.id)}
                                                title="Ver detalles"
                                            >
                                                👁️
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.editButton}`}
                                                onClick={() => handleEdit(user.id)}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.rolesButton}`}
                                                onClick={() => handleManageRoles(user)}
                                                title="Gestionar roles"
                                            >
                                                👥
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${
                                                    user.status === USER_STATUS.ACTIVE ? styles.deactivateButton : styles.activateButton
                                                }`}
                                                onClick={() => handleToggleStatus(user.id, user.status)}
                                                title={user.status === USER_STATUS.ACTIVE ? 'Desactivar' : 'Activar'}
                                            >
                                                {user.status === USER_STATUS.ACTIVE ? '🔴' : '🟢'}
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                                onClick={() => handleDeleteClick(user)}
                                                title="Eliminar"
                                                disabled={user.id === 1} // Prevent deleting super admin
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className={styles.emptyState}>
                                    {searchTerm || roleFilter || statusFilter 
                                        ? 'No se encontraron usuarios con los filtros aplicados'
                                        : 'No hay usuarios disponibles'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        className={styles.pageButton}
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                    >
                        Anterior
                    </button>
                    
                    {[...Array(pagination.totalPages)].map((_, index) => (
                        <button
                            key={index + 1}
                            className={`${styles.pageButton} ${pagination.page === index + 1 ? styles.activePage : ''}`}
                            onClick={() => handlePageChange(index + 1)}
                        >
                            {index + 1}
                        </button>
                    ))}
                    
                    <button
                        className={styles.pageButton}
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                    >
                        Siguiente
                    </button>
                </div>
            )}

            {showDeleteModal && selectedUser && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3 className={styles.modalTitle}>Confirmar Eliminación</h3>
                        <p className={styles.modalMessage}>
                            ¿Estás seguro de que deseas eliminar al usuario "{selectedUser.name}"?
                            {selectedUser.id === 1 && (
                                <span className={styles.warning}>
                                    <br />
                                    ⚠️ No puedes eliminar al administrador principal.
                                </span>
                            )}
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                className={`${styles.modalButton} ${styles.cancelButton}`}
                                onClick={handleDeleteCancel}
                            >
                                Cancelar
                            </button>
                            <button
                                className={`${styles.modalButton} ${styles.confirmButton}`}
                                onClick={handleDeleteConfirm}
                                disabled={selectedUser.id === 1}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRoleModal && selectedUser && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3 className={styles.modalTitle}>
                            Gestionar Roles - {selectedUser.name}
                        </h3>
                        
                        <div className={styles.rolesList}>
                            {availableRoles.map(role => (
                                <label key={role.id} className={styles.roleCheckbox}>
                                    <input
                                        type="checkbox"
                                        checked={selectedRoles.includes(role.id)}
                                        onChange={() => handleRoleToggle(role.id)}
                                    />
                                    <span>{role.label}</span>
                                </label>
                            ))}
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={`${styles.modalButton} ${styles.cancelButton}`}
                                onClick={() => {
                                    setShowRoleModal(false);
                                    setSelectedUser(null);
                                    setSelectedRoles([]);
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                className={`${styles.modalButton} ${styles.confirmButton}`}
                                onClick={handleSaveRoles}
                            >
                                Guardar Roles
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;