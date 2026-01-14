import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import Table from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import ProductForm from './ProductForm';
import ProductDetail from './ProductDetail';
import ProductFilter from './ProductFilter';
import { ProductGrid } from './ProductCard'; // ✅ CORREGIDO: Importar correctamente
import { formatCurrency, formatNumber } from '../../utils/helpers';
import { useNotification } from '../../context/NotificationContext';
import {
  FiPackage,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiGrid,
  FiList,
  FiPlus,
  FiFilter,
  FiBarChart2,
  FiShoppingCart
} from 'react-icons/fi';
import PropTypes from 'prop-types';

// ✅ CORRECCIÓN: Implementación del hook usePagination simplificado
const usePagination = (fetchFunction, initialParams = {}, immediate = true) => {
  const [state, setState] = useState({
    data: null,
    loading: false,
    page: initialParams.page || 1,
    limit: initialParams.limit || 10,
    totalPages: 1,
    totalItems: 0,
    error: null
  });

  const fetchData = useCallback(async (params = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetchFunction({
        page: params.page || state.page,
        limit: params.limit || state.limit,
        ...params
      });

      if (response.success) {
        setState(prev => ({
          ...prev,
          data: response.data,
          totalPages: response.total_pages || 1,
          totalItems: response.total_items || 0,
          page: response.current_page || 1,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.message || 'Error fetching data',
          loading: false
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Error fetching data',
        loading: false
      }));
    }
  }, [fetchFunction, state.page, state.limit]);

  const goToPage = useCallback((page) => {
    if (page >= 1) {
      setState(prev => ({ ...prev, page }));
      fetchData({ page });
    }
  }, [fetchData]);

  const changeLimit = useCallback((limit) => {
    setState(prev => ({ ...prev, limit, page: 1 }));
    fetchData({ limit, page: 1 });
  }, [fetchData]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate]);

  return {
    ...state,
    goToPage,
    changeLimit,
    refresh: fetchData
  };
};

/**
 * ✅ COMPONENTE DE LISTA DE PRODUCTOS MEJORADO
 * Correcciones aplicadas:
 * 1. Gestión de estado optimizada
 * 2. Carga de datos en paralelo
 * 3. Manejo de errores mejorado
 * 4. Vista dual (tabla/cuadrícula) optimizada
 */

const ProductList = ({ className = '' }) => {
  const { success, error, withLoadingNotification } = useNotification();

  // ✅ MEJORA: Estado unificado
  const [state, setState] = useState({
    filters: {
      search: '',
      category_id: '',
      status: '',
      stock: '',
      price_min: '',
      price_max: '',
      sort_by: 'name',
      sort_order: 'asc',
      limit: 10
    },
    selectedProduct: null,
    categories: [],
    viewMode: 'table', // 'table' o 'grid'
    exportLoading: false,
    showFilters: true,
    stats: null
  });

  const {
    filters,
    selectedProduct,
    categories,
    viewMode,
    exportLoading,
    showFilters,
    stats
  } = state;

  // ✅ MEJORA: Paginación optimizada
  const pagination = usePagination(
    useCallback(async (params) => {
      const response = await productService.getAll({
        ...params,
        ...filters,
      });
      return response;
    }, [filters]),
    { page: 1, limit: filters.limit },
    true
  );

  const {
    data: productsData,
    loading,
    page,
    limit,
    totalPages,
    totalItems,
    goToPage,
    changeLimit,
    refresh
  } = pagination;

  // ✅ MEJORA: Cargar datos en paralelo
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesResponse, statsResponse] = await Promise.allSettled([
          categoryService.getAll({ limit: 100 }),
          productService.getStats()
        ]);

        if (categoriesResponse.status === 'fulfilled' && categoriesResponse.value.success) {
          setState(prev => ({ ...prev, categories: categoriesResponse.value.data }));
        }

        if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
          setState(prev => ({ ...prev, stats: statsResponse.value.data }));
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };

    loadData();
  }, []);

  // ✅ MEJORA: Handlers optimizados
  const handleFilterChange = useCallback((newFilters) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  }, []);

  const handleFilterSubmit = useCallback(() => {
    goToPage(1);
    refresh();
  }, [goToPage, refresh]);

  const handleResetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {
        search: '',
        category_id: '',
        status: '',
        stock: '',
        price_min: '',
        price_max: '',
        sort_by: 'name',
        sort_order: 'asc',
        limit: 10
      }
    }));
    refresh();
  }, [refresh]);

  // ✅ MEJORA: Manejo de productos
  const handleCreate = useCallback(() => {
    setState(prev => ({ ...prev, selectedProduct: null }));
    openModal('form');
  }, []);

  const handleEdit = useCallback((product) => {
    setState(prev => ({ ...prev, selectedProduct: product }));
    openModal('form');
  }, []);

  const handleView = useCallback((product) => {
    setState(prev => ({ ...prev, selectedProduct: product }));
    openModal('detail');
  }, []);

  const handleDelete = useCallback(async (product) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${product.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await withLoadingNotification(
        productService.delete(product.id),
        'Eliminando producto...'
      );

      success('Producto eliminado exitosamente');
      refresh();
    } catch (err) {
      // Error manejado por withLoadingNotification
    }
  }, [withLoadingNotification, success, refresh]);

  const handleExport = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, exportLoading: true }));

      const response = await productService.exportProducts(filters);
      if (response.success) {
        const url = globalThis.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `productos_${new Date().toISOString().split('T')[0]}.csv`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        success('Exportación completada');
      }
    } catch (err) {
      console.error('Error exportando productos:', err);
      error(`Error exportando productos: ${err.message || 'Error desconocido'}`);
    } finally {
      setState(prev => ({ ...prev, exportLoading: false }));
    }
  }, [filters, success, error]);


  // ✅ MEJORA: Manejo de modales
  const [modals, setModals] = useState({
    form: false,
    detail: false
  });

  const openModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    if (modalName === 'form') {
      setState(prev => ({ ...prev, selectedProduct: null }));
    }
  }, []);

  // ✅ CORRECCIÓN: Función auxiliar para obtener estilos de color
  const getStockColorClass = (color) => {
    switch (color) {
      case 'danger': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColorClass = (color) => {
    switch (color) {
      case 'danger': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ✅ MEJORA: Columnas de tabla optimizadas
  const columns = useMemo(() => [
    Table.createColumn('sku', 'SKU', {
      headerClass: 'w-32',
      cellClass: 'font-mono text-sm'
    }),
    Table.createColumn('name', 'Producto', {
      cell: (product) => (
        <div className="flex items-center min-w-0">
          {product.image_url ? (
            <img
              src={`${process.env.REACT_APP_API_URL || ''}${product.image_url}`}
              alt={product.name}
              className="h-10 w-10 rounded-lg object-cover mr-3 shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-image.png';
              }}
              loading="lazy"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center mr-3 shrink-0">
              <FiPackage className="text-gray-500" />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">{product.name}</div>
            <div className="text-sm text-gray-500 truncate">{product.category_name}</div>
          </div>
        </div>
      ),
      headerClass: 'min-w-64'
    }),
    Table.createColumn('price', 'Precio', {
      cell: (product) => (
        <div className="text-right">
          <div className="font-semibold text-gray-900">
            {formatCurrency(product.price)}
          </div>
          <div className="text-xs text-gray-500">
            Costo: {formatCurrency(product.cost)}
          </div>
        </div>
      ),
      headerClass: 'w-32 text-right',
      cellClass: 'text-right'
    }),
    Table.createColumn('current_stock', 'Stock', {
      cell: (product) => {
        const getStockColor = (current, min, max) => {
          if (current <= 0) return 'danger';
          if (current <= min) return 'warning';
          if (current >= max) return 'info';
          return 'success';
        };

        const color = getStockColor(product.current_stock, product.min_stock, product.max_stock);
        const percentage = Math.round((product.current_stock / product.max_stock) * 100);

        return (
          <div className="text-right">
            <div className="font-semibold">
              {product.current_stock} <span className="text-xs text-gray-500">{product.unit}</span>
            </div>
            <div className="flex items-center justify-end mt-1">
              <div className={`w-2 h-2 rounded-full ${getStockColorClass(color)} mr-2`}></div>
              <div className="text-xs text-gray-500">{percentage}%</div>
            </div>
          </div>
        );
      },
      headerClass: 'w-32 text-right',
      cellClass: 'text-right'
    }),
    Table.createColumn('status', 'Estado', {
      cell: (product) => {
        const statusConfig = {
          active: { label: 'Activo', color: 'success' },
          inactive: { label: 'Inactivo', color: 'warning' },
          discontinued: { label: 'Descontinuado', color: 'danger' }
        };

        const config = statusConfig[product.status] || statusConfig.active;

        return (
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColorClass(config.color)}`}>
            {config.label}
          </div>
        );
      },
      headerClass: 'w-24'
    })
  ], []);

  // ✅ MEJORA: Acciones de tabla
  const tableActions = useMemo(() => Table.createActions([
    {
      label: 'Ver',
      icon: <FiEye />,
      onClick: handleView,
      variant: 'ghost',
      title: 'Ver detalles'
    },
    {
      label: 'Editar',
      icon: <FiEdit2 />,
      onClick: handleEdit,
      variant: 'ghost',
      title: 'Editar producto'
    },
    {
      label: 'Eliminar',
      icon: <FiTrash2 />,
      onClick: handleDelete,
      variant: 'danger',
      title: 'Eliminar producto',
      confirm: true
    }
  ]), [handleView, handleEdit, handleDelete]);

  // ✅ MEJORA: Estadísticas del inventario
  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600">Productos totales</div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.total_products)}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600">Valor total</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_value)}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600">Stock bajo</div>
          <div className="text-2xl font-bold text-red-600">{formatNumber(stats.low_stock)}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600">Sin stock</div>
          <div className="text-2xl font-bold text-yellow-600">{formatNumber(stats.out_of_stock)}</div>
        </div>
      </div>
    );
  };

  // ✅ MEJORA: Contenido de la lista
  const renderContent = () => {
    if (viewMode === 'table') {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table
            columns={columns}
            data={productsData?.data || []}
            loading={loading}
            actions={tableActions}
            pagination={{
              currentPage: page,
              totalPages,
              startIndex: (page - 1) * limit + 1,
              endIndex: Math.min(page * limit, totalItems),
              totalItems,
              onPageChange: goToPage,
              onPrevious: () => goToPage(page - 1),
              onNext: () => goToPage(page + 1),
              onLimitChange: changeLimit
            }}
            emptyMessage={
              <div className="text-center py-12">
                <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filters.search || filters.category_id || filters.status
                    ? 'Intenta con otros filtros'
                    : 'Comienza agregando tu primer producto'}
                </p>
                {!filters.search && !filters.category_id && !filters.status && (
                  <Button
                    variant="primary"
                    onClick={handleCreate}
                    className="mt-4"
                    startIcon={<FiPlus />}
                  >
                    Crear primer producto
                  </Button>
                )}
              </div>
            }
            onRowClick={handleView}
            rowClass="cursor-pointer hover:bg-gray-50"
          />
        </div>
      );
    }

    // Vista de cuadrícula
    return (
      <>
        <ProductGrid
          products={productsData?.data || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          loading={loading}
          emptyMessage={{
            title: 'No hay productos',
            description: 'Comienza agregando tu primer producto al inventario.',
            action: {
              label: 'Crear producto',
              icon: <FiPlus />,
              onClick: handleCreate
            }
          }}
        />

        {/* Paginación para vista cuadrícula */}
        {!loading && productsData?.data?.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{Math.min(page * limit, totalItems)}</span> de{' '}
              <span className="font-medium">{totalItems}</span> productos
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario de Productos</h1>
          <p className="mt-1 text-gray-600">
            Gestiona todos tus productos desde un solo lugar
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Toggle de vista */}
          <div className="flex rounded-lg border border-gray-200 p-1">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setState(prev => ({ ...prev, viewMode: 'table' }))}
              startIcon={<FiList />}
              className="rounded-md"
            >
              Tabla
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setState(prev => ({ ...prev, viewMode: 'grid' }))}
              startIcon={<FiGrid />}
              className="rounded-md"
            >
              Cuadrícula
            </Button>
          </div>

          {/* Acciones principales */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={refresh}
              startIcon={<FiRefreshCw className={loading ? 'animate-spin' : ''} />}
              disabled={loading}
              title="Actualizar lista"
            >
              Actualizar
            </Button>

            <Button
              variant="outline"
              onClick={handleExport}
              startIcon={<FiDownload />}
              loading={exportLoading}
              disabled={exportLoading}
            >
              Exportar
            </Button>

            <Button
              variant="primary"
              onClick={handleCreate}
              startIcon={<FiPlus />}
            >
              Nuevo Producto
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {renderStats()}

      {/* Filtros */}
      <ProductFilter
        filters={filters}
        categories={categories}
        onFilterChange={handleFilterChange}
        onSearch={handleFilterSubmit}
        onReset={handleResetFilters}
        loading={loading}
      />

      {/* Contenido */}
      {renderContent()}

      {/* Modales */}
      <Modal
        isOpen={modals.form}
        onClose={() => closeModal('form')}
        title={selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="extra-large"
        closeOnOverlayClick={false}
      >
        <ProductForm
          product={selectedProduct}
          categories={categories}
          onSubmit={() => {
            closeModal('form');
            success(selectedProduct ? 'Producto actualizado' : 'Producto creado');
            refresh();
          }}
          onCancel={() => closeModal('form')}
        />
      </Modal>

      <Modal
        isOpen={modals.detail}
        onClose={() => closeModal('detail')}
        title="Detalles del Producto"
        size="extra-large"
        fullHeight
      >
        {selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onEdit={() => {
              closeModal('detail');
              handleEdit(selectedProduct);
            }}
            onClose={() => closeModal('detail')}
            onInventoryAction={(product, type) => {
              closeModal('detail');
              console.log(`Acción de inventario: ${type} para ${product.name}`);
              // Implementar lógica de acciones de inventario aquí
            }}
          />
        )}
      </Modal>
    </div>
  );
};

// ✅ AÑADIR: PropTypes
ProductList.propTypes = {
  className: PropTypes.string
};

// ✅ AÑADIR: DefaultProps
ProductList.defaultProps = {
  className: ''
};

export default ProductList;