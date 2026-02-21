import React, { useState, useRef, useEffect } from 'react';
import styles from './QRScanner.module.css';
import Button from '../../common/Button/Button';
import Alert from '../../common/Alert/Alert';

const QRScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (scanning) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [scanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanQR();
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const scanQR = () => {
    if (!scanning) return;

    const scan = () => {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        if (canvasRef.current.width && canvasRef.current.height) {
          context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Aquí iría la lógica de detección de QR
          // Por simplicidad, simulamos un escaneo después de 3 segundos
          setTimeout(() => {
            if (scanning) {
              // Simular resultado de QR
              const mockResult = 'PROD-001';
              setResult(mockResult);
              setScanning(false);
              if (onScan) onScan(mockResult);
            }
          }, 3000);
        }
      }
      
      if (scanning) {
        requestAnimationFrame(scan);
      }
    };

    scan();
  };

  const handleStartScan = () => {
    setError('');
    setResult('');
    setScanning(true);
  };

  const handleStopScan = () => {
    setScanning(false);
  };

  return (
    <div className={styles.scanner}>
      <div className={styles.header}>
        <h3 className={styles.title}>Escanear Código QR</h3>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className={styles.content}>
        {error && (
          <Alert type="error" message={error} closable onClose={() => setError('')} />
        )}

        {result && (
          <Alert 
            type="success" 
            message="¡Código escaneado con éxito!" 
            description={`Resultado: ${result}`}
            closable
            onClose={() => setResult('')}
          />
        )}

        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            className={styles.video}
            playsInline
          />
          <canvas
            ref={canvasRef}
            className={styles.canvas}
          />
          {scanning && <div className={styles.scanOverlay} />}
        </div>

        <div className={styles.actions}>
          {!scanning ? (
            <Button 
              variant="primary" 
              onClick={handleStartScan}
              fullWidth
            >
              Iniciar Escaneo
            </Button>
          ) : (
            <Button 
              variant="danger" 
              onClick={handleStopScan}
              fullWidth
            >
              Detener Escaneo
            </Button>
          )}
        </div>

        <p className={styles.instructions}>
          Coloca el código QR dentro del área de escaneo
        </p>
      </div>
    </div>
  );
};

export default QRScanner;