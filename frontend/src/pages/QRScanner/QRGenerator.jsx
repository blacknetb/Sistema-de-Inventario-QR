import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLoading } from '../../contexts/LoadingContext';
import qrApi from '../../api/qrApi';
import productsApi from '../../api/productsApi';
import styles from './QRScannerPage.module.css';

const QRGenerator = () => {
    const navigate = useNavigate();
    const { productId } = useParams();
    const { showNotification } = useNotification();
    const { withLoading } = useLoading();

    const [qrData, setQrData] = useState(null);
    const [product, setProduct] = useState(null);
    const [formData, setFormData] = useState({
        type: 'product',
        size: 300,
        margin: 4,
        color: '#000000',
        bgColor: '#FFFFFF',
        errorCorrection: 'H',
        includeLogo: true,
        format: 'png',
        content: ''
    });

    const [previewUrl, setPreviewUrl] = useState(null);
    const [generated, setGenerated] = useState(false);

    useEffect(() => {
        if (productId) {
            loadProduct();
        }
    }, [productId]);

    const loadProduct = async () => {
        try {
            const response = await withLoading(productsApi.getProductById(productId));
            if (response.success) {
                setProduct(response.data);
                setFormData(prev => ({
                    ...prev,
                    content: JSON.stringify({
                        id: response.data.id,
                        sku: response.data.sku,
                        name: response.data.name
                    })
                }));
            }
        } catch (error) {
            showNotification('Error al cargar el producto', 'error');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleGenerate = async () => {
        try {
            let response;
            
            if (productId) {
                response = await withLoading(
                    qrApi.generateProductQR(productId, formData)
                );
            } else {
                response = await withLoading(
                    qrApi.generateDynamicQR(
                        formData.type === 'text' ? formData.content : JSON.parse(formData.content),
                        formData
                    )
                );
            }

            if (response.success) {
                setQrData(response.data);
                setPreviewUrl(response.data.imageUrl);
                setGenerated(true);
                showNotification('Código QR generado exitosamente', 'success');
            }
        } catch (error) {
            showNotification('Error al generar el código QR', 'error');
        }
    };

    const handleDownload = async () => {
        try {
            const blob = await withLoading(
                qrApi.downloadQR(qrData.code, formData.format)
            );
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `qr_${product?.sku || 'code'}.${formData.format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            showNotification('Error al descargar el código QR', 'error');
        }
    };

    const handlePrint = async () => {
        try {
            await withLoading(qrApi.printQR(qrData.code));
            showNotification('Enviado a impresión', 'success');
        } catch (error) {
            showNotification('Error al imprimir', 'error');
        }
    };

    const handleNewQR = () => {
        setGenerated(false);
        setQrData(null);
        setPreviewUrl(null);
    };

    return (
        <div className={styles.qrGenerator}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    {productId ? 'Generar QR para Producto' : 'Generador de Códigos QR'}
                </h1>
            </div>

            {!generated ? (
                <div className={styles.generatorContent}>
                    {product && (
                        <div className={styles.productInfo}>
                            <h3>Producto seleccionado:</h3>
                            <p>{product.name} (SKU: {product.sku})</p>
                        </div>
                    )}

                    {!productId && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Tipo de QR:</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className={styles.select}
                            >
                                <option value="product">Producto</option>
                                <option value="text">Texto</option>
                                <option value="url">URL</option>
                                <option value="wifi">WiFi</option>
                                <option value="contact">Contacto</option>
                            </select>
                        </div>
                    )}

                    {!productId && formData.type !== 'product' && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Contenido:</label>
                            {formData.type === 'text' ? (
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    className={styles.textarea}
                                    rows={4}
                                    placeholder="Ingresa el texto a codificar"
                                />
                            ) : formData.type === 'url' ? (
                                <input
                                    type="url"
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="https://ejemplo.com"
                                />
                            ) : formData.type === 'wifi' ? (
                                <div className={styles.wifiForm}>
                                    <input
                                        type="text"
                                        name="ssid"
                                        placeholder="Nombre de la red (SSID)"
                                        className={styles.input}
                                    />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Contraseña"
                                        className={styles.input}
                                    />
                                    <select name="encryption" className={styles.select}>
                                        <option value="WPA">WPA/WPA2</option>
                                        <option value="WEP">WEP</option>
                                        <option value="">Sin encriptación</option>
                                    </select>
                                </div>
                            ) : formData.type === 'contact' ? (
                                <div className={styles.contactForm}>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Nombre"
                                        className={styles.input}
                                    />
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Teléfono"
                                        className={styles.input}
                                    />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email"
                                        className={styles.input}
                                    />
                                </div>
                            ) : null}
                        </div>
                    )}

                    <div className={styles.optionsSection}>
                        <h3>Opciones de personalización</h3>
                        
                        <div className={styles.optionsGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Tamaño:</label>
                                <input
                                    type="number"
                                    name="size"
                                    value={formData.size}
                                    onChange={handleChange}
                                    className={styles.input}
                                    min="100"
                                    max="1000"
                                    step="50"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Margen:</label>
                                <input
                                    type="number"
                                    name="margin"
                                    value={formData.margin}
                                    onChange={handleChange}
                                    className={styles.input}
                                    min="0"
                                    max="10"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Color:</label>
                                <input
                                    type="color"
                                    name="color"
                                    value={formData.color}
                                    onChange={handleChange}
                                    className={styles.colorInput}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Fondo:</label>
                                <input
                                    type="color"
                                    name="bgColor"
                                    value={formData.bgColor}
                                    onChange={handleChange}
                                    className={styles.colorInput}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Corrección de error:</label>
                                <select
                                    name="errorCorrection"
                                    value={formData.errorCorrection}
                                    onChange={handleChange}
                                    className={styles.select}
                                >
                                    <option value="L">Baja (7%)</option>
                                    <option value="M">Media (15%)</option>
                                    <option value="Q">Alta (25%)</option>
                                    <option value="H">Muy alta (30%)</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Formato:</label>
                                <select
                                    name="format"
                                    value={formData.format}
                                    onChange={handleChange}
                                    className={styles.select}
                                >
                                    <option value="png">PNG</option>
                                    <option value="svg">SVG</option>
                                    <option value="jpeg">JPEG</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        name="includeLogo"
                                        checked={formData.includeLogo}
                                        onChange={handleChange}
                                    />
                                    <span>Incluir logo</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className={styles.generatorActions}>
                        <button
                            onClick={() => navigate(-1)}
                            className={styles.cancelButton}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGenerate}
                            className={styles.generateButton}
                        >
                            Generar QR
                        </button>
                    </div>
                </div>
            ) : (
                <div className={styles.resultContent}>
                    <div className={styles.previewSection}>
                        <h3>Vista previa</h3>
                        <div className={styles.qrPreview}>
                            {previewUrl && (
                                <img 
                                    src={previewUrl} 
                                    alt="Código QR generado"
                                    className={styles.previewImage}
                                />
                            )}
                        </div>
                    </div>

                    <div className={styles.qrInfo}>
                        <p><strong>Código:</strong> {qrData.code}</p>
                        <p><strong>Formato:</strong> {qrData.format}</p>
                        <p><strong>Tamaño:</strong> {qrData.size}px</p>
                    </div>

                    <div className={styles.resultActions}>
                        <button
                            onClick={handleDownload}
                            className={styles.downloadButton}
                        >
                            📥 Descargar
                        </button>
                        <button
                            onClick={handlePrint}
                            className={styles.printButton}
                        >
                            🖨️ Imprimir
                        </button>
                        <button
                            onClick={handleNewQR}
                            className={styles.newButton}
                        >
                            Generar otro
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRGenerator;