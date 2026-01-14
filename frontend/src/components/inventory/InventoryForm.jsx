import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import "../../assets/styles/inventory.css"
import * as yup from 'yup';
import PropTypes from 'prop-types';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';
import { useNotification } from '../../context/NotificationContext';
import { 
  FiPackage, 
  FiInfo, 
  FiTrendingUp, 
  FiTrendingDown,
  FiDollarSign,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiUser,
  FiSave,
  FiX,
  FiSearch
} from 'react-icons/fi';
import { formatCurrency } from '../../utils/helpers';

// ✅ Esquema de validación mejorado
const inventorySchema = yup.object().shape({
  product_id: yup.string().required('Selecciona un producto'),
  movement_type: yup.string().oneOf(['in', 'out']).required('Selecciona tipo de movimiento'),
  quantity: yup
    .number()
    .typeError('La cantidad debe ser un número')
    .positive('La cantidad debe ser positiva')
    .integer('La cantidad debe ser un número entero')
    .required('Ingresa la cantidad'),
  reason: yup
    .string()
    .required('Ingresa el motivo del movimiento')
    .min(5, 'El motivo debe tener al menos 5 caracteres')
    .max(500, 'El motivo no debe exceder 500 caracteres'),
  notes: yup.string().max(1000, 'Las notas no deben exceder 1000 caracteres'),
  reference_number: yup.string().max(50, 'El número de referencia no debe exceder 50 caracteres'),
});

// ✅ Hook de debounce reutilizable
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// ✅ Componente principal
const InventoryForm = ({ onSubmit, onCancel, initialProductId, mode = 'create' }) => {
  const { success, error, warning, withLoadingNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentStock, setCurrentStock] = useState(0);
  const [suggestedQuantity, setSuggestedQuantity] = useState(0);
  const [recentMovements, setRecentMovements] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const debouncedProductSearch = useDebounce(productSearch, 300);

  // ✅ useForm con configuración optimizada
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    watch,
    reset,
    trigger
  } = useForm({
    resolver: yupResolver(inventorySchema),
    defaultValues: {
      movement_type: 'in',
      quantity: 1,
      product_id: initialProductId || '',
      reason: '',
      notes: '',
      reference_number: '',
    },
    mode: 'onChange'
  });

  const productId = watch('product_id');
  const movementType = watch('movement_type');
  const quantity = watch('quantity');
  const reason = watch('reason');

  // ✅ Cargar productos al montar el componente
  useEffect(() => {
    let isMounted = true;

    const loadInitialProducts = async () => {
      try {
        const response = await productService.getAll({ 
          limit: 200,
          status: 'active',
          fields: 'id,name,sku,description,unit,price,min_stock,max_stock,category_name,supplier_name,current_stock'
        });
        
        if (isMounted && response.success) {
          setProducts(response.data || []);
          setFilteredProducts(response.data || []);
          setInitialLoadComplete(true);
        }
      } catch (err) {
        console.error('Error cargando productos:', err);
        if (isMounted) {
          error('Error cargando productos. Intenta nuevamente.');
        }
      }
    };
    
    loadInitialProducts();

    return () => {
      isMounted = false;
    };
  }, [error]);

  // ✅ Filtrar productos con debounce
  useEffect(() => {
    if (!initialLoadComplete) return;

    const filterProducts = () => {
      if (debouncedProductSearch.trim() === '') {
        setFilteredProducts(products);
      } else {
        const searchTerm = debouncedProductSearch.toLowerCase();
        const filtered = products.filter(product => 
          (product.name && product.name.toLowerCase().includes(searchTerm)) ||
          (product.sku && product.sku.toLowerCase().includes(searchTerm)) ||
          (product.description && product.description.toLowerCase().includes(searchTerm))
        );
        setFilteredProducts(filtered);
      }
    };

    filterProducts();
  }, [debouncedProductSearch, products, initialLoadComplete]);

  // ✅ Cargar detalles del producto seleccionado
  useEffect(() => {
    let isMounted = true;

    const loadProductData = async () => {
      if (!productId) {
        if (isMounted) {
          setSelectedProduct(null);
          setCurrentStock(0);
          setSuggestedQuantity(0);
          setRecentMovements([]);
        }
        return;
      }

      try {
        // Cargar producto
        const productResponse = await productService.getById(productId);
        if (!isMounted) return;

        if (productResponse.success) {
          const product = productResponse.data;
          setSelectedProduct(product);
          
          // Cargar stock actual
          const currentStockValue = product.current_stock || 0;
          setCurrentStock(currentStockValue);
          
          // Cargar movimientos recientes
          const movementsResponse = await inventoryService.getHistoryByProduct(productId, { 
            limit: 5,
            sort_by: 'created_at',
            sort_order: 'desc'
          });
          
          if (isMounted && movementsResponse.success) {
            setRecentMovements(movementsResponse.data || []);
          }
        } else {
          if (isMounted) {
            error('Error cargando información del producto');
          }
        }
      } catch (err) {
        console.error('Error cargando detalles del producto:', err);
        if (isMounted) {
          error('Error cargando información del producto');
        }
      }
    };
    
    loadProductData();

    return () => {
      isMounted = false;
    };
  }, [productId, error]);

  // ✅ Actualizar cantidad sugerida
  useEffect(() => {
    if (selectedProduct && movementType === 'in') {
      const optimalStock = selectedProduct.min_stock * 1.5;
      const suggested = Math.max(
        optimalStock - currentStock,
        selectedProduct.min_stock * 0.5
      );
      setSuggestedQuantity(suggested > 0 ? Math.ceil(suggested) : selectedProduct.min_stock);
    }
  }, [selectedProduct, currentStock, movementType]);

  // ✅ Validación de stock mejorada
  const validateStock = useCallback((value) => {
    if (!selectedProduct || !value) return true;
    
    const quantityNum = parseInt(value, 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return 'La cantidad debe ser un número positivo';
    }
    
    if (movementType === 'out') {
      if (quantityNum > currentStock) {
        return `Stock insuficiente. Disponible: ${currentStock} ${selectedProduct.unit}`;
      }
      
      const newStock = currentStock - quantityNum;
      if (newStock < selectedProduct.min_stock) {
        return `Alerta: El stock quedará por debajo del mínimo (${selectedProduct.min_stock} ${selectedProduct.unit})`;
      }
    }
    
    if (movementType === 'in') {
      const newStock = currentStock + quantityNum;
      if (selectedProduct.max_stock && newStock > selectedProduct.max_stock) {
        return `Alerta: El stock excederá el máximo (${selectedProduct.max_stock} ${selectedProduct.unit})`;
      }
    }
    
    return true;
  }, [selectedProduct, currentStock, movementType]);

  // ✅ Aplicar cantidad sugerida
  const applySuggestedQuantity = useCallback(() => {
    if (suggestedQuantity > 0) {
      setValue('quantity', suggestedQuantity, { shouldValidate: true });
    }
  }, [suggestedQuantity, setValue]);

  // ✅ Calcular valor total
  const calculateTotalValue = useCallback(() => {
    if (!selectedProduct || !quantity) return 0;
    const qty = parseInt(quantity, 10) || 0;
    return (selectedProduct.price || 0) * qty;
  }, [selectedProduct, quantity]);

  // ✅ Estado de stock
  const stockStatus = useMemo(() => {
    if (!selectedProduct) return null;
    
    const percentage = selectedProduct.max_stock 
      ? (currentStock / selectedProduct.max_stock) * 100 
      : (currentStock / selectedProduct.min_stock) * 100;
    
    if (currentStock === 0) {
      return { 
        color: 'danger', 
        text: 'Agotado', 
        icon: <FiXCircle />,
        level: 'critical'
      };
    } else if (currentStock <= selectedProduct.min_stock) {
      return { 
        color: 'warning', 
        text: 'Stock Bajo', 
        icon: <FiAlertTriangle />,
        level: 'low'
      };
    } else if (selectedProduct.max_stock && percentage >= 90) {
      return { 
        color: 'info', 
        text: 'Stock Alto', 
        icon: <FiAlertTriangle />,
        level: 'high'
      };
    } else {
      return { 
        color: 'success', 
        text: 'Stock Normal', 
        icon: <FiCheckCircle />,
        level: 'normal'
      };
    }
  }, [selectedProduct, currentStock]);

  // ✅ Envío del formulario
  const onSubmitForm = async (data) => {
    if (!selectedProduct) {
      error('Selecciona un producto antes de continuar');
      return;
    }

    try {
      setLoading(true);
      
      // Validación adicional de stock
      const validationResult = validateStock(data.quantity);
      if (validationResult !== true) {
        warning(validationResult);
        setLoading(false);
        return;
      }
      
      const response = await withLoadingNotification(
        inventoryService.createMovement({
          ...data,
          notes: data.notes || `Movimiento registrado el ${new Date().toLocaleDateString()}`,
          reference_number: data.reference_number || `MOV-${Date.now()}`
        }),
        'Registrando movimiento...'
      );

      if (response.success) {
        success('Movimiento registrado exitosamente', {
          duration: 5000,
          icon: '✅',
          action: {
            label: 'Ver detalle',
            onClick: () => window.open(`/inventory/history/${response.data.id}`, '_blank')
          }
        });
        
        // Resetear formulario
        reset({
          movement_type: 'in',
          quantity: 1,
          product_id: initialProductId || '',
          reason: '',
          notes: '',
          reference_number: '',
        });
        
        // Limpiar estados
        setSelectedProduct(null);
        setCurrentStock(0);
        setProductSearch('');
        setSuggestedQuantity(0);
        setRecentMovements([]);
        
        // Llamar callback de onSubmit si existe
        if (onSubmit && typeof onSubmit === 'function') {
          onSubmit(response.data);
        }
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (err) {
      console.error('Error registrando movimiento:', err);
      error('Error al registrar el movimiento. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* ✅ ENCABEZADO */}
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-primary">Registro de Movimiento</h2>
            <p className="text-sm text-muted mt-1">
              Complete los detalles del movimiento de inventario
            </p>
          </div>
          <Badge 
            variant={mode === 'create' ? 'primary' : 'warning'}
            className="capitalize"
          >
            {mode === 'create' ? 'Nuevo Registro' : 'Edición'}
          </Badge>
        </div>
      </div>

      {/* ✅ TIPO DE MOVIMIENTO */}
      <div>
        <label className="form-label mb-3 block">Tipo de Movimiento *</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { 
              value: 'in', 
              label: 'Entrada de Stock', 
              description: 'Agregar productos al inventario',
              icon: <FiTrendingUp className="text-2xl" />,
              color: 'green',
              examples: ['Compra', 'Producción', 'Devolución', 'Ajuste positivo']
            },
            { 
              value: 'out', 
              label: 'Salida de Stock', 
              description: 'Retirar productos del inventario',
              icon: <FiTrendingDown className="text-2xl" />,
              color: 'red',
              examples: ['Venta', 'Consumo', 'Daño', 'Ajuste negativo']
            },
          ].map((option) => (
            <label 
              key={option.value} 
              className={`radio-card ${movementType === option.value ? 'radio-card-active' : ''}`}
            >
              <input
                type="radio"
                className="sr-only"
                value={option.value}
                {...register('movement_type', {
                  onChange: () => trigger('quantity')
                })}
              />
              <div className={`radio-card-content ${movementType === option.value ? `border-${option.color === 'green' ? 'success' : 'danger'}` : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`radio-card-icon ${movementType === option.value ? `bg-${option.color === 'green' ? 'success' : 'danger'}-light` : ''}`}>
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <div className={`radio-card-title ${movementType === option.value ? `text-${option.color === 'green' ? 'success' : 'danger'}` : ''}`}>
                      {option.label}
                    </div>
                    <div className="radio-card-description">
                      {option.description}
                    </div>
                    <div className="radio-card-examples">
                      <span className="font-medium">Ejemplos:</span> {option.examples.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
        {errors.movement_type && (
          <Alert type="danger" className="mt-2">
            {errors.movement_type.message}
          </Alert>
        )}
      </div>

      {/* ✅ SELECCIÓN DE PRODUCTO */}
      <div className="space-y-3">
        <label className="form-label">Producto *</label>
        
        {/* Buscador */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar producto por nombre, SKU o descripción..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            icon={<FiSearch />}
            iconPosition="left"
            disabled={loading}
          />
        </div>
        
        {/* Selector de productos */}
        <div className="relative">
          <Controller
            name="product_id"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                disabled={loading}
                options={[
                  { value: '', label: 'Seleccione un producto...' },
                  ...filteredProducts.map((product) => ({
                    value: product.id,
                    label: `${product.name} (${product.sku}) - Stock: ${product.current_stock || 0} ${product.unit}`
                  }))
                ]}
                onChange={(e) => {
                  field.onChange(e);
                  trigger('product_id');
                }}
              />
            )}
          />
          {filteredProducts.length > 0 && (
            <div className="text-xs text-muted mt-1">
              {filteredProducts.length} productos encontrados
            </div>
          )}
        </div>
        
        {errors.product_id && (
          <Alert type="danger">
            {errors.product_id.message}
          </Alert>
        )}
      </div>

      {/* ✅ INFORMACIÓN DEL PRODUCTO SELECCIONADO */}
      {selectedProduct && (
        <div className="card card-info">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="icon-container bg-info-light">
                <FiPackage className="text-info" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="card-title">
                {selectedProduct.name}
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  SKU: {selectedProduct.sku}
                </Badge>
                {selectedProduct.category_name && (
                  <Badge variant="outline" className="text-xs">
                    {selectedProduct.category_name}
                  </Badge>
                )}
                {selectedProduct.supplier_name && (
                  <Badge variant="outline" className="text-xs">
                    Proveedor: {selectedProduct.supplier_name}
                  </Badge>
                )}
              </div>
              
              {/* Estadísticas del producto */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="stat-card">
                  <div className="stat-label">Stock Actual</div>
                  <div className={`stat-value ${
                    stockStatus?.level === 'critical' ? 'text-danger' :
                    stockStatus?.level === 'low' ? 'text-warning' :
                    'text-info'
                  }`}>
                    {currentStock} {selectedProduct.unit}
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-label">Stock Mínimo</div>
                  <div className="stat-value">
                    {selectedProduct.min_stock} {selectedProduct.unit}
                  </div>
                </div>
                
                {selectedProduct.max_stock && (
                  <div className="stat-card">
                    <div className="stat-label">Stock Máximo</div>
                    <div className="stat-value">
                      {selectedProduct.max_stock} {selectedProduct.unit}
                    </div>
                  </div>
                )}
                
                <div className="stat-card">
                  <div className="stat-label">Estado</div>
                  <div className="flex items-center mt-1">
                    {stockStatus?.icon}
                    <span className={`ml-2 font-bold ${
                      stockStatus?.color === 'danger' ? 'text-danger' :
                      stockStatus?.color === 'warning' ? 'text-warning' :
                      stockStatus?.color === 'success' ? 'text-success' :
                      'text-info'
                    }`}>
                      {stockStatus?.text}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Barra de progreso de stock */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-info mb-2">
                  <span>0 {selectedProduct.unit}</span>
                  <span>
                    {selectedProduct.max_stock || selectedProduct.min_stock * 2} {selectedProduct.unit}
                  </span>
                </div>
                <ProgressBar
                  value={(currentStock / (selectedProduct.max_stock || selectedProduct.min_stock * 2)) * 100}
                  max={100}
                  variant={stockStatus?.color}
                  showLabel={false}
                  height="10px"
                  className="rounded-full"
                />
                <div className="flex justify-between text-xs text-muted mt-2">
                  <span>Actual: {currentStock}</span>
                  <span>Mín: {selectedProduct.min_stock}</span>
                  {selectedProduct.max_stock && <span>Máx: {selectedProduct.max_stock}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ CANTIDAD Y VALOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="form-label">
              Cantidad ({movementType === 'in' ? 'entrada' : 'salida'}) *
            </label>
            {movementType === 'in' && suggestedQuantity > 0 && (
              <button
                type="button"
                onClick={applySuggestedQuantity}
                className="btn btn-link btn-sm text-success"
                disabled={loading}
              >
                <FiCheckCircle className="mr-1" />
                Sugerido: {suggestedQuantity}
              </button>
            )}
          </div>
          
          <Controller
            name="quantity"
            control={control}
            rules={{
              validate: validateStock
            }}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                type="number"
                min="1"
                step="1"
                placeholder="Ej: 10"
                error={fieldState.error?.message}
                required
                disabled={!selectedProduct || loading}
                onChange={(e) => {
                  field.onChange(e);
                  if (e.target.value && selectedProduct) {
                    trigger('quantity');
                  }
                }}
                className="text-lg"
              />
            )}
          />
          
          {movementType === 'out' && selectedProduct && (
            <div className="text-sm text-muted mt-2">
              Disponible: <span className="font-medium">{currentStock} {selectedProduct.unit}</span>
            </div>
          )}
        </div>
        
        <div>
          <label className="form-label">Valor Total</label>
          <div className="value-display">
            <FiDollarSign className="value-icon" />
            <div className="flex-1">
              <div className="value-amount">
                {formatCurrency(calculateTotalValue())}
              </div>
              <div className="value-description">
                {selectedProduct?.price ? `${formatCurrency(selectedProduct.price)} c/u` : 'Precio no disponible'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ VALIDACIÓN DE STOCK */}
      {errors.quantity?.message && selectedProduct && (
        <Alert 
          type={errors.quantity.message.includes('insuficiente') ? 'danger' : 'warning'}
          icon={<FiAlertTriangle />}
          dismissible
        >
          <div className="space-y-1">
            <div className="font-medium">{errors.quantity.message}</div>
            {movementType === 'out' && currentStock > 0 && (
              <div className="text-sm">
                Stock disponible: {currentStock} {selectedProduct.unit}
              </div>
            )}
            {movementType === 'in' && selectedProduct.max_stock && (
              <div className="text-sm">
                Capacidad máxima: {selectedProduct.max_stock} {selectedProduct.unit}
              </div>
            )}
          </div>
        </Alert>
      )}

      {/* ✅ MOTIVO Y DETALLES ADICIONALES */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="form-label">Motivo *</label>
            <div className="text-sm text-muted">
              {reason ? `${reason.length}/500` : 'Máximo 500 caracteres'}
            </div>
          </div>
          <textarea
            className="form-textarea"
            placeholder={`Describe el motivo de esta ${movementType === 'in' ? 'entrada' : 'salida'}...`}
            {...register('reason')}
            disabled={!selectedProduct || loading}
            rows={4}
          />
          {errors.reason && (
            <Alert type="danger" className="mt-2">
              {errors.reason.message}
            </Alert>
          )}
        </div>
        
        {/* Campos adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Número de Referencia</label>
            <Input
              type="text"
              placeholder="Ej: FACT-001, OC-2024-001"
              {...register('reference_number')}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="form-label">Notas Adicionales</label>
            <textarea
              className="form-textarea"
              placeholder="Información adicional del movimiento..."
              {...register('notes')}
              rows={3}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* ✅ MOVIMIENTOS RECIENTES */}
      {recentMovements.length > 0 && (
        <div className="card card-muted">
          <h4 className="card-subtitle">
            <FiCalendar className="mr-2" />
            Movimientos Recientes
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {recentMovements.map((movement, index) => (
              <div 
                key={movement.id || `movement-${index}`} 
                className="movement-item"
              >
                <div className="flex items-center min-w-0">
                  <div className={`movement-indicator ${
                    movement.movement_type === 'in' ? 'movement-in' : 'movement-out'
                  }`} />
                  <div className="min-w-0">
                    <div className="flex items-center">
                      <span className={`movement-quantity ${
                        movement.movement_type === 'in' ? 'text-success' : 'text-danger'
                      }`}>
                        {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity} {selectedProduct?.unit}
                      </span>
                      <span className="mx-2 text-border">•</span>
                      <span className="movement-reason">{movement.reason}</span>
                    </div>
                    <div className="movement-meta">
                      <FiUser className="inline mr-1" />
                      {movement.created_by_name || 'Sistema'} • {new Date(movement.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="movement-time">
                  {new Date(movement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ RESUMEN DEL MOVIMIENTO */}
      {selectedProduct && quantity && parseInt(quantity, 10) > 0 && (
        <div className="card card-primary">
          <h4 className="card-title">Resumen del Movimiento</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="summary-card">
              <div className="summary-label">Producto</div>
              <div className="summary-value">{selectedProduct.name}</div>
              <div className="summary-description">{selectedProduct.sku}</div>
            </div>
            
            <div className="summary-card">
              <div className="summary-label">Tipo</div>
              <div className={`summary-value ${
                movementType === 'in' ? 'text-success' : 'text-danger'
              }`}>
                {movementType === 'in' ? 'Entrada ↗' : 'Salida ↘'}
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-label">Cantidad</div>
              <div className={`summary-value ${
                movementType === 'in' ? 'text-success' : 'text-danger'
              }`}>
                {movementType === 'in' ? '+' : '-'}{quantity} {selectedProduct.unit}
              </div>
            </div>
          </div>
          
          <div className="summary-details">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="detail-label">Stock Actual</div>
                <div className="detail-value">{currentStock} {selectedProduct.unit}</div>
              </div>
              
              <div>
                <div className="detail-label">Movimiento</div>
                <div className={`detail-value ${
                  movementType === 'in' ? 'text-success' : 'text-danger'
                }`}>
                  {movementType === 'in' ? '+' : '-'}{quantity} {selectedProduct.unit}
                </div>
              </div>
              
              <div>
                <div className="detail-label">Nuevo Stock</div>
                <div className={`detail-value ${
                  movementType === 'in' 
                    ? (currentStock + parseInt(quantity, 10)) > (selectedProduct.max_stock || Infinity)
                      ? 'text-warning'
                      : 'text-success'
                    : (currentStock - parseInt(quantity, 10)) < selectedProduct.min_stock
                      ? 'text-warning'
                      : 'text-danger'
                }`}>
                  {movementType === 'in' 
                    ? currentStock + parseInt(quantity, 10) 
                    : currentStock - parseInt(quantity, 10)} {selectedProduct.unit}
                </div>
              </div>
              
              <div>
                <div className="detail-label">Valor Total</div>
                <div className="detail-value">{formatCurrency(calculateTotalValue())}</div>
              </div>
            </div>
            
            {/* Barra de progreso del nuevo stock */}
            <div className="mt-4">
              <ProgressBar
                value={movementType === 'in' 
                  ? ((currentStock + parseInt(quantity, 10)) / (selectedProduct.max_stock || selectedProduct.min_stock * 2)) * 100
                  : ((currentStock - parseInt(quantity, 10)) / selectedProduct.min_stock) * 100
                }
                max={100}
                variant={
                  movementType === 'in'
                    ? (currentStock + parseInt(quantity, 10)) > (selectedProduct.max_stock || selectedProduct.min_stock * 2)
                      ? 'warning'
                      : 'success'
                    : (currentStock - parseInt(quantity, 10)) < selectedProduct.min_stock
                      ? 'warning'
                      : 'danger'
                }
                showLabel
                label={`Nuevo stock: ${
                  movementType === 'in' 
                    ? currentStock + parseInt(quantity, 10) 
                    : currentStock - parseInt(quantity, 10)
                } ${selectedProduct.unit}`}
                height="12px"
                className="rounded-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* ✅ ACCIONES */}
      <div className="form-actions">
        <div className="form-help">
          <div className="flex items-center">
            <FiInfo className="mr-2" />
            * Campos obligatorios
          </div>
          {selectedProduct && selectedProduct.price && (
            <div className="mt-1">
              Precio unitario: <span className="font-medium">{formatCurrency(selectedProduct.price)}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            icon={<FiX />}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!selectedProduct || !quantity || !reason || loading || !isValid}
            icon={<FiSave />}
            className="min-w-[180px]"
          >
            {movementType === 'in' ? 'Registrar Entrada' : 'Registrar Salida'}
          </Button>
        </div>
      </div>
    </form>
  );
};

// ✅ Prop types completos
InventoryForm.propTypes = {
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
  initialProductId: PropTypes.string,
  mode: PropTypes.oneOf(['create', 'edit'])
};

InventoryForm.defaultProps = {
  onSubmit: () => {},
  mode: 'create'
};

export default InventoryForm;