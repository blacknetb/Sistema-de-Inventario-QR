import { useState, useEffect, useCallback } from 'react';

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Cargar proveedores iniciales
  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simular llamada API
      await new Promise(resolve => setTimeout(resolve, 600));

      // Datos de ejemplo
      const mockSuppliers = [
        {
          id: 1,
          name: 'HP Inc.',
          contact: 'Juan Pérez',
          email: 'ventas@hp.com',
          phone: '+1 234 567 890',
          address: '123 Tech Street, Silicon Valley, CA',
          taxId: '123456789',
          paymentTerms: 'Net 30',
          products: ['Laptops', 'Impresoras'],
          rating: 4.5,
          status: 'active',
          lastOrder: '2024-02-15',
          totalOrders: 45
        },
        {
          id: 2,
          name: 'Logitech',
          contact: 'María García',
          email: 'ventas@logitech.com',
          phone: '+1 234 567 891',
          address: '456 Peripheral Ave, San Jose, CA',
          taxId: '987654321',
          paymentTerms: 'Net 15',
          products: ['Mouses', 'Teclados', 'Webcams'],
          rating: 4.8,
          status: 'active',
          lastOrder: '2024-02-18',
          totalOrders: 78
        },
        {
          id: 3,
          name: 'Samsung Electronics',
          contact: 'Carlos López',
          email: 'ventas@samsung.com',
          phone: '+1 234 567 892',
          address: '789 Display Blvd, Seoul, Korea',
          taxId: '456789123',
          paymentTerms: 'Net 45',
          products: ['Monitores', 'TVs', 'Memorias'],
          rating: 4.6,
          status: 'active',
          lastOrder: '2024-02-10',
          totalOrders: 32
        },
        {
          id: 4,
          name: 'Redragon',
          contact: 'Ana Martínez',
          email: 'ventas@redragon.com',
          phone: '+1 234 567 893',
          address: '321 Gaming Way, Taipei, Taiwan',
          taxId: '789123456',
          paymentTerms: 'Net 30',
          products: ['Teclados mecánicos', 'Mouses gaming'],
          rating: 4.3,
          status: 'inactive',
          lastOrder: '2024-01-20',
          totalOrders: 15
        },
        {
          id: 5,
          name: 'Corsair',
          contact: 'David Wilson',
          email: 'ventas@corsair.com',
          phone: '+1 234 567 894',
          address: '654 Performance Rd, Fremont, CA',
          taxId: '321654987',
          paymentTerms: 'Net 30',
          products: ['Sillas gamer', 'Fuentes poder', 'Gabinete'],
          rating: 4.7,
          status: 'active',
          lastOrder: '2024-02-12',
          totalOrders: 23
        },
        {
          id: 6,
          name: 'Microsoft',
          contact: 'Laura Torres',
          email: 'ventas@microsoft.com',
          phone: '+1 234 567 895',
          address: '987 Software Ave, Redmond, WA',
          taxId: '654987321',
          paymentTerms: 'Net 60',
          products: ['Software', 'Accesorios', 'Hardware'],
          rating: 4.9,
          status: 'active',
          lastOrder: '2024-02-14',
          totalOrders: 56
        }
      ];

      setSuppliers(mockSuppliers);
      return mockSuppliers;
    } catch (err) {
      setError('Error al cargar proveedores');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getSupplier = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 300));

      const supplier = suppliers.find(s => s.id === id);
      if (!supplier) {
        throw new Error('Proveedor no encontrado');
      }

      setSelectedSupplier(supplier);
      return { success: true, supplier };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [suppliers]);

  const addSupplier = useCallback(async (supplierData) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 500));

      // Validaciones
      if (!supplierData.name || !supplierData.email || !supplierData.phone) {
        throw new Error('Nombre, email y teléfono son requeridos');
      }

      // Verificar email duplicado
      const exists = suppliers.some(s => s.email === supplierData.email);
      if (exists) {
        throw new Error('Ya existe un proveedor con ese email');
      }

      const newSupplier = {
        id: Date.now(),
        ...supplierData,
        rating: 0,
        status: 'active',
        totalOrders: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };

      setSuppliers(prev => [...prev, newSupplier]);
      return { success: true, supplier: newSupplier };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [suppliers]);

  const updateSupplier = useCallback(async (id, updatedData) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 500));

      let updatedSupplier = null;

      setSuppliers(prev => prev.map(s => {
        if (s.id === id) {
          updatedSupplier = { ...s, ...updatedData };
          return updatedSupplier;
        }
        return s;
      }));

      if (!updatedSupplier) {
        throw new Error('Proveedor no encontrado');
      }

      return { success: true, supplier: updatedSupplier };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSupplier = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 500));

      const supplierToDelete = suppliers.find(s => s.id === id);
      if (!supplierToDelete) {
        throw new Error('Proveedor no encontrado');
      }

      if (supplierToDelete.totalOrders > 0) {
        throw new Error('No se puede eliminar un proveedor con órdenes asociadas');
      }

      setSuppliers(prev => prev.filter(s => s.id !== id));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [suppliers]);

  const searchSuppliers = useCallback(async (searchTerm) => {
    try {
      setLoading(true);

      await new Promise(resolve => setTimeout(resolve, 300));

      if (!searchTerm) {
        return suppliers;
      }

      const searchLower = searchTerm.toLowerCase();
      const filtered = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.contact.toLowerCase().includes(searchLower) ||
        s.email.toLowerCase().includes(searchLower) ||
        s.products?.some(p => p.toLowerCase().includes(searchLower))
      );

      return filtered;
    } catch (err) {
      setError('Error al buscar proveedores');
      return [];
    } finally {
      setLoading(false);
    }
  }, [suppliers]);

  const filterByStatus = useCallback((status) => {
    return suppliers.filter(s => s.status === status);
  }, [suppliers]);

  const getTopSuppliers = useCallback((limit = 5) => {
    return [...suppliers]
      .filter(s => s.status === 'active')
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  }, [suppliers]);

  const getSuppliersByProduct = useCallback((product) => {
    const productLower = product.toLowerCase();
    return suppliers.filter(s => 
      s.products?.some(p => p.toLowerCase().includes(productLower))
    );
  }, [suppliers]);

  const selectSupplier = useCallback((supplier) => {
    setSelectedSupplier(supplier);
  }, []);

  const clearSelectedSupplier = useCallback(() => {
    setSelectedSupplier(null);
  }, []);

  const getSupplierStats = useCallback(() => {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
    const inactiveSuppliers = totalSuppliers - activeSuppliers;
    
    const averageRating = suppliers
      .filter(s => s.rating)
      .reduce((sum, s) => sum + s.rating, 0) / activeSuppliers || 0;

    const totalOrders = suppliers.reduce((sum, s) => sum + (s.totalOrders || 0), 0);

    return {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      averageRating,
      totalOrders
    };
  }, [suppliers]);

  const updateSupplierRating = useCallback(async (id, newRating) => {
    try {
      setLoading(true);

      await new Promise(resolve => setTimeout(resolve, 300));

      setSuppliers(prev => prev.map(s => 
        s.id === id ? { ...s, rating: newRating } : s
      ));

      return { success: true };
    } catch (err) {
      setError('Error al actualizar calificación');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    suppliers,
    loading,
    error,
    selectedSupplier,
    loadSuppliers,
    getSupplier,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    searchSuppliers,
    filterByStatus,
    getTopSuppliers,
    getSuppliersByProduct,
    selectSupplier,
    clearSelectedSupplier,
    getSupplierStats,
    updateSupplierRating
  };
};

export default useSuppliers;