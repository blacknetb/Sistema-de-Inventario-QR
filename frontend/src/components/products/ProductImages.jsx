import React, { useState, useRef } from 'react';
import '../../assets/styles/Products/products.CSS';

const ProductImages = ({ images = [], onImagesChange, readonly = false }) => {
  const [mainImage, setMainImage] = useState(images[0] || '');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => URL.createObjectURL(file));
    const updatedImages = [...images, ...newImages];
    onImagesChange(updatedImages);
    
    if (!mainImage && newImages.length > 0) {
      setMainImage(newImages[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      const newImages = imageFiles.map(file => URL.createObjectURL(file));
      const updatedImages = [...images, ...newImages];
      onImagesChange(updatedImages);
      
      if (!mainImage && newImages.length > 0) {
        setMainImage(newImages[0]);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOverItem = (e, index) => {
    e.preventDefault();
  };

  const handleDropItem = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedItem);
    
    onImagesChange(newImages);
    setDraggedIndex(null);
  };

  const handleSetMainImage = (image) => {
    setMainImage(image);
  };

  const handleDeleteImage = (index, e) => {
    e.stopPropagation();
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    
    if (images[index] === mainImage) {
      setMainImage(newImages[0] || '');
    }
  };

  const handleReplaceImage = (index, e) => {
    e.stopPropagation();
    if (!fileInputRef.current) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const newImage = URL.createObjectURL(file);
        const newImages = [...images];
        newImages[index] = newImage;
        onImagesChange(newImages);
        
        if (images[index] === mainImage) {
          setMainImage(newImage);
        }
      }
    };
    input.click();
  };

  const getImageName = (url) => {
    if (url.startsWith('blob:')) return 'Imagen subida';
    if (url.includes('placeholder.com')) return 'Imagen de ejemplo';
    return url.split('/').pop();
  };

  return (
    <div className="product-images">
      <div className="images-header">
        <h3>Imágenes del Producto</h3>
        {!readonly && (
          <div className="header-actions">
            <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
              <span className="btn-icon">📁</span>
              Subir Imágenes
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>

      <div className="images-content">
        <div className="main-image-container">
          {mainImage ? (
            <div className="main-image">
              <img src={mainImage} alt="Imagen principal" />
              <div className="image-overlay">
                <span className="overlay-badge">Principal</span>
              </div>
            </div>
          ) : (
            <div 
              className="main-image empty"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => !readonly && fileInputRef.current?.click()}
            >
              <div className="upload-placeholder">
                <span className="upload-icon">🖼️</span>
                <p>Arrastra imágenes aquí o haz clic para subir</p>
                <small>Formatos: JPG, PNG, GIF, WebP (Max. 5MB)</small>
              </div>
            </div>
          )}
          
          {mainImage && (
            <div className="image-info">
              <div className="info-item">
                <span className="info-label">Imagen principal:</span>
                <span className="info-value">{getImageName(mainImage)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Total de imágenes:</span>
                <span className="info-value">{images.length}</span>
              </div>
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div className="thumbnails-container">
            <div className="thumbnails-header">
              <h4>Miniaturas ({images.length})</h4>
              {!readonly && (
                <button 
                  className="sort-btn"
                  onClick={() => {
                    const reversed = [...images].reverse();
                    onImagesChange(reversed);
                    if (images.includes(mainImage)) {
                      setMainImage(reversed[reversed.indexOf(mainImage)]);
                    }
                  }}
                >
                  🔄 Reordenar
                </button>
              )}
            </div>
            
            <div className="thumbnails-grid">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`thumbnail ${image === mainImage ? 'main' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
                  draggable={!readonly}
                  onDragStart={() => !readonly && handleDragStart(index)}
                  onDragOver={(e) => !readonly && handleDragOverItem(e, index)}
                  onDrop={(e) => !readonly && handleDropItem(e, index)}
                  onClick={() => handleSetMainImage(image)}
                >
                  <img src={image} alt={`Miniatura ${index + 1}`} />
                  
                  {image === mainImage && (
                    <div className="main-badge">
                      <span>✓</span>
                    </div>
                  )}
                  
                  {!readonly && (
                    <div className="thumbnail-actions">
                      <button 
                        className="action-btn delete-btn"
                        onClick={(e) => handleDeleteImage(index, e)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                      <button 
                        className="action-btn replace-btn"
                        onClick={(e) => handleReplaceImage(index, e)}
                        title="Reemplazar"
                      >
                        🔄
                      </button>
                    </div>
                  )}
                  
                  <div className="thumbnail-info">
                    <span className="thumbnail-index">#{index + 1}</span>
                    <span className="thumbnail-name">{getImageName(image)}</span>
                  </div>
                </div>
              ))}
              
              {!readonly && (
                <div 
                  className="thumbnail add-thumbnail"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <div className="add-icon">+</div>
                  <p>Agregar imagen</p>
                </div>
              )}
            </div>
            
            <div className="thumbnails-legend">
              <div className="legend-item">
                <div className="legend-color main"></div>
                <span>Imagen principal</span>
              </div>
              {!readonly && (
                <>
                  <div className="legend-item">
                    <div className="legend-icon">🗑️</div>
                    <span>Eliminar imagen</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-icon">🔄</div>
                    <span>Reemplazar imagen</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-icon">↕️</div>
                    <span>Arrastrar para reordenar</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {images.length === 0 && !readonly && (
          <div 
            className="upload-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-content">
              <div className="upload-icon-large">📷</div>
              <h4>Sube imágenes de tu producto</h4>
              <p>Arrastra y suelta imágenes aquí o haz clic para seleccionar</p>
              <div className="upload-stats">
                <div className="stat">
                  <span className="stat-icon">📁</span>
                  <span className="stat-text">Hasta 10 imágenes</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">⚖️</span>
                  <span className="stat-text">Máx. 5MB por imagen</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">🖼️</span>
                  <span className="stat-text">JPG, PNG, GIF, WebP</span>
                </div>
              </div>
              <button className="btn-primary">
                <span className="btn-icon">📁</span>
                Seleccionar Imágenes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImages;