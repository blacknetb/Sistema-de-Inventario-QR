import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Plus, Folder, Edit2,
  Trash2, Eye, Package, TrendingUp,
  BarChart3, Tag, RefreshCw,
  ChevronRight, ChevronDown, Layers,
  CheckCircle, XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import CategoryModal from '../components/categories/CategoryModal';
import DeleteConfirmation from '../components/common/DeleteConfirmation';
import { useFetch } from '../hooks/useFetch';
import { useDebouncedCallback } from '../hooks/useDebounce';
import { api } from '../services/api';

const CATEGORY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
};

const ICON_OPTIONS = [
  { value: 'folder', icon: Folder, label: 'Carpeta' },
  { value: 'package', icon: Package, label: 'Paquete' },
  { value: 'tag', icon: Tag, label: 'Etiqueta' },
  { value: 'layers', icon: Layers, label: 'Capas' },
  { value: 'bar-chart', icon: BarChart3, label: 'Gráfico' },
  { value: 'trending-up', icon: TrendingUp, label: 'Tendencia' }
];

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const searchInputRef = useRef(null);

  const { data: categoriesData = [], loading, error, refresh: refreshCategories, mutate: mutateCategories } = useFetch(
    async () => {
      try {
        const response = await api.get('/api/categories', {
          params: { includeProducts: true, includeStats: true },
        });
        return response.data?.data || response.data || [];
      } catch (err) {
        console.error('Error fetching categories:', err);
        throw err;
      }
    },
    {},
    {
      initialData: [],
      cacheTime: 30000,
      retryCount: 2,
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Error al cargar categorías');
      },
    }
  );

  const formatCurrency = useCallback((amount) => {
    const numAmount = Number(amount) || 0;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  }, []);

  const renderCategoryIcon = useCallback((iconName, color = '#3b82f6') => {
    const iconConfig = ICON_OPTIONS.find(opt => opt.value === iconName);
    const IconComponent = iconConfig?.icon || Folder;
    return <IconComponent className="w-6 h-6" style={{ color }} />;
  }, []);

  const renderStatusBadge = useCallback((status) => {
    const config = {
      [CATEGORY_STATUS.ACTIVE]: {
        text: 'Activo',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      },
      [CATEGORY_STATUS.INACTIVE]: {
        text: 'Inactivo',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: XCircle
      },
      [CATEGORY_STATUS.ARCHIVED]: {
        text: 'Archivado',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Folder
      }
    };

    const currentConfig = config[status] || config[CATEGORY_STATUS.ACTIVE];
    const Icon = currentConfig.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${currentConfig.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {currentConfig.text}
      </span>
    );
  }, []);

  const buildCategoriesTree = useCallback((categories, sortBy, sortOrder) => {
    if (!categories || !Array.isArray(categories)) return [];

    const categoryMap = new Map();
    const rootCategories = [];

    categories.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        children: [],
        level: 0,
        productCount: category.productCount || 0,
        revenue: category.revenue || 0,
        color: category.color || '#3b82f6',
        icon: category.icon || 'folder'
      });
    });

    categories.forEach(category => {
      const node = categoryMap.get(category.id);
      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId);
        node.level = (parent.level || 0) + 1;
        parent.children.push(node);
        parent.children.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        rootCategories.push(node);
      }
    });

    const sortRecursive = (items) => {
      return items.sort((a, b) => {
        if (sortBy === 'name') {
          return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortBy === 'productCount') {
          return sortOrder === 'asc' ? (a.productCount || 0) - (b.productCount || 0) : (b.productCount || 0) - (a.productCount || 0);
        }
        return 0;
      }).map(item => ({
        ...item,
        children: sortRecursive(item.children || [])
      }));
    };

    return sortRecursive(rootCategories);
  }, []);

  const categoriesTree = useMemo(() => 
    buildCategoriesTree(categoriesData, sortBy, sortOrder), 
    [categoriesData, sortBy, sortOrder, buildCategoriesTree]
  );

  const stats = useMemo(() => {
    if (!Array.isArray(categoriesData)) return {
      totalCategories: 0, activeCategories: 0, inactiveCategories: 0,
      totalProducts: 0, totalRevenue: 0, averageProductsPerCategory: 0
    };

    const totalCategories = categoriesData.length;
    const activeCategories = categoriesData.filter(c => c.status === CATEGORY_STATUS.ACTIVE).length;
    const totalProducts = categoriesData.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
    const totalRevenue = categoriesData.reduce((sum, cat) => sum + (cat.revenue || 0), 0);
    const averageProductsPerCategory = totalCategories > 0 ? Math.round(totalProducts / totalCategories) : 0;

    return {
      totalCategories, activeCategories,
      inactiveCategories: totalCategories - activeCategories,
      totalProducts, totalRevenue, averageProductsPerCategory
    };
  }, [categoriesData]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categoriesTree;

    const searchLower = searchTerm.toLowerCase().trim();
    const filterTree = (items) => items.reduce((acc, item) => {
      const matches = item.name?.toLowerCase().includes(searchLower) ||
                     item.description?.toLowerCase().includes(searchLower) ||
                     item.slug?.toLowerCase().includes(searchLower);

      if (matches) {
        acc.push(item);
      } else {
        const filteredChildren = filterTree(item.children || []);
        if (filteredChildren.length > 0) {
          acc.push({ ...item, children: filteredChildren });
        }
      }
      return acc;
    }, []);

    return filterTree([...categoriesTree]);
  }, [categoriesTree, searchTerm]);

  const debouncedSearch = useDebouncedCallback(
    (value) => setSearchTerm(value.trim()),
    300,
    { leading: false, trailing: true }
  );

  const CategoryListItem = React.memo(({ category, level, isExpanded, onToggle, onEdit, onDelete, onView }) => {
    const hasChildren = category.children && category.children.length > 0;

    return (
      <>
        <div
          className={`flex items-center p-4 hover:bg-gray-50 transition-colors duration-200 ${selectedCategory?.id === category.id ? 'bg-blue-50' : ''}`}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          <div className="flex items-center flex-1 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => onToggle(category.id)}
                className="mr-2 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label={isExpanded ? 'Colapsar categoría' : 'Expandir categoría'}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6 mr-2" />
            )}

            <div className="p-2 rounded-lg mr-3 shrink-0" style={{ backgroundColor: `${category.color || '#3b82f6'}20` }}>
              {renderCategoryIcon(category.icon, category.color)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 truncate">{category.name}</h3>
                <div className="flex items-center space-x-2 ml-2">{renderStatusBadge(category.status)}</div>
              </div>
              {category.description && <p className="text-sm text-gray-600 truncate mt-1">{category.description}</p>}
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center"><Package className="w-3 h-3 mr-1" />{category.productCount || 0} productos</span>
                {(category.revenue || 0) > 0 && <span className="flex items-center"><TrendingUp className="w-3 h-3 mr-1" />{formatCurrency(category.revenue)}</span>}
                <span>{category.createdAt ? new Date(category.createdAt).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button onClick={() => onView(category)} className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors" title="Ver productos">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit(category)} className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors" title="Editar">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(category)} className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors" title="Eliminar">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && hasChildren && category.children.map(child => (
          <CategoryListItem
            key={child.id}
            category={child}
            level={level + 1}
            isExpanded={expandedCategories.has(child.id)}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        ))}
      </>
    );
  });

  CategoryListItem.displayName = 'CategoryListItem';

  const renderCategoryItem = useCallback((category, level = 0) => {
    const handleToggle = (categoryId) => {
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        newSet.has(categoryId) ? newSet.delete(categoryId) : newSet.add(categoryId);
        return newSet;
      });
    };

    const handleEdit = (cat) => {
      setSelectedCategory(cat);
      setShowEditModal(true);
    };

    const handleDelete = (cat) => {
      setCategoryToDelete(cat);
      setShowDeleteModal(true);
    };

    const handleView = (cat) => {
      setSelectedCategory(cat);
    };

    return (
      <CategoryListItem
        key={category.id}
        category={category}
        level={level}
        isExpanded={expandedCategories.has(category.id)}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />
    );
  }, [expandedCategories, selectedCategory]);

  const CategoryCard = React.memo(({ category, onEdit, onDelete, onView }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="h-2" style={{ backgroundColor: category.color || '#3b82f6' }}></div>
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="p-3 rounded-lg mr-4" style={{ backgroundColor: `${category.color || '#3b82f6'}20` }}>
            {renderCategoryIcon(category.icon, category.color)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{category.name}</h3>
            {category.description && <p className="text-sm text-gray-600 truncate">{category.description}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{category.productCount || 0}</div>
            <div className="text-xs text-gray-500">Productos</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{category.children?.length || 0}</div>
            <div className="text-xs text-gray-500">Subcategorías</div>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {(category.revenue || 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ingresos:</span>
              <span className="font-medium">{formatCurrency(category.revenue)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Estado:</span>
            {renderStatusBadge(category.status)}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Creada:</span>
            <span className="font-medium">{category.createdAt ? new Date(category.createdAt).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <button onClick={() => onView(category)} className="px-3 py-2 text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center transition-colors">
            <Eye className="w-4 h-4 mr-1" /> Ver
          </button>
          <button onClick={() => onEdit(category)} className="px-3 py-2 text-green-600 hover:text-green-900 text-sm font-medium flex items-center transition-colors">
            <Edit2 className="w-4 h-4 mr-1" /> Editar
          </button>
          <button onClick={() => onDelete(category)} className="px-3 py-2 text-red-600 hover:text-red-900 text-sm font-medium flex items-center transition-colors">
            <Trash2 className="w-4 h-4 mr-1" /> Eliminar
          </button>
        </div>
      </div>
    </motion.div>
  ));

  CategoryCard.displayName = 'CategoryCard';

  const renderCategoryCard = useCallback((category) => (
    <CategoryCard
      key={category.id}
      category={category}
      onEdit={(cat) => {
        setSelectedCategory(cat);
        setShowEditModal(true);
      }}
      onDelete={(cat) => {
        setCategoryToDelete(cat);
        setShowDeleteModal(true);
      }}
      onView={(cat) => setSelectedCategory(cat)}
    />
  ), []);

  const toggleCategoryExpand = useCallback((categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      newSet.has(categoryId) ? newSet.delete(categoryId) : newSet.add(categoryId);
      return newSet;
    });
  }, []);

  const toggleExpandAll = useCallback(() => {
    if (expandedCategories.size === categoriesTree.length) {
      setExpandedCategories(new Set());
    } else {
      const allIds = categoriesTree.map(cat => cat.id);
      setExpandedCategories(new Set(allIds));
    }
  }, [categoriesTree, expandedCategories.size]);

  const handleAddCategory = useCallback(async (categoryData) => {
    try {
      const formattedData = {
        name: categoryData.name,
        description: categoryData.description || '',
        status: categoryData.status || CATEGORY_STATUS.ACTIVE,
        icon: categoryData.icon || 'folder',
        color: categoryData.color || '#3b82f6',
        parentId: categoryData.parentId || null,
        slug: categoryData.slug || categoryData.name.toLowerCase().replaceAll(' ', '-')
      };

      const response = await api.post('/api/categories', formattedData);
      mutateCategories(prev => [...(prev || []), response.data]);
      setShowAddModal(false);
      toast.success('Categoría creada exitosamente');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Error al crear categoría';
      toast.error(message);
      throw new Error(message);
    }
  }, [mutateCategories]);

  const handleEditCategory = useCallback(async (categoryData) => {
    try {
      if (!categoryData.id) {
        toast.error('ID de categoría no proporcionado');
        return;
      }

      const formattedData = {
        name: categoryData.name,
        description: categoryData.description || "",
        status: categoryData.status || CATEGORY_STATUS.ACTIVE,
        icon: categoryData.icon || "folder",
        color: categoryData.color || "#3b82f6",
        parentId: categoryData.parentId || null,
        slug: categoryData.slug || categoryData.name.toLowerCase().replaceAll(" ", "-"),
      };

      const response = await api.put(`/api/categories/${categoryData.id}`, formattedData);
      mutateCategories(prev => (prev || []).map(cat => cat.id === categoryData.id ? response.data : cat));
      setShowEditModal(false);
      setSelectedCategory(null);
      toast.success('Categoría actualizada exitosamente');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar categoría';
      toast.error(message);
      throw new Error(message);
    }
  }, [mutateCategories]);

  const handleDeleteCategory = useCallback(async () => {
    if (!categoryToDelete?.id) {
      toast.error('Categoría no seleccionada');
      return;
    }

    try {
      await api.delete(`/api/categories/${categoryToDelete.id}`);
      mutateCategories(prev => (prev || []).filter(cat => cat.id !== categoryToDelete.id));
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      toast.success('Categoría eliminada exitosamente');
    } catch (error) {
      const message = error.response?.data?.message || 'Error al eliminar categoría';
      toast.error(message);
    }
  }, [categoryToDelete, mutateCategories]);

  const handleRefresh = useCallback(async () => {
    try {
      await refreshCategories();
      toast.success('Categorías actualizadas');
    } catch (error) {
      console.error('Refresh error:', error);
    }
  }, [refreshCategories]);

  const handleSortChange = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }, [sortBy, sortOrder]);

  const MainContent = () => {
    if (filteredCategories.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No se encontraron categorías</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? "Intenta con otros términos de búsqueda" : "Comienza agregando tu primera categoría"}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Agregar categoría
          </button>
        </div>
      );
    }

    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map(renderCategoryCard)}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredCategories.map((category) => renderCategoryItem(category))}
      </div>
    );
  };

  if (loading && !categoriesData.length) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
            <p className="text-gray-600 mt-2">Organiza y gestiona las categorías de productos</p>
          </div>
        </div>
        <LoadingSpinner message="Cargando categorías..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
            <p className="text-gray-600 mt-2">Organiza y gestiona las categorías de productos</p>
          </div>
        </div>
        <ErrorMessage
          title="Error al cargar categorías"
          message={error.message || 'No se pudieron cargar las categorías'}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-600 mt-2">Organiza y gestiona las categorías de productos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleExpandAll}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center"
          >
            {expandedCategories.size === categoriesTree.length ? (
              <><ChevronRight className="w-4 h-4 mr-2" />Colapsar todo</>
            ) : (
              <><ChevronDown className="w-4 h-4 mr-2" />Expandir todo</>
            )}
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center"
          >
            {viewMode === 'grid' ? (
              <><Layers className="w-4 h-4 mr-2" />Vista lista</>
            ) : (
              <><Folder className="w-4 h-4 mr-2" />Vista cuadrícula</>
            )}
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Actualizar
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />Nueva Categoría
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg"><Folder className="w-6 h-6 text-blue-600" /></div>
            <span className="text-sm font-medium text-blue-600">{stats.totalCategories > 0 ? `+${stats.totalCategories}` : '0'}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalCategories}</h3>
          <p className="text-gray-600 text-sm">Total categorías</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg"><Package className="w-6 h-6 text-green-600" /></div>
            <span className="text-sm font-medium text-green-600">{stats.activeCategories > 0 ? `+${stats.activeCategories}` : '0'}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.activeCategories}</h3>
          <p className="text-gray-600 text-sm">Categorías activas</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg"><BarChart3 className="w-6 h-6 text-purple-600" /></div>
            <span className="text-sm font-medium text-purple-600">{stats.totalProducts > 0 ? `+${stats.totalProducts}` : '0'}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalProducts}</h3>
          <p className="text-gray-600 text-sm">Productos totales</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg"><TrendingUp className="w-6 h-6 text-orange-600" /></div>
            <span className="text-sm font-medium text-orange-600">{stats.averageProductsPerCategory}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.averageProductsPerCategory}</h3>
          <p className="text-gray-600 text-sm">Promedio productos</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg"><Tag className="w-6 h-6 text-indigo-600" /></div>
            <span className="text-sm font-medium text-indigo-600">{formatCurrency(stats.totalRevenue)}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{formatCurrency(stats.totalRevenue)}</h3>
          <p className="text-gray-600 text-sm">Ingresos totales</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Buscar categorías</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSortChange('name')}
                className={`px-3 py-1 rounded text-sm transition-colors ${sortBy === 'name' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Nombre {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSortChange('productCount')}
                className={`px-3 py-1 rounded text-sm transition-colors ${sortBy === 'productCount' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Productos {sortBy === 'productCount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>

          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar categorías..."
              defaultValue={searchTerm}
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full md:w-64 lg:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm text-gray-500">
            Mostrando {filteredCategories.length} categorías{searchTerm && ` para "${searchTerm}"`}
          </span>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                if (searchInputRef.current) searchInputRef.current.value = '';
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors flex items-center"
            >
              <Filter className="w-4 h-4 inline mr-2" /> Limpiar búsqueda
            </button>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}>
        <MainContent />
      </motion.div>

      <AnimatePresence>
        {showAddModal && (
          <CategoryModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddCategory}
            title="Nueva Categoría"
            submitText="Crear Categoría"
            parentCategories={categoriesData}
            iconOptions={ICON_OPTIONS}
            statusOptions={Object.entries(CATEGORY_STATUS).map(([key, value]) => ({
              value,
              label: key.charAt(0) + key.slice(1).toLowerCase()
            }))}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && selectedCategory && (
          <CategoryModal
            isOpen={showEditModal}
            onClose={() => { setShowEditModal(false); setSelectedCategory(null); }}
            onSubmit={handleEditCategory}
            title="Editar Categoría"
            submitText="Guardar Cambios"
            initialData={selectedCategory}
            parentCategories={categoriesData.filter(cat => cat.id !== selectedCategory.id)}
            iconOptions={ICON_OPTIONS}
            statusOptions={Object.entries(CATEGORY_STATUS).map(([key, value]) => ({
              value,
              label: key.charAt(0) + key.slice(1).toLowerCase()
            }))}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && categoryToDelete && (
          <DeleteConfirmation
            isOpen={showDeleteModal}
            onClose={() => { setShowDeleteModal(false); setCategoryToDelete(null); }}
            onConfirm={handleDeleteCategory}
            title="Eliminar Categoría"
            message={`¿Estás seguro de que quieres eliminar la categoría "${categoryToDelete.name}"? ${(categoryToDelete.productCount || 0) > 0
              ? `Esta categoría tiene ${categoryToDelete.productCount} productos.`
              : ''
              }`}
            confirmText="Eliminar"
            cancelText="Cancelar"
            warning={(categoryToDelete.productCount || 0) > 0}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

Categories.displayName = 'Categories';
export { Categories };
export default Categories;