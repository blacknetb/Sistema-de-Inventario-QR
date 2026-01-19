import React, { useState, useEffect } from 'react';
import '../../assets/styles/inventory/Inventory.css';

const SearchBar = ({ searchTerm, onSearchChange, placeholder }) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchTerm);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timer);
  }, [localSearchTerm, onSearchChange]);

  const handleClear = () => {
    setLocalSearchTerm('');
    onSearchChange('');
  };

  return (
    <div className="search-bar-container">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
          placeholder={placeholder}
        />
        {localSearchTerm && (
          <button className="clear-search-btn" onClick={handleClear}>
            ✕
          </button>
        )}
      </div>
      <div className="search-tips">
        <span className="tip-icon">💡</span>
        <span className="tip-text">Busca por nombre, SKU, categoría o proveedor</span>
      </div>
    </div>
  );
};

export default SearchBar;