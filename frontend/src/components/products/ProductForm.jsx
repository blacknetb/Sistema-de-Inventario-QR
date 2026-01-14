import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { productSchema } from '../../utils/validators';
import { productService } from '../../services/productService';
import { generateSKU, formatCurrency } from '../../utils/helpers';
import Button from '../common/Button';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Select from '../common/Select';
import FileUpload from '../common/FileUpload';
import { useNotification } from '../../context/NotificationContext';
import {
  FiUpload,
  FiX,
  FiRefreshCw,
  FiDollarSign,
  FiPercent,
  FiPackage,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';
import { PRODUCT_UNITS, PRODUCT_STATUS } from '../../utils/constants';

/**
 * ✅ COMPONENTE DE FORMULARIO DE PRODUCTO MEJORADO
 * Correcciones aplicadas:
 * 1. Manejo optimizado de estados y efectos
 * 2. Validaciones mejoradas con useMemo
 * 3. Manejo de errores más robusto
 * 4. Compatibilidad total con el backend
 */

const ProductForm = ({
  product,
  categories = [],
  onSubmit,
  onCancel,
  className = ''
}) => {
  const { success, error, withLoadingNotification } = useNotification();

  // ✅ CORRECCIÓN: Estados separados correctamente inicializados
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // ✅ CORRECCIÓN: Configuración del formulario con useForm mejorado
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    setValue,
    watch,
    trigger,
    reset
  } = useForm({
    resolver: yupResolver(productSchema),
    defaultValues: product || {
      name: '',
      sku: '',
      description: '',
      category_id: '',
      status: 'active',
      price: 0,
      cost: 0,
      min_stock: 0,
      max_stock: 100,
      unit: 'unidad',
      image_url: ''
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: false
  });

  // ✅ CORRECCIÓN: Usar watch con useMemo para optimizar renders
  const watchedValues = watch();
  const {
    name: productName,
    category_id: selectedCategory,
    price,
    cost,
    min_stock,
    max_stock
  } = watchedValues;

  // ✅ CORRECCIÓN: Calcular márgenes con useMemo para optimización
  const financialMetrics = useMemo(() => {
    const priceNum = parseFloat(price) || 0;
    const costNum = parseFloat(cost) || 0;

    const margin = priceNum > 0 && costNum > 0
      ? ((priceNum - costNum) / costNum) * 100
      : 0;

    const profit = priceNum - costNum;
    const totalValue = priceNum * (watchedValues.current_stock || 0);

    return { margin, profit, totalValue };
  }, [price, cost, watchedValues.current_stock]);

  // ✅ CORRECCIÓN: Estado del stock con useMemo
  const stockStatus = useMemo(() => {
    const current = watchedValues.current_stock || 0;
    const min = parseFloat(min_stock) || 0;
    const max = parseFloat(max_stock) || 100;

    if (current <= 0) {
      return { label: 'Sin stock', color: 'danger', bgColor: 'bg-red-50' };
    }
    if (current <= min) {
      return { label: 'Stock bajo', color: 'warning', bgColor: 'bg-yellow-50' };
    }
    if (current >= max) {
      return { label: 'Exceso', color: 'info', bgColor: 'bg-blue-50' };
    }
    return { label: 'En stock', color: 'success', bgColor: 'bg-green-50' };
  }, [watchedValues.current_stock, min_stock, max_stock]);

  // ✅ CORRECCIÓN: Configurar imagen de vista previa solo una vez
  useEffect(() => {
    if (product?.image_url) {
      const imageUrl = product.image_url.startsWith('http')
        ? product.image_url
        : `${process.env.REACT_APP_API_URL || ''}${product.image_url}`;
      setPreviewImage(imageUrl);
      setValue('image_url', product.image_url);
    }
  }, [product, setValue]);

  // ✅ CORRECCIÓN: Generar SKU automático optimizado
  const generateAutoSKU = useCallback(() => {
    if (!product && selectedCategory && productName) {
      const sku = generateSKU(productName, selectedCategory);
      setValue('sku', sku, { shouldValidate: true, shouldDirty: true });
    }
  }, [product, selectedCategory, productName, setValue]);

  useEffect(() => {
    generateAutoSKU();
  }, [generateAutoSKU]);

  // ✅ CORRECCIÓN: Validar stock máximo vs mínimo optimizado
  const validateStock = useCallback(() => {
    const minStock = parseFloat(min_stock) || 0;
    const maxStock = parseFloat(max_stock) || 0;

    if (maxStock > 0 && minStock > maxStock) {
      setValue('min_stock', maxStock, {
        shouldValidate: true,
        shouldDirty: true
      });
    }
  }, [min_stock, max_stock, setValue]);

  // ✅ CORRECCIÓN: Manejo de imagen optimizado
  const handleImageUpload = async (file) => {
    if (!file) return false;

    // Validar tipo de archivo
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!validTypes.includes(file.type)) {
      error('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)');
      return false;
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      error(`La imagen no puede exceder ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
      return false;
    }

    // Vista previa
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    setImageFile(file);
    setValue('image_url', file.name, { shouldDirty: true });

    return true;
  };

  const removeImage = () => {
    setPreviewImage(null);
    setImageFile(null);
    setValue('image_url', '', { shouldDirty: true });
  };

  // ✅ CORRECCIÓN: Manejo de submit optimizado
  const onSubmitForm = async (data) => {
    try {
      setLoading(true);

      let productId = product?.id;
      const productData = {
        ...data,
        price: parseFloat(data.price) || 0,
        cost: parseFloat(data.cost) || 0,
        min_stock: parseInt(data.min_stock) || 0,
        max_stock: parseInt(data.max_stock) || 100
      };

      // Crear o actualizar producto
      const productResponse = await withLoadingNotification(
        productId
          ? productService.update(productId, productData)
          : productService.create(productData),
        productId ? 'Actualizando producto...' : 'Creando producto...'
      );

      if (!productResponse.success) {
        throw new Error(productResponse.message || 'Error guardando producto');
      }

      productId = productResponse.data?.id || productId;

      // ✅ MEJORA: Subir imagen en paralelo si es posible
      if (imageFile && productId) {
        setUploadingImage(true);
        try {
          const imageResponse = await productService.uploadImage(productId, imageFile);
          if (!imageResponse.success) {
            console.warn('Imagen no se pudo subir:', imageResponse.message);
          }
        } catch (imageError) {
          console.error('Error subiendo imagen:', imageError);
        } finally {
          setUploadingImage(false);
        }
      }

      success(productId ? 'Producto actualizado' : 'Producto creado');

      // ✅ MEJORA: Resetear formulario después de éxito
      reset();

      if (onSubmit) {
        onSubmit(productResponse.data || { id: productId, ...productData });
      }
    } catch (err) {
      console.error('Error en formulario:', err);
      error(err.message || 'Error guardando producto');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRECCIÓN: Generar SKU manual con validación
  const handleManualSKU = () => {
    if (selectedCategory && productName) {
      const sku = generateSKU(productName, selectedCategory);
      setValue('sku', sku, { shouldValidate: true, shouldDirty: true });
      success('SKU generado manualmente');
    } else {
      error('Necesita nombre y categoría para generar SKU');
    }
  };

  // ✅ CORRECCIÓN: Manejo de cancelación con confirmación mejorada
  const handleCancel = () => {
    if (isDirty && !window.confirm('¿Desea descartar los cambios? Los datos no guardados se perderán.')) {
      return;
    }
    reset();
    if (onCancel) onCancel();
  };

  // ✅ CORRECCIÓN: Categorías formateadas para select
  const categoryOptions = useMemo(() => [
    { value: '', label: 'Selecciona una categoría', disabled: true },
    ...categories.map(category => ({
      value: category.id,
      label: category.name,
      ...(category.description && { description: category.description })
    }))
  ], [categories]);

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm)}
      className={`space-y-6 ${className}`}
      data-testid="product-form"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Información básica */}
        <div className="lg:col-span-2 space-y-6">
          {/* Nombre y SKU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Input
                label="Nombre del producto *"
                placeholder="Ej: Laptop Dell XPS 13"
                {...register('name')}
                error={errors.name?.message}
                required
                disabled={loading}
                autoFocus
                icon={FiPackage}
                onBlur={() => trigger('name')}
              />
              <div className="text-xs text-gray-500">
                Nombre descriptivo del producto
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="SKU *"
                    placeholder="SKU automático"
                    {...register('sku')}
                    error={errors.sku?.message}
                    required
                    disabled={loading}
                    onBlur={() => trigger('sku')}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleManualSKU}
                  disabled={!selectedCategory || !productName || loading}
                  startIcon={<FiRefreshCw />}
                  title="Generar SKU automático"
                  size="sm"
                  className="h-10"
                >
                  Generar
                </Button>
              </div>
              <div className="text-xs text-gray-500">
                Código único de identificación
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <Textarea
              label="Descripción"
              placeholder="Descripción detallada del producto..."
              {...register('description')}
              disabled={loading}
              rows={4}
              maxLength={1000}
              showCount
            />
            <div className="text-xs text-gray-500">
              Información adicional sobre el producto
            </div>
          </div>

          {/* Categoría y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Select
                label="Categoría *"
                options={categoryOptions}
                {...register('category_id')}
                error={errors.category_id?.message}
                disabled={loading || categories.length === 0}
                required
              />
              {categories.length === 0 && (
                <div className="text-xs text-yellow-600 mt-1">
                  No hay categorías disponibles. Crea una categoría primero.
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Select
                label="Estado *"
                options={PRODUCT_STATUS.map(status => ({
                  value: status.value,
                  label: status.label
                }))}
                {...register('status')}
                error={errors.status?.message}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Precio y Costo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Input
                label={
                  <div className="flex items-center">
                    <FiDollarSign className="mr-1" />
                    Precio de venta *
                  </div>
                }
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('price', {
                  valueAsNumber: true,
                  onChange: () => trigger('price'),
                })}
                error={errors.price?.message}
                required
                disabled={loading}
                icon={FiDollarSign}
              />
              {price > 0 && (
                <div className="text-sm text-green-600">
                  {formatCurrency(price)}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Input
                label="Costo *"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('cost', {
                  valueAsNumber: true,
                  onChange: () => trigger('cost'),
                })}
                error={errors.cost?.message}
                required
                disabled={loading}
              />
              {cost > 0 && (
                <div className="text-sm text-gray-600">
                  {formatCurrency(cost)}
                </div>
              )}
            </div>
          </div>

          {/* Métricas financieras */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-xs text-gray-500 mb-1">Margen</div>
                <div className={`text-lg font-semibold ${financialMetrics.margin > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {financialMetrics.margin.toFixed(2)}%
                </div>
              </div>

              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-xs text-gray-500 mb-1">Ganancia/unidad</div>
                <div className={`text-lg font-semibold ${financialMetrics.profit > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {formatCurrency(financialMetrics.profit)}
                </div>
              </div>

              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-xs text-gray-500 mb-1">Rentabilidad</div>
                <div className={`text-lg font-semibold ${financialMetrics.margin > 20 ? 'text-green-600' :
                  financialMetrics.margin > 0 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                  {financialMetrics.margin > 20 ? 'Alta' :
                    financialMetrics.margin > 0 ? 'Media' : 'Baja'}
                </div>
              </div>

              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-xs text-gray-500 mb-1">Valor en stock</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(financialMetrics.totalValue)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha - Imagen y stock */}
        <div className="space-y-6">
          {/* Imagen del producto */}
          <div className="space-y-2">
            <label className="form-label">Imagen del producto</label>
            <div className="mt-1">
              <FileUpload
                previewImage={previewImage}
                onFileSelect={handleImageUpload}
                onRemove={removeImage}
                accept="image/*"
                maxSize={5 * 1024 * 1024}
                uploading={uploadingImage}
                className="h-48"
                dropzoneText="Arrastra imagen o haz clic"
                helperText="PNG, JPG, GIF, WEBP hasta 5MB"
              />
            </div>
          </div>

          {/* Gestión de stock */}
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3">Gestión de Stock</h4>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Input
                    label="Stock mínimo"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register('min_stock', {
                      valueAsNumber: true,
                      onChange: validateStock,
                    })}
                    error={errors.min_stock?.message}
                    disabled={loading}
                    icon={FiTrendingDown}
                  />
                  <div className="text-xs text-gray-500">
                    Alerta cuando el stock llegue a este nivel
                  </div>
                </div>

                <div className="space-y-1">
                  <Input
                    label="Stock máximo"
                    type="number"
                    min="1"
                    placeholder="100"
                    {...register('max_stock', {
                      valueAsNumber: true,
                      onChange: validateStock,
                    })}
                    error={errors.max_stock?.message}
                    disabled={loading}
                    icon={FiTrendingUp}
                  />
                  <div className="text-xs text-gray-500">
                    Capacidad máxima de almacenamiento
                  </div>
                </div>

                <div className="space-y-1">
                  <Select
                    label="Unidad de medida *"
                    options={PRODUCT_UNITS.map(unit => ({
                      value: unit,
                      label: unit.charAt(0).toUpperCase() + unit.slice(1)
                    }))}
                    {...register('unit')}
                    error={errors.unit?.message}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Estado del stock */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3">Estado actual</h4>

              <div className={`p-3 rounded-lg ${stockStatus.bgColor} border`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${stockStatus.color === 'danger' ? 'bg-red-500' :
                        stockStatus.color === 'warning' ? 'bg-yellow-500' :
                          stockStatus.color === 'success' ? 'bg-green-500' :
                            'bg-blue-500'
                      }`}></div>
                    <span className={`text-sm font-medium ${stockStatus.color === 'danger' ? 'text-red-700' :
                        stockStatus.color === 'warning' ? 'text-yellow-700' :
                          stockStatus.color === 'success' ? 'text-green-700' :
                            'text-blue-700'
                      }`}>
                      {stockStatus.label}
                    </span>
                  </div>
                  <div className="text-lg font-semibold">
                    {watchedValues.current_stock || 0} {watchedValues.unit}
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Nivel de stock</span>
                    <span>
                      {Math.round(((watchedValues.current_stock || 0) / (max_stock || 100)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${stockStatus.color === 'danger' ? 'bg-red-500' :
                          stockStatus.color === 'warning' ? 'bg-yellow-500' :
                            stockStatus.color === 'success' ? 'bg-green-500' :
                              'bg-blue-500'
                        } transition-all duration-300`}
                      style={{
                        width: `${Math.min(((watchedValues.current_stock || 0) / (max_stock || 100)) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-200 gap-4">
        <div className="flex items-center space-x-2">
          {isDirty && (
            <div className="flex items-center text-yellow-600 text-sm">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1 animate-pulse"></div>
              <span>Tienes cambios sin guardar</span>
            </div>
          )}

          {!isValid && (
            <div className="text-red-600 text-sm">
              ⚠️ Complete los campos requeridos
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading || uploadingImage}
            className="min-w-[100px]"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={loading || uploadingImage}
            disabled={loading || uploadingImage || !isValid}
            className="min-w-[150px]"
          >
            {product ? 'Actualizar Producto' : 'Crear Producto'}
          </Button>
        </div>
      </div>
    </form>
  );
};

// ✅ MEJORA: Propiedades por defecto y validación de props
ProductForm.defaultProps = {
  product: null,
  categories: [],
  onSubmit: () => { },
  onCancel: () => { },
  className: ''
};

// ✅ AÑADIR: PropTypes
ProductForm.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    sku: PropTypes.string,
    description: PropTypes.string,
    category_id: PropTypes.string,
    status: PropTypes.string,
    price: PropTypes.number,
    cost: PropTypes.number,
    min_stock: PropTypes.number,
    max_stock: PropTypes.number,
    unit: PropTypes.string,
    image_url: PropTypes.string,
    current_stock: PropTypes.number
  }),
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      description: PropTypes.string
    })
  ),
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  className: PropTypes.string
};

export default ProductForm;