/**
 * Plantilla para gráficos circulares (pie/doughnut)
 * Configuraciones predefinidas para diferentes tipos de gráficos circulares
 */

export const pieTemplates = {
  // Plantilla básica para gráfico de pastel
  basic: {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        label: 'Datos',
        data: [],
        backgroundColor: [
          '#3498db', '#2ecc71', '#e74c3c', '#f39c12',
          '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
          '#16a085', '#27ae60', '#2980b9', '#8e44ad',
          '#2c3e50', '#f1c40f', '#e74c3c', '#95a5a6'
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            color: '#2c3e50',
            font: {
              size: 12,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
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
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        },
        title: {
          display: true,
          text: 'Gráfico Circular',
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
      cutout: '0%', // Para pie chart
      radius: '70%',
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1000,
        easing: 'easeInOutQuart'
      },
      interaction: {
        intersect: true,
        mode: 'nearest'
      }
    }
  },

  // Plantilla para gráfico de dona
  doughnut: {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        label: 'Datos',
        data: [],
        backgroundColor: [
          '#3498db', '#2ecc71', '#e74c3c', '#f39c12',
          '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
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
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        },
        title: {
          display: true,
          text: 'Gráfico de Dona',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      cutout: '50%', // Para doughnut chart
      radius: '70%'
    }
  },

  // Plantilla para gráfico de anillo
  ring: {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        label: 'Datos',
        data: [],
        backgroundColor: [
          '#3498db', '#2ecc71', '#e74c3c', '#f39c12',
          '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 20
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        },
        title: {
          display: true,
          text: 'Gráfico de Anillo',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      cutout: '70%', // Anillo más delgado
      radius: '90%'
    }
  },

  // Plantilla para distribución de categorías de inventario
  inventoryCategories: {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        label: 'Valor por Categoría',
        data: [],
        backgroundColor: [
          '#3498db', '#2ecc71', '#e74c3c', '#f39c12',
          '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
          '#16a085', '#27ae60', '#2980b9', '#8e44ad',
          '#2c3e50', '#f1c40f', '#e74c3c', '#95a5a6'
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 20,
        hoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            color: '#2c3e50',
            font: {
              size: 11,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
            generateLabels: function(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i];
                  const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  
                  return {
                    text: `${label}: $${value.toLocaleString('es-ES')} (${percentage}%)`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: data.datasets[0].borderColor,
                    lineWidth: 2,
                    hidden: false,
                    index: i
                  };
                });
              }
              return [];
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
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: $${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (${percentage}%)`;
            }
          }
        },
        title: {
          display: true,
          text: 'Distribución del Valor del Inventario por Categoría',
          color: '#2c3e50',
          font: {
            size: 16,
            weight: 'bold',
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          },
          padding: {
            top: 10,
            bottom: 20
          }
        }
      },
      cutout: '0%',
      radius: '75%',
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  },

  // Plantilla para distribución de ventas
  salesDistribution: {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        label: 'Ventas',
        data: [],
        backgroundColor: [
          '#3498db', '#2ecc71', '#e74c3c', '#f39c12',
          '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            color: '#2c3e50',
            font: {
              size: 12,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            padding: 15,
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
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: $${value.toLocaleString('es-ES')} (${percentage}%)`;
            }
          }
        },
        title: {
          display: true,
          text: 'Distribución de Ventas',
          color: '#2c3e50',
          font: {
            size: 16,
            weight: 'bold',
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          },
          padding: {
            top: 10,
            bottom: 20
          }
        }
      },
      cutout: '50%',
      radius: '80%'
    }
  },

  // Plantilla para niveles de stock
  stockLevels: {
    type: 'pie',
    data: {
      labels: ['Agotado', 'Bajo Stock', 'Stock Medio', 'Stock Alto'],
      datasets: [{
        label: 'Productos por Nivel de Stock',
        data: [0, 0, 0, 0],
        backgroundColor: [
          '#e74c3c', // Agotado - Rojo
          '#f39c12', // Bajo Stock - Naranja
          '#3498db', // Stock Medio - Azul
          '#2ecc71'  // Stock Alto - Verde
        ],
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 25,
        hoverBorderWidth: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            color: '#2c3e50',
            font: {
              size: 12,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            padding: 20,
            usePointStyle: true,
            generateLabels: function(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i];
                  const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  
                  return {
                    text: `${label}: ${value} productos (${percentage}%)`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: data.datasets[0].borderColor,
                    lineWidth: 3,
                    hidden: false,
                    index: i
                  };
                });
              }
              return [];
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
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              
              let description = '';
              switch(label) {
                case 'Agotado':
                  description = 'Productos sin stock';
                  break;
                case 'Bajo Stock':
                  description = 'Productos con stock ≤ 5 unidades';
                  break;
                case 'Stock Medio':
                  description = 'Productos con stock 6-10 unidades';
                  break;
                case 'Stock Alto':
                  description = 'Productos con stock > 10 unidades';
                  break;
              }
              
              return [
                `${label}: ${value} productos`,
                `${percentage}% del total`,
                description
              ];
            }
          }
        },
        title: {
          display: true,
          text: 'Distribución de Niveles de Stock',
          color: '#2c3e50',
          font: {
            size: 16,
            weight: 'bold',
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          },
          padding: {
            top: 10,
            bottom: 20
          }
        }
      },
      cutout: '0%',
      radius: '85%'
    }
  },

  // Plantilla para distribución de gastos
  expenses: {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        label: 'Gastos',
        data: [],
        backgroundColor: [
          '#3498db', '#2ecc71', '#e74c3c', '#f39c12',
          '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            color: '#2c3e50',
            font: {
              size: 12,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: $${value.toLocaleString('es-ES')} (${percentage}%)`;
            }
          }
        },
        title: {
          display: true,
          text: 'Distribución de Gastos',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      cutout: '60%',
      radius: '85%'
    }
  },

  // Plantilla para gráfico con porcentajes en el centro
  withCenterText: {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        label: 'Datos',
        data: [],
        backgroundColor: [
          '#3498db', '#2ecc71', '#e74c3c', '#f39c12',
          '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        },
        title: {
          display: true,
          text: 'Gráfico con Texto en el Centro',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        // Plugin personalizado para texto en el centro
        centerText: {
          text: 'Total',
          color: '#2c3e50',
          fontStyle: 'bold',
          sidePadding: 20
        }
      },
      cutout: '70%',
      radius: '90%'
    }
  }
};

/**
 * Plugin personalizado para mostrar texto en el centro del gráfico de dona
 */
export const centerTextPlugin = {
  id: 'centerText',
  beforeDraw: function(chart) {
    if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
      const { ctx, chartArea: { width, height } } = chart;
      const centerX = width / 2;
      const centerY = height / 2;
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Texto principal
      const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
      ctx.font = 'bold 24px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText(total.toLocaleString('es-ES'), centerX, centerY - 15);
      
      // Texto secundario
      ctx.font = '14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('Total', centerX, centerY + 15);
      
      ctx.restore();
    }
  }
};

/**
 * Obtiene una plantilla de gráfico circular
 * @param {string} templateName - Nombre de la plantilla
 * @param {Object} customData - Datos personalizados para reemplazar
 * @returns {Object} Configuración del gráfico
 */
export function getPieTemplate(templateName = 'basic', customData = {}) {
  const template = pieTemplates[templateName] || pieTemplates.basic;
  
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
  
  // Aplicar configuración personalizada de leyenda
  if (customData.legendPosition) {
    config.options.plugins.legend.position = customData.legendPosition;
  }
  
  if (customData.cutout !== undefined) {
    config.options.cutout = customData.cutout;
  }
  
  if (customData.radius !== undefined) {
    config.options.radius = customData.radius;
  }
  
  return config;
}

/**
 * Crea un gráfico de dona con texto en el centro
 * @param {Array} labels - Etiquetas para los segmentos
 * @param {Array} data - Datos para los segmentos
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Configuración del gráfico
 */
export function createDoughnutWithCenterText(labels, data, options = {}) {
  const config = getPieTemplate('withCenterText', {
    labels,
    data,
    ...options
  });
  
  return config;
}

/**
 * Crea un gráfico de niveles de stock
 * @param {number} outOfStock - Productos agotados
 * @param {number} lowStock - Productos con bajo stock
 * @param {number} mediumStock - Productos con stock medio
 * @param {number} highStock - Productos con stock alto
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Configuración del gráfico
 */
export function createStockLevelsChart(outOfStock, lowStock, mediumStock, highStock, options = {}) {
  const config = getPieTemplate('stockLevels', {
    data: [outOfStock, lowStock, mediumStock, highStock],
    ...options
  });
  
  return config;
}

/**
 * Crea un gráfico de distribución por categorías
 * @param {Array} categories - Nombres de las categorías
 * @param {Array} values - Valores para cada categoría
 * @param {string} valueType - Tipo de valor ('currency', 'units', 'percentage')
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Configuración del gráfico
 */
export function createCategoryDistributionChart(categories, values, valueType = 'currency', options = {}) {
  const config = getPieTemplate('inventoryCategories', {
    labels: categories,
    data: values,
    ...options
  });
  
  // Ajustar tooltip según el tipo de valor
  if (valueType === 'currency') {
    config.options.plugins.tooltip.callbacks.label = function(context) {
      const label = context.label || '';
      const value = context.raw || 0;
      const total = context.dataset.data.reduce((a, b) => a + b, 0);
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
      return `${label}: $${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (${percentage}%)`;
    };
  } else if (valueType === 'units') {
    config.options.plugins.tooltip.callbacks.label = function(context) {
      const label = context.label || '';
      const value = context.raw || 0;
      const total = context.dataset.data.reduce((a, b) => a + b, 0);
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
      return `${label}: ${value.toLocaleString('es-ES')} unidades (${percentage}%)`;
    };
  }
  
  return config;
}

/**
 * Genera colores para un gráfico circular basado en el número de segmentos
 * @param {number} count - Número de segmentos
 * @param {string} palette - Paleta de colores ('default', 'inventory', 'sales', 'stock', 'financial')
 * @returns {Array} Array de colores
 */
export function generatePieColors(count, palette = 'default') {
  const palettes = {
    default: [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12',
      '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
      '#16a085', '#27ae60', '#2980b9', '#8e44ad',
      '#2c3e50', '#f1c40f', '#e74c3c', '#95a5a6'
    ],
    inventory: [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12',
      '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
      '#16a085', '#27ae60', '#2980b9', '#8e44ad'
    ],
    sales: [
      '#3498db', '#2980b9', '#1f618d', '#154360',
      '#2ecc71', '#27ae60', '#229954', '#1e8449',
      '#9b59b6', '#8e44ad', '#7d3c98', '#6c3483'
    ],
    stock: [
      '#e74c3c', '#c0392b', // Agotado
      '#f39c12', '#d35400', // Bajo stock
      '#3498db', '#2980b9', // Stock medio
      '#2ecc71', '#27ae60'  // Stock alto
    ],
    financial: [
      '#2ecc71', '#27ae60', // Ingresos
      '#3498db', '#2980b9', // Activos
      '#9b59b6', '#8e44ad', // Inversiones
      '#e74c3c', '#c0392b'  // Gastos
    ],
    pastel: [
      '#aed6f1', '#a9dfbf', '#f5b7b1', '#f9e79f',
      '#d2b4de', '#a3e4d7', '#d5dbdb', '#fad7a0',
      '#76d7c4', '#7dcea0', '#85c1e9', '#bb8fce',
      '#f8c471', '#e59866', '#ec7063', '#a569bd'
    ]
  };
  
  const selectedPalette = palettes[palette] || palettes.default;
  
  if (count <= selectedPalette.length) {
    return selectedPalette.slice(0, count);
  }
  
  // Si hay más segmentos que colores en la paleta, generar gradientes
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 360) / count;
    const saturation = palette === 'pastel' ? 50 : 70;
    const lightness = palette === 'pastel' ? 75 : 60;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  
  return colors;
}

/**
 * Calcula los porcentajes para cada segmento del gráfico
 * @param {Array} data - Array de valores
 * @returns {Array} Array de porcentajes
 */
export function calculatePercentages(data) {
  const total = data.reduce((sum, value) => sum + value, 0);
  if (total === 0) return data.map(() => 0);
  
  return data.map(value => ((value / total) * 100).toFixed(1));
}

/**
 * Filtra segmentos pequeños para agruparlos en "Otros"
 * @param {Array} labels - Etiquetas originales
 * @param {Array} data - Datos originales
 * @param {number} threshold - Umbral mínimo de porcentaje (por defecto 2%)
 * @returns {Object} Objeto con labels y data filtrados
 */
export function filterSmallSegments(labels, data, threshold = 2) {
  const total = data.reduce((sum, value) => sum + value, 0);
  if (total === 0) return { labels: [], data: [] };
  
  const mainLabels = [];
  const mainData = [];
  let otherData = 0;
  const otherIndices = [];
  
  // Separar segmentos principales de segmentos pequeños
  data.forEach((value, index) => {
    const percentage = (value / total) * 100;
    if (percentage >= threshold) {
      mainLabels.push(labels[index]);
      mainData.push(value);
    } else {
      otherData += value;
      otherIndices.push(index);
    }
  });
  
  // Agregar "Otros" si hay segmentos pequeños
  if (otherData > 0 && otherIndices.length > 0) {
    mainLabels.push('Otros');
    mainData.push(otherData);
  }
  
  return {
    labels: mainLabels,
    data: mainData,
    filteredIndices: otherIndices
  };
}

/**
 * Crea una configuración de gráfico para mostrar top N categorías
 * @param {Array} labels - Todas las etiquetas
 * @param {Array} data - Todos los datos
 * @param {number} topN - Número de categorías a mostrar (por defecto 5)
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Configuración del gráfico
 */
export function createTopNCategoriesChart(labels, data, topN = 5, options = {}) {
  // Crear array de objetos con label y data
  const items = labels.map((label, index) => ({
    label,
    value: data[index] || 0
  }));
  
  // Ordenar por valor descendente
  items.sort((a, b) => b.value - a.value);
  
  // Tomar top N
  const topItems = items.slice(0, topN);
  
  // Calcular el resto
  const restValue = items.slice(topN).reduce((sum, item) => sum + item.value, 0);
  
  // Preparar arrays finales
  const finalLabels = topItems.map(item => item.label);
  const finalData = topItems.map(item => item.value);
  
  // Agregar "Otros" si hay más categorías
  if (restValue > 0) {
    finalLabels.push('Otros');
    finalData.push(restValue);
  }
  
  // Crear el gráfico
  return getPieTemplate('inventoryCategories', {
    labels: finalLabels,
    data: finalData,
    title: `Top ${topN} Categorías`,
    ...options
  });
}

/**
 * Configura animaciones para gráficos circulares
 * @param {Object} config - Configuración original del gráfico
 * @param {Object} animationOptions - Opciones de animación
 * @returns {Object} Configuración actualizada
 */
export function addPieAnimations(config, animationOptions = {}) {
  const defaultAnimation = {
    animateScale: true,
    animateRotate: true,
    duration: 1000,
    easing: 'easeInOutQuart'
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

/**
 * Configura el gráfico para ser responsivo
 * @param {Object} config - Configuración original del gráfico
 * @param {Object} responsiveOptions - Opciones responsivas
 * @returns {Object} Configuración actualizada
 */
export function makePieResponsive(config, responsiveOptions = {}) {
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

export default {
  pieTemplates,
  getPieTemplate,
  createDoughnutWithCenterText,
  createStockLevelsChart,
  createCategoryDistributionChart,
  createTopNCategoriesChart,
  generatePieColors,
  calculatePercentages,
  filterSmallSegments,
  addPieAnimations,
  makePieResponsive,
  centerTextPlugin
};