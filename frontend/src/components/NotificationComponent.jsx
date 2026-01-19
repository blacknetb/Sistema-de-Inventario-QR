import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './components.css';

/**
 * Sistema completo de notificaciones para el inventario
 * Soporta diferentes tipos, prioridades y acciones
 */
const NotificationComponent = ({
  notifications = [],
  maxVisible = 5,
  position = 'top-right',
  autoClose = 5000,
  showProgress = true,
  pauseOnHover = true,
  closeOnClick = true,
  newestOnTop = true,
  withIcons = true,
  withActions = true,
  withSound = true,
  showCount = true,
  className = '',
  style = {},
  onNotificationClick,
  onNotificationClose,
  onAllRead,
  onAllClear
}) => {
  const [internalNotifications, setInternalNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [playSound, setPlaySound] = useState(false);
  
  const notificationRef = useRef(null);
  const audioRef = useRef(null);
  const timeoutRefs = useRef({});

  // Inicializar notificaciones
  useEffect(() => {
    const initializedNotifications = notifications.map(notification => ({
      ...notification,
      id: notification.id || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: notification.read || false,
      timestamp: notification.timestamp || new Date().toISOString(),
      progress: 100,
      closing: false
    }));
    
    setInternalNotifications(initializedNotifications);
  }, [notifications]);

  // Calcular notificaciones no leídas
  useEffect(() => {
    const unread = internalNotifications.filter(n => !n.read).length;
    setUnreadCount(unread);
    
    // Reproducir sonido si hay notificaciones no leídas y está habilitado
    if (withSound && unread > 0 && !playSound) {
      setPlaySound(true);
      playNotificationSound();
    }
  }, [internalNotifications, withSound, playSound]);

  // Manejar cierre automático
  useEffect(() => {
    internalNotifications.forEach(notification => {
      if (autoClose > 0 && !notification.read && !notification.persistent) {
        startAutoCloseTimer(notification.id);
      }
    });
    
    return () => {
      // Limpiar todos los timeouts
      Object.values(timeoutRefs.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, [internalNotifications, autoClose]);

  // Reproducir sonido de notificación
  const playNotificationSound = () => {
    if (!withSound) return;
    
    try {
      // Crear contexto de audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio context not supported or blocked by browser');
    }
  };

  // Iniciar temporizador de cierre automático
  const startAutoCloseTimer = (notificationId) => {
    if (timeoutRefs.current[notificationId]) {
      clearTimeout(timeoutRefs.current[notificationId]);
    }
    
    // Actualizar progreso cada 100ms
    const updateProgress = () => {
      setInternalNotifications(prev => prev.map(notification => {
        if (notification.id === notificationId && notification.progress > 0) {
          return {
            ...notification,
            progress: notification.progress - (100 / (autoClose / 100))
          };
        }
        return notification;
      }));
    };
    
    const progressInterval = setInterval(updateProgress, 100);
    
    // Cerrar después del tiempo especificado
    timeoutRefs.current[notificationId] = setTimeout(() => {
      clearInterval(progressInterval);
      handleCloseNotification(notificationId);
    }, autoClose);
  };

  // Pausar temporizador al hacer hover
  const handleMouseEnter = (notificationId) => {
    if (pauseOnHover && timeoutRefs.current[notificationId]) {
      clearTimeout(timeoutRefs.current[notificationId]);
      timeoutRefs.current[notificationId] = null;
    }
  };

  // Reanudar temporizador al salir del hover
  const handleMouseLeave = (notificationId) => {
    if (pauseOnHover && autoClose > 0) {
      const notification = internalNotifications.find(n => n.id === notificationId);
      if (notification && !notification.read && !notification.persistent) {
        startAutoCloseTimer(notificationId);
      }
    }
  };

  // Manejar clic en notificación
  const handleNotificationClick = (notification) => {
    if (closeOnClick) {
      handleCloseNotification(notification.id);
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    
    // Marcar como leída
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  // Cerrar notificación específica
  const handleCloseNotification = (notificationId) => {
    // Marcar como cerrando para animación
    setInternalNotifications(prev => prev.map(notification => 
      notification.id === notificationId ? { ...notification, closing: true } : notification
    ));
    
    // Esperar animación de salida
    setTimeout(() => {
      setInternalNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (onNotificationClose) {
        const closedNotification = internalNotifications.find(n => n.id === notificationId);
        if (closedNotification) {
          onNotificationClose(closedNotification);
        }
      }
    }, 300);
    
    // Limpiar timeout
    if (timeoutRefs.current[notificationId]) {
      clearTimeout(timeoutRefs.current[notificationId]);
      delete timeoutRefs.current[notificationId];
    }
  };

  // Marcar notificación como leída
  const markAsRead = (notificationId) => {
    setInternalNotifications(prev => prev.map(notification => 
      notification.id === notificationId ? { ...notification, read: true } : notification
    ));
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = () => {
    setInternalNotifications(prev => prev.map(notification => ({
      ...notification,
      read: true
    })));
    
    if (onAllRead) {
      onAllRead();
    }
  };

  // Limpiar todas las notificaciones
  const handleClearAll = () => {
    // Marcar todas como cerrando para animación
    setInternalNotifications(prev => prev.map(notification => ({
      ...notification,
      closing: true
    })));
    
    // Esperar animación de salida
    setTimeout(() => {
      setInternalNotifications([]);
      
      if (onAllClear) {
        onAllClear();
      }
    }, 300);
    
    // Limpiar todos los timeouts
    Object.values(timeoutRefs.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    timeoutRefs.current = {};
  };

  // Agregar nueva notificación
  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: notification.id || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      timestamp: new Date().toISOString(),
      progress: 100,
      closing: false
    };
    
    setInternalNotifications(prev => 
      newestOnTop ? [newNotification, ...prev] : [...prev, newNotification]
    );
  };

  // Obtener icono según tipo de notificación
  const getNotificationIcon = (type) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      inventory: '📦',
      sales: '💰',
      stock: '📊',
      system: '⚙️',
      user: '👤',
      alert: '🚨'
    };
    
    return icons[type] || icons.info;
  };

  // Obtener clase CSS según tipo de notificación
  const getNotificationTypeClass = (type) => {
    const typeClasses = {
      success: 'notification-success',
      error: 'notification-error',
      warning: 'notification-warning',
      info: 'notification-info',
      inventory: 'notification-inventory',
      sales: 'notification-sales',
      stock: 'notification-stock',
      system: 'notification-system',
      user: 'notification-user',
      alert: 'notification-alert'
    };
    
    return typeClasses[type] || 'notification-info';
  };

  // Formatear timestamp relativo
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notificationDate = new Date(timestamp);
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    
    return notificationDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  // Obtener clase de posición
  const getPositionClass = () => {
    const positionClasses = {
      'top-right': 'position-top-right',
      'top-left': 'position-top-left',
      'bottom-right': 'position-bottom-right',
      'bottom-left': 'position-bottom-left',
      'top-center': 'position-top-center',
      'bottom-center': 'position-bottom-center'
    };
    
    return positionClasses[position] || 'position-top-right';
  };

  // Notificaciones visibles (limitadas por maxVisible)
  const visibleNotifications = internalNotifications
    .filter(n => !n.closing)
    .slice(0, maxVisible);

  // Notificaciones no leídas
  const unreadNotifications = internalNotifications.filter(n => !n.read);

  return (
    <div 
      className={`notification-container ${getPositionClass()} ${className} ${isOpen ? 'open' : ''}`}
      style={style}
      ref={notificationRef}
    >
      {/* Botón/badge de notificaciones */}
      <div className="notification-trigger">
        <button 
          className="notification-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={`Notificaciones (${unreadCount} sin leer)`}
          aria-expanded={isOpen}
        >
          <span className="button-icon">🔔</span>
          {showCount && unreadCount > 0 && (
            <span className="notification-count">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Panel de notificaciones */}
      <div className={`notification-panel ${isOpen ? 'panel-open' : ''}`}>
        <div className="panel-header">
          <h3 className="panel-title">Notificaciones</h3>
          <div className="panel-actions">
            {unreadCount > 0 && (
              <button 
                className="action-btn mark-all-read"
                onClick={handleMarkAllAsRead}
                title="Marcar todas como leídas"
              >
                Marcar todas como leídas
              </button>
            )}
            {internalNotifications.length > 0 && (
              <button 
                className="action-btn clear-all"
                onClick={handleClearAll}
                title="Limpiar todas"
              >
                Limpiar todas
              </button>
            )}
            <button 
              className="action-btn close-panel"
              onClick={() => setIsOpen(false)}
              title="Cerrar panel"
            >
              ×
            </button>
          </div>
        </div>

        <div className="notifications-list">
          {visibleNotifications.length === 0 ? (
            <div className="empty-notifications">
              <span className="empty-icon">📭</span>
              <p className="empty-text">No hay notificaciones</p>
              <p className="empty-subtext">Todo está al día</p>
            </div>
          ) : (
            visibleNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${getNotificationTypeClass(notification.type)} ${
                  notification.read ? 'read' : 'unread'
                } ${notification.priority || 'normal'}`}
                onClick={() => handleNotificationClick(notification)}
                onMouseEnter={() => handleMouseEnter(notification.id)}
                onMouseLeave={() => handleMouseLeave(notification.id)}
                role="button"
                tabIndex={0}
                aria-label={`Notificación ${notification.type}: ${notification.title}`}
              >
                {/* Barra de progreso para auto-cierre */}
                {showProgress && autoClose > 0 && !notification.persistent && (
                  <div 
                    className="notification-progress"
                    style={{ width: `${notification.progress}%` }}
                  />
                )}

                <div className="notification-content">
                  {/* Icono */}
                  {withIcons && (
                    <div className="notification-icon">
                      {notification.icon || getNotificationIcon(notification.type)}
                    </div>
                  )}

                  {/* Contenido principal */}
                  <div className="notification-body">
                    <div className="notification-header">
                      <h4 className="notification-title">{notification.title}</h4>
                      {!notification.read && (
                        <span className="unread-indicator" aria-label="No leída"></span>
                      )}
                    </div>
                    
                    <p className="notification-message">{notification.message}</p>
                    
                    {notification.details && (
                      <div className="notification-details">
                        <small>{notification.details}</small>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="notification-meta">
                      <span className="notification-time">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                      
                      {notification.source && (
                        <span className="notification-source">
                          {notification.source}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  {withActions && notification.actions && notification.actions.length > 0 && (
                    <div className="notification-actions">
                      {notification.actions.map((action, index) => (
                        <button
                          key={index}
                          className={`action-btn ${action.type || 'secondary'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (action.onClick) {
                              action.onClick(notification);
                            }
                          }}
                          title={action.label}
                        >
                          {action.icon && <span className="action-icon">{action.icon}</span>}
                          <span className="action-label">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Botón de cierre */}
                  <button
                    className="notification-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseNotification(notification.id);
                    }}
                    aria-label="Cerrar notificación"
                    title="Cerrar"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer del panel */}
        {internalNotifications.length > maxVisible && (
          <div className="panel-footer">
            <p className="footer-text">
              Mostrando {visibleNotifications.length} de {internalNotifications.length} notificaciones
            </p>
            <button 
              className="view-all-btn"
              onClick={() => {
                // Aquí podrías navegar a una página de todas las notificaciones
                console.log('Ver todas las notificaciones');
              }}
            >
              Ver todas
            </button>
          </div>
        )}
      </div>

      {/* Overlay para cerrar al hacer clic fuera */}
      {isOpen && (
        <div 
          className="notification-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Audio para notificaciones */}
      <audio ref={audioRef} style={{ display: 'none' }}>
        <source src="/notification-sound.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

NotificationComponent.propTypes = {
  /**
   * Array de notificaciones
   */
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.oneOf([
        'success', 'error', 'warning', 'info', 
        'inventory', 'sales', 'stock', 'system', 'user', 'alert'
      ]).isRequired,
      title: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      details: PropTypes.string,
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      read: PropTypes.bool,
      timestamp: PropTypes.string,
      source: PropTypes.string,
      priority: PropTypes.oneOf(['low', 'normal', 'high', 'critical']),
      persistent: PropTypes.bool,
      actions: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          icon: PropTypes.string,
          type: PropTypes.oneOf(['primary', 'secondary', 'danger']),
          onClick: PropTypes.func
        })
      )
    })
  ),
  
  /** Máximo de notificaciones visibles */
  maxVisible: PropTypes.number,
  
  /** Posición del panel */
  position: PropTypes.oneOf([
    'top-right', 'top-left', 'bottom-right', 
    'bottom-left', 'top-center', 'bottom-center'
  ]),
  
  /** Tiempo en ms para cierre automático (0 = deshabilitado) */
  autoClose: PropTypes.number,
  
  /** Mostrar barra de progreso para auto-cierre */
  showProgress: PropTypes.bool,
  
  /** Pausar auto-cierre al hacer hover */
  pauseOnHover: PropTypes.bool,
  
  /** Cerrar notificación al hacer clic */
  closeOnClick: PropTypes.bool,
  
  /** Mostrar nuevas notificaciones arriba */
  newestOnTop: PropTypes.bool,
  
  /** Mostrar iconos */
  withIcons: PropTypes.bool,
  
  /** Mostrar acciones */
  withActions: PropTypes.bool,
  
  /** Reproducir sonido */
  withSound: PropTypes.bool,
  
  /** Mostrar contador de no leídas */
  showCount: PropTypes.bool,
  
  /** Clase CSS adicional */
  className: PropTypes.string,
  
  /** Estilos adicionales */
  style: PropTypes.object,
  
  /** Callback al hacer clic en notificación */
  onNotificationClick: PropTypes.func,
  
  /** Callback al cerrar notificación */
  onNotificationClose: PropTypes.func,
  
  /** Callback al marcar todas como leídas */
  onAllRead: PropTypes.func,
  
  /** Callback al limpiar todas */
  onAllClear: PropTypes.func
};

NotificationComponent.defaultProps = {
  notifications: [],
  maxVisible: 5,
  position: 'top-right',
  autoClose: 5000,
  showProgress: true,
  pauseOnHover: true,
  closeOnClick: true,
  newestOnTop: true,
  withIcons: true,
  withActions: true,
  withSound: true,
  showCount: true,
  className: '',
  style: {}
};

// Métodos públicos para control desde fuera
NotificationComponent.addNotification = function(notification) {
  // Este método será implementado por el componente padre
  console.log('Método addNotification llamado desde fuera');
};

NotificationComponent.clearAll = function() {
  // Este método será implementado por el componente padre
  console.log('Método clearAll llamado desde fuera');
};

export default NotificationComponent;