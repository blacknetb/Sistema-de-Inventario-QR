/**
 * Archivo de exportación principal para componentes de Products
 * Permite importaciones limpias desde otros módulos
 */

import ProductList from './ProductList';
import ProductForm from './ProductForm';
import ProductCard from './ProductCard';
import ProductDetail from './ProductDetail';
import ProductFilters from './ProductFilters';

// Exportación individual de todos los componentes
export {
    ProductList,
    ProductForm,
    ProductCard,
    ProductDetail,
    ProductFilters
};

// Exportación por defecto (ProductList como principal)
export default ProductList;