/**
 * Plantilla para gráficos de barras
 * Configuraciones predefinidas para diferentes tipos de gráficos de barras
 */

export const barTemplates = {
  // Plantilla básica para barras verticales
  basic: {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Datos',
        data: [],
        backgroundColor: '#3498db',
        borderColor: '#2980b9',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#2c3e50',
            font: {
              size: 12,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#3498db',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.formattedValue}`;
            }
          }
        },
        title: {
          display: true,
          text: 'Gráfico de Barras',
          color: '#2c3e50',
          font: {
            size: 16,
            weight: 'bold',
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          },
          padding: {
            top: 10,
            bottom: 30
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#7f8c8d',
            font: {
              size: 11,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            maxRotation: 45,
            minRotation: 0
          },
          title: {
            display: true,
            text: 'Categoría',
            color: '#2c3e50',
            font: {
              size: 13,
              weight: 'bold',
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            padding: { top: 10, bottom: 5 }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#7f8c8d',
            font: {
              size: 11,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            callback: function(value) {
              return value.toLocaleString('es-ES');
            }
          },
          title: {
            display: true,
            text: 'Valor',
            color: '#2c3e50',
            font: {
              size: 13,
              weight: 'bold',
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            padding: { top: 5, bottom: 10 }
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  },

  // Plantilla para barras horizontales
  horizontal: {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Datos',
        data: [],
        backgroundColor: '#2ecc71',
        borderColor: '#27ae60',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false
        },
        title: {
          display: true,
          text: 'Gráfico de Barras Horizontales',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        y: {
          grid: {
            display: false
          }
        }
      }
    }
  },

  // Plantilla para barras agrupadas
  grouped: {
    type: 'bar',
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        },
        title: {
          display: true,
          text: 'Barras Agrupadas',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    }
  },

  // Plantilla para barras apiladas
  stacked: {
    type: 'bar',
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        },
        title: {
          display: true,
          text: 'Barras Apiladas',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    }
  },

  // Plantilla para comparación de valores (positivos/negativos)
  comparison: {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Valores',
        data: [],
        backgroundColor: function(context) {
          const value = context.raw;
          return value >= 0 ? 'rgba(46, 204, 113, 0.8)' : 'rgba(231, 76, 60, 0.8)';
        },
        borderColor: function(context) {
          const value = context.raw;
          return value >= 0 ? 'rgba(39, 174, 96, 1)' : 'rgba(192, 57, 43, 1)';
        },
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const sign = value >= 0 ? '+' : '';
              return `${context.dataset.label}: ${sign}${context.formattedValue}`;
            }
          }
        },
        title: {
          display: true,
          text: 'Comparación de Valores',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: false,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    }
  },

  // Plantilla para reporte de inventario
  inventory: {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Valor del Inventario',
        data: [],
        backgroundColor: [
          '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
          '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
          '#16a085', '#27ae60', '#2980b9', '#8e44ad',
          '#2c3e50', '#f1c40f', '#e74c3c', '#95a5a6'
        ],
        borderColor: [
          '#2980b9', '#27ae60', '#c0392b', '#d35400',
          '#8e44ad', '#16a085', '#2c3e50', '#d35400',
          '#1a5276', '#229954', '#1f618d', '#7d3c98',
          '#1c2833', '#b7950b', '#922b21', '#7f8c8d'
        ],
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#2c3e50',
            font: {
              size: 12,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#3498db',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              return `Valor: $${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
            }
          }
        },
        title: {
          display: true,
          text: 'Valor del Inventario por Categoría',
          color: '#2c3e50',
          font: {
            size: 16,
            weight: 'bold',
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          },
          padding: {
            top: 10,
            bottom: 30
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#7f8c8d',
            font: {
              size: 11,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            maxRotation: 45,
            minRotation: 0
          },
          title: {
            display: true,
            text: 'Categorías',
            color: '#2c3e50',
            font: {
              size: 13,
              weight: 'bold',
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            padding: { top: 10, bottom: 5 }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#7f8c8d',
            font: {
              size: 11,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            callback: function(value) {
              return '$' + value.toLocaleString('es-ES');
            }
          },
          title: {
            display: true,
            text: 'Valor ($)',
            color: '#2c3e50',
            font: {
              size: 13,
              weight: 'bold',
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            padding: { top: 5, bottom: 10 }
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  },

  // Plantilla para reporte de ventas
  sales: {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Ventas',
        data: [],
        backgroundColor: 'rgba(52, 152, 219, 0.8)',
        borderColor: 'rgba(41, 128, 185, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#2c3e50',
            font: {
              size: 12,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#3498db',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 6,
          callbacks: {
            label: function(context) {
              return `Ventas: $${context.formattedValue}`;
            }
          }
        },
        title: {
          display: true,
          text: 'Ventas Diarias',
          color: '#2c3e50',
          font: {
            size: 16,
            weight: 'bold',
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          },
          padding: {
            top: 10,
            bottom: 30
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#7f8c8d',
            font: {
              size: 11,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }
          },
          title: {
            display: true,
            text: 'Fecha',
            color: '#2c3e50',
            font: {
              size: 13,
              weight: 'bold',
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            padding: { top: 10, bottom: 5 }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#7f8c8d',
            font: {
              size: 11,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            callback: function(value) {
              return '$' + value.toLocaleString('es-ES');
            }
          },
          title: {
            display: true,
            text: 'Monto ($)',
            color: '#2c3e50',
            font: {
              size: 13,
              weight: 'bold',
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            padding: { top: 5, bottom: 10 }
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  },

  // Plantilla para reporte de stock
  stock: {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Nivel de Stock',
        data: [],
        backgroundColor: function(context) {
          const value = context.raw;
          if (value === 0) return 'rgba(231, 76, 60, 0.8)';
          if (value <= 5) return 'rgba(243, 156, 18, 0.8)';
          if (value <= 10) return 'rgba(52, 152, 219, 0.8)';
          return 'rgba(46, 204, 113, 0.8)';
        },
        borderColor: function(context) {
          const value = context.raw;
          if (value === 0) return 'rgba(192, 57, 43, 1)';
          if (value <= 5) return 'rgba(211, 84, 0, 1)';
          if (value <= 10) return 'rgba(41, 128, 185, 1)';
          return 'rgba(39, 174, 96, 1)';
        },
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#2c3e50',
            font: {
              size: 12,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#3498db',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 6,
          callbacks: {
            label: function(context) {
              const value = context.raw;
              let status = '';
              if (value === 0) status = ' (Agotado)';
              else if (value <= 5) status = ' (Bajo Stock)';
              else if (value <= 10) status = ' (Stock Medio)';
              else status = ' (Stock Alto)';
              return `Stock: ${value} unidades${status}`;
            }
          }
        },
        title: {
          display: true,
          text: 'Niveles de Stock por Producto',
          color: '#2c3e50',
          font: {
            size: 16,
            weight: 'bold',
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          },
          padding: {
            top: 10,
            bottom: 30
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#7f8c8d',
            font: {
              size: 11,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            maxRotation: 45,
            minRotation: 0
          },
          title: {
            display: true,
            text: 'Productos',
            color: '#2c3e50',
            font: {
              size: 13,
              weight: 'bold',
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            padding: { top: 10, bottom: 5 }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#7f8c8d',
            font: {
              size: 11,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            callback: function(value) {
              return value.toLocaleString('es-ES') + ' uds';
            }
          },
          title: {
            display: true,
            text: 'Cantidad',
            color: '#2c3e50',
            font: {
              size: 13,
              weight: 'bold',
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            padding: { top: 5, bottom: 10 }
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  }
};

/**
 * Obtiene una plantilla de gráfico de barras
 * @param {string} templateName - Nombre de la plantilla
 * @param {Object} customData - Datos personalizados para reemplazar
 * @returns {Object} Configuración del gráfico
 */
export function getBarTemplate(templateName = 'basic', customData = {}) {
  const template = barTemplates[templateName] || barTemplates.basic;
  
  // Crear una copia profunda de la plantilla
  const config = JSON.parse(JSON.stringify(template));
  
  // Aplicar datos personalizados
  if (customData.labels) {
    config.data.labels = customData.labels;
  }
  
  if (customData.datasets) {
    config.data.datasets = customData.datasets;
  } else if (customData.data) {
    config.data.datasets[0].data = customData.data;
  }
  
  if (customData.title) {
    config.options.plugins.title.text = customData.title;
  }
  
  if (customData.xTitle) {
    config.options.scales.x.title.text = customData.xTitle;
  }
  
  if (customData.yTitle) {
    config.options.scales.y.title.text = customData.yTitle;
  }
  
  // Aplicar colores personalizados si se proporcionan
  if (customData.backgroundColor) {
    if (Array.isArray(customData.backgroundColor)) {
      config.data.datasets.forEach((dataset, index) => {
        dataset.backgroundColor = customData.backgroundColor[index] || dataset.backgroundColor;
      });
    } else {
      config.data.datasets[0].backgroundColor = customData.backgroundColor;
    }
  }
  
  if (customData.borderColor) {
    if (Array.isArray(customData.borderColor)) {
      config.data.datasets.forEach((dataset, index) => {
        dataset.borderColor = customData.borderColor[index] || dataset.borderColor;
      });
    } else {
      config.data.datasets[0].borderColor = customData.borderColor;
    }
  }
  
  return config;
}

/**
 * Crea un gráfico de barras con múltiples conjuntos de datos
 * @param {Array} labels - Etiquetas para el eje X
 * @param {Array} datasets - Conjuntos de datos
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Configuración del gráfico
 */
export function createGroupedBarChart(labels, datasets, options = {}) {
  const config = getBarTemplate('grouped', {
    labels,
    datasets: datasets.map((dataset, index) => ({
      label: dataset.label || `Dataset ${index + 1}`,
      data: dataset.data,
      backgroundColor: dataset.backgroundColor || 
        `hsl(${(index * 360) / datasets.length}, 70%, 60%)`,
      borderColor: dataset.borderColor || 
        `hsl(${(index * 360) / datasets.length}, 70%, 45%)`,
      borderWidth: 1,
      borderRadius: 4
    })),
    ...options
  });
  
  return config;
}

/**
 * Crea un gráfico de barras apiladas
 * @param {Array} labels - Etiquetas para el eje X
 * @param {Array} datasets - Conjuntos de datos
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Configuración del gráfico
 */
export function createStackedBarChart(labels, datasets, options = {}) {
  const config = getBarTemplate('stacked', {
    labels,
    datasets: datasets.map((dataset, index) => ({
      label: dataset.label || `Dataset ${index + 1}`,
      data: dataset.data,
      backgroundColor: dataset.backgroundColor || 
        `rgba(${52 + index * 30}, ${152 + index * 20}, ${219 - index * 30}, 0.8)`,
      borderColor: dataset.borderColor || 
        `rgba(${41 + index * 30}, ${128 + index * 20}, ${185 - index * 30}, 1)`,
      borderWidth: 1,
      borderRadius: 4
    })),
    ...options
  });
  
  return config;
}

/**
 * Crea un gráfico de barras horizontales
 * @param {Array} labels - Etiquetas para el eje Y
 * @param {Array} data - Datos para el eje X
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Configuración del gráfico
 */
export function createHorizontalBarChart(labels, data, options = {}) {
  const config = getBarTemplate('horizontal', {
    labels,
    data,
    ...options
  });
  
  return config;
}

/**
 * Crea un gráfico de barras para comparación (positivo/negativo)
 * @param {Array} labels - Etiquetas para el eje X
 * @param {Array} data - Datos (pueden ser positivos o negativos)
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Configuración del gráfico
 */
export function createComparisonBarChart(labels, data, options = {}) {
  const config = getBarTemplate('comparison', {
    labels,
    data,
    ...options
  });
  
  return config;
}

/**
 * Genera colores para un gráfico de barras basado en los valores
 * @param {Array} values - Valores para los que generar colores
 * @param {string} palette - Paleta de colores ('inventory', 'sales', 'stock', o personalizada)
 * @returns {Array} Array de colores
 */
export function generateBarColors(values, palette = 'default') {
  const palettes = {
    default: ['#3498db'],
    inventory: [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
      '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
    ],
    sales: [
      '#3498db', '#2980b9', '#1f618d', '#154360',
      '#2ecc71', '#27ae60', '#229954', '#1e8449'
    ],
    stock: [
      '#2ecc71', '#27ae60', '#229954', '#1e8449',
      '#f39c12', '#d35400', '#e67e22', '#a04000'
    ],
    financial: [
      '#2ecc71', '#27ae60', '#3498db', '#2980b9',
      '#9b59b6', '#8e44ad', '#e74c3c', '#c0392b'
    ]
  };
  
  const selectedPalette = palettes[palette] || palettes.default;
  
  if (values.length <= selectedPalette.length) {
    return selectedPalette.slice(0, values.length);
  }
  
  // Si hay más valores que colores en la paleta, generar gradientes
  const colors = [];
  for (let i = 0; i < values.length; i++) {
    const hue = (i * 360) / values.length;
    colors.push(`hsl(${hue}, 70%, 60%)`);
  }
  
  return colors;
}

/**
 * Configura opciones para gráficos responsivos
 * @param {Object} config - Configuración original del gráfico
 * @param {Object} responsiveOptions - Opciones responsivas
 * @returns {Object} Configuración actualizada
 */
export function makeResponsive(config, responsiveOptions = {}) {
  const defaultResponsiveOptions = {
    maintainAspectRatio: false,
    responsive: true,
    devicePixelRatio: 2
  };
  
  return {
    ...config,
    options: {
      ...config.options,
      ...defaultResponsiveOptions,
      ...responsiveOptions
    }
  };
}

/**
 * Añade animaciones personalizadas al gráfico
 * @param {Object} config - Configuración original del gráfico
 * @param {Object} animationOptions - Opciones de animación
 * @returns {Object} Configuración actualizada
 */
export function addAnimations(config, animationOptions = {}) {
  const defaultAnimation = {
    duration: 1000,
    easing: 'easeInOutQuart',
    animateScale: true,
    animateRotate: true
  };
  
  return {
    ...config,
    options: {
      ...config.options,
      animation: {
        ...defaultAnimation,
        ...animationOptions
      }
    }
  };
}

export default {
  barTemplates,
  getBarTemplate,
  createGroupedBarChart,
  createStackedBarChart,
  createHorizontalBarChart,
  createComparisonBarChart,
  generateBarColors,
  makeResponsive,
  addAnimations
};