import { useState, useCallback, useMemo, useEffect } from 'react';

/**
 * Hook para búsqueda avanzada en el inventario
 * @param {Array} items - Items del inventario
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Funciones y estado de búsqueda
 */
const useInventorySearch = (items = [], options = {}) => {
  const {
    initialQuery = '',
    searchFields = ['name', 'description', 'sku', 'barcode', 'category', 'supplier'],
    fuzzyMatch = true,
    minScore = 0.3,
    debounceDelay = 300,
    maxResults = 100
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    minPrice: '',
    maxPrice: '',
    inStockOnly: false
  });
  const [sortBy, setSortBy] = useState('relevance');

  // Búsqueda difusa (fuzzy search)
  const fuzzySearch = useCallback((text, pattern) => {
    if (!fuzzyMatch) {
      return text.toLowerCase().includes(pattern.toLowerCase()) ? 1 : 0;
    }

    const textLower = text.toLowerCase();
    const patternLower = pattern.toLowerCase();
    
    let patternIdx = 0;
    let score = 0;
    let consecutive = 0;
    let maxConsecutive = 0;

    for (let i = 0; i < textLower.length; i++) {
      if (patternIdx < patternLower.length && textLower[i] === patternLower[patternIdx]) {
        score += 1;
        consecutive += 1;
        maxConsecutive = Math.max(maxConsecutive, consecutive);
        patternIdx++;
      } else {
        consecutive = 0;
      }
    }

    // Calcular score final
    if (patternIdx === patternLower.length) {
      const lengthRatio = patternLower.length / textLower.length;
      const completeness = patternIdx / patternLower.length;
      const consecutiveness = maxConsecutive / patternLower.length;
      
      return (completeness * 0.5) + (consecutiveness * 0.3) + (lengthRatio * 0.2);
    }

    return 0;
  }, [fuzzyMatch]);

  // Buscar en un item
  const searchInItem = useCallback((item, searchTerm) => {
    if (!searchTerm.trim()) return { score: 0, matches: {} };

    const matches = {};
    let totalScore = 0;
    let fieldCount = 0;

    searchFields.forEach(field => {
      if (item[field] !== undefined && item[field] !== null) {
        const fieldValue = String(item[field]);
        const score = fuzzySearch(fieldValue, searchTerm);
        
        if (score > minScore) {
          matches[field] = {
            value: fieldValue,
            score,
            positions: findMatchPositions(fieldValue, searchTerm)
          };
          totalScore += score;
          fieldCount++;
        }
      }
    });

    const avgScore = fieldCount > 0 ? totalScore / fieldCount : 0;
    
    return {
      score: avgScore,
      matches,
      fieldCount
    };
  }, [searchFields, fuzzySearch, minScore]);

  // Encontrar posiciones de coincidencia
  const findMatchPositions = useCallback((text, pattern) => {
    const textLower = text.toLowerCase();
    const patternLower = pattern.toLowerCase();
    const positions = [];
    
    let startIndex = 0;
    while (startIndex < textLower.length) {
      const index = textLower.indexOf(patternLower, startIndex);
      if (index === -1) break;
      
      positions.push({
        start: index,
        end: index + patternLower.length
      });
      
      startIndex = index + 1;
    }
    
    return positions;
  }, []);

  // Realizar búsqueda
  const performSearch = useCallback((searchTerm = query) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return [];
    }

    setIsSearching(true);

    const results = items
      .map(item => {
        const searchResult = searchInItem(item, searchTerm);
        return {
          item,
          ...searchResult
        };
      })
      .filter(result => result.score > minScore)
      .sort((a, b) => {
        // Ordenar por relevancia
        if (sortBy === 'relevance') {
          return b.score - a.score;
        }
        
        // Ordenar por otros criterios
        switch(sortBy) {
          case 'name':
            return a.item.name.localeCompare(b.item.name);
          case 'price_asc':
            return a.item.price - b.item.price;
          case 'price_desc':
            return b.item.price - a.item.price;
          case 'quantity_asc':
            return a.item.quantity - b.item.quantity;
          case 'quantity_desc':
            return b.item.quantity - a.item.quantity;
          default:
            return b.score - a.score;
        }
      })
      .slice(0, maxResults);

    // Aplicar filtros adicionales
    const filteredResults = results.filter(result => {
      const item = result.item;
      
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }
      
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }
      
      if (filters.minPrice && item.price < parseFloat(filters.minPrice)) {
        return false;
      }
      
      if (filters.maxPrice && item.price > parseFloat(filters.maxPrice)) {
        return false;
      }
      
      if (filters.inStockOnly && item.quantity === 0) {
        return false;
      }
      
      return true;
    });

    setSearchResults(filteredResults);
    
    // Agregar a historial si hay resultados
    if (filteredResults.length > 0 && searchTerm.trim()) {
      setSearchHistory(prev => {
        const newHistory = [
          {
            query: searchTerm,
            timestamp: new Date().toISOString(),
            results: filteredResults.length
          },
          ...prev.filter(h => h.query !== searchTerm)
        ].slice(0, 10);
        
        return newHistory;
      });
    }

    setIsSearching(false);
    return filteredResults;
  }, [items, query, searchInItem, minScore, sortBy, maxResults, filters]);

  // Búsqueda con debounce
  useEffect(() => {
    if (query.trim()) {
      const timer = setTimeout(() => {
        performSearch(query);
      }, debounceDelay);

      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [query, debounceDelay, performSearch]);

  // Búsqueda rápida por SKU o código de barras
  const quickSearch = useCallback((identifier) => {
    if (!identifier.trim()) return null;

    // Buscar por SKU exacto
    const bySku = items.find(item => 
      item.sku && item.sku.toLowerCase() === identifier.toLowerCase()
    );
    
    if (bySku) {
      return {
        type: 'sku',
        item: bySku,
        exact: true
      };
    }

    // Buscar por código de barras exacto
    const byBarcode = items.find(item => 
      item.barcode && item.barcode === identifier
    );
    
    if (byBarcode) {
      return {
        type: 'barcode',
        item: byBarcode,
        exact: true
      };
    }

    // Búsqueda por ID
    const byId = items.find(item => 
      item.id.toString() === identifier
    );
    
    if (byId) {
      return {
        type: 'id',
        item: byId,
        exact: true
      };
    }

    // Búsqueda aproximada
    const searchResult = searchInItem({ 
      name: identifier,
      sku: identifier,
      barcode: identifier 
    }, identifier);
    
    if (searchResult.score > minScore) {
      // Encontrar el mejor match entre todos los items
      const bestMatch = items
        .map(item => ({
          item,
          score: searchInItem(item, identifier).score
        }))
        .filter(result => result.score > minScore)
        .sort((a, b) => b.score - a.score)[0];
      
      if (bestMatch) {
        return {
          type: 'fuzzy',
          item: bestMatch.item,
          score: bestMatch.score,
          exact: false
        };
      }
    }

    return null;
  }, [items, searchInItem, minScore]);

  // Búsqueda avanzada con múltiples criterios
  const advancedSearch = useCallback((criteria) => {
    const {
      name,
      category,
      minPrice,
      maxPrice,
      minQuantity,
      maxQuantity,
      supplier,
      status,
      location,
      sku,
      barcode
    } = criteria;

    let results = [...items];

    // Aplicar filtros
    if (name) {
      results = results.filter(item => 
        searchInItem(item, name).score > minScore
      );
    }

    if (category) {
      results = results.filter(item => 
        item.category && item.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (minPrice !== undefined) {
      results = results.filter(item => item.price >= minPrice);
    }

    if (maxPrice !== undefined) {
      results = results.filter(item => item.price <= maxPrice);
    }

    if (minQuantity !== undefined) {
      results = results.filter(item => item.quantity >= minQuantity);
    }

    if (maxQuantity !== undefined) {
      results = results.filter(item => item.quantity <= maxQuantity);
    }

    if (supplier) {
      results = results.filter(item => 
        item.supplier && item.supplier.toLowerCase().includes(supplier.toLowerCase())
      );
    }

    if (status) {
      results = results.filter(item => item.status === status);
    }

    if (location) {
      results = results.filter(item => 
        item.location && item.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (sku) {
      results = results.filter(item => 
        item.sku && item.sku.toLowerCase().includes(sku.toLowerCase())
      );
    }

    if (barcode) {
      results = results.filter(item => 
        item.barcode && item.barcode.includes(barcode)
      );
    }

    setSearchResults(results);
    return results;
  }, [items, searchInItem, minScore]);

  // Sugerencias de búsqueda
  const getSearchSuggestions = useCallback((partialQuery) => {
    if (!partialQuery || partialQuery.length < 2) {
      return [];
    }

    const suggestions = new Set();
    const queryLower = partialQuery.toLowerCase();

    items.forEach(item => {
      // Sugerencias de nombres
      if (item.name.toLowerCase().includes(queryLower)) {
        suggestions.add(item.name);
      }

      // Sugerencias de categorías
      if (item.category && item.category.toLowerCase().includes(queryLower)) {
        suggestions.add(item.category);
      }

      // Sugerencias de SKU
      if (item.sku && item.sku.toLowerCase().includes(queryLower)) {
        suggestions.add(item.sku);
      }

      // Sugerencias de proveedores
      if (item.supplier && item.supplier.toLowerCase().includes(queryLower)) {
        suggestions.add(item.supplier);
      }
    });

    // Agregar del historial
    searchHistory.forEach(history => {
      if (history.query.toLowerCase().includes(queryLower)) {
        suggestions.add(history.query);
      }
    });

    return Array.from(suggestions).slice(0, 10);
  }, [items, searchHistory]);

  // Buscar items similares
  const findSimilarItems = useCallback((item, limit = 5) => {
    if (!item) return [];

    const similarItems = items
      .filter(i => i.id !== item.id)
      .map(otherItem => {
        let similarity = 0;
        let criteria = 0;

        // Comparar categoría
        if (item.category && otherItem.category && item.category === otherItem.category) {
          similarity += 0.4;
          criteria++;
        }

        // Comparar proveedor
        if (item.supplier && otherItem.supplier && item.supplier === otherItem.supplier) {
          similarity += 0.3;
          criteria++;
        }

        // Comparar rango de precio (dentro del 20%)
        const priceRatio = Math.min(item.price, otherItem.price) / Math.max(item.price, otherItem.price);
        if (priceRatio > 0.8) {
          similarity += 0.2;
          criteria++;
        }

        // Normalizar score
        const normalizedScore = criteria > 0 ? similarity / criteria : 0;

        return {
          item: otherItem,
          similarity: normalizedScore,
          matchingCriteria: criteria
        };
      })
      .filter(result => result.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(result => result.item);

    return similarItems;
  }, [items]);

  // Estadísticas de búsqueda
  const searchStats = useMemo(() => {
    return {
      totalItems: items.length,
      searchResults: searchResults.length,
      searchHistory: searchHistory.length,
      hasResults: searchResults.length > 0,
      isSearching,
      currentQuery: query
    };
  }, [items.length, searchResults.length, searchHistory.length, isSearching, query]);

  // Limpiar búsqueda
  const clearSearch = useCallback(() => {
    setQuery('');
    setSearchResults([]);
  }, []);

  // Limpiar historial
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    // Estado
    query,
    setQuery,
    searchResults,
    searchHistory,
    isSearching,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    
    // Funciones de búsqueda
    performSearch,
    quickSearch,
    advancedSearch,
    getSearchSuggestions,
    findSimilarItems,
    
    // Utilidades
    clearSearch,
    clearHistory,
    
    // Estadísticas
    searchStats,
    
    // Información
    hasSearch: query.trim().length > 0,
    hasResults: searchResults.length > 0,
    searchFields,
    
    // Métodos de conveniencia
    searchByName: (name) => {
      setQuery(name);
      return performSearch(name);
    },
    
    searchByCategory: (category) => {
      setFilters(prev => ({ ...prev, category }));
      return performSearch();
    },
    
    getTopResults: (limit = 5) => searchResults.slice(0, limit),
    
    getRecentSearches: (limit = 5) => searchHistory.slice(0, limit)
  };
};

export default useInventorySearch;