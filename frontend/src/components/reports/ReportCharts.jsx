import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Radar, PolarArea } from 'react-chartjs-2';
import { getBarTemplate, createGroupedBarChart, createStackedBarChart } from './chart-templates/bar-template';
import { getPieTemplate, createCategoryDistributionChart, createStockLevelsChart, centerTextPlugin } from './chart-templates/pie-template';
import "../../assets/styles/Reports/reports.css";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Registrar plugin personalizado para texto en el centro
ChartJS.register(centerTextPlugin);

const ReportCharts = ({ type, data, options, height, width, template }) => {
  const chartRef = useRef(null);
  
  // Configuración base
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            size: 12
          },
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: {
          family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          size: 13
        },
        bodyFont: {
          family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          size: 12
        },
        padding: 12,
        cornerRadius: 6,
        displayColors: true
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  // Obtener configuración basada en template
  const getTemplateConfig = () => {
    if (!template) return null;
    
    switch(type) {
      case 'bar':
        if (template.startsWith('grouped-')) {
          return createGroupedBarChart(
            data.labels,
            data.datasets,
            { title: template.replace('grouped-', '') }
          );
        }
        if (template.startsWith('stacked-')) {
          return createStackedBarChart(
            data.labels,
            data.datasets,
            { title: template.replace('stacked-', '') }
          );
        }
        return getBarTemplate(template, {
          labels: data.labels,
          data: data.datasets?.[0]?.data || [],
          datasets: data.datasets,
          title: template
        });
        
      case 'pie':
      case 'doughnut':
        if (template === 'stock-levels') {
          return createStockLevelsChart(
            data.outOfStock || 0,
            data.lowStock || 0,
            data.mediumStock || 0,
            data.highStock || 0,
            { title: 'Niveles de Stock' }
          );
        }
        if (template === 'category-distribution') {
          return createCategoryDistributionChart(
            data.labels,
            data.values,
            data.valueType || 'currency',
            { title: 'Distribución por Categoría' }
          );
        }
        return getPieTemplate(template, {
          labels: data.labels,
          data: data.datasets?.[0]?.data || [],
          datasets: data.datasets,
          title: template
        });
        
      default:
        return null;
    }
  };

  const templateConfig = getTemplateConfig();
  const mergedOptions = templateConfig ? 
    { ...templateConfig.options, ...options } : 
    { ...baseOptions, ...options };

  const chartData = templateConfig ? templateConfig.data : data;

  const renderChart = () => {
    const chartProps = {
      ref: chartRef,
      data: chartData,
      options: mergedOptions,
      height: height || 300,
      width: width || '100%'
    };

    switch (type) {
      case 'line':
        return <Line {...chartProps} />;
      case 'bar':
        return <Bar {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'doughnut':
        return <Doughnut {...chartProps} />;
      case 'radar':
        return <Radar {...chartProps} />;
      case 'polar':
        return <PolarArea {...chartProps} />;
      case 'area':
        return <Line {...chartProps} options={{
          ...mergedOptions,
          elements: {
            ...mergedOptions.elements,
            line: {
              ...mergedOptions.elements?.line,
              fill: true
            }
          }
        }} />;
      default:
        return <Bar {...chartProps} />;
    }
  };

  useEffect(() => {
    // Limpiar el chart cuando el componente se desmonte
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const handleDownload = () => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = `chart-${type}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = chartRef.current.toBase64Image();
      link.click();
    }
  };

  const handlePrint = () => {
    const chartWindow = window.open('', '_blank');
    chartWindow.document.write(`
      <html>
        <head>
          <title>Gráfico del Reporte</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 40px;
              text-align: center;
            }
            img { 
              max-width: 100%; 
              height: auto;
              margin: 20px 0;
            }
            .chart-info {
              margin-bottom: 20px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h2>Gráfico de ${type}</h2>
          <div class="chart-info">
            Generado: ${new Date().toLocaleString()}
          </div>
          <img src="${chartRef.current?.toBase64Image() || ''}" alt="Chart">
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 100);
            }
          </script>
        </body>
      </html>
    `);
    chartWindow.document.close();
  };

  return (
    <div className="report-chart-container">
      <div className="chart-wrapper">
        {renderChart()}
      </div>
      
      <div className="chart-actions">
        <button 
          className="btn-chart-action"
          onClick={handleDownload}
          title="Descargar como imagen"
        >
          📥
        </button>
        <button 
          className="btn-chart-action"
          onClick={handlePrint}
          title="Imprimir gráfico"
        >
          🖨️
        </button>
        <button 
          className="btn-chart-action"
          onClick={() => alert('Función de compartir en desarrollo')}
          title="Compartir"
        >
          📤
        </button>
      </div>
    </div>
  );
};

export default ReportCharts;