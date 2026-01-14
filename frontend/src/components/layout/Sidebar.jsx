import React, { useState, useMemo, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import PropTypes from 'prop-types';
import '../../assets/styles/layout.css';

// ✅ Componentes de íconos SVG inline
const DashboardIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ProductsIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const InventoryIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const CategoriesIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const QRIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
);

const ReportsIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a6 6 0 01-9 5.197" />
  </svg>
);

const SettingsIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChartBarIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ChevronLeftIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const LogoutIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// Configuración de navegación centralizada
const useNavigationItems = (userRole) => {
  return useMemo(() => {
    const baseItems = [
      {
        name: 'Dashboard',
        href: '/',
        icon: <DashboardIcon className="w-5 h-5" />,
        permission: true,
        badge: null,
        description: 'Vista general del sistema'
      },
      {
        name: 'Productos',
        href: '/products',
        icon: <ProductsIcon className="w-5 h-5" />,
        permission: true,
        badge: null,
        description: 'Gestión de productos'
      },
      {
        name: 'Inventario',
        href: '/inventory',
        icon: <InventoryIcon className="w-5 h-5" />,
        permission: true,
        badge: 'new',
        description: 'Control de stock'
      },
      {
        name: 'Categorías',
        href: '/categories',
        icon: <CategoriesIcon className="w-5 h-5" />,
        permission: true,
        badge: null,
        description: 'Organización por categorías'
      },
      {
        name: 'Códigos QR',
        href: '/qr',
        icon: <QRIcon className="w-5 h-5" />,
        permission: true,
        badge: null,
        description: 'Generar y escanear QR'
      },
      {
        name: 'Reportes',
        href: '/reports',
        icon: <ReportsIcon className="w-5 h-5" />,
        permission: true,
        badge: 'updated',
        description: 'Análisis y estadísticas'
      },
      {
        name: 'Estadísticas',
        href: '/analytics',
        icon: <ChartBarIcon className="w-5 h-5" />,
        permission: userRole === 'admin',
        badge: null,
        description: 'Métricas avanzadas',
        adminOnly: true
      }
    ];

    const adminItems = userRole === 'admin' ? [
      {
        name: 'Usuarios',
        href: '/users',
        icon: <UsersIcon className="w-5 h-5" />,
        permission: true,
        badge: null,
        description: 'Gestión de usuarios',
        adminOnly: true
      },
      {
        name: 'Configuración',
        href: '/settings',
        icon: <SettingsIcon className="w-5 h-5" />,
        permission: true,
        badge: null,
        description: 'Configuración del sistema',
        adminOnly: true
      }
    ] : [];

    return [...baseItems, ...adminItems].filter(item => item.permission);
  }, [userRole]);
};

const Sidebar = ({ onClose, collapsed: externalCollapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Determinar si se usa colapsado interno o externo
  const collapsed =
    externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setCollapsed =
    externalCollapsed !== undefined ? onToggle : setInternalCollapsed;

  const navigationItems = useNavigationItems(user?.role);

  /**
   * ✅ MEJORA: Verificación de ruta activa mejorada
   */
  const isActive = useCallback((href) => {
    if (href === '/') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  }, [location.pathname]);

  /**
   * ✅ MEJORA: Manejo de logout con confirmación
   */
  const handleLogout = useCallback(() => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
    }
  }, [logout]);

  /**
   * ✅ MEJORA: Clases para estados activos
   */
  const getItemClasses = useCallback((href, isAdminOnly = false) => {
    return clsx(
      'group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative',
      'hover:bg-gray-700 hover:text-white',
      isActive(href)
        ? 'bg-primary-600 text-white shadow-lg'
        : 'text-gray-300',
      isAdminOnly && 'border-l-2 border-purple-500'
    );
  }, [isActive]);

  return (
    <div className={clsx(
      'bg-gray-900 text-white transition-all duration-300 flex flex-col h-full',
      'border-r border-gray-800',
      collapsed ? 'w-20' : 'w-64'
    )}>
      {/* Logo y toggle */}
      <div className={clsx(
        'flex items-center justify-between h-16 px-4 border-b border-gray-800',
        collapsed ? 'px-3' : 'px-4'
      )}>
        {!collapsed ? (
          <div className="flex items-center min-w-0">
            <div className="h-10 w-10 bg-linea-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shrink-0 shadow-md">
              <span className="text-white font-bold text-xl">IQ</span>
            </div>
            <div className="ml-3 min-w-0">
              <h1 className="text-lg font-bold text-white truncate">
                Inventario QR
              </h1>
              <p className="text-xs text-gray-400 truncate">
                Sistema profesional
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto">
            <div className="h-10 w-10 bg-linear-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">IQ</span>
            </div>
          </div>
        )}
        
        {onToggle && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={clsx(
              'p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-gray-700 transition-all',
              collapsed ? 'mx-auto' : ''
            )}
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? (
              <ChevronRightIcon className="w-5 h-5" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive: active }) => getItemClasses(item.href, item.adminOnly)}
            onMouseEnter={() => setHoveredItem(item.name)}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={onClose}
            title={collapsed ? item.description : undefined}
          >
            <span className={clsx(
              'shrink-0 relative',
              collapsed ? 'mx-auto' : 'mr-3'
            )}>
              {item.icon}
              {item.badge && (
                <span className={clsx(
                  'absolute -top-1 -right-1 h-2 w-2 rounded-full',
                  item.badge === 'new' ? 'bg-green-500' : 'bg-yellow-500'
                )} />
              )}
            </span>
            
            {!collapsed && (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="truncate">{item.name}</span>
                {item.adminOnly && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-600 rounded">Admin</span>
                )}
                {item.badge && (
                  <span className={clsx(
                    'ml-2 px-1.5 py-0.5 text-xs rounded',
                    item.badge === 'new' ? 'bg-green-600' : 'bg-yellow-600'
                  )}>
                    {item.badge === 'new' ? 'Nuevo' : 'Actualizado'}
                  </span>
                )}
              </div>
            )}
            
            {/* Tooltip para modo colapsado */}
            {collapsed && hoveredItem === item.name && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-xl z-50 whitespace-nowrap animate-fade-in">
                <div className="font-medium mb-1">{item.name}</div>
                <div className="text-xs text-gray-300">{item.description}</div>
                {item.adminOnly && (
                  <div className="mt-1 text-xs text-purple-400">Solo administrador</div>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Información del usuario y logout */}
      <div className={clsx(
        'border-t border-gray-800 p-4 space-y-4',
        collapsed ? 'px-3' : 'px-4'
      )}>
        {!collapsed ? (
          <>
            {/* Información del usuario */}
            <div className="flex items-center p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
              <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
                <span className="text-white font-medium">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                <p className="text-xs mt-1">
                  <span className={clsx(
                    'px-2 py-0.5 rounded-full',
                    user?.role === 'admin'
                      ? 'bg-purple-600 text-white'
                      : 'bg-blue-600 text-white'
                  )}>
                    {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </span>
                </p>
              </div>
            </div>

            {/* Botón logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-3 text-sm font-medium text-red-400 hover:text-white hover:bg-red-900 rounded-lg transition-all duration-200 group"
            >
              <LogoutIcon className="w-5 h-5 mr-3" />
              <span className="truncate">Cerrar sesión</span>
            </button>

            {/* Información de la app */}
            <div className="pt-4 border-t border-gray-700">
              <div className="text-xs text-gray-400 space-y-1">
                <p className="truncate">v{process.env.REACT_APP_VERSION || '1.0.0'}</p>
                <p className="truncate">© {new Date().getFullYear()} Inventario QR</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="px-2 py-1 bg-gray-700 rounded text-xs">Producción</span>
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            {/* Avatar usuario */}
            <div 
              className="h-10 w-10 rounded-full bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center cursor-pointer"
              title={`${user?.name}\n${user?.email}`}
            >
              <span className="text-white font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>

            {/* Botón logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-red-400 hover:text-white hover:bg-red-900 rounded-lg transition-all"
              title="Cerrar sesión"
            >
              <LogoutIcon className="w-5 h-5" />
            </button>

            {/* Versión */}
            <div className="text-xs text-gray-400 text-center">
              <p>v{process.env.REACT_APP_VERSION?.charAt(0) || '1'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Validación de props
Sidebar.propTypes = {
  onClose: PropTypes.func,
  collapsed: PropTypes.bool,
  onToggle: PropTypes.func,
};

export default Sidebar;