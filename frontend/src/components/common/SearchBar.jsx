import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const SearchBar = ({
    placeholder = 'Buscar...',
    onSearch,
    onClear,
    delay = 300,
    showSuggestions = true,
    suggestions = [],
    onSuggestionSelect,
    size = 'medium',
    variant = 'default',
    className = '',
    initialValue = ''
}) => {
    const [query, setQuery] = useState(initialValue);
    const [showSuggestionList, setShowSuggestionList] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);
    const timeoutRef = useRef(null);

    // Efecto para buscar con delay
    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (query.trim() && onSearch) {
            setLoading(true);
            timeoutRef.current = setTimeout(() => {
                onSearch(query);
                setLoading(false);
            }, delay);
        } else if (onClear) {
            onClear();
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [query, delay, onSearch, onClear]);

    // Cerrar sugerencias al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestionList(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        setQuery(e.target.value);
        if (showSuggestions && e.target.value.trim()) {
            setShowSuggestionList(true);
        } else {
            setShowSuggestionList(false);
        }
    };

    const handleClear = () => {
        setQuery('');
        setShowSuggestionList(false);
        if (onClear) onClear();
    };

    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion);
        setShowSuggestionList(false);
        if (onSuggestionSelect) onSuggestionSelect(suggestion);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setShowSuggestionList(false);
        }
        if (e.key === 'Enter' && onSearch) {
            onSearch(query);
            setShowSuggestionList(false);
        }
    };

    const sizeClasses = {
        small: 'search-sm',
        medium: 'search-md',
        large: 'search-lg'
    };

    const variantClasses = {
        default: 'search-default',
        outline: 'search-outline',
        filled: 'search-filled'
    };

    return (
        <div 
            className={`search-container ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
            ref={searchRef}
        >
            <div className={`search-input-wrapper ${isFocused ? 'focused' : ''}`}>
                <i className="fas fa-search search-icon"></i>
                
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => {
                        setIsFocused(true);
                        if (showSuggestions && query.trim() && suggestions.length > 0) {
                            setShowSuggestionList(true);
                        }
                    }}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="search-input"
                    aria-label="Buscar"
                />
                
                {loading && (
                    <div className="search-loading">
                        <div className="spinner-small"></div>
                    </div>
                )}
                
                {query && !loading && (
                    <button
                        className="search-clear"
                        onClick={handleClear}
                        aria-label="Limpiar búsqueda"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                )}
                
                <button
                    className="btn btn-primary search-btn"
                    onClick={() => onSearch && onSearch(query)}
                    disabled={!query.trim()}
                >
                    Buscar
                </button>
            </div>
            
            {/* Sugerencias */}
            {showSuggestions && showSuggestionList && suggestions.length > 0 && (
                <div className="search-suggestions">
                    <div className="suggestions-header">
                        <span>Resultados sugeridos</span>
                        <button
                            className="btn-close-suggestions"
                            onClick={() => setShowSuggestionList(false)}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div className="suggestions-list">
                        {suggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                className="suggestion-item"
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                <i className="fas fa-search"></i>
                                <span>{suggestion}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="suggestions-footer">
                        <small>
                            Presiona <kbd>Enter</kbd> para buscar o <kbd>Esc</kbd> para cancelar
                        </small>
                    </div>
                </div>
            )}
            
            {/* Estadísticas de búsqueda */}
            {query && (
                <div className="search-stats">
                    <span className="search-count">
                        {suggestions.length} resultados encontrados
                    </span>
                    <span className="search-tips">
                        <i className="fas fa-lightbulb"></i>
                        Usa comillas para búsqueda exacta
                    </span>
                </div>
            )}
        </div>
    );
};

SearchBar.propTypes = {
    placeholder: PropTypes.string,
    onSearch: PropTypes.func,
    onClear: PropTypes.func,
    delay: PropTypes.number,
    showSuggestions: PropTypes.bool,
    suggestions: PropTypes.arrayOf(PropTypes.string),
    onSuggestionSelect: PropTypes.func,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    variant: PropTypes.oneOf(['default', 'outline', 'filled']),
    className: PropTypes.string,
    initialValue: PropTypes.string
};

export default SearchBar;