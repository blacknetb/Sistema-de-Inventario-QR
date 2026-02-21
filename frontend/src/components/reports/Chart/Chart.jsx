import React, { useEffect, useRef } from 'react';
import styles from './Chart.module.css';

const Chart = ({ type = 'bar', data, title, height = 300 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || !data.labels || !data.values) return;

    const ctx = canvasRef.current.getContext('2d');
    const canvas = canvasRef.current;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configurar dimensiones
    const width = canvas.width;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Encontrar valor máximo para escala
    const maxValue = Math.max(...data.values, 0);
    const scale = chartHeight / (maxValue || 1);

    // Dibujar ejes
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Eje Y
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    
    // Eje X
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Dibujar líneas de cuadrícula
    ctx.beginPath();
    ctx.strokeStyle = '#f3f4f6';
    ctx.setLineDash([5, 5]);
    
    for (let i = 0; i <= 5; i++) {
      const y = height - padding - (i * chartHeight / 5);
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    if (type === 'bar') {
      const barWidth = (chartWidth / data.labels.length) * 0.7;
      const barSpacing = (chartWidth / data.labels.length) * 0.3;

      data.values.forEach((value, index) => {
        const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
        const barHeight = value * scale;
        const y = height - padding - barHeight;

        // Dibujar barra
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Dibujar valor encima de la barra
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(value, x + barWidth / 2, y - 5);

        // Dibujar etiqueta del eje X
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(data.labels[index], x + barWidth / 2, height - padding + 20);
      });
    } else if (type === 'line') {
      // Dibujar línea
      ctx.beginPath();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      
      data.values.forEach((value, index) => {
        const x = padding + (index * chartWidth / (data.labels.length - 1));
        const y = height - padding - (value * scale);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Dibujar puntos
      data.values.forEach((value, index) => {
        const x = padding + (index * chartWidth / (data.labels.length - 1));
        const y = height - padding - (value * scale);
        
        ctx.beginPath();
        ctx.fillStyle = '#2563eb';
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dibujar valor
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(value, x, y - 10);

        // Dibujar etiqueta del eje X
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(data.labels[index], x, height - padding + 20);
      });
    }

    // Dibujar valores del eje Y
    for (let i = 0; i <= 5; i++) {
      const value = Math.round(maxValue * i / 5);
      const y = height - padding - (i * chartHeight / 5);
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(value, padding - 10, y + 4);
    }

  }, [type, data, height]);

  return (
    <div className={styles.chart}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={800}
          height={height}
          className={styles.canvas}
        />
      </div>
    </div>
  );
};

export default Chart;