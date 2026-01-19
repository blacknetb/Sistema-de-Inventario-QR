import React from 'react';
import '../../assets/styles/layout/layout.css';

const PageHeader = ({ 
  title, 
  subtitle, 
  icon,
  actions,
  breadcrumb,
  stats,
  tabs
}) => {
  return (
    <div className="page-header">
      <div className="page-header-top">
        <div className="page-header-left">
          <div className="page-title-section">
            {icon && <span className="page-title-icon">{icon}</span>}
            <div>
              <h1 className="page-title">{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
          </div>
          
          {breadcrumb && (
            <div className="page-breadcrumb">
              {breadcrumb}
            </div>
          )}
        </div>
        
        {actions && (
          <div className="page-header-right">
            <div className="page-actions">
              {actions}
            </div>
          </div>
        )}
      </div>
      
      {stats && (
        <div className="page-header-stats">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: stat.color + '20', color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                {stat.trend && (
                  <div className={`stat-trend ${stat.trend > 0 ? 'positive' : 'negative'}`}>
                    {stat.trend > 0 ? '↗' : '↘'} {Math.abs(stat.trend)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {tabs && (
        <div className="page-header-tabs">
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={`tab-button ${tab.active ? 'active' : ''}`}
              onClick={tab.onClick}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {tab.badge && <span className="tab-badge">{tab.badge}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageHeader;