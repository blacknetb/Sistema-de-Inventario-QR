// Contexto de inventario
import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';

// Crear el contexto de inventario
export const inventoryContext = createContext();

// URL base del backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Proveedor del contexto de inventario
export const InventoryProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [inventoryError, setInventoryError] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalValue: 0,
        lowStock: 0,
        outOfStock: 0,
        recentTransactions: 0
    });

    // Cargar datos iniciales
    const loadInitialData = useCallback(async () => {
        try {
            setInventoryLoading(true);
            
            // Cargar productos, categorías y proveedores en paralelo
            const [productsRes, categoriesRes, suppliersRes, transactionsRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/products`),
                axios.get(`${API_URL}/categories`),
                axios.get(`${API_URL}/suppliers`),
                axios.get(`${API_URL}/transactions?limit=50`),
                axios.get(`${API_URL}/stats`)
            ]);

            setProducts(productsRes.data);
            setCategories(categoriesRes.data);
            setSuppliers(suppliersRes.data);
            setTransactions(transactionsRes.data);
            setStats(statsRes.data);
            
        } catch (error) {
            setInventoryError('Error al cargar los datos del inventario');
            console.error('Error loading initial data:', error);
        } finally {
            setInventoryLoading(false);
        }
    }, []);

    // PRODUCTOS
    const getProducts = async () => {
        try {
            setInventoryLoading(true);
            const response = await axios.get(`${API_URL}/products`);
            setProducts(response.data);
            return response.data;
        } catch (error) {
            setInventoryError('Error al obtener productos');
            throw error;
        } finally {
            setInventoryLoading(false);
        }
    };

    const getProductById = async (id) => {
        try {
            setInventoryLoading(true);
            const response = await axios.get(`${API_URL}/products/${id}`);
            return response.data;
        } catch (error) {
            setInventoryError('Error al obtener el producto');
            throw error;
        } finally {
            setInventoryLoading(false);
        }
    };

    const createProduct = async (productData) => {
        try {
            setInventoryLoading(true);
            const response = await axios.post(`${API_URL}/products`, productData);
            setProducts(prev => [...prev, response.data]);
            return { success: true, product: response.data };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al crear producto';
            setInventoryError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setInventoryLoading(false);
        }
    };

    const updateProduct = async (id, productData) => {
        try {
            setInventoryLoading(true);
            const response = await axios.put(`${API_URL}/products/${id}`, productData);
            setProducts(prev => prev.map(p => p._id === id ? response.data : p));
            return { success: true, product: response.data };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al actualizar producto';
            setInventoryError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setInventoryLoading(false);
        }
    };

    const deleteProduct = async (id) => {
        try {
            setInventoryLoading(true);
            await axios.delete(`${API_URL}/products/${id}`);
            setProducts(prev => prev.filter(p => p._id !== id));
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al eliminar producto';
            setInventoryError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setInventoryLoading(false);
        }
    };

    const searchProducts = async (searchTerm) => {
        try {
            setInventoryLoading(true);
            const response = await axios.get(`${API_URL}/products/search?q=${searchTerm}`);
            return response.data;
        } catch (error) {
            setInventoryError('Error al buscar productos');
            throw error;
        } finally {
            setInventoryLoading(false);
        }
    };

    // CATEGORÍAS
    const getCategories = async () => {
        try {
            setInventoryLoading(true);
            const response = await axios.get(`${API_URL}/categories`);
            setCategories(response.data);
            return response.data;
        } catch (error) {
            setInventoryError('Error al obtener categorías');
            throw error;
        } finally {
            setInventoryLoading(false);
        }
    };

    const createCategory = async (categoryData) => {
        try {
            setInventoryLoading(true);
            const response = await axios.post(`${API_URL}/categories`, categoryData);
            setCategories(prev => [...prev, response.data]);
            return { success: true, category: response.data };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al crear categoría';
            setInventoryError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setInventoryLoading(false);
        }
    };

    const updateCategory = async (id, categoryData) => {
        try {
            setInventoryLoading(true);
            const response = await axios.put(`${API_URL}/categories/${id}`, categoryData);
            setCategories(prev => prev.map(c => c._id === id ? response.data : c));
            return { success: true, category: response.data };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al actualizar categoría';
            setInventoryError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setInventoryLoading(false);
        }
    };

    const deleteCategory = async (id) => {
        try {
            setInventoryLoading(true);
            await axios.delete(`${API_URL}/categories/${id}`);
            setCategories(prev => prev.filter(c => c._id !== id));
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al eliminar categoría';
            setInventoryError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setInventoryLoading(false);
        }
    };

    // PROVEEDORES
    const getSuppliers = async () => {
        try {
            setInventoryLoading(true);
            const response = await axios.get(`${API_URL}/suppliers`);
            setSuppliers(response.data);
            return response.data;
        } catch (error) {
            setInventoryError('Error al obtener proveedores');
            throw error;
        } finally {
            setInventoryLoading(false);
        }
    };

    const createSupplier = async (supplierData) => {
        try {
            setInventoryLoading(true);
            const response = await axios.post(`${API_URL}/suppliers`, supplierData);
            setSuppliers(prev => [...prev, response.data]);
            return { success: true, supplier: response.data };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al crear proveedor';
            setInventoryError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setInventoryLoading(false);
        }
    };

    const updateSupplier = async (id, supplierData) => {
        try {
            setInventoryLoading(true);
            const response = await axios.put(`${API_URL}/suppliers/${id}`, supplierData);
            setSuppliers(prev => prev.map(s => s._id === id ? response.data : s));
            return { success: true, supplier: response.data };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al actualizar proveedor';
            setInventoryError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setInventoryLoading(false);
        }
    };

    const deleteSupplier = async (id) => {
        try {
            setInventoryLoading(true);
            await axios.delete(`${API_URL}/suppliers/${id}`);
            setSuppliers(prev => prev.filter(s => s._id !== id));
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al eliminar proveedor';
            setInventoryError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setInventoryLoading(false);
        }
    };

    // TRANSACCIONES
    const getTransactions = async (filters = {}) => {
        try {
            setInventoryLoading(true);
            const queryParams = new URLSearchParams(filters).toString();
            const response = await axios.get(`${API_URL}/transactions?${queryParams}`);
            setTransactions(response.data);
            return response.data;
        } catch (error) {
            setInventoryError('Error al obtener transacciones');
            throw error;
        } finally {
            setInventoryLoading(false);
        }
    };

    const createTransaction = async (transactionData) => {
        try {
            setInventoryLoading(true);
            const response = await axios.post(`${API_URL}/transactions`, transactionData);
            
            // Actualizar producto relacionado
            if (response.data.product) {
                setProducts(prev => prev.map(p => 
                    p._id === response.data.product._id ? response.data.product : p
                ));
            }
            
            // Agregar transacción a la lista
            setTransactions(prev => [response.data, ...prev]);
            
            return { success: true, transaction: response.data };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al crear transacción';
            setInventoryError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setInventoryLoading(false);
        }
    };

    // ESTADÍSTICAS
    const getStats = async () => {
        try {
            setInventoryLoading(true);
            const response = await axios.get(`${API_URL}/stats`);
            setStats(response.data);
            return response.data;
        } catch (error) {
            setInventoryError('Error al obtener estadísticas');
            throw error;
        } finally {
            setInventoryLoading(false);
        }
    };

    // REPORTES
    const generateReport = async (reportType, params = {}) => {
        try {
            setInventoryLoading(true);
            const response = await axios.post(`${API_URL}/reports/${reportType}`, params, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            setInventoryError('Error al generar reporte');
            throw error;
        } finally {
            setInventoryLoading(false);
        }
    };

    // Limpiar errores
    const clearInventoryError = () => {
        setInventoryError(null);
    };

    // Valor del contexto
    const value = {
        products,
        categories,
        suppliers,
        transactions,
        inventoryLoading,
        inventoryError,
        selectedProduct,
        selectedCategory,
        selectedSupplier,
        stats,
        loadInitialData,
        // Productos
        getProducts,
        getProductById,
        createProduct,
        updateProduct,
        deleteProduct,
        searchProducts,
        setSelectedProduct,
        // Categorías
        getCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        setSelectedCategory,
        // Proveedores
        getSuppliers,
        createSupplier,
        updateSupplier,
        deleteSupplier,
        setSelectedSupplier,
        // Transacciones
        getTransactions,
        createTransaction,
        // Estadísticas
        getStats,
        // Reportes
        generateReport,
        // Utilidades
        clearInventoryError
    };

    return (
        <inventoryContext.Provider value={value}>
            {children}
        </inventoryContext.Provider>
    );
};

// Hook personalizado para usar el contexto de inventario
export const useInventory = () => {
    const context = useContext(inventoryContext);
    if (!context) {
        throw new Error('useInventory debe ser usado dentro de InventoryProvider');
    }
    return context;
};