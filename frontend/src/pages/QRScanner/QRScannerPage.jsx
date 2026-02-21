import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import qrApi from '../../api/qrApi';
import productsApi from '../../api/productsApi';
import styles from './QRScannerPage.module.css';

const QRScannerPage = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();
    
    const [scanner, setScanner] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [scannedProduct, setScannedProduct] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [selectedCamera, setSelectedCamera] = useState('environment');
    const scannerRef = useRef(null);

    useEffect(() => {
        initializeScanner();
        
        return () => {
            if (scanner) {
                scanner.stop().catch(console.error);
            }
        };
    }, []);

    const initializeScanner = () => {
        const qrScanner = new Html5QrcodeScanner(
            'qr-reader',
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                showZoomSliderIfSupported: true,
                defaultZoomValueIfSupported: 2
            },
            false
        );

        setScanner(qrScanner);
    };

    const startScanning = () => {
        if (scanner) {
            scanner.render(onScanSuccess, onScanError);
            setScanning(true);
        }
    };

    const stopScanning = () => {
        if (scanner) {
            scanner.clear();
            setScanning(false);
        }
    };

    const onScanSuccess = async (decodedText) => {
        setLastResult(decodedText);
        
        try {
            // Validar si es un código QR del sistema
            const validation = await withLoading(qrApi.validateQR(decodedText));
            
            if (validation.success && validation.data) {
                // Buscar producto asociado
                if (validation.data.productId) {
                    const product = await withLoading(
                        productsApi.getProductById(validation.data.productId)
                    );
                    
                    if (product.success) {
                        setScannedProduct(product.data);
                        setShowResult(true);
                        stopScanning();
                        
                        showNotification(
                            `Producto encontrado: ${product.data.name}`,
                            'success'
                        );
                    }
                } else {
                    setScannedProduct({
                        code: decodedText,
                        data: validation.data
                    });
                    setShowResult(true);
                    stopScanning();
                }
            } else {
                showNotification('Código QR no válido en el sistema', 'warning');
            }
        } catch (error) {
            showNotification('Error al procesar el código QR', 'error');
        }
    };

    const onScanError = (error) => {
        // Ignorar errores comunes de lectura
        if (!error.includes('NotFoundException')) {
            console.warn('Scan error:', error);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const response = await withLoading(qrApi.decodeQR(file));
            
            if (response.success) {
                setLastResult(response.data.content);
                onScanSuccess(response.data.content);
            }
        } catch (error) {
            showNotification('Error al decodificar la imagen', 'error');
        }
    };

    const handleViewProduct = () => {
        if (scannedProduct?.id) {
            navigate(`/products/${scannedProduct.id}`);
        }
    };

    const handleScanAgain = () => {
        setShowResult(false);
        setScannedProduct(null);
        setLastResult(null);
        startScanning();
    };

    const handleGenerateQR = () => {
        navigate('/qr/generate');
    };

    return (
        <div className={styles.qrScannerPage}>
            <div className={styles.header}>
                <h1 className={styles.title}>Escáner QR</h1>
                <button
                    onClick={handleGenerateQR}
                    className={styles.generateButton}
                >
                    Generar QR
                </button>
            </div>

            <div className={styles.content}>
                {!showResult ? (
                    <div className={styles.scannerContainer}>
                        <div className={styles.scannerOptions}>
                            <div className={styles.cameraSelect}>
                                <label>Seleccionar cámara:</label>
                                <select
                                    value={selectedCamera}
                                    onChange={(e) => setSelectedCamera(e.target.value)}
                                    className={styles.select}
                                >
                                    <option value="environment">Cámara trasera</option>
                                    <option value="user">Cámara frontal</option>
                                </select>
                            </div>

                            {!scanning ? (
                                <button
                                    onClick={startScanning}
                                    className={styles.startButton}
                                >
                                    Iniciar Escáner
                                </button>
                            ) : (
                                <button
                                    onClick={stopScanning}
                                    className={styles.stopButton}
                                >
                                    Detener Escáner
                                </button>
                            )}

                            <div className={styles.fileUpload}>
                                <label className={styles.fileLabel}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className={styles.fileInput}
                                    />
                                    <span className={styles.fileButton}>
                                        📷 Subir imagen QR
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className={styles.scannerWrapper}>
                            <div id="qr-reader" className={styles.scanner}></div>
                            
                            {!scanning && (
                                <div className={styles.scannerPlaceholder}>
                                    <div className={styles.placeholderIcon}>📷</div>
                                    <p>Haz clic en "Iniciar Escáner" para comenzar</p>
                                </div>
                            )}
                        </div>

                        {lastResult && (
                            <div className={styles.lastResult}>
                                <h3>Último código escaneado:</h3>
                                <p className={styles.resultCode}>{lastResult}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.resultContainer}>
                        <h2 className={styles.resultTitle}>Resultado del Escaneo</h2>
                        
                        {scannedProduct?.id ? (
                            <div className={styles.productResult}>
                                <div className={styles.productHeader}>
                                    {scannedProduct.image && (
                                        <img 
                                            src={scannedProduct.image} 
                                            alt={scannedProduct.name}
                                            className={styles.productImage}
                                        />
                                    )}
                                    <div className={styles.productInfo}>
                                        <h3>{scannedProduct.name}</h3>
                                        <p className={styles.productSku}>
                                            SKU: {scannedProduct.sku || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className={styles.productDetails}>
                                    <div className={styles.detailRow}>
                                        <span>Precio:</span>
                                        <strong>${scannedProduct.price?.toFixed(2)}</strong>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span>Stock:</span>
                                        <strong className={
                                            scannedProduct.stock < 10 ? styles.lowStock : ''
                                        }>
                                            {scannedProduct.stock}
                                        </strong>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span>Categoría:</span>
                                        <span>{scannedProduct.category?.name || 'N/A'}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span>Proveedor:</span>
                                        <span>{scannedProduct.supplier?.name || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className={styles.resultActions}>
                                    <button
                                        onClick={handleViewProduct}
                                        className={styles.viewButton}
                                    >
                                        Ver Detalles
                                    </button>
                                    <button
                                        onClick={handleScanAgain}
                                        className={styles.scanAgainButton}
                                    >
                                        Escanear Otro
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.genericResult}>
                                <div className={styles.resultIcon}>✅</div>
                                <p className={styles.resultMessage}>
                                    Código QR válido
                                </p>
                                <div className={styles.resultData}>
                                    <pre>{JSON.stringify(scannedProduct?.data, null, 2)}</pre>
                                </div>
                                <button
                                    onClick={handleScanAgain}
                                    className={styles.scanAgainButton}
                                >
                                    Escanear Otro
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScannerPage;