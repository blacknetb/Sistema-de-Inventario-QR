import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiEdit, 
  FiSave, 
  FiTrash2, 
  FiCopy, 
  FiPrinter,
  FiDownload,
  FiShare2,
  FiTag,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiUser,
  FiBarChart2,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiCamera,
  FiQrCode,
  FiHistory,
  FiShoppingCart,
  FiTruck,
  FiHome,
  FiMapPin,
  FiLayers
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode.react';
import logger from '../utils/logger';
import '../assets/styles/pages/pages.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.pathname.includes('/edit');
  const isNewMode = location.pathname.includes('/new');
  
  const [loading, setLoading] = useState(!isNewMode);
  const [editing, setEditing] = useState(isNewMode || isEditMode);
  const [product, setProduct] = useState({
    id: isNewMode ? null : id,
    name: '',
    sku: '',
    barcode: '',
    category: '',
    description: '',
    price: 0,
    cost: 0,
    quantity: 0,
    minStock: 10,
    maxStock: 100,
    unit: 'unidad',
    weight: 0,
    dimensions: '0x0x0',
    supplier: '',
    location: '',
    status: 'available',
    notes: '',
    tags: [],
    images: [],
    lastUpdated: '',
    createdBy: '',
    createdAt: ''
  });

  const [history, setHistory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Datos de ejemplo para el historial
  const sampleHistory = [
    { id: 1, action: 'stock_update', user: 'Juan Pérez', quantity: 50, oldValue: 20, newValue: 70, timestamp: '2024-01-15 10:30', notes: 'Ingreso por compra' },
    { id: 2, action: 'price_update', user: 'Admin', oldValue: 29.99, newValue: 34.99, timestamp: '2024-01-14 15:45', notes: 'Ajuste por inflación' },
    { id: 3, action: 'stock_update', user: 'María García', quantity: -15, oldValue: 70, newValue: 55, timestamp: '2024-01-13 11:20', notes: 'Venta a cliente' },
    { id: 4, action: 'product_edit', user: 'Carlos López', timestamp: '2024-01-12 09:15', notes: 'Actualización de descripción' },
    { id: 5, action: 'stock_update', user: 'Sistema', quantity: 25, oldValue: 55, newValue: 80, timestamp: '2024-01-10 14:30', notes: 'Ajuste automático' }
  ];

  // Datos de ejemplo para proveedores
  const sampleSuppliers = [
    { id: 1, name: 'Tecnología Global S.A.', contact: 'Juan Martínez', email: 'juan@tecnologiaglobal.com', phone: '+1 234 567 890' },
    { id: 2, name: 'ElectroParts Ltda.', contact: 'María Rodríguez', email: 'maria@electroparts.com', phone: '+1 987 654 321' },
    { id: 3, name: 'Suministros Industriales', contact: 'Carlos Sánchez', email: 'carlos@suministros.com', phone: '+1 555 123 456' }
  ];

  // Categorías disponibles
  const availableCategories = [
    'Electrónica',
    'Computación',
    'Muebles',
    'Oficina',
    'Herramientas',
    'Materiales',
    'Insumos',
    'Alimentos',
    'Bebidas',
    'Limpieza',
    'Seguridad',
    'Otros'
  ];

  useEffect(() => {
    if (!isNewMode) {
      fetchProduct();
      fetchHistory();
    }
    fetchSuppliers();
    fetchCategories();
  }, [id, isNewMode]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      // Simular llamada a API
      setTimeout(() => {
        setProduct({
          id: id,
          name: 'Laptop Dell XPS 13',
          sku: 'LP-DEL-XPS13-001',
          barcode: '1234567890123',
          category: 'Electrónica',
          description: 'Laptop ultradelgada con pantalla InfinityEdge, procesador Intel Core i7, 16GB RAM, 512GB SSD. Ideal para profesionales y estudiantes.',
          price: 1299.99,
          cost: 899.99,
          quantity: 15,
          minStock: 5,
          maxStock: 50,
          unit: 'unidad',
          weight: 1.2,
          dimensions: '30x20x1.5',
          supplier: 'Tecnología Global S.A.',
          location: 'Almacén A - Estante B3',
          status: 'available',
          notes: 'Producto de alta demanda. Mantener stock mínimo de 5 unidades.',
          tags: ['laptop', 'dell', 'premium', 'portátil', 'trabajo'],
          images: [
            'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800',
            'https://images.unsplash.com/photo-1515343480029-43cdfe6b6aae?auto=format&fit=crop&w-800'
          ],
          lastUpdated: '2024-01-15 10:30:00',
          createdBy: 'Admin Principal',
          createdAt: '2023-12-01 08:00:00'
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      logger.error('Error fetching product:', error);
      toast.error('Error al cargar el producto');
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistory(sampleHistory);
    } catch (error) {
      logger.error('Error fetching history:', error);
      toast.error('Error al cargar el historial');
    }
  };

  const fetchSuppliers = async () => {
    try {
      setSuppliers(sampleSuppliers);
    } catch (error) {
      logger.error('Error fetching suppliers:', error);
      toast.error('Error al cargar proveedores');
    }
  };

  const fetchCategories = async () => {
    try {
      setCategories(availableCategories);
    } catch (error) {
      logger.error('Error fetching categories:', error);
      toast.error('Error al cargar categorías');
    }
  };

  const handleInputChange = (field, value) => {
    setProduct(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagAdd = (tag) => {
    if (tag && !product.tags.includes(tag)) {
      setProduct(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setProduct(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validaciones
      if (!product.name.trim()) {
        toast.error('El nombre del producto es requerido');
        setLoading(false);
        return;
      }

      if (product.price <= 0) {
        toast.error('El precio debe ser mayor a 0');
        setLoading(false);
        return;
      }

      // Simular guardado
      setTimeout(() => {
        toast.success(isNewMode ? 'Producto creado exitosamente' : 'Producto actualizado exitosamente');
        setEditing(false);
        setLoading(false);
        
        if (isNewMode) {
          navigate(`/products/${product.id || 'new-id'}`);
        }
      }, 1500);
    } catch (error) {
      logger.error('Error saving product:', error);
      toast.error('Error al guardar el producto');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        toast.success('Producto eliminado exitosamente');
        navigate('/products');
        setLoading(false);
      }, 1000);
    } catch (error) {
      logger.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
      setLoading(false);
    }
  };

  const handleStockUpdate = (type) => {
    const quantity = prompt(`Ingrese la cantidad para ${type === 'add' ? 'agregar' : 'retirar'} stock:`);
    if (quantity && !isNaN(quantity)) {
      const qty = parseInt(quantity);
      const newQuantity = type === 'add' ? product.quantity + qty : product.quantity - qty;
      
      if (newQuantity < 0) {
        toast.error('No puede haber stock negativo');
        return;
      }

      handleInputChange('quantity', newQuantity);
      toast.success(`Stock ${type === 'add' ? 'agregado' : 'retirado'} exitosamente`);
    }
  };

  const generateQRContent = () => {
    return JSON.stringify({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      quantity: product.quantity,
      lastUpdated: new Date().toISOString()
    }, null, 2);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(product, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `producto_${product.sku || product.name}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Datos exportados exitosamente');
  };

  const calculateProfit = () => {
    return product.price - product.cost;
  };

  const calculateProfitMargin = () => {
    if (product.cost === 0) return 0;
    return ((product.price - product.cost) / product.cost * 100).toFixed(2);
  };

  const getStockStatus = () => {
    if (product.quantity <= product.minStock) return 'low';
    if (product.quantity >= product.maxStock) return 'high';
    return 'normal';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'success';
      case 'out_of_stock': return 'danger';
      case 'discontinued': return 'warning';
      case 'incoming': return 'info';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="product-details-loading">
        <div className="loading-spinner"></div>
        <p>Cargando producto...</p>
      </div>
    );
  }

  return (
    <div className="product-details">
      {/* Header */}
      <div className="product-header">
        <button className="btn-back" onClick={() => navigate('/products')}>
          <FiArrowLeft /> Volver a Productos
        </button>
        
        <div className="header-actions">
          {!editing ? (
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                <FiEdit /> Editar
              </button>
              <button className="btn btn-secondary" onClick={() => setShowQR(true)}>
                <FiQrCode /> Ver QR
              </button>
              <button className="btn btn-secondary" onClick={handlePrint}>
                <FiPrinter /> Imprimir
              </button>
              <button className="btn btn-secondary" onClick={handleExport}>
                <FiDownload /> Exportar
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Guardando...' : <><FiSave /> Guardar</>}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  if (isNewMode) {
                    navigate('/products');
                  } else {
                    setEditing(false);
                    fetchProduct();
                  }
                }}
              >
                <FiX /> Cancelar
              </button>
            </>
          )}
          
          {!isNewMode && !editing && (
            <button 
              className="btn btn-danger" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              <FiTrash2 /> Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="product-content">
        {/* Left Column - Información Principal */}
        <div className="product-main-info">
          <div className="product-basic-info">
            <div className="product-header-info">
              <div className="product-title-section">
                {editing ? (
                  <input
                    type="text"
                    className="product-title-input"
                    value={product.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nombre del producto"
                  />
                ) : (
                  <h1 className="product-title">{product.name}</h1>
                )}
                
                <div className="product-meta">
                  {editing ? (
                    <input
                      type="text"
                      className="product-sku-input"
                      value={product.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="SKU"
                    />
                  ) : (
                    <span className="product-sku">
                      <FiTag /> SKU: {product.sku || 'N/A'}
                    </span>
                  )}
                  
                  <span className={`product-status status-${getStatusColor(product.status)}`}>
                    {product.status === 'available' && <FiCheckCircle />}
                    {product.status === 'out_of_stock' && <FiAlertCircle />}
                    {product.status === 'discontinued' && <FiX />}
                    {product.status === 'incoming' && <FiTruck />}
                    {product.status}
                  </span>
                </div>
              </div>

              <div className="product-price-section">
                {editing ? (
                  <div className="price-inputs">
                    <div className="price-input-group">
                      <label>Costo:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={product.cost}
                        onChange={(e) => handleInputChange('cost', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="price-input-group">
                      <label>Precio:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={product.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="product-price">
                      <FiDollarSign />
                      <span className="price-amount">{product.price.toFixed(2)}</span>
                      <span className="price-currency">USD</span>
                    </div>
                    <div className="product-profit">
                      <span className="profit-amount">+{calculateProfit().toFixed(2)}</span>
                      <span className="profit-margin">({calculateProfitMargin()}%)</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="product-description-section">
              <h3>
                <FiPackage /> Descripción
              </h3>
              {editing ? (
                <textarea
                  className="product-description-input"
                  value={product.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  placeholder="Descripción del producto..."
                />
              ) : (
                <p className="product-description">{product.description}</p>
              )}
            </div>

            <div className="product-details-grid">
              <div className="detail-item">
                <h4>
                  <FiPackage /> Cantidad en Stock
                </h4>
                {editing ? (
                  <input
                    type="number"
                    value={product.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                  />
                ) : (
                  <div className="stock-info">
                    <div className="stock-quantity">
                      <span className={`stock-value stock-${getStockStatus()}`}>
                        {product.quantity} {product.unit}
                      </span>
                      <div className="stock-actions">
                        <button 
                          className="btn-icon btn-success"
                          onClick={() => handleStockUpdate('add')}
                          title="Agregar stock"
                        >
                          <FiTrendingUp />
                        </button>
                        <button 
                          className="btn-icon btn-danger"
                          onClick={() => handleStockUpdate('remove')}
                          title="Retirar stock"
                        >
                          <FiTrendingDown />
                        </button>
                      </div>
                    </div>
                    <div className="stock-limits">
                      <span>Mín: {product.minStock}</span>
                      <span>Máx: {product.maxStock}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="detail-item">
                <h4>
                  <FiLayers /> Categoría
                </h4>
                {editing ? (
                  <select
                    value={product.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : (
                  <span className="category-badge">{product.category}</span>
                )}
              </div>

              <div className="detail-item">
                <h4>
                  <FiMapPin /> Ubicación
                </h4>
                {editing ? (
                  <input
                    type="text"
                    value={product.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Ej: Almacén A - Estante B3"
                  />
                ) : (
                  <span className="location-text">
                    <FiHome /> {product.location}
                  </span>
                )}
              </div>

              <div className="detail-item">
                <h4>
                  <FiTruck /> Proveedor
                </h4>
                {editing ? (
                  <select
                    value={product.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                  >
                    <option value="">Seleccionar proveedor</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.name}>{sup.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="supplier-text">{product.supplier}</span>
                )}
              </div>

              <div className="detail-item">
                <h4>
                  <FiBarChart2 /> Especificaciones
                </h4>
                <div className="specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Peso:</span>
                    {editing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={product.weight}
                        onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
                      />
                    ) : (
                      <span className="spec-value">{product.weight} kg</span>
                    )}
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Dimensiones:</span>
                    {editing ? (
                      <input
                        type="text"
                        value={product.dimensions}
                        onChange={(e) => handleInputChange('dimensions', e.target.value)}
                        placeholder="Ej: 30x20x1.5"
                      />
                    ) : (
                      <span className="spec-value">{product.dimensions} cm</span>
                    )}
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Unidad:</span>
                    {editing ? (
                      <input
                        type="text"
                        value={product.unit}
                        onChange={(e) => handleInputChange('unit', e.target.value)}
                        placeholder="Ej: unidad, kg, litro"
                      />
                    ) : (
                      <span className="spec-value">{product.unit}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="detail-item full-width">
                <h4>
                  <FiTag /> Etiquetas
                </h4>
                {editing ? (
                  <div className="tags-editor">
                    <div className="tags-input">
                      <input
                        type="text"
                        placeholder="Agregar etiqueta..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            handleTagAdd(e.target.value.trim());
                            e.target.value = '';
                          }
                        }}
                      />
                      <button className="btn-icon" onClick={(e) => {
                        const input = e.target.previousSibling;
                        if (input.value.trim()) {
                          handleTagAdd(input.value.trim());
                          input.value = '';
                        }
                      }}>
                        <FiTag />
                      </button>
                    </div>
                    <div className="tags-list">
                      {product.tags.map(tag => (
                        <span key={tag} className="tag">
                          {tag}
                          <button onClick={() => handleTagRemove(tag)}>
                            <FiX />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="tags-list">
                    {product.tags.map(tag => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="product-notes-section">
              <h3>
                <FiAlertCircle /> Notas
              </h3>
              {editing ? (
                <textarea
                  className="product-notes-input"
                  value={product.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  placeholder="Notas adicionales sobre el producto..."
                />
              ) : (
                <p className="product-notes">{product.notes || 'No hay notas adicionales.'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Información Adicional */}
        <div className="product-sidebar">
          {/* QR Code */}
          <div className="sidebar-card">
            <h3>
              <FiQrCode /> Código QR
            </h3>
            <div className="qr-container">
              <QRCode 
                value={generateQRContent()} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="qr-actions">
              <button className="btn btn-secondary btn-sm">
                <FiDownload /> Descargar
              </button>
              <button className="btn btn-secondary btn-sm">
                <FiShare2 /> Compartir
              </button>
            </div>
          </div>

          {/* Historial */}
          <div className="sidebar-card">
            <h3>
              <FiHistory /> Historial Reciente
            </h3>
            <div className="history-list">
              {history.slice(0, 5).map(entry => (
                <div key={entry.id} className="history-item">
                  <div className="history-icon">
                    {entry.action.includes('stock') && <FiPackage />}
                    {entry.action.includes('price') && <FiDollarSign />}
                    {entry.action.includes('edit') && <FiEdit />}
                  </div>
                  <div className="history-content">
                    <p className="history-action">
                      {entry.action === 'stock_update' && 'Actualización de stock'}
                      {entry.action === 'price_update' && 'Cambio de precio'}
                      {entry.action === 'product_edit' && 'Edición de producto'}
                    </p>
                    <div className="history-meta">
                      <span className="history-user">
                        <FiUser /> {entry.user}
                      </span>
                      <span className="history-time">
                        <FiCalendar /> {entry.timestamp}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="history-notes">{entry.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {history.length > 5 && (
              <button 
                className="btn btn-link"
                onClick={() => {/* Navegar a historial completo */}}
              >
                Ver historial completo →
              </button>
            )}
          </div>

          {/* Metadatos */}
          <div className="sidebar-card">
            <h3>
              <FiBarChart2 /> Metadatos
            </h3>
            <div className="metadata-list">
              <div className="metadata-item">
                <span className="metadata-label">Creado por:</span>
                <span className="metadata-value">{product.createdBy}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Fecha creación:</span>
                <span className="metadata-value">{product.createdAt}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Última actualización:</span>
                <span className="metadata-value">{product.lastUpdated}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Código de barras:</span>
                <span className="metadata-value">{product.barcode || 'N/A'}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Valor total en stock:</span>
                <span className="metadata-value">
                  ${(product.price * product.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="sidebar-card">
            <h3>Acciones Rápidas</h3>
            <div className="quick-actions">
              <button 
                className="btn btn-secondary btn-block"
                onClick={() => handleStockUpdate('add')}
              >
                <FiTrendingUp /> Agregar Stock
              </button>
              <button 
                className="btn btn-secondary btn-block"
                onClick={() => handleStockUpdate('remove')}
              >
                <FiTrendingDown /> Retirar Stock
              </button>
              <button className="btn btn-secondary btn-block">
                <FiShoppingCart /> Crear Orden
              </button>
              <button className="btn btn-secondary btn-block">
                <FiCopy /> Duplicar Producto
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal confirm-modal">
            <div className="modal-header">
              <h3>Confirmar Eliminación</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="confirm-content">
                <FiAlertCircle className="confirm-icon" />
                <p>¿Estás seguro de que deseas eliminar el producto <strong>{product.name}</strong>?</p>
                <p className="confirm-warning">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Eliminar Producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de QR */}
      {showQR && (
        <div className="modal-overlay">
          <div className="modal qr-modal">
            <div className="modal-header">
              <h3>Código QR del Producto</h3>
              <button className="modal-close" onClick={() => setShowQR(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="qr-modal-content">
                <QRCode 
                  value={generateQRContent()} 
                  size={300}
                  level="H"
                  includeMargin={true}
                />
                <div className="qr-info">
                  <h4>{product.name}</h4>
                  <p>SKU: {product.sku}</p>
                  <p>Última actualización: {new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary">
                <FiDownload /> Descargar QR
              </button>
              <button className="btn btn-secondary" onClick={() => setShowQR(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;