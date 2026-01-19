import React, { useState } from 'react';
import '../../assets/styles/Reports/reports.css';

const ReportTemplates = ({ onSelectTemplate, onSaveTemplate, onDeleteTemplate }) => {
  const [templates, setTemplates] = useState([
    {
      id: 'daily-inventory',
      name: 'Reporte Diario de Inventario',
      description: 'Resumen diario de niveles de stock y alertas',
      type: 'inventory',
      filters: {
        dateRange: 'today',
        categories: [],
        minStock: 0,
        maxStock: 1000
      },
      created: '2024-01-15',
      lastUsed: '2024-01-15'
    },
    {
      id: 'weekly-sales',
      name: 'Reporte Semanal de Ventas',
      description: 'Análisis de ventas semanales con comparativas',
      type: 'sales',
      filters: {
        dateRange: 'last7days',
        categories: ['Electrónica', 'Accesorios'],
        sortBy: 'totalValue',
        sortOrder: 'desc'
      },
      created: '2024-01-10',
      lastUsed: '2024-01-15'
    },
    {
      id: 'monthly-financial',
      name: 'Reporte Financiero Mensual',
      description: 'Estado financiero mensual completo',
      type: 'financial',
      filters: {
        dateRange: 'last30days',
        categories: [],
        includeCharts: true,
        includeSummary: true
      },
      created: '2024-01-01',
      lastUsed: '2024-01-15'
    },
    {
      id: 'stock-alerts',
      name: 'Alertas de Stock',
      description: 'Productos bajo stock y agotados',
      type: 'stock',
      filters: {
        dateRange: 'last30days',
        categories: [],
        minStock: 0,
        maxStock: 5,
        sortBy: 'quantity',
        sortOrder: 'asc'
      },
      created: '2024-01-05',
      lastUsed: '2024-01-15'
    },
    {
      id: 'category-analysis',
      name: 'Análisis por Categoría',
      description: 'Desempeño de productos por categoría',
      type: 'category',
      filters: {
        dateRange: 'last90days',
        categories: [],
        sortBy: 'totalValue',
        sortOrder: 'desc'
      },
      created: '2024-01-08',
      lastUsed: '2024-01-14'
    }
  ]);

  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'inventory',
    filters: {}
  });

  const reportTypes = [
    { id: 'inventory', name: 'Inventario', icon: '📦' },
    { id: 'sales', name: 'Ventas', icon: '💰' },
    { id: 'stock', name: 'Stock', icon: '📊' },
    { id: 'financial', name: 'Financiero', icon: '💵' },
    { id: 'category', name: 'Categorías', icon: '🏷️' },
    { id: 'trends', name: 'Tendencias', icon: '📈' }
  ];

  const handleSelectTemplate = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  const handleSaveTemplate = () => {
    if (!newTemplate.name.trim()) {
      alert('Por favor ingresa un nombre para la plantilla');
      return;
    }

    const template = {
      id: `template-${Date.now()}`,
      name: newTemplate.name,
      description: newTemplate.description,
      type: newTemplate.type,
      filters: newTemplate.filters || {},
      created: new Date().toISOString().split('T')[0],
      lastUsed: new Date().toISOString().split('T')[0]
    };

    setTemplates([template, ...templates]);
    
    if (onSaveTemplate) {
      onSaveTemplate(template);
    }

    setNewTemplate({
      name: '',
      description: '',
      type: 'inventory',
      filters: {}
    });
    setShowNewTemplate(false);
  };

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('¿Estás seguro de querer eliminar esta plantilla?')) {
      setTemplates(templates.filter(t => t.id !== templateId));
      
      if (onDeleteTemplate) {
        onDeleteTemplate(templateId);
      }
    }
  };

  const getTemplateIcon = (type) => {
    const reportType = reportTypes.find(t => t.id === type);
    return reportType ? reportType.icon : '📋';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  };

  return (
    <div className="report-templates">
      <div className="templates-header">
        <h2>Plantillas de Reporte</h2>
        <button 
          className="btn-new-template"
          onClick={() => setShowNewTemplate(true)}
        >
          <span className="btn-icon">+</span>
          Nueva Plantilla
        </button>
      </div>

      {showNewTemplate && (
        <div className="new-template-modal">
          <div className="modal-header">
            <h3>Crear Nueva Plantilla</h3>
            <button 
              className="btn-close-modal"
              onClick={() => setShowNewTemplate(false)}
            >
              ×
            </button>
          </div>

          <div className="modal-content">
            <div className="form-group">
              <label>Nombre de la Plantilla *</label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                placeholder="Ej: Reporte Semanal de Ventas"
                className="template-input"
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                placeholder="Describe el propósito de esta plantilla..."
                className="template-textarea"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Tipo de Reporte</label>
              <div className="type-options">
                {reportTypes.map(type => (
                  <div
                    key={type.id}
                    className={`type-option ${newTemplate.type === type.id ? 'selected' : ''}`}
                    onClick={() => setNewTemplate({...newTemplate, type: type.id})}
                  >
                    <span className="type-icon">{type.icon}</span>
                    <span className="type-name">{type.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Configuración de Filtros</label>
              <div className="filters-preview">
                <p>Los filtros actuales se guardarán como parte de la plantilla.</p>
                <p className="info-note">
                  <small>Para configurar filtros específicos, primero ajusta los filtros en el reporte principal y luego guarda la plantilla.</small>
                </p>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              className="btn-cancel"
              onClick={() => setShowNewTemplate(false)}
            >
              Cancelar
            </button>
            <button 
              className="btn-save"
              onClick={handleSaveTemplate}
            >
              Guardar Plantilla
            </button>
          </div>
        </div>
      )}

      <div className="templates-grid">
        {templates.map(template => (
          <div key={template.id} className="template-card">
            <div className="template-header">
              <div className="template-icon">
                {getTemplateIcon(template.type)}
              </div>
              <div className="template-info">
                <h3>{template.name}</h3>
                <p className="template-desc">{template.description}</p>
              </div>
              <div className="template-actions">
                <button 
                  className="action-btn"
                  onClick={() => handleSelectTemplate(template)}
                  title="Usar plantilla"
                >
                  ▶
                </button>
                <button 
                  className="action-btn"
                  onClick={() => handleDeleteTemplate(template.id)}
                  title="Eliminar plantilla"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="template-details">
              <div className="detail-item">
                <span className="detail-label">Tipo:</span>
                <span className="detail-value">
                  {reportTypes.find(t => t.id === template.type)?.name || template.type}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Creada:</span>
                <span className="detail-value">{formatDate(template.created)}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Último uso:</span>
                <span className="detail-value">{formatDate(template.lastUsed)}</span>
              </div>
              
              {template.filters.categories && template.filters.categories.length > 0 && (
                <div className="detail-item">
                  <span className="detail-label">Categorías:</span>
                  <span className="detail-value">
                    {template.filters.categories.length} seleccionadas
                  </span>
                </div>
              )}
            </div>

            <div className="template-footer">
              <button 
                className="btn-use-template"
                onClick={() => handleSelectTemplate(template)}
              >
                Usar Esta Plantilla
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="empty-templates">
          <div className="empty-icon">📋</div>
          <h3>No hay plantillas guardadas</h3>
          <p>Crea tu primera plantilla para guardar configuraciones de reportes frecuentes</p>
          <button 
            className="btn-create-first"
            onClick={() => setShowNewTemplate(true)}
          >
            Crear Primera Plantilla
          </button>
        </div>
      )}

      <div className="templates-info">
        <h3>💡 Sobre las Plantillas</h3>
        <div className="info-grid">
          <div className="info-card">
            <h4>¿Qué son las plantillas?</h4>
            <p>Las plantillas guardan configuraciones específicas de filtros y visualización para reportes que usas frecuentemente.</p>
          </div>
          
          <div className="info-card">
            <h4>¿Cómo usarlas?</h4>
            <p>Configura un reporte con tus filtros preferidos, guarda como plantilla y úsala nuevamente con un solo clic.</p>
          </div>
          
          <div className="info-card">
            <h4>Beneficios</h4>
            <ul>
              <li>Ahorra tiempo en configuraciones repetitivas</li>
              <li>Mantiene consistencia en los reportes</li>
              <li>Comparte configuraciones con tu equipo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportTemplates;