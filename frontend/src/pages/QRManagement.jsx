import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  QrCode, Download, Printer, Scan, Copy,
  RefreshCw, Search, CheckCircle, AlertCircle,
  Eye, Share2,
  Loader2, BarChart3, Database, Layers, Package
} from 'lucide-react';
import QRCode from 'qrcode.react';
import { toast } from 'react-hot-toast';

// ✅ CORRECCIÓN: Configuración centralizada
const API_CONFIG = {
  BASE_URL: globalThis.APP_CONFIG?.apiUrl || 'http://localhost:3000/api',
  getAuthHeader: () => ({
    'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  })
};

// ✅ CORRECCIÓN: Componente ProductRow
const ProductRow = React.memo(({ product, isSelected, onSelect, onGenerateQR, onView }) => {
  const stockStatus = useMemo(() => {
    const stock = Number(product.stock) || 0;
    if (stock === 0) return { color: 'red', label: 'Sin stock', bg: 'bg-red-100', text: 'text-red-800' };
    if (stock <= 10) return { color: 'orange', label: 'Bajo', bg: 'bg-orange-100', text: 'text-orange-800' };
    if (stock <= 50) return { color: 'yellow', label: 'Medio', bg: 'bg-yellow-100', text: 'text-yellow-800' };
    return { color: 'green', label: 'Alto', bg: 'bg-green-100', text: 'text-green-800' };
  }, [product.stock]);

  const handleViewClick = useCallback((e, id) => {
    e.stopPropagation();
    onView(id);
  }, [onView]);

  const handleGenerateClick = useCallback((e, product) => {
    e.stopPropagation();
    onGenerateQR(product);
  }, [onGenerateQR]);

  return (
    <tr
      className={`hover:bg-gray-50 transition-all duration-200 cursor-pointer group ${isSelected ? 'bg-blue-50' : ''
        }`}
      onClick={() => onSelect(product)}
      role="row"
      aria-selected={isSelected}
    >
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="shrink-0 h-10 w-10 bg-linear-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <Package className="h-5 w-5 text-gray-500" />
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={product.name}>
              {product.name}
            </div>
            <div className="text-xs text-gray-500">{product.category || 'Sin categoría'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 font-mono" title={product.sku}>
          {product.sku}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${stockStatus.bg} ${stockStatus.text}`}>
          {product.stock} unidades
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => handleViewClick(e, product.id)}
            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors duration-200 rounded hover:bg-blue-50"
            aria-label={`Ver detalles de ${product.name}`}
            title="Ver detalles"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleGenerateClick(e, product)}
            className="px-3 py-1.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center"
            aria-label={`Generar QR para ${product.name}`}
          >
            <QrCode className="w-4 h-4 mr-1.5" />
            QR
          </button>
        </div>
      </td>
    </tr>
  );
});

ProductRow.displayName = 'ProductRow';

ProductRow.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    sku: PropTypes.string.isRequired,
    stock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    category: PropTypes.string,
    image: PropTypes.string,
    inventoryId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onGenerateQR: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired
};

// ✅ CORRECCIÓN: Componente ProductFilters
const ProductFilters = React.memo(({ searchTerm, setSearchTerm, categories, selectedCategory, setSelectedCategory }) => {
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  const handleCategoryChange = useCallback((e) => {
    setSelectedCategory(e.target.value);
  }, [setSelectedCategory]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar producto o SKU..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
          aria-label="Buscar productos"
        />
      </div>

      <div className="sm:w-48">
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 bg-white"
          aria-label="Filtrar por categoría"
        >
          <option value="all">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});

ProductFilters.displayName = 'ProductFilters';

ProductFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedCategory: PropTypes.string.isRequired,
  setSelectedCategory: PropTypes.func.isRequired
};

// ✅ CORRECCIÓN: Componente QRHistoryItem
const QRHistoryItem = React.memo(({ item, onRegenerate }) => {
  const handleRegenerateClick = useCallback(() => {
    onRegenerate(item);
  }, [onRegenerate, item]);

  const formattedDate = useMemo(() => {
    return new Date(item.generatedAt).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [item.generatedAt]);

  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <div className="shrink-0 h-8 w-8 bg-linear-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
            <QrCode className="h-4 w-4 text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 truncate" title={item.productName}>
              {item.productName}
            </p>
            <p className="text-xs text-gray-500">
              Generado: {formattedDate}
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={handleRegenerateClick}
        className="ml-2 p-1.5 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded hover:bg-blue-50"
        aria-label="Regenerar QR"
        title="Regenerar QR"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
});

QRHistoryItem.displayName = 'QRHistoryItem';

QRHistoryItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    productName: PropTypes.string.isRequired,
    generatedAt: PropTypes.string.isRequired,
    productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    sku: PropTypes.string.isRequired,
    data: PropTypes.string
  }).isRequired,
  onRegenerate: PropTypes.func.isRequired
};

// ✅ CORRECCIÓN: Funciones auxiliares para manejo de productos
const renderErrorState = (error) => (
  <div className="text-center py-12">
    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
    <p className="text-gray-600 mb-4">{error}</p>
    <button
      onClick={() => globalThis.location.reload()}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
    >
      Reintentar
    </button>
  </div>
);

const renderNoProductsState = (setSearchTerm, setSelectedCategory) => (
  <div className="text-center py-12 bg-gray-50 rounded-xl">
    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No se encontraron productos
    </h3>
    <p className="text-gray-600 mb-6">
      Intenta con otros términos de búsqueda o categorías.
    </p>
    <button
      onClick={() => {
        setSearchTerm("");
        setSelectedCategory("all");
      }}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
    >
      Limpiar filtros
    </button>
  </div>
);

const renderProductsTable = (filteredProducts, selectedProduct, setSelectedProduct, handleGenerateQR) => (
  <div className="overflow-hidden border border-gray-200 rounded-xl">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Producto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredProducts.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              isSelected={selectedProduct?.id === product.id}
              onSelect={setSelectedProduct}
              onGenerateQR={handleGenerateQR}
              onView={(id) => globalThis.open(`/products/${id}`, "_blank")}
            />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const getProductContent = (props) => {
  const { error, filteredProducts, setSearchTerm, setSelectedCategory, selectedProduct, setSelectedProduct, handleGenerateQR } = props;

  if (error) {
    return renderErrorState(error);
  }

  if (filteredProducts.length === 0) {
    return renderNoProductsState(setSearchTerm, setSelectedCategory);
  }

  return renderProductsTable(filteredProducts, selectedProduct, setSelectedProduct, handleGenerateQR);
};

// ✅ CORRECCIÓN: Funciones auxiliares para handlePrintQR
const generatePrintHTML = (selectedProduct) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>QR Code - ${selectedProduct.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #ffffff;
          }
          
          .print-container {
            width: 100%;
            max-width: 600px;
            border: 2px solid #e5e7eb;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f3f4f6;
          }
          
          .header h1 {
            margin: 0 0 10px 0;
            color: #111827;
            font-size: 28px;
            font-weight: 700;
          }
          
          .header .subtitle {
            color: #6b7280;
            font-size: 16px;
            font-weight: 500;
          }
          
          .qr-section {
            text-align: center;
            margin: 30px 0;
            padding: 30px;
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            border-radius: 12px;
          }
          
          .qr-container {
            display: inline-block;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          
          .product-info {
            background: #f8fafc;
            border-radius: 12px;
            padding: 24px;
            margin: 30px 0;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-top: 16px;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
          }
          
          .info-label {
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .info-value {
            font-size: 14px;
            color: #111827;
            font-weight: 600;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
          }
          
          .logo {
            display: inline-block;
            margin-bottom: 10px;
            font-weight: 700;
            color: #374151;
            font-size: 14px;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .print-container {
              border: none;
              box-shadow: none;
              padding: 20px;
            }
            
            .qr-section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            <h1>Código QR de Producto</h1>
            <div class="subtitle">Sistema de Inventario</div>
          </div>
          
          <div class="qr-section">
            <div class="qr-container" id="qr-code"></div>
          </div>
          
          <div class="product-info">
            <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 600;">
              ${selectedProduct.name}
            </h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">SKU</span>
                <span class="info-value">${selectedProduct.sku}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Categoría</span>
                <span class="info-value">${selectedProduct.category || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Stock disponible</span>
                <span class="info-value">${selectedProduct.stock} unidades</span>
              </div>
              <div class="info-item">
                <span class="info-label">ID de Producto</span>
                <span class="info-value">${selectedProduct.id}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div class="logo">Sistema de Inventario QR</div>
            <div>${globalThis.location.hostname}</div>
            <div>Generado: ${new Date().toLocaleString('es-MX')}</div>
          </div>
        </div>
        
        <script>
          // Insertar el código QR simulado
          const qrContainer = document.getElementById('qr-code');
          const qrCanvas = document.createElement('canvas');
          qrCanvas.width = 200;
          qrCanvas.height = 200;
          
          const ctx = qrCanvas.getContext('2d');
          // QR simulado
          ctx.fillStyle = '#000000';
          ctx.fillRect(20, 20, 160, 160);
          
          qrContainer.appendChild(qrCanvas);
          
          // Imprimir automáticamente
          setTimeout(() => {
            window.print();
            setTimeout(() => window.close(), 1000);
          }, 500);
        </script>
      </body>
    </html>
  `;
};

const handlePrintAndClose = (printWindow) => {
  setTimeout(() => {
    printWindow.print();
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.close();
      }
    }, 1000);
  }, 500);
};

const setupPrintWindow = (printWindow, fullHTML) => {
  const doc = printWindow.document;

  // Usar srcdoc si está disponible (la forma más moderna)
  if ('srcdoc' in doc) {
    doc.srcdoc = fullHTML;
  } else {
    // Fallback: usar innerHTML en el elemento raíz
    const root = doc.documentElement || doc.createElement('html');
    root.innerHTML = fullHTML;
    if (!doc.documentElement) {
      doc.appendChild(root);
    }
  }

  printWindow.onload = () => handlePrintAndClose(printWindow);
};

// ✅ CORRECCIÓN: Componente principal optimizado
const QRManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qrSize, setQrSize] = useState(200);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeText, setIncludeText] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [qrHistory, setQrHistory] = useState([]);

  const qrRef = useRef(null);
  const printWindowRef = useRef(null);

  // ✅ CORRECCIÓN: Cargar productos y categorías
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`${API_CONFIG.BASE_URL}/products?limit=50`, {
            headers: API_CONFIG.getAuthHeader()
          }),
          fetch(`${API_CONFIG.BASE_URL}/products/categories`, {
            headers: API_CONFIG.getAuthHeader()
          })
        ]);

        if (!productsRes.ok || !categoriesRes.ok) {
          throw new Error('Error al cargar datos');
        }

        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        const validProducts = Array.isArray(productsData.products)
          ? productsData.products
          : Array.isArray(productsData)
            ? productsData
            : [];

        setProducts(validProducts);
        setFilteredProducts(validProducts);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);

        if (validProducts.length > 0 && !selectedProduct) {
          setSelectedProduct(validProducts[0]);
        }

        // Cargar historial desde localStorage
        const savedHistory = localStorage.getItem('qrHistory');
        if (savedHistory) {
          try {
            setQrHistory(JSON.parse(savedHistory));
          } catch (e) {
            console.warn('Error parsing QR history:', e);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);

        // Datos de ejemplo para desarrollo
        if (process.env.NODE_ENV === 'development') {
          const sampleProducts = [
            {
              id: 1,
              name: 'Laptop Dell XPS 15',
              sku: 'LP-DELL-XPS15',
              stock: 25,
              category: 'Electrónica',
              image: null
            },
            {
              id: 2,
              name: 'Mouse Logitech MX Master 3',
              sku: 'MS-LOG-MX3',
              stock: 150,
              category: 'Accesorios',
              image: null
            },
            {
              id: 3,
              name: 'Teclado Mecánico RGB',
              sku: 'KB-MEC-RGB',
              stock: 45,
              category: 'Accesorios',
              image: null
            },
            {
              id: 4,
              name: 'Monitor Samsung 27" 4K',
              sku: 'MN-SAM-27UHD',
              stock: 18,
              category: 'Electrónica',
              image: null
            },
            {
              id: 5,
              name: 'Disco SSD 1TB NVMe',
              sku: 'SSD-NVME-1TB',
              stock: 89,
              category: 'Componentes',
              image: null
            },
          ];

          setProducts(sampleProducts);
          setFilteredProducts(sampleProducts);
          setCategories(['Electrónica', 'Accesorios', 'Componentes']);
          setSelectedProduct(sampleProducts[0]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ CORRECCIÓN: Filtrar productos con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const filtered = products.filter(product => {
        const matchesSearch = searchTerm === '' ||
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'all' ||
          product.category === selectedCategory;

        return matchesSearch && matchesCategory;
      });

      setFilteredProducts(filtered);

      if (filtered.length > 0 && !selectedProduct) {
        setSelectedProduct(filtered[0]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, products, selectedProduct]);

  // ✅ CORRECCIÓN: Datos del QR optimizados
  const qrData = useMemo(() => {
    if (!selectedProduct) return '';

    return JSON.stringify({
      productId: selectedProduct.id,
      sku: selectedProduct.sku,
      name: selectedProduct.name,
      category: selectedProduct.category,
      stock: selectedProduct.stock,
      inventoryId: selectedProduct.inventoryId || 'N/A',
      timestamp: new Date().toISOString(),
      type: 'product',
      version: '1.0'
    });
  }, [selectedProduct]);

  // ✅ CORRECCIÓN: Guardar en historial
  const saveToHistory = useCallback((product) => {
    const historyItem = {
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      generatedAt: new Date().toISOString(),
      data: qrData
    };

    const newHistory = [historyItem, ...qrHistory.slice(0, 9)]; // Mantener últimos 10
    setQrHistory(newHistory);

    try {
      localStorage.setItem('qrHistory', JSON.stringify(newHistory));
    } catch (e) {
      console.warn('Error saving QR history to localStorage:', e);
    }
  }, [qrHistory, qrData]);

  // ✅ CORRECCIÓN: Función para generar QR
  const handleGenerateQR = useCallback((product) => {
    setSelectedProduct(product);
    saveToHistory(product);
    setGenerating(true);

    setTimeout(() => {
      setGenerating(false);
      toast.success(`QR generado para ${product.name}`);
    }, 500);
  }, [saveToHistory]);

  // ✅ CORRECCIÓN: Función para descargar QR optimizada
  const handleDownloadQR = useCallback(async () => {
    if (!qrRef.current || !selectedProduct || downloading) return;

    try {
      setDownloading(true);

      const canvas = qrRef.current.querySelector('canvas');
      if (!canvas) {
        throw new Error('No se pudo generar el código QR');
      }

      // Crear canvas mejorado con información
      const enhancedCanvas = document.createElement('canvas');
      enhancedCanvas.width = qrSize + 200;
      enhancedCanvas.height = qrSize + 200;
      const ctx = enhancedCanvas.getContext('2d');

      // Fondo blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, enhancedCanvas.width, enhancedCanvas.height);

      // Dibujar QR
      ctx.drawImage(canvas, 100, 100, qrSize, qrSize);

      // Agregar texto
      if (includeText) {
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(selectedProduct.name, enhancedCanvas.width / 2, 70);

        ctx.font = '14px Arial';
        ctx.fillText(`SKU: ${selectedProduct.sku}`, enhancedCanvas.width / 2, enhancedCanvas.height - 70);
        ctx.fillText(`Stock: ${selectedProduct.stock} unidades`, enhancedCanvas.width / 2, enhancedCanvas.height - 45);
        ctx.fillText(`Generado: ${new Date().toLocaleDateString('es-MX')}`, enhancedCanvas.width / 2, enhancedCanvas.height - 20);
      }

      // Descargar
      const url = enhancedCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qr_${selectedProduct.sku}_${Date.now()}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Código QR descargado');
    } catch (error) {
      console.error('Error downloading QR:', error);
      toast.error('Error al descargar el código QR');
    } finally {
      setDownloading(false);
    }
  }, [selectedProduct, qrSize, includeText, downloading]);

  // ✅ CORRECCIÓN: Función para imprimir QR (sin anidamiento profundo)
  const handlePrintQR = useCallback(async () => {
    if (!selectedProduct || printing) return;

    try {
      setPrinting(true);

      // Cerrar ventana anterior si existe
      if (printWindowRef.current && !printWindowRef.current.closed) {
        printWindowRef.current.close();
      }

      const printWindow = globalThis.open('', '_blank', 'width=800,height=600');
      printWindowRef.current = printWindow;

      if (!printWindow) {
        toast.error('Por favor, permite las ventanas emergentes para imprimir');
        return;
      }

      const fullHTML = generatePrintHTML(selectedProduct);
      setupPrintWindow(printWindow, fullHTML);

    } catch (error) {
      console.error('Error printing QR:', error);
      toast.error('Error al imprimir el código QR');
    } finally {
      setPrinting(false);
    }
  }, [selectedProduct, printing]);

  // ✅ CORRECCIÓN: Función para copiar datos del QR
  const handleCopyQRData = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
      toast.success('Datos del QR copiados al portapapeles');
    } catch (error) {
      console.error('Error copying QR data:', error);
      toast.error('Error al copiar datos del QR');
    }
  }, [qrData]);

  // ✅ CORRECCIÓN: Función para compartir QR
  const handleShareQR = useCallback(async () => {
    if (!selectedProduct) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `QR de ${selectedProduct.name}`,
          text: `Código QR para ${selectedProduct.name} (SKU: ${selectedProduct.sku})`,
          url: globalThis.location.href
        });
      } else {
        await navigator.clipboard.writeText(globalThis.location.href);
        toast.success('Enlace copiado al portapapeles');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing QR:', error);
      }
    }
  }, [selectedProduct]);

  // ✅ CORRECCIÓN: Función para regenerar desde historial
  const handleRegenerateFromHistory = useCallback((historyItem) => {
    const product = products.find(p => p.id === historyItem.productId);
    if (product) {
      handleGenerateQR(product);
    }
  }, [products, handleGenerateQR]);

  // ✅ CORRECCIÓN: Clear history
  const handleClearHistory = useCallback(() => {
    if (globalThis.confirm('¿Estás seguro de que deseas limpiar el historial de QR?')) {
      setQrHistory([]);
      localStorage.removeItem('qrHistory');
      toast.success('Historial limpiado');
    }
  }, []);

  // ✅ CORRECCIÓN: Loading state
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <QrCode className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando productos</h3>
          <p className="text-gray-600">Preparando generador de códigos QR...</p>
        </div>
      </div>
    );
  }

  // ✅ CORRECCIÓN: Button text para copiado (sin ternario anidado)
  const copyButtonText = copied ? (
    <>
      <CheckCircle className="w-5 h-5 mr-2" />
      Copiado
    </>
  ) : (
    <>
      <Copy className="w-5 h-5 mr-2" />
      Copiar Datos
    </>
  );

  const copyButtonClass = copied
    ? 'bg-linear-to-r from-green-600 to-teal-600 text-white'
    : 'bg-linear-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header con estadísticas */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Códigos QR</h1>
                <p className="text-gray-600 mt-1">
                  Genera y administra códigos QR para tus productos ({products.length} disponibles)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center font-medium"
              onClick={() => globalThis.open('/scanner', '_blank')}
              aria-label="Escanear código QR"
            >
              <Scan className="w-4 h-4 mr-2" />
              Escanear QR
            </button>
            <button
              className="px-4 py-2.5 bg-linear-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center font-medium"
              onClick={() => globalThis.open('/products', '_blank')}
              aria-label="Ver todos los productos"
            >
              <Package className="w-4 h-4 mr-2" />
              Ver Productos
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-5">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{products.length}</div>
            <p className="text-sm text-gray-600">Productos disponibles</p>
          </div>

          <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-xl p-5">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{qrHistory.length}</div>
            <p className="text-sm text-gray-600">QRs generados</p>
          </div>

          <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-xl p-5">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
            <p className="text-sm text-gray-600">Categorías</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de productos con filtros */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Productos</h2>
                <div className="text-sm text-gray-600">
                  {filteredProducts.length} de {products.length} productos
                </div>
              </div>

              <ProductFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />

              {getProductContent({
                error,
                filteredProducts,
                setSearchTerm,
                setSelectedCategory,
                selectedProduct,
                setSelectedProduct,
                handleGenerateQR
              })}
            </div>
          </div>

          {/* Panel de generación QR con controles */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Generador QR</h2>

              {selectedProduct ? (
                <>
                  <div
                    ref={qrRef}
                    className="flex flex-col items-center justify-center p-6 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl mb-6 border border-gray-200"
                  >
                    <div className="mb-4 relative">
                      <QRCode
                        value={qrData}
                        size={qrSize}
                        level="H"
                        includeMargin={true}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        renderAs="canvas"
                      />
                      {includeLogo && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                          <QrCode className="w-6 h-6 text-blue-600" />
                        </div>
                      )}
                      {generating && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded">
                          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                      )}
                    </div>

                    {includeText && (
                      <div className="text-center mt-4">
                        <h3 className="font-semibold text-gray-900 truncate max-w-xs">{selectedProduct.name}</h3>
                        <div className="flex items-center justify-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>SKU: {selectedProduct.sku}</span>
                          <span className="text-gray-400">•</span>
                          <span>Stock: {selectedProduct.stock}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controles de personalización */}
                  <div className="space-y-6 mb-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Tamaño del QR: <span className="font-semibold text-blue-600">{qrSize}px</span>
                      </label>
                      <input
                        type="range"
                        min="128"
                        max="256"
                        step="32"
                        value={qrSize}
                        onChange={(e) => setQrSize(Number.parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600"
                        aria-label="Ajustar tamaño del código QR"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>128px</span>
                        <span>192px</span>
                        <span>256px</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeLogo}
                          onChange={(e) => setIncludeLogo(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-2"
                        />
                        <span className="ml-2 text-sm text-gray-700">Incluir logo en el centro del QR</span>
                      </label>

                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeText}
                          onChange={(e) => setIncludeText(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-2"
                        />
                        <span className="ml-2 text-sm text-gray-700">Incluir información del producto</span>
                      </label>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleDownloadQR}
                      disabled={downloading}
                      className="px-4 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center font-medium disabled:opacity-50"
                      aria-label="Descargar código QR"
                    >
                      {downloading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-5 h-5 mr-2" />
                      )}
                      {downloading ? 'Descargando...' : 'Descargar'}
                    </button>

                    <button
                      onClick={handlePrintQR}
                      disabled={printing}
                      className="px-4 py-3 bg-linear-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center justify-center font-medium disabled:opacity-50"
                      aria-label="Imprimir código QR"
                    >
                      {printing ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Printer className="w-5 h-5 mr-2" />
                      )}
                      {printing ? 'Imprimiendo...' : 'Imprimir'}
                    </button>

                    <button
                      onClick={handleCopyQRData}
                      className={`px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center font-medium col-span-2 ${copyButtonClass}`}
                      aria-label={copied ? 'Datos copiados' : 'Copiar datos del código QR'}
                    >
                      {copyButtonText}
                    </button>

                    <button
                      onClick={handleShareQR}
                      className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center font-medium col-span-2"
                      aria-label="Compartir código QR"
                    >
                      <Share2 className="w-5 h-5 mr-2" />
                      Compartir
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Selecciona un producto para generar su código QR</p>
                </div>
              )}
            </div>

            {/* Historial QR con acciones */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Historial QR</h3>
                {qrHistory.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    aria-label="Limpiar historial"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
                {qrHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No hay historial de QR generados</p>
                  </div>
                ) : (
                  qrHistory.map((item) => (
                    <QRHistoryItem
                      key={item.id}
                      item={item}
                      onRegenerate={handleRegenerateFromHistory}
                    />
                  ))
                )}
              </div>

              {qrHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Últimos {qrHistory.length} QR generados
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRManagement;