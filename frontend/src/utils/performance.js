/**
 * ✅ UTILIDADES DE RENDIMIENTO MEJORADAS
 * Funciones optimizadas para mejorar el rendimiento de la aplicación
 */

// ==================== DEBOUNCE Y THROTTLE MEJORADOS ====================

/**
 * ✅ DEBOUNCE AVANZADO CON OPCIONES
 */
export const debounce = (func, wait, options = {}) => {
  const { leading = false, trailing = true, maxWait = null } = options;

  let timeoutId;
  let lastArgs;
  let lastThis;
  let lastCallTime;
  let lastInvokeTime = 0;
  let result;

  const invokeFunc = (time) => {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);

    return result;
  };

  const remainingWait = (time) => {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait === null
      ? timeWaiting
      : Math.min(timeWaiting, maxWait - timeSinceLastInvoke);
  };

  const shouldInvoke = (time) => {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== null && timeSinceLastInvoke >= maxWait)
    );
  };

  const timerExpired = () => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }

    timeoutId = setTimeout(timerExpired, remainingWait(time));
  };

  const trailingEdge = (time) => {
    timeoutId = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }

    lastArgs = lastThis = undefined;
    return result;
  };

  const debounced = function (...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(lastCallTime);
      }

      if (maxWait !== null) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }

    if (timeoutId === undefined) {
      timeoutId = setTimeout(timerExpired, wait);
    }

    return result;
  };

  debounced.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeoutId = undefined;
  };

  debounced.flush = () => {
    return timeoutId === undefined ? result : trailingEdge(Date.now());
  };

  debounced.pending = () => {
    return timeoutId !== undefined;
  };

  return debounced;
};

/**
 * ✅ THROTTLE AVANZADO CON OPCIONES
 */
export const throttle = (func, limit, options = {}) => {
  const { leading = true, trailing = true } = options;

  return debounce(func, limit, {
    leading,
    trailing,
    maxWait: limit,
  });
};

// ==================== MEMOIZACIÓN Y CACHÉ ====================

/**
 * ✅ MEMOIZE CON LIMITE DE CACHÉ
 */
export const memoize = (func, options = {}) => {
  const {
    maxSize = 100,
    ttl = null, // Time to live en ms
    serializer = JSON.stringify,
  } = options;

  const cache = new Map();
  const timestamps = new Map();

  const memoized = function (...args) {
    const key = serializer(args);
    const now = Date.now();

    // Verificar si existe en caché y no ha expirado
    if (cache.has(key)) {
      if (ttl === null || now - timestamps.get(key) < ttl) {
        return cache.get(key);
      }

      // Eliminar si ha expirado
      cache.delete(key);
      timestamps.delete(key);
    }

    // Limitar tamaño del caché
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
      timestamps.delete(firstKey);
    }

    // Ejecutar función y guardar en caché
    const result = func.apply(this, args);
    cache.set(key, result);
    timestamps.set(key, now);

    return result;
  };

  memoized.clear = () => {
    cache.clear();
    timestamps.clear();
  };

  memoized.delete = (...args) => {
    const key = serializer(args);
    cache.delete(key);
    timestamps.delete(key);
  };

  memoized.has = (...args) => {
    const key = serializer(args);
    return cache.has(key);
  };

  memoized.size = () => cache.size;

  return memoized;
};

// ==================== MEDICIÓN DE RENDIMIENTO ====================

/**
 * ✅ MEDIR TIEMPO DE EJECUCIÓN
 */
export const measurePerformance = (func, label = "Function") => {
  return function (...args) {
    const start = performance.now();
    const result = func.apply(this, args);
    const end = performance.now();

    console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);

    return result;
  };
};

/**
 * ✅ CREAR PROFILER PARA MÚLTIPLES FUNCIONES
 */
export const createProfiler = (functions) => {
  const profiles = {};
  const profiledFunctions = {};

  Object.entries(functions).forEach(([name, func]) => {
    profiles[name] = {
      count: 0,
      totalTime: 0,
      averageTime: 0,
    };

    profiledFunctions[name] = function (...args) {
      const start = performance.now();
      const result = func.apply(this, args);
      const end = performance.now();

      const time = end - start;
      profiles[name].count++;
      profiles[name].totalTime += time;
      profiles[name].averageTime =
        profiles[name].totalTime / profiles[name].count;

      return result;
    };
  });

  profiledFunctions.getProfiles = () => ({ ...profiles });
  profiledFunctions.resetProfiles = () => {
    Object.keys(profiles).forEach((name) => {
      profiles[name] = {
        count: 0,
        totalTime: 0,
        averageTime: 0,
      };
    });
  };

  return profiledFunctions;
};

// ==================== UTILIDADES ADICIONALES ====================

/**
 * ✅ LIMITAR EJECUCIÓN SIMULTÁNEA
 */
export const limitConcurrency = (func, limit = 1) => {
  const queue = [];
  let active = 0;

  const processQueue = () => {
    if (active < limit && queue.length > 0) {
      const { args, resolve, reject } = queue.shift();
      active++;

      func(...args)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          active--;
          processQueue();
        });
    }
  };

  return function (...args) {
    return new Promise((resolve, reject) => {
      queue.push({ args, resolve, reject });
      processQueue();
    });
  };
};

/**
 * ✅ CANCELACIÓN DE PROMESAS
 */
export const makeCancelable = (promise) => {
  let hasCanceled = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(
      (val) => {
        if (hasCanceled) {
          reject(new Error("Promise was canceled"));
        } else {
          resolve(val);
        }
      },
      (error) => {
        if (hasCanceled) {
          reject(new Error("Promise was canceled"));
        } else {
          reject(error);
        }
      }
    );
  });

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled = true;
    },
  };
};

/**
 * ✅ DIFERIR EJECUCIÓN
 */
export const defer = (callback) => {
  if (typeof setImmediate === "function") {
    setImmediate(callback);
  } else if (typeof MessageChannel === "function") {
    const channel = new MessageChannel();
    channel.port1.onmessage = callback;
    channel.port2.postMessage(null);
  } else {
    setTimeout(callback, 0);
  }
};

// ✅ EXPORTACIÓN POR DEFECTO
export default {
  // Debounce y throttle
  debounce,
  throttle,

  // Memoización y caché
  memoize,

  // Medición de rendimiento
  measurePerformance,
  createProfiler,

  // Control de recursos
  limitConcurrency,
  makeCancelable,

  // Utilidades
  defer,
};