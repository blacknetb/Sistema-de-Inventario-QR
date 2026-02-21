/**
 * handlers.js - Manejadores de rutas para MSW
 * Define las respuestas simuladas para las APIs
 */

import { http, HttpResponse } from 'msw';

// Datos de ejemplo
const mockUsers = [
    {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        avatar: null,
        phone: '+56 9 1234 5678',
        department: 'IT',
        position: 'Administrador',
        permissions: ['all'],
        createdAt: '2024-01-01T00:00:00.000Z'
    },
    {
        id: 2,
        name: 'Manager User',
        email: 'manager@example.com',
        role: 'manager',
        avatar: null,
        phone: '+56 9 8765 4321',
        department: 'Ventas',
        position: 'Gerente',
        permissions: ['products:view', 'products:create', 'reports:view'],
        createdAt: '2024-01-15T00:00:00.000Z'
    }
];

const mockProducts = [
    {
        id: 1,
        name: 'Laptop HP Pavilion',
        sku: 'LAP-HP-001',
        barcode: '1234567890123',
        price: 899.99,
        cost: 700.00,
        stock: 45,
        categoryId: 1,
        category: 'Electrónica',
        supplierId: 1,
        supplier: 'HP Distribuidor',
        description: 'Laptop HP Pavilion con procesador Intel Core i5',
        status: 'active',
        images: [],
        createdAt: '2024-01-10T00:00:00.000Z'
    },
    {
        id: 2,
        name: 'Monitor Samsung 24"',
        sku: 'MON-SAM-001',
        barcode: '1234567890124',
        price: 249.99,
        cost: 180.00,
        stock: 12,
        categoryId: 1,
        category: 'Electrónica',
        supplierId: 2,
        supplier: 'Samsung Chile',
        description: 'Monitor Samsung 24 pulgadas Full HD',
        status: 'active',
        images: [],
        createdAt: '2024-01-12T00:00:00.000Z'
    },
    {
        id: 3,
        name: 'Teclado Mecánico',
        sku: 'TEC-LOG-001',
        barcode: '1234567890125',
        price: 89.99,
        cost: 45.00,
        stock: 3,
        categoryId: 1,
        category: 'Electrónica',
        supplierId: 3,
        supplier: 'Logitech',
        description: 'Teclado mecánico RGB',
        status: 'low_stock',
        images: [],
        createdAt: '2024-01-20T00:00:00.000Z'
    }
];

const mockCategories = [
    { id: 1, name: 'Electrónica', description: 'Productos electrónicos', parentId: null, status: 'active' },
    { id: 2, name: 'Ropa', description: 'Prendas de vestir', parentId: null, status: 'active' },
    { id: 3, name: 'Hogar', description: 'Artículos para el hogar', parentId: null, status: 'active' },
    { id: 4, name: 'Laptops', description: 'Computadores portátiles', parentId: 1, status: 'active' },
    { id: 5, name: 'Monitores', description: 'Pantallas y monitores', parentId: 1, status: 'active' }
];

const mockSuppliers = [
    { id: 1, name: 'HP Distribuidor', email: 'ventas@hp.com', phone: '+56 2 2345 6789', address: 'Santiago, Chile', status: 'active' },
    { id: 2, name: 'Samsung Chile', email: 'ventas@samsung.cl', phone: '+56 2 2878 7000', address: 'Las Condes, Santiago', status: 'active' },
    { id: 3, name: 'Logitech', email: 'ventas@logitech.com', phone: '+56 2 2456 7890', address: 'Providencia, Santiago', status: 'active' }
];

const mockMovements = [
    { id: 1, productId: 1, type: 'purchase', quantity: 10, date: '2024-02-01T10:30:00.000Z', userId: 1 },
    { id: 2, productId: 1, type: 'sale', quantity: -2, date: '2024-02-02T15:45:00.000Z', userId: 2 },
    { id: 3, productId: 2, type: 'purchase', quantity: 5, date: '2024-02-03T09:15:00.000Z', userId: 1 }
];

// Definir manejadores para las APIs
export const handlers = [
    // ========================================
    // AUTH ENDPOINTS
    // ========================================
    http.post('/api/v1/auth/login', async ({ request }) => {
        const { email, password } = await request.json();

        // Simular validación
        if (email === 'admin@example.com' && password === 'admin123') {
            return HttpResponse.json({
                success: true,
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token',
                refreshToken: 'mock-refresh-token-123',
                user: mockUsers[0]
            });
        }

        if (email === 'manager@example.com' && password === 'manager123') {
            return HttpResponse.json({
                success: true,
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token-2',
                refreshToken: 'mock-refresh-token-456',
                user: mockUsers[1]
            });
        }

        return HttpResponse.json(
            { success: false, message: 'Credenciales inválidas' },
            { status: 401 }
        );
    }),

    http.post('/api/v1/auth/register', async ({ request }) => {
        const userData = await request.json();
        
        return HttpResponse.json({
            success: true,
            message: 'Usuario registrado exitosamente',
            user: {
                id: 3,
                ...userData,
                role: 'operator',
                createdAt: new Date().toISOString()
            }
        });
    }),

    http.post('/api/v1/auth/refresh', async ({ request }) => {
        return HttpResponse.json({
            success: true,
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-mock-token',
            refreshToken: 'mock-refresh-token-new'
        });
    }),

    http.post('/api/v1/auth/logout', () => {
        return HttpResponse.json({ success: true });
    }),

    http.get('/api/v1/auth/verify', () => {
        return HttpResponse.json({ 
            success: true, 
            user: mockUsers[0] 
        });
    }),

    http.post('/api/v1/auth/change-password', () => {
        return HttpResponse.json({ 
            success: true, 
            message: 'Contraseña cambiada exitosamente' 
        });
    }),

    // ========================================
    // USERS ENDPOINTS
    // ========================================
    http.get('/api/v1/users', ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const search = url.searchParams.get('search') || '';

        let filteredUsers = mockUsers;
        if (search) {
            filteredUsers = mockUsers.filter(user => 
                user.name.toLowerCase().includes(search.toLowerCase()) ||
                user.email.toLowerCase().includes(search.toLowerCase())
            );
        }

        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedUsers = filteredUsers.slice(start, end);

        return HttpResponse.json({
            success: true,
            data: paginatedUsers,
            total: filteredUsers.length,
            page,
            limit,
            totalPages: Math.ceil(filteredUsers.length / limit)
        });
    }),

    http.get('/api/v1/users/:id', ({ params }) => {
        const user = mockUsers.find(u => u.id === parseInt(params.id));
        
        if (user) {
            return HttpResponse.json({ success: true, data: user });
        }
        
        return HttpResponse.json(
            { success: false, message: 'Usuario no encontrado' },
            { status: 404 }
        );
    }),

    http.put('/api/v1/users/profile', async ({ request }) => {
        const updates = await request.json();
        return HttpResponse.json({ 
            success: true, 
            message: 'Perfil actualizado',
            user: { ...mockUsers[0], ...updates }
        });
    }),

    http.get('/api/v1/users/stats/summary', () => {
        return HttpResponse.json({
            success: true,
            data: {
                total: 25,
                active: 18,
                inactive: 5,
                blocked: 2,
                byRole: {
                    admin: 2,
                    manager: 3,
                    supervisor: 5,
                    operator: 10,
                    viewer: 5
                }
            }
        });
    }),

    // ========================================
    // PRODUCTS ENDPOINTS
    // ========================================
    http.get('/api/v1/products', ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const search = url.searchParams.get('search') || '';
        const lowStock = url.searchParams.get('lowStock') === 'true';

        let filteredProducts = [...mockProducts];
        
        if (search) {
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.sku.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (lowStock) {
            filteredProducts = filteredProducts.filter(p => p.stock < 10);
        }

        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedProducts = filteredProducts.slice(start, end);

        return HttpResponse.json({
            success: true,
            data: paginatedProducts,
            total: filteredProducts.length,
            page,
            limit,
            totalPages: Math.ceil(filteredProducts.length / limit)
        });
    }),

    http.get('/api/v1/products/low-stock', () => {
        const lowStockProducts = mockProducts.filter(p => p.stock < 10);
        return HttpResponse.json({
            success: true,
            data: lowStockProducts,
            count: lowStockProducts.length
        });
    }),

    http.get('/api/v1/products/:id', ({ params }) => {
        const product = mockProducts.find(p => p.id === parseInt(params.id));
        
        if (product) {
            return HttpResponse.json({ success: true, data: product });
        }
        
        return HttpResponse.json(
            { success: false, message: 'Producto no encontrado' },
            { status: 404 }
        );
    }),

    http.post('/api/v1/products', async ({ request }) => {
        const newProduct = await request.json();
        const product = {
            id: mockProducts.length + 1,
            ...newProduct,
            createdAt: new Date().toISOString()
        };
        return HttpResponse.json({
            success: true,
            message: 'Producto creado exitosamente',
            data: product
        });
    }),

    http.put('/api/v1/products/:id', async ({ params, request }) => {
        const updates = await request.json();
        return HttpResponse.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: { id: parseInt(params.id), ...updates }
        });
    }),

    http.delete('/api/v1/products/:id', () => {
        return HttpResponse.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });
    }),

    http.patch('/api/v1/products/:id/stock', async ({ request }) => {
        const { quantity, type } = await request.json();
        return HttpResponse.json({
            success: true,
            message: 'Stock actualizado',
            newStock: type === 'add' ? 50 + quantity : 50 - quantity
        });
    }),

    http.get('/api/v1/products/stats/summary', () => {
        return HttpResponse.json({
            success: true,
            data: {
                totalProducts: 150,
                totalValue: 87500.50,
                lowStock: 5,
                outOfStock: 2,
                byCategory: {
                    electronics: 45,
                    clothing: 60,
                    home: 45
                }
            }
        });
    }),

    // ========================================
    // CATEGORIES ENDPOINTS
    // ========================================
    http.get('/api/v1/categories', () => {
        return HttpResponse.json({
            success: true,
            data: mockCategories,
            total: mockCategories.length
        });
    }),

    http.get('/api/v1/categories/tree', () => {
        const buildTree = (parentId = null) => {
            return mockCategories
                .filter(c => c.parentId === parentId)
                .map(c => ({
                    ...c,
                    children: buildTree(c.id)
                }));
        };

        return HttpResponse.json({
            success: true,
            data: buildTree(null)
        });
    }),

    http.get('/api/v1/categories/:id', ({ params }) => {
        const category = mockCategories.find(c => c.id === parseInt(params.id));
        
        if (category) {
            return HttpResponse.json({ success: true, data: category });
        }
        
        return HttpResponse.json(
            { success: false, message: 'Categoría no encontrada' },
            { status: 404 }
        );
    }),

    // ========================================
    // SUPPLIERS ENDPOINTS
    // ========================================
    http.get('/api/v1/suppliers', () => {
        return HttpResponse.json({
            success: true,
            data: mockSuppliers,
            total: mockSuppliers.length
        });
    }),

    http.get('/api/v1/suppliers/:id', ({ params }) => {
        const supplier = mockSuppliers.find(s => s.id === parseInt(params.id));
        
        if (supplier) {
            return HttpResponse.json({ success: true, data: supplier });
        }
        
        return HttpResponse.json(
            { success: false, message: 'Proveedor no encontrado' },
            { status: 404 }
        );
    }),

    // ========================================
    // REPORTS ENDPOINTS
    // ========================================
    http.post('/api/v1/reports/inventory', () => {
        return HttpResponse.json({
            success: true,
            data: {
                totalProducts: 150,
                totalValue: 87500.50,
                byCategory: [
                    { category: 'Electrónica', count: 45, value: 45000 },
                    { category: 'Ropa', count: 60, value: 22500 },
                    { category: 'Hogar', count: 45, value: 20000.50 }
                ],
                lowStock: [
                    { product: 'Teclado Mecánico', stock: 3, threshold: 5 },
                    { product: 'Monitor Samsung', stock: 8, threshold: 10 }
                ]
            }
        });
    }),

    http.post('/api/v1/reports/movements', () => {
        return HttpResponse.json({
            success: true,
            data: {
                totalMovements: 150,
                byType: {
                    purchase: 45,
                    sale: 80,
                    adjustment: 15,
                    return: 10
                },
                movements: mockMovements
            }
        });
    }),

    // ========================================
    // QR ENDPOINTS
    // ========================================
    http.post('/api/v1/qr/products/:productId/generate', () => {
        return HttpResponse.json({
            success: true,
            data: {
                qrCode: 'data:image/png;base64,mockQRCodeData',
                url: 'http://localhost:3000/qr/product-123'
            }
        });
    }),

    http.get('/api/v1/qr/decode', () => {
        return HttpResponse.json({
            success: true,
            data: {
                type: 'product',
                productId: 1,
                productName: 'Laptop HP Pavilion'
            }
        });
    })
];

export default handlers;