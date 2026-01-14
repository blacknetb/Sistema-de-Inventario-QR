import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  QrCode, Camera, RotateCw,
  AlertCircle, CheckCircle, Search,
  Package, ArrowLeft, Download,
  History, Info
} from 'lucide-react';

// ✅ Configuración de API
const API_CONFIG = {
  BASE_URL: window.APP_CONFIG?.apiUrl || 'http://localhost:3000/api',
  getAuthHeader: () => ({
    'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  })
};

// ✅ Componente de historial de escaneos
const ScanHistoryItem = React.memo(({ scan, onClick }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;

    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer group"
      onClick={() => onClick(scan.productId)}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center min-w-0">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 shrink-0">
          <Package className="w-5 h-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <div className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {scan.productName}
          </div>
          <div className="text-xs text-gray-500 flex items-center mt-1">
            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded mr-2">{scan.code}</span>
            <span>{formatTime(scan.timestamp)}</span>
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-500 shrink-0">
        {scan.user}
      </div>
    </motion.div>
  );
});

ScanHistoryItem.propTypes = {
  scan: PropTypes.shape({
    productId: PropTypes.string.isRequired,
    productName: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    user: PropTypes.string.isRequired
  }).isRequired,
  onClick: PropTypes.func.isRequired
};

ScanHistoryItem.displayName = 'ScanHistoryItem';

// ✅ Función para obtener estado de stock
const getStockStatus = (stock, minStock) => {
  if (stock <= 0) return { text: 'Agotado', color: 'bg-red-100 text-red-800' };
  if (stock <= (minStock || 10) * 0.3) return { text: 'Crítico', color: 'bg-red-100 text-red-800' };
  if (stock <= (minStock || 10) * 0.5) return { text: 'Bajo', color: 'bg-yellow-100 text-yellow-800' };
  return { text: 'Disponible', color: 'bg-green-100 text-green-800' };
};

// ✅ Componente de detalles de producto escaneado
const ScannedProductDetails = React.memo(({ product, onUpdateStock, onViewDetails, isLoading }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (!product) return null;

  const stockStatus = getStockStatus(product.stock, product.minStock);
  const handleCustomAdjustment = () => {
    const quantity = prompt('Ingresa la cantidad a ajustar (use + para añadir, - para restar):', '+1');
    if (quantity && !isNaN(parseInt(quantity, 10))) {
      onUpdateStock(product.id, parseInt(quantity, 10));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-0.5 rounded">
              {product.sku}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${stockStatus.color}`}>
              {stockStatus.text}
            </span>
          </div>
        </div>
        <button
          onClick={onViewDetails}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Ver detalles completos"
        >
          <Info className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Stock actual</div>
            <div className="text-xl font-bold text-gray-900">{product.stock} unidades</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Precio</div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(product.price)}</div>
          </div>
        </div>

        {product.location && (
          <div>
            <div className="text-sm text-gray-500">Ubicación</div>
            <div className="font-medium text-gray-900">{product.location}</div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-900 mb-3">Ajustar stock</div>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateStock(product.id, 1)}
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
            >
              +1
            </button>
            <button
              onClick={() => onUpdateStock(product.id, -1)}
              disabled={isLoading || product.stock <= 0}
              className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
            >
              -1
            </button>
            <button
              onClick={handleCustomAdjustment}
              disabled={isLoading}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              Personalizar
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center pt-2">
          Última actualización: {new Date(product.lastUpdated || product.createdAt).toLocaleDateString('es-MX')}
        </div>
      </div>
    </motion.div>
  );
});

ScannedProductDetails.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    sku: PropTypes.string.isRequired,
    stock: PropTypes.number.isRequired,
    minStock: PropTypes.number,
    price: PropTypes.number,
    location: PropTypes.string,
    lastUpdated: PropTypes.string,
    createdAt: PropTypes.string
  }).isRequired,
  onUpdateStock: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired
};

ScannedProductDetails.displayName = 'ScannedProductDetails';

// ✅ COMPONENTE PRINCIPAL MEJORADO
const Scanner = () => {
  const navigate = useNavigate();

  // ✅ ESTADOS DEL ESCÁNER
  const [scanning, setScanning] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [activeCamera, setActiveCamera] = useState('environment');
  const [cameraDevices, setCameraDevices] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [scanCount, setScanCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);

  // ✅ REFERENCIAS
  const videoRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const beepAudioRef = useRef(null);

  // ✅ EFECTO PARA CARGAR PERMISOS Y DISPOSITIVOS
  useEffect(() => {
    checkCameraPermission();
    loadCameraDevices();
    loadScanHistory();

    // ✅ MEJORA: Cargar audio de escaneo
    beepAudioRef.current = new Audio('/sounds/beep.mp3');
    beepAudioRef.current.volume = 0.3;

    // ✅ MEJORA: Cleanup function
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      stopCamera();
    };
  }, []);

  // ✅ MEJORA: Función para detener la cámara
  const stopCamera = useCallback(() => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // ✅ MEJORA: Función para reproducir sonido de escaneo
  const playScanSound = useCallback(() => {
    if (beepAudioRef.current) {
      beepAudioRef.current.currentTime = 0;
      beepAudioRef.current.play().catch(() => {
        console.log('Audio playback failed');
      });
    }
  }, []);

  // ✅ MEJORA: Función para verificar permisos de cámara
  const checkCameraPermission = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('API de cámara no disponible en este navegador');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: activeCamera,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Detener stream después de verificar permisos
      stream.getTracks().forEach(track => track.stop());

      setCameraPermission('granted');
      setError(null);
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setCameraPermission('denied');

      if (err.name === 'NotAllowedError') {
        setError('Permiso de cámara denegado. Por favor, habilita la cámara en los ajustes de tu navegador.');
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró ninguna cámara disponible en este dispositivo.');
      } else if (err.name === 'NotReadableError') {
        setError('La cámara está en uso por otra aplicación. Por favor, ciérrala e intenta de nuevo.');
      } else {
        setError(`Error de cámara: ${err.message}`);
      }
    }
  };

  // ✅ MEJORA: Función para cargar dispositivos de cámara
  const loadCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameraDevices(videoDevices);

      // ✅ MEJORA: Si hay múltiples cámaras, seleccionar la trasera por defecto
      if (videoDevices.length > 1) {
        const rearCamera = videoDevices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        if (rearCamera) {
          setActiveCamera('environment');
        }
      }
    } catch (err) {
      console.error('Error al listar dispositivos de cámara:', err);
    }
  };

  // ✅ MEJORA: Función para cargar historial de escaneos
  const loadScanHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('scanHistory')) || [];
      const validHistory = history.filter(item =>
        item &&
        typeof item === 'object' &&
        item.productId &&
        item.productName &&
        item.timestamp
      ).slice(0, 10);

      setScanHistory(validHistory);
      setSuccessCount(validHistory.filter(h => h.success).length);
      setScanCount(validHistory.length);
    } catch (error) {
      console.error('Error cargando historial de escaneos:', error);
      setScanHistory([]);
    }
  };

  // ✅ MEJORA: Función para añadir al historial
  const addToScanHistory = useCallback((product, success = true) => {
    if (!product?.id || !product?.name) return;

    const historyItem = {
      productId: product.id,
      productName: product.name,
      code: product.sku || product.barcode || 'N/A',
      timestamp: new Date().toISOString(),
      user: localStorage.getItem('username') || 'Usuario',
      success
    };

    const newHistory = [historyItem, ...scanHistory].slice(0, 20);
    setScanHistory(newHistory);

    // ✅ MEJORA: Actualizar contadores
    if (success) {
      setSuccessCount(prev => prev + 1);
    }
    setScanCount(prev => prev + 1);

    try {
      localStorage.setItem('scanHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error guardando historial:', error);
    }
  }, [scanHistory]);

  // ✅ MEJORA: Función para buscar producto por código QR
  const searchProductByCode = async (code) => {
    if (!code || typeof code !== 'string' || code.trim().length < 3) {
      throw new Error('Código QR inválido o muy corto');
    }

    try {
      // ✅ MEJORA: Intentar diferentes formatos de búsqueda
      const searchPromises = [
        fetch(`${API_CONFIG.BASE_URL}/products/sku/${encodeURIComponent(code.trim())}`, {
          headers: API_CONFIG.getAuthHeader()
        }),
        fetch(`${API_CONFIG.BASE_URL}/products/barcode/${encodeURIComponent(code.trim())}`, {
          headers: API_CONFIG.getAuthHeader()
        }),
        fetch(`${API_CONFIG.BASE_URL}/products/search?q=${encodeURIComponent(code.trim())}`, {
          headers: API_CONFIG.getAuthHeader()
        })
      ];

      let product = null;
      for (const promise of searchPromises) {
        try {
          const response = await promise;
          if (response.ok) {
            const data = await response.json();
            if (data?.id) {
              product = data;
              break;
            }
          }
        } catch (error) {
          console.log('Búsqueda fallida, intentando siguiente método...');
          // No propagamos el error aquí, continuamos con el siguiente método
        }
      }

      if (!product) {
        throw new Error('Producto no encontrado en el inventario');
      }

      return product;
    } catch (error) {
      console.error('Error buscando producto:', error);
      throw error;
    }
  };

  // ✅ MEJORA: Función para obtener clase CSS de notificación
  const getNotificationClass = (type) => {
    if (type === 'success') return 'bg-green-500 text-white';
    if (type === 'error') return 'bg-red-500 text-white';
    return 'bg-blue-500 text-white';
  };

  // ✅ MEJORA: Función para mostrar notificaciones
  const showNotification = (message, type = 'info') => {
    // ✅ MEJORA: Implementar sistema de notificaciones visuales
    const notification = document.createElement('div');
    const notificationClass = getNotificationClass(type);

    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${notificationClass}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  };

  // ✅ MEJORA: Manejador de escaneo exitoso
  const handleScanSuccess = useCallback(async (code) => {
    if (!code || scanResult === code) return;

    setScanResult(code);
    setScanning(false);
    setLoading(true);
    setError(null);
    playScanSound();

    try {
      console.log('🔍 Escaneando código:', code);
      const product = await searchProductByCode(code);

      if (product) {
        setCurrentProduct(product);
        addToScanHistory(product, true);

        // ✅ MEJORA: Mostrar notificación de éxito
        showNotification(`✅ Producto encontrado: ${product.name}`, 'success');
      }
    } catch (err) {
      console.error('Error al procesar escaneo:', err);
      setError(err.message || 'Error al procesar el código QR');
      addToScanHistory({ id: 'error', name: code }, false);
      showNotification(`❌ ${err.message || 'Producto no encontrado'}`, 'error');
    } finally {
      setLoading(false);

      // ✅ MEJORA: Reanudar escaneo después de 2 segundos
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      scanTimeoutRef.current = setTimeout(() => {
        setScanning(true);
        setScanResult(null);
      }, 2000);
    }
  }, [scanResult, playScanSound, addToScanHistory]);

  // ✅ MEJORA: Función para cambiar de cámara
  const switchCamera = useCallback(() => {
    stopCamera();
    setActiveCamera(prev => prev === 'environment' ? 'user' : 'environment');
    setScanning(false);

    setTimeout(() => {
      setScanning(true);
      setError(null);
    }, 500);
  }, [stopCamera]);

  // ✅ MEJORA: Función para actualizar stock
  const handleUpdateStock = useCallback(async (productId, adjustment) => {
    if (!productId || typeof adjustment !== 'number' || isNaN(adjustment)) {
      showNotification('❌ Datos de actualización inválidos', 'error');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_CONFIG.BASE_URL}/products/${productId}/stock`, {
        method: 'PATCH',
        headers: API_CONFIG.getAuthHeader(),
        body: JSON.stringify({
          quantity: adjustment,
          reason: 'Ajuste manual desde escáner',
          notes: `Escaneado el ${new Date().toISOString()}`,
          user: localStorage.getItem('username') || 'Sistema'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar stock');
      }

      const updatedData = await response.json();

      // ✅ MEJORA: Actualizar producto localmente
      setCurrentProduct(prev => ({
        ...prev,
        stock: updatedData.stock,
        lastUpdated: new Date().toISOString()
      }));

      showNotification(
        `✅ Stock actualizado: ${adjustment > 0 ? '+' : ''}${adjustment} unidades`,
        'success'
      );
    } catch (err) {
      console.error('Error actualizando stock:', err);
      showNotification(`❌ ${err.message || 'Error al actualizar stock'}`, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ MEJORA: Función para navegar a producto
  const navigateToProduct = useCallback((productId) => {
    if (!productId) return;
    navigate(`/products/${productId}`);
  }, [navigate]);

  // ✅ MEJORA: Función para reiniciar escáner
  const resetScanner = useCallback(() => {
    stopCamera();
    setScanning(true);
    setScanResult(null);
    setCurrentProduct(null);
    setError(null);

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
  }, [stopCamera]);

  // ✅ MEJORA: Función para simular escaneo (para desarrollo)
  const simulateScan = useCallback(() => {
    const testCodes = [
      'PROD-001-2024',
      'SKU-12345',
      'BC-67890',
      'ITEM-555'
    ];
    const randomCode = testCodes[Math.floor(Math.random() * testCodes.length)];
    handleScanSuccess(randomCode);
  }, [handleScanSuccess]);

  // ✅ MEJORA: Renderizado de permisos de cámara
  if (cameraPermission === 'denied') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Cámara no disponible</h2>
            <p className="text-gray-600 mb-6">{error}</p>

            <div className="space-y-4">
              <button
                onClick={checkCameraPermission}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
              >
                Reintentar conexión
              </button>

              <button
                onClick={() => navigate('/products')}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Ir al inventario
              </button>

              <button
                onClick={simulateScan}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Simular escaneo (desarrollo)
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Para habilitar la cámara:</h4>
              <ol className="text-sm text-gray-600 text-left space-y-2">
                <li className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-gray-100 rounded-full text-center mr-2 shrink-0">
                    1
                  </span>
                  <span>Haz clic en el ícono de candado en la barra de direcciones</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-gray-100 rounded-full text-center mr-2 shrink-0">
                    2
                  </span>
                  <span>Selecciona "Configuración de sitios" o "Permisos"</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-gray-100 rounded-full text-center mr-2 shrink-0">
                    3
                  </span>
                  <span>Habilita el acceso a la cámara para este sitio</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-gray-100 rounded-full text-center mr-2 shrink-0">
                    4
                  </span>
                  <span>Recarga la página</span>
                </li>
              </ol>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* ✅ HEADER DEL ESCÁNER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate('/products')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 shrink-0 mt-1"
                aria-label="Volver al inventario"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <QrCode className="w-6 h-6 text-blue-600" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Escáner QR de Inventario
                  </h1>
                </div>
                <p className="text-gray-600">
                  Escanea códigos QR para buscar y gestionar productos en tiempo real
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={switchCamera}
                disabled={loading || cameraDevices.length < 2}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 flex items-center font-medium disabled:opacity-50"
                title={cameraDevices.length < 2 ? 'Solo hay una cámara disponible' : 'Cambiar cámara'}
              >
                <Camera className="w-4 h-4 mr-2" />
                {activeCamera === 'environment' ? 'Frontal' : 'Trasera'}
              </button>

              <button
                onClick={() => navigate('/qr-management')}
                className="px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center font-medium shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Generar QR
              </button>
            </div>
          </div>
        </motion.div>

        {/* ✅ CONTENIDO PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ✅ PANEL DEL ESCÁNER */}
          <div className="lg:col-span-2 space-y-8">
            {/* ESCÁNER PRINCIPAL */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              {/* ENCABEZADO */}
              <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg mr-3">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Escáner QR en tiempo real</h2>
                      <p className="text-blue-100 text-sm mt-1">
                        {scanning ? 'Listo para escanear' : 'Escaneo pausado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${scanning ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-sm">{scanning ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </div>
              </div>

              {/* CONTENIDO DEL ESCÁNER */}
              <div className="p-6">
                {/* ESTADOS */}
                {loading && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-b-2xl">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-700 font-medium">Buscando producto...</p>
                      <p className="text-sm text-gray-500 mt-1">Por favor espera</p>
                    </div>
                  </div>
                )}

                {error && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-3 shrink-0" />
                      <div>
                        <p className="text-red-800 font-medium">Error de escaneo</p>
                        <p className="text-red-700 text-sm mt-1">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ÁREA DEL ESCÁNER */}
                <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-square">
                  {scanning ? (
                    <>
                      {/* VIDEO DE LA CÁMARA */}
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* GUIAS DEL ESCÁNER */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* MARCO DEL ESCÁNER */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                          {/* ESQUINAS */}
                          <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                          <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />

                          {/* LÍNEA DE ESCANEO */}
                          <div className="absolute left-0 right-0 h-1 bg-linear-to-r from-transparent via-blue-500 to-transparent animate-pulse rounded-full" />
                        </div>

                        {/* OVERLAY */}
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/60" />
                      </div>

                      {/* INSTRUCCIONES */}
                      <div className="absolute bottom-8 left-0 right-0 text-center">
                        <p className="text-white bg-black/50 backdrop-blur-sm inline-block px-6 py-3 rounded-full text-sm font-medium">
                          📱 Coloca el código QR dentro del marco
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-900 to-purple-900">
                      <div className="text-center p-8">
                        <div className="w-24 h-24 bg-linear-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                          <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">¡Escaneo completado!</h3>
                        <p className="text-blue-200 mb-6 max-w-sm">
                          {currentProduct
                            ? `Producto encontrado: ${currentProduct.name}`
                            : 'Procesando código QR...'
                          }
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button
                            onClick={resetScanner}
                            className="px-6 py-3 bg-white text-blue-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-semibold shadow-sm"
                          >
                            Escanear otro código
                          </button>
                          {currentProduct && (
                            <button
                              onClick={() => navigateToProduct(currentProduct.id)}
                              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-semibold"
                            >
                              Ver detalles completos
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CONTROLES */}
                <div className="mt-8 flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => setScanning(!scanning)}
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg flex items-center font-medium transition-colors duration-200 ${scanning
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                  >
                    {scanning ? (
                      <>
                        <div className="w-2 h-2 bg-red-600 rounded-full mr-2" />
                        Pausar Escaneo
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-2" />
                        Reanudar Escaneo
                      </>
                    )}
                  </button>

                  <button
                    onClick={resetScanner}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center font-medium transition-colors duration-200"
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    Reiniciar
                  </button>

                  <button
                    onClick={simulateScan}
                    className="px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg flex items-center font-medium transition-colors duration-200"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Simular Escaneo
                  </button>

                  {scanResult && (
                    <div className="px-6 py-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
                        <div>
                          <p className="text-xs text-blue-800 font-medium">Código escaneado:</p>
                          <p className="font-mono text-blue-900 text-sm truncate max-w-xs">
                            {scanResult}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ✅ HISTORIAL DE ESCANEOS */}
            {scanHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg mr-3">
                      <History className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Historial de Escaneos Recientes
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {scanCount} escaneos totales • {successCount} exitosos
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Limpiar todo el historial de escaneos?')) {
                        localStorage.removeItem('scanHistory');
                        setScanHistory([]);
                        setScanCount(0);
                        setSuccessCount(0);
                      }
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="space-y-3">
                  {scanHistory.map((scan, index) => (
                    <ScanHistoryItem
                      key={`${scan.productId}-${index}-${scan.timestamp}`}
                      scan={scan}
                      onClick={navigateToProduct}
                    />
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <button
                    onClick={() => navigate('/reports')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                  >
                    Ver reportes completos de escaneos →
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* ✅ PANEL DE DETALLES */}
          <div className="lg:col-span-1 space-y-8">
            {/* DETALLES DEL PRODUCTO */}
            {currentProduct ? (
              <ScannedProductDetails
                product={currentProduct}
                onUpdateStock={handleUpdateStock}
                onViewDetails={() => navigateToProduct(currentProduct.id)}
                isLoading={loading}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-lg p-8 text-center"
              >
                <div className="w-20 h-20 bg-linear-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Información del Producto
                </h3>
                <p className="text-gray-600 mb-6">
                  Escanea un código QR para ver los detalles del producto aquí
                </p>

                <div className="space-y-4">
                  <div className="flex items-start text-left">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Busca códigos QR</p>
                      <p className="text-sm text-gray-500">Escanea códigos QR de productos en tu inventario</p>
                    </div>
                  </div>

                  <div className="flex items-start text-left">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Actualiza stock</p>
                      <p className="text-sm text-gray-500">Ajusta el inventario directamente desde aquí</p>
                    </div>
                  </div>

                  <div className="flex items-start text-left">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Acceso rápido</p>
                      <p className="text-sm text-gray-500">Ve a los detalles completos con un clic</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={simulateScan}
                    className="w-full px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-sm"
                  >
                    Probar con producto de ejemplo
                  </button>
                </div>
              </motion.div>
            )}

            {/* ✅ ESTADÍSTICAS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Estadísticas del Escáner
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">{scanCount}</div>
                  <div className="text-sm text-blue-600 font-medium">Total escaneos</div>
                </div>

                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">{successCount}</div>
                  <div className="text-sm text-green-600 font-medium">Éxitos</div>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-700">
                    {scanCount > 0 ? Math.round((successCount / scanCount) * 100) : 0}%
                  </div>
                  <div className="text-sm text-purple-600 font-medium">Tasa de éxito</div>
                </div>

                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-orange-700">
                    {scanning ? 'Activo' : 'Pausado'}
                  </div>
                  <div className="text-sm text-orange-600 font-medium">Estado</div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">Consejos para escanear:</h4>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                    <span>Mantén el código QR dentro del marco de escaneo</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                    <span>Asegura buena iluminación en el área</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                    <span>Limpia la lente de la cámara si es necesario</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                    <span>Evita reflejos en el código QR</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scanner;