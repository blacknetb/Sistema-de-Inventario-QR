import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import '../../assets/styles/layout.css';

// ✅ Hook personalizado para detectar clicks fuera de un elemento
const useClickOutside = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, callback]);
};

// ✅ Función debounce optimizada (definida localmente)
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ✅ Componentes SVG inline
const BellIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const SunIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const UserIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CogIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const Header = ({ isScrolled, onToggleSidebar, onToggleTheme, currentTheme }) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme(); // ✅ FIX: Hook useTheme corregido
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);

  // ✅ Usar hook personalizado para click outside
  useClickOutside(profileRef, () => setIsProfileOpen(false));
  useClickOutside(notificationsRef, () => setIsNotificationsOpen(false));
  useClickOutside(searchRef, () => setIsSearchOpen(false));

  /**
   * ✅ MEJORA: Título de página memoizado
   */
  const pageTitle = useMemo(() => {
    const titles = {
      '/': 'Dashboard',
      '/products': 'Productos',
      '/inventory': 'Inventario',
      '/categories': 'Categorías',
      '/qr': 'Códigos QR',
      '/reports': 'Reportes',
      '/profile': 'Mi Perfil',
      '/settings': 'Configuración',
      '/users': 'Usuarios'
    };

    return Object.entries(titles).find(([path]) =>
      location.pathname.startsWith(path)
    )?.[1] || 'Dashboard';
  }, [location.pathname]);

  /**
   * ✅ MEJORA: Logout con confirmación
   */
  const handleLogout = useCallback(() => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
      navigate('/login');
    }
  }, [logout, navigate]);

  /**
   * ✅ MEJORA: Búsqueda global optimizada con debounce
   */
  const debouncedSearch = useMemo(() =>
    debounce((query) => {
      if (query.trim()) {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    }, 300),
    [navigate]
  );

  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    debouncedSearch(searchQuery);
  };

  /**
   * ✅ MEJORA: Notificaciones simuladas para demo
   */
  useEffect(() => {
    // Datos de ejemplo para notificaciones
    const mockNotifications = [
      { id: 1, type: 'success', message: 'Nuevo producto agregado', read: false, timestamp: new Date() },
      { id: 2, type: 'info', message: 'Inventario actualizado', read: true, timestamp: new Date(Date.now() - 3600000) },
      { id: 3, type: 'warning', message: 'Stock bajo en producto "XYZ"', read: false, timestamp: new Date(Date.now() - 7200000) }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
    setUnreadCount(prev => prev - 1);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const displayedNotifications = useMemo(() =>
    notifications.slice(0, 5), [notifications]
  );

  const getNotificationIcon = (type) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  };

  return (
    <header className={clsx(
      'bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700',
      'sticky top-0 z-40 transition-all duration-300',
      isScrolled && 'shadow-lg'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y navegación izquierda */}
          <div className="flex items-center flex-1">
            {/* Botón sidebar móvil */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Abrir menú"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo y título */}
            <div className="hidden lg:flex items-center ml-2">
              <Link to="/" className="flex items-center group">
                <div className="h-9 w-9 bg-linear-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <span className="text-white font-bold text-lg">IQ</span>
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {pageTitle}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sistema de Gestión de Inventario
                  </p>
                </div>
              </Link>
            </div>

            {/* Búsqueda global - Desktop */}
            <div className="hidden lg:block ml-8 flex-1 max-w-md" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Buscar productos, categorías..."
                    className={clsx(
                      "w-full px-4 py-2 pl-10 pr-4 rounded-lg border",
                      "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600",
                      "text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
                      "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                      "transition-all duration-200"
                    )}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Navegación derecha */}
          <div className="flex items-center space-x-4">
            {/* Botón búsqueda móvil */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Buscar"
            >
              <SearchIcon className="h-6 w-6" />
            </button>

            {/* Botón tema */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={`Cambiar a tema ${currentTheme === 'dark' ? 'claro' : 'oscuro'}`}
              title={`Tema ${currentTheme === 'dark' ? 'claro' : 'oscuro'}`}
            >
              {currentTheme === 'dark' ? (
                <SunIcon className="h-6 w-6" />
              ) : (
                <MoonIcon className="h-6 w-6" />
              )}
            </button>

            {/* Notificaciones */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={clsx(
                  "p-2 rounded-full relative transition-colors",
                  isNotificationsOpen
                    ? "text-primary-600 bg-primary-50 dark:bg-primary-900"
                    : "text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                aria-label="Notificaciones"
              >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown notificaciones */}
              {isNotificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-96 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-50 overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Notificaciones
                      </h3>
                      <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={clearAll}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                          >
                            Marcar todas
                          </button>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {unreadCount} sin leer
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de notificaciones */}
                  <div className="max-h-96 overflow-y-auto scrollbar-thin">
                    {displayedNotifications.length > 0 ? (
                      displayedNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={clsx(
                            'w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700',
                            'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer',
                            !notification.read && 'bg-blue-50 dark:bg-blue-900 bg-opacity-50'
                          )}
                        >
                          <div className="flex items-start">
                            <div className="shrink-0 mr-3">
                              {(() => {
                                let typeClass = '';

                                if (notification.type === 'success') {
                                  typeClass = 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400';
                                } else if (notification.type === 'error') {
                                  typeClass = 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400';
                                } else if (notification.type === 'warning') {
                                  typeClass = 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400';
                                } else {
                                  typeClass = 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400';
                                }

                                return (
                                  <div
                                    className={clsx(
                                      'h-9 w-9 rounded-full flex items-center justify-center text-sm',
                                      typeClass
                                    )}
                                  >
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 dark:text-white">
                                {notification.message}
                              </p>
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(notification.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {!notification.read && (
                                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <BellIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          No hay notificaciones
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <Link
                        to="/notifications"
                        className="block px-4 py-3 text-sm text-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        Ver todas las notificaciones
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Perfil de usuario */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={clsx(
                  "flex items-center max-w-xs rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all",
                  isProfileOpen && "ring-2 ring-primary-500 ring-offset-2"
                )}
                id="user-menu"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                <span className="sr-only">Abrir menú de usuario</span>
                <div className="h-9 w-9 rounded-full bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="ml-2 hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                    {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </p>
                </div>
                <ChevronDownIcon className="ml-1 h-5 w-5 text-gray-400" />
              </button>

              {/* Dropdown perfil */}
              {isProfileOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-64 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-50"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu"
                >
                  {/* Header perfil */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="ml-3 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user?.email}
                        </p>
                        <div className="mt-1">
                          <span className={clsx(
                            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                            user?.role === 'admin'
                              ? "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                              : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                          )}>
                            {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enlaces perfil */}
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <UserIcon className="mr-3 h-5 w-5 text-gray-400" />
                      Mi perfil
                    </Link>

                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <CogIcon className="mr-3 h-5 w-5 text-gray-400" />
                      Configuración
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      role="menuitem"
                    >
                      <LogoutIcon className="mr-3 h-5 w-5 text-red-400" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Búsqueda móvil expandida */}
        {isSearchOpen && (
          <div className="lg:hidden pb-4 animate-slide-down">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Buscar productos, categorías..."
                  className="w-full px-4 py-3 pl-10 pr-4 rounded-lg border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;