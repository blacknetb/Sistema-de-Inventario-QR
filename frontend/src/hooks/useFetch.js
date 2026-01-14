import { useState, useEffect, useCallback, useRef } from "react";

/**
 * ✅ HOOK DE FETCH MEJORADO - VERSIÓN CORREGIDA
 * Correcciones aplicadas:
 * 1. Eliminados memory leaks en AbortController
 * 2. Sistema de caché simplificado y optimizado
 * 3. Mejor manejo de race conditions
 * 4. Compatibilidad total con backend de inventario
 */

// ✅ Configuración por defecto optimizada
const DEFAULT_CONFIG = {
  immediate: true,
  initialData: null,
  cacheTime: 5 * 60 * 1000, // 5 minutos por defecto
  staleTime: 0,
  retryCount: 3,
  retryDelay: 1000,
  retryBackoff: true,
  pollingInterval: 0,
  pollingEnabled: false,
  keepPreviousData: false,
  deduplicate: true,
  onSuccess: null,
  onError: null,
  onFinally: null,
};

// ✅ Sistema de caché en memoria
const memoryCache = new Map();

/**
 * Clave de caché consistente
 */
const generateCacheKey = (fetchFunction, params = {}) => {
  const normalizedParams = Object.keys(params)
    .sort((a, b) => a.localeCompare(b)) // ✅ orden alfabético confiable
    .reduce((obj, key) => {
      obj[key] = params[key];
      return obj;
    }, {});

  return `cache_${fetchFunction.name || "anonymous"}_${JSON.stringify(normalizedParams)}`;
};

/**
 * Hook para manejo avanzado de peticiones HTTP - VERSIÓN CORREGIDA
 */
export const useFetch = (fetchFunction, params = {}, config = {}) => {
  // ✅ MEJORA CORREGIDA: Merge de configuración
  const finalConfig = useRef({
    ...DEFAULT_CONFIG,
    ...config,
    cacheTime: Math.max(0, config.cacheTime ?? DEFAULT_CONFIG.cacheTime),
    retryCount: Math.max(0, config.retryCount ?? DEFAULT_CONFIG.retryCount),
    retryDelay: Math.max(100, config.retryDelay ?? DEFAULT_CONFIG.retryDelay),
  }).current;

  const {
    immediate,
    initialData,
    cacheTime,
    staleTime,
    retryCount,
    retryDelay,
    retryBackoff,
    pollingInterval,
    pollingEnabled,
    keepPreviousData,
    deduplicate,
    onSuccess,
    onError,
    onFinally,
  } = finalConfig;

  // ✅ Estado mejorado
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [pollingCount, setPollingCount] = useState(0);

  // ✅ Refs optimizados
  const abortControllerRef = useRef(null);
  const pollingRef = useRef(null);
  const mountedRef = useRef(true);
  const paramsRef = useRef(params);
  const cacheKeyRef = useRef(null);
  const pendingRequests = useRef(new Map());

  /**
   * ✅ MEJORA CORREGIDA: Obtener de caché
   */
  const getFromCache = useCallback(
    (key) => {
      if (!cacheTime) return null;

      const memoryCached = memoryCache.get(key);
      if (memoryCached) {
        const { data: cachedData, timestamp } = memoryCached;
        const age = Date.now() - timestamp;

        if (age < cacheTime) {
          return cachedData;
        } else {
          memoryCache.delete(key);
        }
      }

      return null;
    },
    [cacheTime]
  );

  /**
   * ✅ Guardar en caché
   */
  const saveToCache = useCallback(
    (key, dataToCache) => {
      if (!cacheTime) return;

      const cacheItem = {
        data: dataToCache,
        timestamp: Date.now(),
      };

      memoryCache.set(key, cacheItem);
    },
    [cacheTime]
  );

  /**
   * ✅ MEJORA CORREGIDA: Cancelar petición segura
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * ✅ Detener polling
   */
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  /**
   * ✅ MEJORA CORREGIDA: Función de ejecución simplificada
   */
  const execute = useCallback(
    async (customParams = {}, options = {}) => {
      const {
        ignoreCache = false,
        silent = false,
        skipDeduplicate = false,
      } = options;

      // Cancelar petición anterior
      cancelRequest();

      // Crear nuevo abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const mergedParams = { ...paramsRef.current, ...customParams };
      const cacheKey = generateCacheKey(fetchFunction, mergedParams);
      cacheKeyRef.current = cacheKey;

      // Deduplicación de peticiones
      if (
        deduplicate &&
        !skipDeduplicate &&
        pendingRequests.current.has(cacheKey)
      ) {
        return pendingRequests.current.get(cacheKey);
      }

      // Helpers
      const handleSuccess = (result) => {
        setFetchedAt(Date.now());
        setRetryAttempt(0);
        if (cacheTime > 0) saveToCache(cacheKey, result);
        if (!silent && mountedRef.current) {
          setLoading(false);
          onSuccess?.(result);
        }
        return result;
      };

      const handleError = async (err, retries) => {
        if (err.name === "AbortError") throw err;
        if (!mountedRef.current) return null;

        if (retries < retryCount) {
          setRetryAttempt(retries);
          const delay = retryBackoff
            ? retryDelay * Math.pow(2, retries - 1)
            : retryDelay;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return true; // señal de retry
        }

        if (!silent && mountedRef.current) {
          setError(err);
          setLoading(false);
          onError?.(err);
        }
        throw err;
      };

      const runRequest = async () => {
        let retries = 0;

        const validateMounted = () => {
          if (!mountedRef.current) throw new Error("Componente desmontado");
          if (signal.aborted)
            throw new DOMException("AbortError", "AbortError");
        };

        while (retries <= retryCount) {
          try {
            validateMounted();

            const result = await fetchFunction(mergedParams, { signal });
            if (!mountedRef.current) return null;

            if (!silent && !(keepPreviousData && loading)) {
              setData(result);
            }

            return handleSuccess(result);
          } catch (err) {
            retries++;
            const shouldRetry = await handleError(err, retries);
            if (!shouldRetry) return null; // retorno temprano en vez de break
          }
        }
      };

      // Verificar caché (retorno temprano)
      const cachedData =
        !ignoreCache && cacheTime > 0 ? getFromCache(cacheKey) : null;
      const isStale = !fetchedAt || Date.now() - fetchedAt > staleTime;
      if (cachedData && !isStale) {
        if (!silent && mountedRef.current) {
          setData(cachedData);
          onSuccess?.(cachedData);
        }
        return cachedData;
      }

      if (!silent && mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      const requestPromise = runRequest();

      // Deduplicación de promesas
      const finalize = () => onFinally?.();
      if (deduplicate && !skipDeduplicate) {
        pendingRequests.current.set(cacheKey, requestPromise);
        requestPromise.finally(() => {
          pendingRequests.current.delete(cacheKey);
          finalize();
        });
      } else {
        requestPromise.finally(finalize);
      }

      return requestPromise;
    },
    [
      cancelRequest,
      fetchFunction,
      fetchedAt,
      getFromCache,
      keepPreviousData,
      loading,
      onError,
      onFinally,
      onSuccess,
      retryBackoff,
      retryCount,
      retryDelay,
      saveToCache,
      staleTime,
      cacheTime,
      deduplicate,
    ]
  );

  /**
   * ✅ Actualizar parámetros
   */
  const updateParams = useCallback(
    (newParams, options = {}) => {
      const { immediate: immediateUpdate = true, merge = true } = options;

      paramsRef.current = merge
        ? { ...paramsRef.current, ...newParams }
        : newParams;

      if (immediateUpdate) {
        execute();
      }
    },
    [execute]
  );

  /**
   * ✅ Reset completo
   */
  const reset = useCallback(
    (options = {}) => {
      const { clearCache = false, newParams } = options;

      if (newParams) {
        paramsRef.current = newParams;
      }

      setData(initialData);
      setLoading(false);
      setError(null);
      setFetchedAt(null);
      setRetryAttempt(0);

      if (clearCache && cacheKeyRef.current) {
        memoryCache.delete(cacheKeyRef.current);
      }
    },
    [initialData]
  );

  /**
   * ✅ Refrescar
   */
  const refresh = useCallback(
    async (options = {}) => {
      const { invalidate = true } = options;

      if (invalidate && cacheKeyRef.current) {
        memoryCache.delete(cacheKeyRef.current);
      }

      return await execute({}, { ignoreCache: true });
    },
    [execute]
  );

  /**
   * ✅ Mutación optimista
   */
  const mutate = useCallback(
    async (newData, options = {}) => {
      const {
        shouldRevalidate = true,
        optimistic = false,
        rollbackOnError = true,
      } = options;

      const previousData = data;

      if (optimistic && mountedRef.current) {
        setData(newData);
      }

      if (shouldRevalidate) {
        try {
          const result = await execute();
          return result;
        } catch (err) {
          if (rollbackOnError && optimistic && mountedRef.current) {
            setData(previousData);
          }
          throw err;
        }
      } else if (mountedRef.current) {
        setData(newData);
        if (cacheKeyRef.current) {
          saveToCache(cacheKeyRef.current, newData);
        }
        return newData;
      }
    },
    [data, execute, saveToCache]
  );

  // Función auxiliar para manejar el polling tick
  const handlePollingTick = () => {
    if (!mountedRef.current) return;

    execute({}, { silent: true })
      .then(incrementPollingCount)
      .catch(silencePollingError);
  };

  // Función auxiliar para incrementar el contador
  const incrementPollingCount = () => {
    setPollingCount((prev) => prev + 1);
  };

  // Función auxiliar para silenciar errores
  const silencePollingError = () => {
    // Silenciar errores en polling
  };

  const startPolling = useCallback(
    (interval = pollingInterval) => {
      stopPolling();

      if (interval > 0 && pollingEnabled) {
        pollingRef.current = setInterval(handlePollingTick, interval);
      }
    },
    [execute, pollingEnabled, pollingInterval, stopPolling]
  );

  /**
   * ✅ MEJORA CORREGIDA: Efecto de montaje optimizado
   */
  useEffect(() => {
    mountedRef.current = true;
    paramsRef.current = params;

    if (immediate) {
      execute();
    }

    if (pollingEnabled && pollingInterval > 0) {
      startPolling();
    }

    return () => {
      mountedRef.current = false;
      cancelRequest();
      stopPolling();
    };
  }, [
    cancelRequest,
    execute,
    immediate,
    pollingEnabled,
    pollingInterval,
    startPolling,
    stopPolling,
  ]);

  return {
    // Estado
    data,
    loading,
    error,
    fetchedAt,
    retryAttempt,
    pollingCount,

    // Información de caché
    cacheKey: cacheKeyRef.current,
    isCached: cacheKeyRef.current
      ? memoryCache.has(cacheKeyRef.current)
      : false,

    // Acciones
    execute,
    updateParams,
    reset,
    refresh,
    mutate,
    cancelRequest,

    // Polling
    startPolling,
    stopPolling,
    isPolling: !!pollingRef.current,
  };
};
