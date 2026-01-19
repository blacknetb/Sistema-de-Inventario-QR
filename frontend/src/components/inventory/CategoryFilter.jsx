import React from 'react';
import '../../assets/styles/inventory/Inventory.css';

const CategoryFilter = ({ categories, selectedCategory, onCategoryChange }) => {
  const getCategoryIcon = (category) => {
    const icons = {
      'all': '📊',
      'Electrónica': '💻',
      'Accesorios': '🖱️',
      'Oficina': '🏢',
      'Almacenamiento': '💾',
      'Redes': '🌐',
      'Mobiliario': '🪑',
      'Herramientas': '🛠️',
      'Consumibles': '📄'
    };
    return icons[category] || '📦';
  };

  const getCategoryCount = (category) => {
    // En una implementación real, esto vendría de los datos
    const mockCounts = {
      'all': 10,
      'Electrónica': 4,
      'Accesorios': 3,
      'Oficina': 1,
      'Almacenamiento': 1,
      'Redes': 1,
      'Mobiliario': 1
    };
    return mockCounts[category] || 0;
  };

  return (
    <div className="category-filter-container">
      <h3 className="filter-title">Filtrar por Categoría</h3>
      <div className="category-list">
        {categories.map(category => (
          <button
            key={category}
            className={`category-item ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onCategoryChange(category)}
          >
            <span className="category-icon">{getCategoryIcon(category)}</span>
            <span className="category-name">
              {category === 'all' ? 'Todas las Categorías' : category}
            </span>
            <span className="category-count">{getCategoryCount(category)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;