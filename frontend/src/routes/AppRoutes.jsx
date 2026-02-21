import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PrivateRoutes from './PrivateRoutes';
import PublicRoutes from './PublicRoutes';

// Componentes públicos
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import ForgotPassword from '../components/auth/ForgotPassword';
import ResetPassword from '../components/auth/ResetPassword';

// Componentes privados
import Dashboard from '../components/dashboard/Dashboard';
import Products from '../components/products/Products';
import AddProduct from '../components/products/AddProduct';
import EditProduct from '../components/products/EditProduct';
import ProductDetails from '../components/products/ProductDetails';
import Categories from '../components/categories/Categories';
import AddCategory from '../components/categories/AddCategory';
import EditCategory from '../components/categories/EditCategory';
import Suppliers from '../components/suppliers/Suppliers';
import AddSupplier from '../components/suppliers/AddSupplier';
import EditSupplier from '../components/suppliers/EditSupplier';
import Movements from '../components/movements/Movements';
import AddMovement from '../components/movements/AddMovement';
import Reports from '../components/reports/Reports';
import Profile from '../components/profile/Profile';
import Settings from '../components/settings/Settings';
import NotFound from '../components/common/NotFound';

const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando aplicación...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route element={<PublicRoutes />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* Rutas privadas */}
      <Route element={<PrivateRoutes />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Rutas de productos */}
        <Route path="/products" element={<Products />} />
        <Route path="/products/add" element={<AddProduct />} />
        <Route path="/products/edit/:id" element={<EditProduct />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        
        {/* Rutas de categorías */}
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/add" element={<AddCategory />} />
        <Route path="/categories/edit/:id" element={<EditCategory />} />
        
        {/* Rutas de proveedores */}
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/suppliers/add" element={<AddSupplier />} />
        <Route path="/suppliers/edit/:id" element={<EditSupplier />} />
        
        {/* Rutas de movimientos */}
        <Route path="/movements" element={<Movements />} />
        <Route path="/movements/add" element={<AddMovement />} />
        
        {/* Otras rutas */}
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Ruta para manejar errores 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;