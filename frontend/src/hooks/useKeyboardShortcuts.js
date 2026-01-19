import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook para manejar atajos de teclado en el sistema de inventario
 * @param {Object} shortcuts - Mapa de atajos de teclado
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Funciones para manejar atajos
 */
const useKeyboardShortcuts = (shortcuts = {}, options = {}) => {
  const {
    enabled = true,
    preventDefault = true,
    capture = false,
    debug = false
  } = options;

  const shortcutsRef = useRef(shortcuts);
  const pressedKeys = useRef(new Set());
  const isMac = useRef(typeof window !== 'undefined' ? /Mac|iPod|iPhone|iPad/.test(navigator.platform) : false);

  // Atajos de teclado por defecto para inventario
  const defaultShortcuts = {
    // Navegación
    'mod+f': { action: 'focus_search', description: 'Buscar items' },
    'mod+n': { action: 'new_item', description: 'Nuevo item' },
    'mod+s': { action: 'save', description: 'Guardar cambios' },
    'mod+shift+s': { action: 'save_as', description: 'Guardar como' },
    'mod+e': { action: 'export', description: 'Exportar datos' },
    'mod+p': { action: 'print', description: 'Imprimir reporte' },
    'esc': { action: 'close_modal', description: 'Cerrar modal' },
    
    // Edición
    'mod+z': { action: 'undo', description: 'Deshacer' },
    'mod+shift+z': { action: 'redo', description: 'Rehacer' },
    'mod+c': { action: 'copy', description: 'Copiar' },
    'mod+v': { action: 'paste', description: 'Pegar' },
    'mod+x': { action: 'cut', description: 'Cortar' },
    'mod+a': { action: 'select_all', description: 'Seleccionar todo' },
    'delete': { action: 'delete', description: 'Eliminar seleccionado' },
    
    // Navegación por teclado
    'arrowup': { action: 'navigate_up', description: 'Navegar arriba' },
    'arrowdown': { action: 'navigate_down', description: 'Navegar abajo' },
    'arrowleft': { action: 'navigate_left', description: 'Navegar izquierda' },
    'arrowright': { action: 'navigate_right', description: 'Navegar derecha' },
    'enter': { action: 'confirm', description: 'Confirmar selección' },
    'space': { action: 'toggle_selection', description: 'Alternar selección' },
    
    // Acciones rápidas
    'mod+1': { action: 'view_dashboard', description: 'Ver dashboard' },
    'mod+2': { action: 'view_inventory', description: 'Ver inventario' },
    'mod+3': { action: 'view_reports', description: 'Ver reportes' },
    'mod+4': { action: 'view_settings', description: 'Ver configuración' },
    
    // Filtros
    'mod+shift+f': { action: 'toggle_filters', description: 'Alternar filtros' },
    'mod+shift+s': { action: 'toggle_search', description: 'Alternar búsqueda' },
    
    // Ayuda
    'f1': { action: 'help', description: 'Mostrar ayuda' },
    'mod+?': { action: 'show_shortcuts', description: 'Mostrar atajos' }
  };

  // Combinar atajos por defecto con personalizados
  const allShortcuts = { ...defaultShortcuts, ...shortcuts };
  shortcutsRef.current = allShortcuts;

  // Normalizar tecla (convertir a formato estándar)
  const normalizeKey = useCallback((key) => {
    const keyMap = {
      'ctrl': 'control',
      'cmd': 'meta',
      'command': 'meta',
      'option': 'alt',
      'esc': 'escape',
      ' ': 'space',
      'arrowup': 'arrowup',
      'arrowdown': 'arrowdown',
      'arrowleft': 'arrowleft',
      'arrowright': 'arrowright',
      'up': 'arrowup',
      'down': 'arrowdown',
      'left': 'arrowleft',
      'right': 'arrowright'
    };

    const normalized = key.toLowerCase();
    return keyMap[normalized] || normalized;
  }, []);

  // Parsear combinación de teclas
  const parseKeyCombo = useCallback((combo) => {
    const parts = combo.toLowerCase().split('+');
    const keys = parts.map(normalizeKey);
    
    // Reemplazar 'mod' con 'ctrl' o 'meta' según el sistema operativo
    const modIndex = keys.indexOf('mod');
    if (modIndex !== -1) {
      keys[modIndex] = isMac.current ? 'meta' : 'control';
    }
    
    return keys.sort();
  }, [isMac, normalizeKey]);

  // Verificar si se presionó una combinación
  const checkCombo = useCallback((combo, pressed) => {
    const comboKeys = parseKeyCombo(combo);
    const pressedArray = Array.from(pressed).map(normalizeKey).sort();
    
    // Verificar si todas las teclas del combo están presionadas
    return comboKeys.every(key => pressedArray.includes(key)) && 
           comboKeys.length === pressedArray.length;
  }, [parseKeyCombo, normalizeKey]);

  // Manejar evento keydown
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;
    
    const key = normalizeKey(event.key);
    pressedKeys.current.add(key);
    
    if (debug) {
      console.log('Key pressed:', key, 'Pressed keys:', Array.from(pressedKeys.current));
    }
    
    // Buscar atajo que coincida
    for (const [combo, shortcut] of Object.entries(shortcutsRef.current)) {
      if (checkCombo(combo, pressedKeys.current)) {
        if (debug) {
          console.log('Shortcut matched:', combo, shortcut);
        }
        
        if (preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }
        
        // Ejecutar callback si existe
        if (shortcut.callback && typeof shortcut.callback === 'function') {
          shortcut.callback(event);
        }
        
        // Disparar evento personalizado
        const shortcutEvent = new CustomEvent('shortcut', {
          detail: { combo, action: shortcut.action, event }
        });
        window.dispatchEvent(shortcutEvent);
        
        break;
      }
    }
  }, [enabled, preventDefault, debug, checkCombo, normalizeKey]);

  // Manejar evento keyup
  const handleKeyUp = useCallback((event) => {
    const key = normalizeKey(event.key);
    pressedKeys.current.delete(key);
  }, [normalizeKey]);

  // Manejar evento blur (limpiar teclas presionadas cuando se pierde foco)
  const handleBlur = useCallback(() => {
    pressedKeys.current.clear();
  }, []);

  // Registrar atajo personalizado
  const registerShortcut = useCallback((combo, shortcut) => {
    shortcutsRef.current = {
      ...shortcutsRef.current,
      [combo]: shortcut
    };
    
    if (debug) {
      console.log('Shortcut registered:', combo, shortcut);
    }
    
    return () => {
      // Función para desregistrar
      const { [combo]: _, ...rest } = shortcutsRef.current;
      shortcutsRef.current = rest;
    };
  }, [debug]);

  // Desregistrar atajo
  const unregisterShortcut = useCallback((combo) => {
    const { [combo]: _, ...rest } = shortcutsRef.current;
    shortcutsRef.current = rest;
    
    if (debug) {
      console.log('Shortcut unregistered:', combo);
    }
  }, [debug]);

  // Obtener todos los atajos registrados
  const getRegisteredShortcuts = useCallback(() => {
    return Object.entries(shortcutsRef.current).map(([combo, shortcut]) => ({
      combo: combo.replace(/mod/g, isMac.current ? '⌘' : 'Ctrl'),
      ...shortcut
    }));
  }, [isMac]);

  // Obtener atajos por categoría
  const getShortcutsByCategory = useCallback(() => {
    const categories = {
      navigation: [],
      editing: [],
      actions: [],
      navigation_keys: [],
      filters: [],
      help: []
    };
    
    Object.entries(shortcutsRef.current).forEach(([combo, shortcut]) => {
      const category = shortcut.category || 'actions';
      if (categories[category]) {
        categories[category].push({
          combo: combo.replace(/mod/g, isMac.current ? '⌘' : 'Ctrl'),
          ...shortcut
        });
      }
    });
    
    return categories;
  }, [isMac]);

  // Habilitar/deshabilitar atajos
  const setEnabled = useCallback((isEnabled) => {
    options.enabled = isEnabled;
  }, [options]);

  // Configurar listener global
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;

    window.addEventListener('keydown', handleKeyDown, capture);
    window.addEventListener('keyup', handleKeyUp, capture);
    window.addEventListener('blur', handleBlur, capture);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, capture);
      window.removeEventListener('keyup', handleKeyUp, capture);
      window.removeEventListener('blur', handleBlur, capture);
      pressedKeys.current.clear();
    };
  }, [enabled, capture, handleKeyDown, handleKeyUp, handleBlur]);

  // Verificar si un atajo está disponible
  const hasShortcut = useCallback((action) => {
    return Object.values(shortcutsRef.current).some(shortcut => shortcut.action === action);
  }, []);

  // Obtener combinación para una acción específica
  const getComboForAction = useCallback((action) => {
    const entry = Object.entries(shortcutsRef.current).find(([_, shortcut]) => 
      shortcut.action === action
    );
    
    if (entry) {
      return entry[0].replace(/mod/g, isMac.current ? '⌘' : 'Ctrl');
    }
    
    return null;
  }, [isMac]);

  // Disparar atajo manualmente
  const triggerShortcut = useCallback((action, eventProps = {}) => {
    const entry = Object.entries(shortcutsRef.current).find(([_, shortcut]) => 
      shortcut.action === action
    );
    
    if (entry) {
      const [combo, shortcut] = entry;
      
      if (debug) {
        console.log('Manually triggering shortcut:', combo, shortcut);
      }
      
      if (shortcut.callback && typeof shortcut.callback === 'function') {
        const event = {
          type: 'keydown',
          preventDefault: () => {},
          stopPropagation: () => {},
          ...eventProps
        };
        shortcut.callback(event);
      }
      
      return true;
    }
    
    return false;
  }, [debug]);

  // Crear grupo de atajos para un componente específico
  const createShortcutGroup = useCallback((componentShortcuts, options = {}) => {
    const { scope = 'component', enabled: groupEnabled = true } = options;
    
    const groupRef = useRef({});
    
    const register = useCallback((combo, shortcut) => {
      const fullCombo = `${scope}:${combo}`;
      groupRef.current[fullCombo] = shortcut;
      return registerShortcut(fullCombo, shortcut);
    }, [scope, registerShortcut]);
    
    const unregister = useCallback((combo) => {
      const fullCombo = `${scope}:${combo}`;
      unregisterShortcut(fullCombo);
      delete groupRef.current[fullCombo];
    }, [scope, unregisterShortcut]);
    
    // Registrar atajos iniciales
    useEffect(() => {
      Object.entries(componentShortcuts).forEach(([combo, shortcut]) => {
        register(combo, shortcut);
      });
      
      return () => {
        Object.keys(componentShortcuts).forEach(combo => {
          unregister(combo);
        });
      };
    }, [componentShortcuts, register, unregister]);
    
    return {
      register,
      unregister,
      shortcuts: groupRef.current
    };
  }, [registerShortcut, unregisterShortcut]);

  return {
    // Estado y configuración
    enabled,
    setEnabled,
    
    // Registro de atajos
    registerShortcut,
    unregisterShortcut,
    createShortcutGroup,
    
    // Consulta de atajos
    getRegisteredShortcuts,
    getShortcutsByCategory,
    hasShortcut,
    getComboForAction,
    
    // Ejecución de atajos
    triggerShortcut,
    
    // Información del sistema
    isMac: isMac.current,
    platformKey: isMac.current ? '⌘' : 'Ctrl',
    
    // Utilidades
    normalizeKey,
    parseKeyCombo,
    checkCombo
  };
};

export default useKeyboardShortcuts;