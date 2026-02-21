import { useState, useCallback, useRef, useEffect } from 'react';

export const useQRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Verificar permisos de cámara
  const checkPermission = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' });
      setPermission(result.state);
      
      result.addEventListener('change', () => {
        setPermission(result.state);
      });
    } catch (err) {
      console.error('Error checking camera permission:', err);
      setPermission('prompt');
    }
  }, []);

  useEffect(() => {
    checkPermission();
    return () => {
      (stopScanning);
    };
  }, [checkPermission,stopScanning]);

  // Obtener dispositivos de video disponibles
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
      
      return videoDevices;
    } catch (err) {
      setError('Error al obtener dispositivos de cámara');
      return [];
    }
  }, [selectedDevice]);

  useEffect(() => {
    getDevices();
  }, [getDevices]);

  const startScanning = useCallback(async (deviceId = selectedDevice) => {
    try {
      setError(null);
      setResult(null);

      const constraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'environment' }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        scanQR();
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara');
      setScanning(false);
    }
  }, [selectedDevice, scanQR]);

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
  }, []);

  const scanQR = useCallback(() => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const scan = () => {
      if (!scanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Aquí iría la lógica real de detección de QR
        // Por ahora simulamos un escaneo después de 3 segundos
        
        // Simular detección de QR
        if (Math.random() > 0.7) { // 30% de probabilidad de detectar
          const mockData = {
            type: 'product',
            id: Math.floor(Math.random() * 1000),
            sku: `PROD-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString()
          };
          
          handleScanResult(mockData);
        }
      }

      if (scanning) {
        requestAnimationFrame(scan);
      }
    };

    scan();
  }, [scanning,]);

  const handleScanResult = useCallback((data) => {
    setResult(data);
    setScanning(false);
    stopScanning();
  }, [stopScanning]);

  const generateQR = useCallback((data) => {
    try {
      // Simular generación de QR
      const qrData = typeof data === 'string' ? data : JSON.stringify(data);
      const qrCode = `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect width="200" height="200" fill="white"/>
          <text x="100" y="100" font-family="Arial" font-size="14" fill="black" text-anchor="middle">
            ${qrData.substring(0, 50)}${qrData.length > 50 ? '...' : ''}
          </text>
        </svg>
      `)}`;
      
      return qrCode;
    } catch (err) {
      setError('Error al generar código QR');
      return null;
    }
  }, []);

  const switchCamera = useCallback(async () => {
    if (devices.length < 2) {
      setError('No hay cámaras adicionales disponibles');
      return;
    }

    const currentIndex = devices.findIndex(d => d.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex].deviceId;
    
    setSelectedDevice(nextDevice);
    
    if (scanning) {
      stopScanning();
      await startScanning(nextDevice);
    }
  }, [devices, selectedDevice, scanning, stopScanning, startScanning]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    scanning,
    result,
    error,
    permission,
    devices,
    selectedDevice,
    videoRef,
    canvasRef,
    startScanning,
    stopScanning,
    generateQR,
    switchCamera,
    reset,
    hasPermission: permission === 'granted',
    hasMultipleCameras: devices.length > 1
  };
};

export default useQRScanner;