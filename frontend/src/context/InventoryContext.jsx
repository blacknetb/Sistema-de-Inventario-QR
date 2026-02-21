import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        minPrice: '',
        maxPrice: '',
        stockStatus: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // Cargar datos iniciales
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadProducts(),
                loadCategories(),
                loadMovements()
            ]);
        } catch (err) {
            setError('Error al cargar datos iniciales');
        } finally {
            setLoading(false);
        }
    };

    // Productos
    const loadProducts = async (page = 1, customFilters = filters) => {
        try {
            setLoading(true);

            // Simular llamada a API
            await new Promise(resolve => setTimeout(resolve, 500));

            // Datos de ejemplo
            const mockProducts = [
                {
                    id: 1,
                    name: 'Laptop HP Pavilion',
                    sku: 'LAP-001',
                    category: 'Electrónica',
                    description: 'Laptop HP Pavilion con procesador i5, 8GB RAM, 512GB SSD',
                    price: 850,
                    cost: 700,
                    stock: 15,
                    minStock: 5,
                    optimalStock: 20,
                    qrCode: null,
                    createdAt: '2024-01-15',
                    updatedAt: '2024-02-20'
                },
                {
                    id: 2,
                    name: 'Mouse Inalámbrico Logitech',
                    sku: 'MOU-002',
                    category: 'Accesorios',
                    description: 'Mouse inalámbrico Logitech M185',
                    price: 25,
                    cost: 15,
                    stock: 8,
                    minStock: 10,
                    optimalStock: 25,
                    qrCode: null,
                    createdAt: '2024-01-20',
                    updatedAt: '2024-02-18'
                },
                {
                    id: 3,
                    name: 'Monitor Samsung 24"',
                    sku: 'MON-003',
                    category: 'Electrónica',
                    description: 'Monitor Samsung de 24 pulgadas Full HD',
                    price: 280,
                    cost: 220,
                    stock: 3,
                    minStock: 5,
                    optimalStock: 15,
                    qrCode: null,
                    createdAt: '2024-01-25',
                    updatedAt: '2024-02-15'
                },
                {
                    id: 4,
                    name: 'Teclado Mecánico Redragon',
                    sku: 'TEC-004',
                    category: 'Accesorios',
                    description: 'Teclado mecánico RGB switches rojos',
                    price: 65,
                    cost: 45,
                    stock: 12,
                    minStock: 8,
                    optimalStock: 20,
                    qrCode: null,
                    createdAt: '2024-02-01',
                    updatedAt: '2024-02-10'
                },
                {
                    id: 5,
                    name: 'Silla Gamer Corsair',
                    sku: 'SIL-005',
                    category: 'Muebles',
                    description: 'Silla gamer ergonómica con soporte lumbar',
                    price: 320,
                    cost: 250,
                    stock: 2,
                    minStock: 3,
                    optimalStock: 8,
                    qrCode: null,
                    createdAt: '2024-02-05',
                    updatedAt: '2024-02-12'
                }
            ];

            // Aplicar filtros
            let filteredProducts = [...mockProducts];

            if (customFilters.search) {
                const searchLower = customFilters.search.toLowerCase();
                filteredProducts = filteredProducts.filter(p =>
                    p.name.toLowerCase().includes(searchLower) ||
                    p.sku.toLowerCase().includes(searchLower)
                );
            }

            if (customFilters.category) {
                filteredProducts = filteredProducts.filter(p =>
                    p.category === customFilters.category
                );
            }

            if (customFilters.minPrice) {
                filteredProducts = filteredProducts.filter(p =>
                    p.price >= parseFloat(customFilters.minPrice)
                );
            }

            if (customFilters.maxPrice) {
                filteredProducts = filteredProducts.filter(p =>
                    p.price <= parseFloat(customFilters.maxPrice)
                );
            }

            if (customFilters.stockStatus) {
                filteredProducts = filteredProducts.filter(p => {
                    if (customFilters.stockStatus === 'low') return p.stock <= p.minStock;
                    if (customFilters.stockStatus === 'optimal') return p.stock <= p.optimalStock && p.stock > p.minStock;
                    if (customFilters.stockStatus === 'high') return p.stock > p.optimalStock;
                    return true;
                });
            }

            // Calcular paginación
            const total = filteredProducts.length;
            const totalPages = Math.ceil(total / pagination.limit);
            const start = (page - 1) * pagination.limit;
            const paginatedProducts = filteredProducts.slice(start, start + pagination.limit);

            setProducts(paginatedProducts);
            setPagination(prev => ({
                ...prev,
                page,
                total,
                totalPages
            }));

            return paginatedProducts;
        } catch (err) {
            setError('Error al cargar productos');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const addProduct = async (productData) => {
        try {
            setLoading(true);

            await new Promise(resolve => setTimeout(resolve, 500));

            const newProduct = {
                id: Date.now(),
                ...productData,
                createdAt: new Date().toISOString().split('T')[0],
                updatedAt: new Date().toISOString().split('T')[0],
                qrCode: null
            };

            setProducts(prev => [newProduct, ...prev]);

            // Registrar movimiento
            await addMovement({
                type: 'creacion',
                productId: newProduct.id,
                productName: newProduct.name,
                quantity: newProduct.stock,
                description: 'Producto creado'
            });

            return { success: true, product: newProduct };
        } catch (err) {
            setError('Error al agregar producto');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const updateProduct = async (id, updatedData) => {
        try {
            setLoading(true);

            await new Promise(resolve => setTimeout(resolve, 500));

            setProducts(prev => prev.map(p =>
                p.id === id
                    ? { ...p, ...updatedData, updatedAt: new Date().toISOString().split('T')[0] }
                    : p
            ));

            // Registrar movimiento
            await addMovement({
                type: 'edicion',
                productId: id,
                productName: updatedData.name,
                description: 'Producto actualizado'
            });

            return { success: true };
        } catch (err) {
            setError('Error al actualizar producto');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id) => {
        try {
            setLoading(true);

            await new Promise(resolve => setTimeout(resolve, 500));

            const productToDelete = products.find(p => p.id === id);

            setProducts(prev => prev.filter(p => p.id !== id));

            // Registrar movimiento
            await addMovement({
                type: 'eliminacion',
                productId: id,
                productName: productToDelete?.name,
                description: 'Producto eliminado'
            });

            return { success: true };
        } catch (err) {
            setError('Error al eliminar producto');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const updateStock = async (id, quantity, type) => {
        try {
            setLoading(true);

            await new Promise(resolve => setTimeout(resolve, 500));

            let updatedProduct;

            setProducts(prev => prev.map(p => {
                if (p.id === id) {
                    const newStock = type === 'entrada'
                        ? p.stock + quantity
                        : p.stock - quantity;

                    updatedProduct = {
                        ...p,
                        stock: newStock,
                        updatedAt: new Date().toISOString().split('T')[0]
                    };

                    return updatedProduct;
                }
                return p;
            }));

            // Registrar movimiento
            await addMovement({
                type: type,
                productId: id,
                productName: updatedProduct?.name,
                quantity: quantity,
                description: `${type === 'entrada' ? 'Entrada' : 'Salida'} de stock`
            });

            return { success: true };
        } catch (err) {
            setError('Error al actualizar stock');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const generateQRCode = async (productId) => {
        try {
            setLoading(true);

            await new Promise(resolve => setTimeout(resolve, 500));

            // Simular generación de QR
            const qrData = `PROD-${productId}-${Date.now()}`;
            const qrCode = `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect width="200" height="200" fill="white"/>
          <text x="100" y="100" font-family="Arial" font-size="14" fill="black" text-anchor="middle">
            ${qrData}
          </text>
        </svg>
      `)}`;

            setProducts(prev => prev.map(p =>
                p.id === productId
                    ? { ...p, qrCode }
                    : p
            ));

            return { success: true, qrCode };
        } catch (err) {
            setError('Error al generar código QR');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Categorías
    const loadCategories = async () => {
        try {
            const mockCategories = [
                'Electrónica',
                'Accesorios',
                'Muebles',
                'Oficina',
                'Computadoras',
                'Impresoras',
                'Redes'
            ];

            setCategories(mockCategories);
            return mockCategories;
        } catch (err) {
            setError('Error al cargar categorías');
            return [];
        }
    };

    const addCategory = async (categoryName) => {
        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            setCategories(prev => [...prev, categoryName]);
            return { success: true };
        } catch (err) {
            setError('Error al agregar categoría');
            return { success: false, error: err.message };
        }
    };

    // Movimientos
    const loadMovements = async () => {
        try {
            const mockMovements = [
                {
                    id: 1,
                    type: 'entrada',
                    productId: 1,
                    productName: 'Laptop HP Pavilion',
                    quantity: 5,
                    date: '2024-02-20T10:30:00',
                    user: 'Admin User',
                    description: 'Compra a proveedor'
                },
                {
                    id: 2,
                    type: 'salida',
                    productId: 2,
                    productName: 'Mouse Inalámbrico Logitech',
                    quantity: 2,
                    date: '2024-02-19T15:45:00',
                    user: 'Admin User',
                    description: 'Venta a cliente'
                },
                {
                    id: 3,
                    type: 'creacion',
                    productId: 3,
                    productName: 'Monitor Samsung 24"',
                    quantity: 0,
                    date: '2024-02-18T09:15:00',
                    user: 'Admin User',
                    description: 'Producto creado'
                },
                {
                    id: 4,
                    type: 'edicion',
                    productId: 1,
                    productName: 'Laptop HP Pavilion',
                    quantity: 0,
                    date: '2024-02-17T14:20:00',
                    user: 'Admin User',
                    description: 'Actualización de precio'
                },
                {
                    id: 5,
                    type: 'entrada',
                    productId: 4,
                    productName: 'Teclado Mecánico Redragon',
                    quantity: 10,
                    date: '2024-02-16T11:00:00',
                    user: 'Admin User',
                    description: 'Reabastecimiento'
                }
            ];

            setMovements(mockMovements);
            return mockMovements;
        } catch (err) {
            setError('Error al cargar movimientos');
            return [];
        }
    };

    const addMovement = async (movementData) => {
        try {
            const newMovement = {
                id: Date.now(),
                date: new Date().toISOString(),
                user: user?.name || 'Sistema',
                ...movementData
            };

            setMovements(prev => [newMovement, ...prev]);
            return { success: true, movement: newMovement };
        } catch (err) {
            console.error('Error al registrar movimiento:', err);
            return { success: false, error: err.message };
        }
    };

    // Reportes y estadísticas
    const getStatistics = useCallback(() => {
        const totalProducts = products.length;
        const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
        const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
        const lowStockProducts = products.filter(p => p.stock <= p.minStock).length;

        const productsByCategory = {};
        products.forEach(p => {
            productsByCategory[p.category] = (productsByCategory[p.category] || 0) + 1;
        });

        return {
            totalProducts,
            totalStock,
            totalValue,
            lowStockProducts,
            productsByCategory,
            averagePrice: totalProducts ? totalValue / totalProducts : 0
        };
    }, [products]);

    const getMovementsByDate = useCallback((days = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return movements.filter(m => new Date(m.date) >= cutoffDate);
    }, [movements]);

    const getStockReport = useCallback(() => {
        return products.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            stock: p.stock,
            minStock: p.minStock,
            optimalStock: p.optimalStock,
            status: p.stock <= p.minStock ? 'Bajo' :
                p.stock <= p.optimalStock ? 'Óptimo' : 'Alto',
            value: p.price * p.stock
        }));
    }, [products]);

    // Filtros y paginación
    const updateFilters = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        loadProducts(1, { ...filters, ...newFilters });
    };

    const clearFilters = () => {
        const emptyFilters = {
            search: '',
            category: '',
            minPrice: '',
            maxPrice: '',
            stockStatus: ''
        };
        setFilters(emptyFilters);
        loadProducts(1, emptyFilters);
    };

    const changePage = (page) => {
        loadProducts(page);
    };

    const value = {
        // Estado
        products,
        categories,
        movements,
        loading,
        error,
        filters,
        pagination,

        // Productos
        loadProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        generateQRCode,

        // Categorías
        loadCategories,
        addCategory,

        // Movimientos
        loadMovements,
        addMovement,

        // Reportes
        getStatistics,
        getMovementsByDate,
        getStockReport,

        // Filtros y paginación
        updateFilters,
        clearFilters,
        changePage
    };

    return (
        <InventoryContext.Provider value={value}>
            {children}
        </InventoryContext.Provider>
    );
};

export default InventoryContext;