import React from 'react';
import '../../assets/styles/layout/layout.css';

const GridLayout = ({ 
  children, 
  columns = 3, 
  gap = '20px',
  responsive = true,
  align = 'stretch',
  justify = 'start',
  className = '',
  style = {}
}) => {
  const gridClass = `
    grid-layout 
    ${responsive ? 'grid-responsive' : ''} 
    ${className}
  `.trim();

  const gridStyle = {
    '--grid-columns': columns,
    '--grid-gap': gap,
    '--grid-align': align,
    '--grid-justify': justify,
    ...style
  };

  return (
    <div className={gridClass} style={gridStyle}>
      {children}
    </div>
  );
};

const GridItem = ({ 
  children, 
  span = 1,
  start = 'auto',
  align = 'auto',
  className = '',
  style = {}
}) => {
  const itemClass = `grid-item ${className}`.trim();
  
  const itemStyle = {
    '--item-span': span,
    '--item-start': start,
    '--item-align': align,
    ...style
  };

  return (
    <div className={itemClass} style={itemStyle}>
      {children}
    </div>
  );
};

export default GridLayout;
export { GridItem };