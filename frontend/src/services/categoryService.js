import { get, post, put, del, clearCache } from "./api";
import notificationService from "./notificationService";

const createCategoryCache = () => {
  const cache = new Map();
  const parentChildMap = new Map();
  const productCategoryMap = new Map();

  return {
    get: (key) => {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
      cache.delete(key);
      return null;
    },

    set: (key, data, ttl = 10 * 60 * 1000) => {
      cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
      });
    },

    delete: (key) => {
      cache.delete(key);
    },

    clear: (pattern = null) => {
      if (pattern) {
        for (const key of cache.keys()) {
          if (key.includes(pattern)) {
            cache.delete(key);
          }
        }
      } else {
        cache.clear();
        parentChildMap.clear();
        productCategoryMap.clear();
      }
    },

    setParentChild: (parentId, childId) => {
      if (!parentChildMap.has(parentId)) {
        parentChildMap.set(parentId, new Set());
      }
      parentChildMap.get(parentId).add(childId);
    },

    getChildren: (parentId) => {
      return parentChildMap.get(parentId) || new Set();
    },

    clearChildren: (parentId) => {
      parentChildMap.delete(parentId);
    },

    addProductToCategory: (productId, categoryId) => {
      if (!productCategoryMap.has(categoryId)) {
        productCategoryMap.set(categoryId, new Set());
      }
      productCategoryMap.get(categoryId).add(productId);
    },

    removeProductFromCategory: (productId, categoryId) => {
      if (productCategoryMap.has(categoryId)) {
        productCategoryMap.get(categoryId).delete(productId);
      }
    },

    getProductsInCategory: (categoryId) => {
      return productCategoryMap.get(categoryId) || new Set();
    },

    hasProducts: (categoryId) => {
      const products = productCategoryMap.get(categoryId);
      return products && products.size > 0;
    },
  };
};

const categoryCache = createCategoryCache();

const validateCategoryData = (categoryData, isUpdate = false) => {
  const errors = [];
  const warnings = [];

  if (!isUpdate || categoryData.name !== undefined) {
    if (!categoryData.name || categoryData.name.trim().length < 2) {
      errors.push("El nombre debe tener al menos 2 caracteres");
    } else if (categoryData.name.length > 255) {
      errors.push("El nombre no puede exceder 255 caracteres");
    }
  }

  if (categoryData.parent_id !== undefined && categoryData.parent_id !== null) {
    const parentId = parseInt(categoryData.parent_id);
    if (isNaN(parentId) || parentId < 0) {
      errors.push("ID de categoría padre inválido");
    }
  }

  if (
    categoryData.description !== undefined &&
    categoryData.description.length > 1000
  ) {
    warnings.push("La descripción es muy larga (máximo 1000 caracteres)");
  }

  if (categoryData.slug !== undefined && categoryData.slug) {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(categoryData.slug)) {
      errors.push(
        "El slug debe contener solo letras minúsculas, números y guiones"
      );
    }
  }

  if (categoryData.color !== undefined && categoryData.color) {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(categoryData.color)) {
      errors.push("El color debe ser un código HEX válido (ej: #FF0000)");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const categoryService = {
  getAll: async (params = {}, useCache = true) => {
    try {
      const cacheKey = `categories_all_${JSON.stringify(params)}`;

      if (useCache) {
        const cached = categoryCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/categories", params);

      if (useCache && response.success && response.data) {
        categoryCache.set(cacheKey, response);

        if (Array.isArray(response.data)) {
          response.data.forEach((category) => {
            if (category.parent_id) {
              categoryCache.setParentChild(category.parent_id, category.id);
            }
          });
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id, useCache = true) => {
    try {
      const cacheKey = `category_${id}`;

      if (useCache) {
        const cached = categoryCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get(`/categories/${id}`);

      if (useCache && response.success) {
        categoryCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  create: async (categoryData) => {
    try {
      const validation = validateCategoryData(categoryData, false);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => {
          notificationService.warning(warning);
        });
      }

      const response = await post("/categories", categoryData);

      if (response.success) {
        categoryCache.clear();
        clearCache("categories");

        notificationService.success("Categoría creada exitosamente");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, categoryData) => {
    try {
      const validation = validateCategoryData(categoryData, true);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => {
          notificationService.warning(warning);
        });
      }

      const response = await put(`/categories/${id}`, categoryData);

      if (response.success) {
        categoryCache.delete(`category_${id}`);
        categoryCache.clear();
        clearCache("categories");

        notificationService.success("Categoría actualizada exitosamente");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id, force = false) => {
    try {
      const hasProducts = await this.hasProducts(id);
      if (hasProducts && !force) {
        throw new Error(
          "No se puede eliminar la categoría porque tiene productos asociados"
        );
      }

      const confirmed = await notificationService.confirm(
        force
          ? "⚠️ Advertencia: Esta categoría tiene productos. ¿Eliminar de todos modos?"
          : "¿Estás seguro de eliminar esta categoría?"
      );

      if (!confirmed) {
        return { success: false, message: "Operación cancelada" };
      }

      const response = await del(`/categories/${id}`);

      if (response.success) {
        categoryCache.delete(`category_${id}`);
        categoryCache.clear();
        clearCache("categories");

        notificationService.success("Categoría eliminada exitosamente");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  getProducts: async (categoryId, params = {}, useCache = true) => {
    try {
      const cacheKey = `category_${categoryId}_products_${JSON.stringify(params)}`;

      if (useCache) {
        const cached = categoryCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/products", {
        ...params,
        category_id: categoryId,
      });

      if (useCache && response.success && response.data) {
        categoryCache.set(cacheKey, response);

        if (Array.isArray(response.data)) {
          response.data.forEach((product) => {
            categoryCache.addProductToCategory(product.id, categoryId);
          });
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  hasProducts: async (categoryId, useCache = true) => {
    try {
      if (useCache && categoryCache.hasProducts(categoryId)) {
        return true;
      }

      const response = await this.getProducts(
        categoryId,
        { limit: 1, fields: "id" },
        true
      );
      return response.success && response.data && response.data.length > 0;
    } catch (error) {
      console.warn("Error verificando productos de categoría:", error);
      return true;
    }
  },

  search: async (term, params = {}) => {
    try {
      const response = await this.getAll(params, false);

      if (response.success && response.data && Array.isArray(response.data)) {
        const searchTerm = term.toLowerCase();
        const filtered = response.data.filter((category) => {
          if (!category) return false;

          const nameMatch =
            category.name && category.name.toLowerCase().includes(searchTerm);
          const descMatch =
            category.description &&
            category.description.toLowerCase().includes(searchTerm);
          const slugMatch =
            category.slug && category.slug.toLowerCase().includes(searchTerm);

          return nameMatch || descMatch || slugMatch;
        });

        return {
          ...response,
          data: filtered,
          searchTerm: term,
          totalResults: filtered.length,
        };
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  getByLevel: async (level = 0, params = {}) => {
    try {
      const allCategories = await this.getAll(params, true);

      if (
        allCategories.success &&
        allCategories.data &&
        Array.isArray(allCategories.data)
      ) {
        const filtered = allCategories.data.filter((category) => {
          if (level === 0) {
            return !category.parent_id;
          }
          return true;
        });

        return {
          ...allCategories,
          data: filtered,
          level,
          total: filtered.length,
        };
      }

      return allCategories;
    } catch (error) {
      throw error;
    }
  },

  getSubcategories: async (parentId, params = {}) => {
    try {
      const allCategories = await this.getAll(params, true);

      if (
        allCategories.success &&
        allCategories.data &&
        Array.isArray(allCategories.data)
      ) {
        const parsedParentId = parseInt(parentId);
        const subcategories = allCategories.data.filter(
          (category) => category.parent_id === parsedParentId
        );

        return {
          ...allCategories,
          data: subcategories,
          parentId,
          total: subcategories.length,
        };
      }

      return allCategories;
    } catch (error) {
      throw error;
    }
  },

  getTree: async (useCache = true) => {
    try {
      const cacheKey = "categories_tree";

      if (useCache) {
        const cached = categoryCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/categories/tree");

      if (response.success) {
        if (useCache) {
          categoryCache.set(cacheKey, response);
        }

        const rebuildRelations = (categories, parentId = null) => {
          if (!Array.isArray(categories)) return;

          categories.forEach((category) => {
            if (parentId) {
              categoryCache.setParentChild(parentId, category.id);
            }

            if (Array.isArray(category?.children)) {
              rebuildRelations(category.children, category.id);
            }
          });
        };

        if (response.data) {
          rebuildRelations(response.data);
        }

        return response;
      }

      const allCategories = await this.getAll({}, useCache);

      if (allCategories?.success && Array.isArray(allCategories?.data)) {
        const buildTree = (categories, parentId = null) => {
          if (!Array.isArray(categories)) return [];

          return categories
            .filter((category) => {
              const categoryParentId = category?.parent_id;
              return (
                (parentId === null && !categoryParentId) ||
                categoryParentId === parentId
              );
            })
            .map((category) => ({
              ...category,
              children: buildTree(categories, category.id),
            }));
        };

        const tree = buildTree(allCategories.data);

        const treeResponse = {
          ...allCategories,
          data: tree,
        };

        if (useCache) {
          categoryCache.set(cacheKey, treeResponse);
        }

        return treeResponse;
      }

      return allCategories;
    } catch (error) {
      console.error("❌ Error al procesar categorías:", error.message);
      throw error;
    }
  },

  validateCategory: (categoryData) => {
    return validateCategoryData(categoryData, false);
  },

  getStats: async () => {
    try {
      const cacheKey = "categories_stats";
      const cached = categoryCache.get(cacheKey);

      if (cached) {
        return cached;
      }

      const allCategories = await this.getAll({}, true);

      if (allCategories?.success && Array.isArray(allCategories?.data)) {
        const stats = {
          total: allCategories.data.length,
          withProducts: 0,
          withoutProducts: 0,
          byLevel: {},
          treeDepth: 0,
        };

        const checks = allCategories.data.map(async (category) => {
          if (!category?.id) return { categoryId: null, hasProducts: false };

          const hasProducts = await this.hasProducts(category.id, true);
          return { categoryId: category.id, hasProducts };
        });

        const results = await Promise.all(checks);

        results.forEach((result) => {
          if (result.hasProducts) {
            stats.withProducts++;
          } else {
            stats.withoutProducts++;
          }
        });

        const calculateDepth = (categories, parentId = null, depth = 0) => {
          if (!Array.isArray(categories)) return depth;

          const children = categories.filter(
            (cat) => cat?.parent_id === parentId
          );

          if (children.length === 0) {
            return depth;
          }

          const childDepths = children.map((child) =>
            calculateDepth(categories, child.id, depth + 1)
          );

          return Math.max(...childDepths);
        };

        stats.treeDepth = calculateDepth(allCategories.data);

        const response = {
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        };

        categoryCache.set(cacheKey, response, 5 * 60 * 1000);
        return response;
      }

      return allCategories;
    } catch (error) {
      console.error("❌ Error al procesar categorías:", error.message);
      throw error;
    }
  },

  clearCache: () => {
    categoryCache.clear();
    clearCache("categories");
  },
};

export default categoryService;