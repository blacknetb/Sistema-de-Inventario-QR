import { useState, useMemo, useCallback, useEffect } from "react";

export const usePagination = ({
  data = [],
  itemsPerPage: initialItemsPerPage = 10,
  initialPage = 1,
  totalItems: externalTotalItems,
  onPageChange,
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [totalItems, setTotalItems] = useState(
    externalTotalItems || data.length,
  );

  // Actualizar totalItems cuando cambien los datos externos
  useEffect(() => {
    if (!externalTotalItems) {
      setTotalItems(data.length);
    }
  }, [data, externalTotalItems]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
  }, [totalItems, itemsPerPage]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = useCallback(
    (page) => {
      const pageNumber = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(pageNumber);
      if (onPageChange) {
        onPageChange(pageNumber);
      }
    },
    [totalPages, onPageChange],
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const lastPage = useCallback(() => {
    goToPage(totalPages);
  }, [totalPages, goToPage]);

  const changeItemsPerPage = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset a primera página
  }, []);

  const getPageRange = useCallback(
    (range = 2) => {
      const pages = [];
      const left = Math.max(1, currentPage - range);
      const right = Math.min(totalPages, currentPage + range);

      for (let i = left; i <= right; i++) {
        pages.push(i);
      }

      return pages;
    },
    [currentPage, totalPages],
  );

  const getPageNumbers = useCallback(() => {
    const pages = [];
    const range = 2;
    const left = Math.max(1, currentPage - range);
    const right = Math.min(totalPages, currentPage + range);

    // Agregar primeras páginas
    if (left > 1) {
      pages.push(1);
      if (left > 2) {
        pages.push("...");
      }
    }

    // Agregar páginas del rango
    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    // Agregar últimas páginas
    if (right < totalPages) {
      if (right < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  const pageInfo = useMemo(() => {
    const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);

    return {
      start,
      end,
      total: totalItems,
      hasPrevious: currentPage > 1,
      hasNext: currentPage < totalPages,
    };
  }, [currentPage, itemsPerPage, totalItems, totalPages]);

  return {
    // Datos paginados
    data: paginatedData,

    // Estado
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,

    // Información de página
    pageInfo,

    // Navegación
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,

    // Configuración
    changeItemsPerPage,

    // Utilidades
    getPageRange,
    getPageNumbers,

    // Verificaciones
    canGoNext: currentPage < totalPages,
    canGoPrev: currentPage > 1,
    isEmpty: data.length === 0,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
  };
};

// Hook para paginación en servidor
export const useServerPagination = ({
  fetchData,
  initialItemsPerPage = 10,
  initialPage = 1,
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [data, setData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchData({
        page: currentPage,
        limit: itemsPerPage,
      });

      setData(result.data);
      setTotalItems(result.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchData, currentPage, itemsPerPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const changeItemsPerPage = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    data,
    loading,
    error,
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    goToPage,
    changeItemsPerPage,
    refresh,
    canGoNext: currentPage < totalPages,
    canGoPrev: currentPage > 1,
  };
};

export default usePagination;
