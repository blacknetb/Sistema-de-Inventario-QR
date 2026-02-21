/**
 * App.jsx - Componente principal de Inventory QR System
 * Maneja las rutas, el layout global y los proveedores de contexto
 */

import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from './context/NotificationContext';
import { LoadingProvider } from './context/LoadingContext';

// Componentes de layout (carga inmediata)
import MainLayout from './components/layout/MainLayout/MainLayout';
import AuthLayout from './components/layout/Auth/AuthLayout';

// Componentes de UI globales
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import NotificationContainer from './components/common/NotificationContainer';

// Lazy loading de páginas para optimización
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login/LoginPage'));
const Register = lazy(() => import('./pages/Register/RegisterPage'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword/ResetPassword'));

// Módulos principales
const Products = lazy(() => import('./pages/Products/ProductsPage'));
const ProductDetail = lazy(() => import('./pages/Products/ProductDetail'));
const ProductForm = lazy(() => import('./pages/Products/ProductForm'));

const Categories = lazy(() => import('./pages/Categories/CategoriesPage'));
const CategoryDetail = lazy(() => import('./pages/Categories/CategoryDetail'));
const CategoryForm = lazy(() => import('./pages/Categories/CategoryForm'));

const Suppliers = lazy(() => import('./pages/Suppliers/SuppliersPage'));
const SupplierDetail = lazy(() => import('./pages/Suppliers/SupplierDetail'));
const SupplierForm = lazy(() => import('./pages/Suppliers/SupplierForm'));

const Users = lazy(() => import('./pages/users/UsersPage'));
const UserDetail = lazy(() => import('./pages/users/UserDetail'));
const UserForm = lazy(() => import('./pages/users/UserForm'));
const Profile = lazy(() => import("./pages/Profile/ProfilePage"));

const Reports = lazy(() => import('./pages/Reports/ReportsPage'));
const ReportGenerator = lazy(() => import('./pages/Reports/ReportGenerator'));

const QRScanner = lazy(() => import('./pages/QRScanner/QRScannerPage'));
const QRGenerator = lazy(() => import('./pages/QRScanner/QRGenerator'));

const Settings = lazy(() => import('./pages/Settings/SettingsPage'));

// Páginas de error
const NotFound = lazy(() => import('./pages/NotFound/NotFoundPage'));
const Unauthorized = lazy(() => import('./pages/NotFound/Unauthorized'));
const ServerError = lazy(() => import('./pages/NotFound/ServerError'));

// Componente de carga para Suspense
const PageLoader = () => (
    <div className="page-loader">
        <LoadingSpinner size="large" />
        <p>Cargando...</p>
    </div>
);

function App() {
    // Efecto para limpiar cualquier dato temporal al iniciar
    useEffect(() => {
        // Limpiar datos de sesión expirados
        const cleanup = () => {
            try {
                // Aquí puedes agregar lógica de limpieza si es necesario
                console.log('App initialized');
            } catch (error) {
                console.error('Error during app initialization:', error);
            }
        };
        
        cleanup();
    }, []);

    return (
        <ErrorBoundary>
            <ThemeProvider>
                <NotificationProvider>
                    <LoadingProvider>
                        <AuthProvider>
                            <Router>
                                <Suspense fallback={<PageLoader />}>
                                    <NotificationContainer />
                                    
                                    <Routes>
                                        {/* ========================================
                                            RUTAS PÚBLICAS (sin autenticación)
                                        ======================================== */}
                                        <Route element={<AuthLayout />}>
                                            <Route path="/login" element={<Login />} />
                                            <Route path="/register" element={<Register />} />
                                            <Route path="/forgot-password" element={<ForgotPassword />} />
                                            <Route path="/reset-password" element={<ResetPassword />} />
                                        </Route>

                                        {/* ========================================
                                            RUTAS PRIVADAS (requieren autenticación)
                                        ======================================== */}
                                        <Route path="/" element={<MainLayout />}>
                                            {/* Redirección por defecto */}
                                            <Route index element={<Navigate to="/dashboard" replace />} />
                                            
                                            {/* Dashboard */}
                                            <Route path="dashboard" element={<Dashboard />} />

                                            {/* Módulo de Productos */}
                                            <Route path="products">
                                                <Route index element={<Products />} />
                                                <Route path=":id" element={<ProductDetail />} />
                                                <Route path="create" element={<ProductForm />} />
                                                <Route path=":id/edit" element={<ProductForm />} />
                                            </Route>

                                            {/* Módulo de Categorías */}
                                            <Route path="categories">
                                                <Route index element={<Categories />} />
                                                <Route path=":id" element={<CategoryDetail />} />
                                                <Route path="create" element={<CategoryForm />} />
                                                <Route path=":id/edit" element={<CategoryForm />} />
                                            </Route>

                                            {/* Módulo de Proveedores */}
                                            <Route path="suppliers">
                                                <Route index element={<Suppliers />} />
                                                <Route path=":id" element={<SupplierDetail />} />
                                                <Route path="create" element={<SupplierForm />} />
                                                <Route path=":id/edit" element={<SupplierForm />} />
                                            </Route>

                                            {/* Módulo de Usuarios */}
                                            <Route path="users">
                                                <Route index element={<Users />} />
                                                <Route path=":id" element={<UserDetail />} />
                                                <Route path="create" element={<UserForm />} />
                                                <Route path=":id/edit" element={<UserForm />} />
                                            </Route>
                                            
                                            {/* Perfil de usuario */}
                                            <Route path="profile" element={<Profile />} />

                                            {/* Módulo de Reportes */}
                                            <Route path="reports">
                                                <Route index element={<Reports />} />
                                                <Route path="generate/:type" element={<ReportGenerator />} />
                                            </Route>

                                            {/* Módulo de QR */}
                                            <Route path="qr">
                                                <Route index element={<Navigate to="/qr/scanner" replace />} />
                                                <Route path="scanner" element={<QRScanner />} />
                                                <Route path="generate" element={<QRGenerator />} />
                                                <Route path="generate/:productId" element={<QRGenerator />} />
                                            </Route>

                                            {/* Configuración */}
                                            <Route path="settings" element={<Settings />} />

                                            {/* Rutas de error dentro del layout principal */}
                                            <Route path="unauthorized" element={<Unauthorized />} />
                                        </Route>

                                        {/* ========================================
                                            RUTAS DE ERROR (fuera del layout)
                                        ======================================== */}
                                        <Route path="/500" element={<ServerError />} />
                                        <Route path="/404" element={<NotFound />} />
                                        <Route path="*" element={<Navigate to="/404" replace />} />
                                    </Routes>
                                </Suspense>
                            </Router>
                        </AuthProvider>
                    </LoadingProvider>
                </NotificationProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;