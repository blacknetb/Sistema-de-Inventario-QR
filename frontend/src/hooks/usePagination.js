import { useState, useMemo, useCallback } from 'react';

/**
 * Hook para manejar paginación de datos del inventario
 * @param {Array} data - Datos a paginar
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Funciones y estado de paginación
 */
const usePagination = (data = [], options = {}) => {
  const {
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [5, 10, 25, 50, 100],
    maxPagesToShow = 5,
    enableSizeChanger = true,
    showTotal = true,
    showQuickJumper = true,
    showSizeChanger = true
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calcular datos paginados
  const paginatedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize]);

  // Calcular total de páginas
  const totalPages = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return 0;
    return Math.ceil(data.length / pageSize);
  }, [data, pageSize]);

  // Calcular información de paginación
  const paginationInfo = useMemo(() => {
    if (!Array.isArray(data)) return null;
    
    const totalItems = data.length;
    const startItem = totalItems > 0 ? ((currentPage - 1) * pageSize) + 1 : 0;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    
    return {
      totalItems,
      startItem,
      endItem,
      currentPage,
      pageSize,
      totalPages,
      hasData: totalItems > 0,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages,
      canGoBack: currentPage > 1,
      canGoForward: currentPage < totalPages
    };
  }, [data, currentPage, pageSize, totalPages]);

  // Cambiar a página específica
  const goToPage = useCallback((page) => {
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    
    setCurrentPage(page);
    
    return {
      success: true,
      page,
      totalPages
    };
  }, [totalPages]);

  // Ir a la siguiente página
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      return { success: true, page: currentPage + 1 };
    }
    return { success: false, message: 'Ya estás en la última página' };
  }, [currentPage, totalPages]);

  // Ir a la página anterior
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      return { success: true, page: currentPage - 1 };
    }
    return { success: false, message: 'Ya estás en la primera página' };
  }, [currentPage]);

  // Ir a la primera página
  const firstPage = useCallback(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
      return { success: true, page: 1 };
    }
    return { success: false, message: 'Ya estás en la primera página' };
  }, [currentPage]);

  // Ir a la última página
  const lastPage = useCallback(() => {
    if (currentPage !== totalPages) {
      setCurrentPage(totalPages);
      return { success: true, page: totalPages };
    }
    return { success: false, message: 'Ya estás en la última página' };
  }, [currentPage, totalPages]);

  // Cambiar tamaño de página
  const changePageSize = useCallback((newSize) => {
    if (pageSizeOptions.includes(newSize)) {
      const newTotalPages = Math.ceil(data.length / newSize);
      const newCurrentPage = Math.min(currentPage, newTotalPages);
      
      setPageSize(newSize);
      setCurrentPage(newCurrentPage > 0 ? newCurrentPage : 1);
      
      return {
        success: true,
        pageSize: newSize,
        currentPage: newCurrentPage,
        totalPages: newTotalPages
      };
    }
    
    return {
      success: false,
      message: `Tamaño de página no válido. Opciones: ${pageSizeOptions.join(', ')}`
    };
  }, [data.length, currentPage, pageSizeOptions]);

  // Calcular rango de páginas a mostrar
  const getPageRange = useCallback(() => {
    if (totalPages <= 1) return [1];
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }, [currentPage, totalPages, maxPagesToShow]);

  // Obtener información para mostrar números de página
  const getDisplayPages = useCallback(() => {
    const pages = getPageRange();
    const displayPages = [];
    
    // Agregar primera página si no está incluida
    if (!pages.includes(1)) {
      displayPages.push({ page: 1, type: 'number' });
      if (pages[0] > 2) {
        displayPages.push({ type: 'ellipsis' });
      }
    }
    
    // Agregar páginas del rango
    pages.forEach(page => {
      displayPages.push({ page, type: 'number', isCurrent: page === currentPage });
    });
    
    // Agregar última página si no está incluida
    if (!pages.includes(totalPages) && totalPages > 0) {
      if (pages[pages.length - 1] < totalPages - 1) {
        displayPages.push({ type: 'ellipsis' });
      }
      displayPages.push({ page: totalPages, type: 'number' });
    }
    
    return displayPages;
  }, [getPageRange, currentPage, totalPages]);

  // Saltar a página específica desde input
  const jumpToPage = useCallback((input) => {
    const page = parseInt(input, 10);
    
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      return goToPage(page);
    }
    
    return {
      success: false,
      message: `Por favor ingresa un número entre 1 y ${totalPages}`
    };
  }, [goToPage, totalPages]);

  // Resetear paginación
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setPageSize(initialPageSize);
    
    return {
      success: true,
      currentPage: 1,
      pageSize: initialPageSize
    };
  }, [initialPageSize]);

  // Obtener datos para una página específica (sin cambiar estado)
  const getPageData = useCallback((page, size = pageSize) => {
    if (!Array.isArray(data)) return [];
    
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    
    return {
      data: data.slice(startIndex, endIndex),
      page,
      pageSize: size,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, data.length),
      totalItems: data.length,
      totalPages: Math.ceil(data.length / size)
    };
  }, [data, pageSize]);

  // Manejar cambio de datos
  const handleDataChange = useCallback((newData) => {
    const newTotalPages = Math.ceil(newData.length / pageSize);
    const newCurrentPage = Math.min(currentPage, newTotalPages);
    
    setCurrentPage(newCurrentPage > 0 ? newCurrentPage : 1);
  }, [currentPage, pageSize]);

  // Exportar configuración de paginación
  const exportConfig = useCallback(() => {
    return {
      currentPage,
      pageSize,
      totalPages,
      totalItems: data.length,
      pageSizeOptions,
      maxPagesToShow,
      exportedAt: new Date().toISOString()
    };
  }, [currentPage, pageSize, totalPages, data.length, pageSizeOptions, maxPagesToShow]);

  // Importar configuración de paginación
  const importConfig = useCallback((config) => {
    if (config.currentPage) {
      setCurrentPage(Math.max(1, Math.min(config.currentPage, totalPages)));
    }
    
    if (config.pageSize && pageSizeOptions.includes(config.pageSize)) {
      setPageSize(config.pageSize);
    }
    
    return { success: true };
  }, [totalPages, pageSizeOptions]);

  return {
    // Estado
    currentPage,
    pageSize,
    
    // Setters
    setCurrentPage,
    setPageSize,
    
    // Datos
    data: paginatedData,
    allData: data,
    
    // Información
    paginationInfo,
    totalPages,
    pageRange: getPageRange(),
    displayPages: getDisplayPages(),
    
    // Navegación
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    jumpToPage,
    
    // Configuración
    changePageSize,
    resetPagination,
    pageSizeOptions,
    
    // Utilidades
    getPageData,
    handleDataChange,
    exportConfig,
    importConfig,
    
    // Opciones de visualización
    enableSizeChanger,
    showTotal,
    showQuickJumper,
    showSizeChanger,
    
    // Métodos de conveniencia
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    
    // Información para mostrar
    getDisplayText: () => {
      if (!paginationInfo) return '';
      
      const { startItem, endItem, totalItems } = paginationInfo;
      return `Mostrando ${startItem}-${endItem} de ${totalItems} items`;
    }
  };
};

export default usePagination;