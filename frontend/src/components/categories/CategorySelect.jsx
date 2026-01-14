import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import categoryService from '../../services/categoryService';
import '../../assets/styles/Categories.css';

/**
 * ✅ COMPONENTE PRINCIPAL CATEGORY SELECT OPTIMIZADO
 */
const CategorySelect = ({
  value,
  onChange,
  required = false,
  disabled = false,
  allowCreate = false,
  placeholder = "Selecciona una categoría",
  className = "",
  error = null,
  onBlur = () => {},
  name = "category_id",
  id,
  ...props
}) => {
  const generatedId = useMemo(() => 
    id || `category-select-${Math.random().toString(36).slice(2, 11)}`,
    [id]
  );
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);

  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const triggerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadCategories = useCallback(async (search = '') => {
    try {
      setLoading(true);
      const response = await categoryService.getAll({
        search,
        limit: 100
      });

      if (response.success) {
        setCategories(response.data || []);
      } else {
        throw new Error(response.message || 'Error al cargar categorías');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (isOpen) {
      searchTimeoutRef.current = setTimeout(() => {
        loadCategories(searchTerm);
      }, 300);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, isOpen, loadCategories]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsCreating(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current && !isCreating) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, isCreating]);

  const selectedCategory = useMemo(() =>
    categories.find(c => 
      c.id === value || 
      c.id === parseInt(value, 10) ||
      c.id?.toString() === value?.toString()
    ),
    [categories, value]
  );

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;

    const searchLower = searchTerm.toLowerCase();
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchLower) ||
      (category.description || '').toLowerCase().includes(searchLower)
    );
  }, [categories, searchTerm]);

  const handleSelect = useCallback((categoryId) => {
    onChange(categoryId);
    setIsOpen(false);
    setSearchTerm('');
    setIsCreating(false);
    onBlur();
  }, [onChange, onBlur]);

  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;

    try {
      setLoadingCreate(true);

      const exists = categories.some(c =>
        c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
      );

      if (exists) {
        alert(`Ya existe una categoría llamada "${newCategoryName.trim()}"`);
        return;
      }

      const response = await categoryService.create({
        name: newCategoryName.trim(),
        description: ''
      });

      if (response.success) {
        await loadCategories();
        handleSelect(response.data.id);
        setIsCreating(false);
        setNewCategoryName('');
      } else {
        throw new Error(response.message || 'Error al crear la categoría');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert(error.message || 'Error al crear la categoría. Por favor, intente nuevamente.');
    } finally {
      setLoadingCreate(false);
    }
  }, [newCategoryName, categories, loadCategories, handleSelect]);

  const handleClearSelection = useCallback((e) => {
    e?.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsCreating(false);
  }, [onChange]);

  const handleToggle = useCallback(() => {
    if (disabled) return;

    setIsOpen(prev => !prev);

    if (!isOpen) {
      setSearchTerm('');
      setIsCreating(false);
      setNewCategoryName('');
    }
  }, [disabled, isOpen]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && isCreating && newCategoryName.trim() && !loadingCreate) {
      handleCreateCategory();
    }
    
    if (e.key === 'Escape') {
      setIsOpen(false);
      setIsCreating(false);
    }
  }, [isCreating, newCategoryName, loadingCreate, handleCreateCategory]);

  const renderDropdown = () => {
    if (!isOpen) return null;

    return (
      <div className="select-dropdown" role="listbox" id={`${generatedId}-dropdown`}>
        <div className="dropdown-search">
          <div className="search-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
              aria-label="Buscar categorías"
            />
            <span className="search-icon">🔍</span>

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="search-clear"
                disabled={loading}
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {allowCreate && searchTerm.trim() && !filteredCategories.some(c =>
          c.name.toLowerCase() === searchTerm.trim().toLowerCase()
        ) && (
          <div className="create-section">
            {isCreating ? (
              <div className="create-form">
                <input
                  type="text"
                  className="create-input"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nombre de la nueva categoría"
                  autoFocus
                  onKeyDown={handleKeyPress}
                  disabled={loadingCreate}
                  maxLength={50}
                  aria-label="Nombre de nueva categoría"
                />
                <div className="create-buttons">
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim() || loadingCreate}
                    className="btn btn-primary btn-small"
                    aria-label="Crear categoría"
                  >
                    {loadingCreate ? (
                      <>
                        <span className="loading-spinner-small" aria-hidden="true"></span>
                        <span>Creando...</span>
                      </>
                    ) : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setNewCategoryName('');
                    }}
                    disabled={loadingCreate}
                    className="btn btn-outline btn-small"
                    aria-label="Cancelar creación"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="create-option"
                disabled={loading}
                aria-label={`Crear categoría "${searchTerm.trim()}"`}
              >
                <span className="create-icon">➕</span>
                Crear "{searchTerm.trim()}"
              </button>
            )}
          </div>
        )}

        <div className="dropdown-list">
          {loading && (
            <div className="dropdown-loading">
              <div className="loading-spinner-small" aria-hidden="true"></div>
              <p>Cargando categorías...</p>
            </div>
          )}

          {!loading && filteredCategories.length === 0 && !searchTerm && (
            <div className="dropdown-empty">
              <p>No hay categorías disponibles</p>
              {allowCreate && (
                <button
                  type="button"
                  className="btn-create-first"
                  onClick={() => {
                    setIsCreating(true);
                    setNewCategoryName('');
                  }}
                  disabled={loading}
                  aria-label="Crear primera categoría"
                >
                  <span className="btn-icon">➕</span>
                  Crear primera categoría
                </button>
              )}
            </div>
          )}

          {!loading && filteredCategories.length === 0 && searchTerm && (
            <div className="dropdown-empty">
              <p>No se encontraron categorías con "{searchTerm}"</p>
              {allowCreate && !isCreating && (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="btn-create-new"
                  disabled={loading}
                  aria-label={`Crear categoría "${searchTerm}"`}
                >
                  <span className="btn-icon">➕</span>
                  Crear nueva categoría
                </button>
              )}
            </div>
          )}

          {!loading && filteredCategories.length > 0 && (
            <div className="options-list">
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`option-item ${selectedCategory?.id === category.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(category.id)}
                  disabled={loading}
                  role="option"
                  aria-selected={selectedCategory?.id === category.id}
                  aria-label={`Seleccionar categoría ${category.name}`}
                >
                  <span className="option-name">{category.name}</span>
                  {category.description && (
                    <span className="option-description">{category.description}</span>
                  )}
                  {category.product_count !== undefined && category.product_count > 0 && (
                    <span className="option-count">
                      ({category.product_count} producto{category.product_count !== 1 ? 's' : ''})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="category-select-container" ref={wrapperRef}>
      <div className={`select-wrapper ${className}`}>
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`select-trigger ${disabled ? 'disabled' : ''} ${error ? 'has-error' : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={generatedId}
          aria-controls={`${generatedId}-dropdown`}
        >
          <span id={generatedId} className={`select-value ${selectedCategory ? 'has-value' : 'placeholder'}`}>
            {selectedCategory ? selectedCategory.name : placeholder}
          </span>

          <div className="select-icons">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="clear-button"
                title="Limpiar selección"
                disabled={disabled}
                aria-label="Limpiar selección"
              >
                ✕
              </button>
            )}

            <span className={`chevron ${isOpen ? 'open' : ''}`} aria-hidden="true">▼</span>
          </div>
        </button>

        <input
          type="hidden"
          name={name}
          value={value || ''}
          required={required}
          readOnly
          aria-hidden="true"
        />
      </div>

      {error && (
        <p className="select-error" role="alert">{error}</p>
      )}

      {renderDropdown()}
    </div>
  );
};

CategorySelect.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  allowCreate: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  error: PropTypes.string,
  onBlur: PropTypes.func,
  name: PropTypes.string,
  id: PropTypes.string
};

CategorySelect.defaultProps = {
  value: '',
  required: false,
  disabled: false,
  allowCreate: false,
  placeholder: "Selecciona una categoría",
  className: "",
  error: null,
  onBlur: () => {},
  name: "category_id"
};

/**
 * ✅ COMPONENTE SIMPLE DE SELECT OPTIMIZADO
 */
const CategorySelectSimple = ({
  value,
  onChange,
  categories = [],
  loading = false,
  placeholder = "Selecciona una categoría",
  disabled = false,
  required = false,
  className = "",
  name = "category_id",
  id,
  ...props
}) => {
  const generatedId = useMemo(() => 
    id || `category-select-simple-${Math.random().toString(36).slice(2, 11)}`,
    [id]
  );

  return (
    <div className="simple-select-container">
      <select
        id={generatedId}
        className={`simple-select ${className}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        required={required}
        aria-label={placeholder}
        name={name}
        {...props}
      >
        <option value="">{placeholder}</option>
        {loading ? (
          <option disabled>Cargando categorías...</option>
        ) : (
          categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
              {category.product_count ? ` (${category.product_count})` : ''}
            </option>
          ))
        )}
      </select>

      {loading && (
        <div className="select-loading" aria-label="Cargando">
          <div className="loading-spinner-small"></div>
        </div>
      )}
    </div>
  );
};

CategorySelectSimple.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  categories: PropTypes.array,
  loading: PropTypes.bool,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string
};

CategorySelectSimple.defaultProps = {
  value: '',
  categories: [],
  loading: false,
  placeholder: "Selecciona una categoría",
  disabled: false,
  required: false,
  className: "",
  name: "category_id"
};

/**
 * ✅ COMPONENTE AVANZADO CON BÚSQUEDA OPTIMIZADO
 */
const CategorySelectAdvanced = ({
  value,
  onChange,
  allowCreate = true,
  ...props
}) => {
  const [searchMode, setSearchMode] = useState(false);

  if (searchMode) {
    return (
      <div className="advanced-select">
        <CategorySelect
          value={value}
          onChange={onChange}
          allowCreate={allowCreate}
          {...props}
        />
        <button
          type="button"
          onClick={() => setSearchMode(false)}
          className="mode-toggle"
          aria-label="Volver a selección simple"
        >
          ← Volver a selección simple
        </button>
      </div>
    );
  }

  return (
    <div className="advanced-select">
      <CategorySelectSimple
        value={value}
        onChange={onChange}
        {...props}
      />
      <button
        type="button"
        onClick={() => setSearchMode(true)}
        className="mode-toggle"
        aria-label="Buscar o crear categoría"
      >
        <span className="toggle-icon">🔍</span>
        <span className="toggle-label">Buscar o crear categoría</span>
      </button>
    </div>
  );
};

CategorySelectAdvanced.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  allowCreate: PropTypes.bool
};

CategorySelectAdvanced.defaultProps = {
  allowCreate: true
};

CategorySelect.Simple = CategorySelectSimple;
CategorySelect.Advanced = CategorySelectAdvanced;

export default CategorySelect;