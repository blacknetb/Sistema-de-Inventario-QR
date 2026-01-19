import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/styles/Products/products.CSS';

const ProductQuickView = ({ productId, onClose }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      const response = await axios.get(`/api/products/${productId}/quickview`);
      setProduct(response.data);
      setLoading(false);
      
      // Inicializar variantes seleccionadas
      if (response.data.variants) {
        const initialVariants = {};
        response.data.variants.forEach(variant => {
          if (variant.options.length > 0) {
            initialVariants[variant.name] = variant.options[0].value;
          }
        });
        setSelectedVariants(initialVariants);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 99)) {
      setQuantity(newQuantity);
    }
  };

  const handleVariantChange = (variantName, value) => {
    setSelectedVariants({
      ...selectedVariants,
      [variantName]: value
    });
  };

  const handleAddToCart = () => {
    // Lógica para agregar al carrito
    const cartItem = {
      productId,
      quantity,
      variants: selectedVariants
    };
    console.log('Agregar al carrito:', cartItem);
    alert('Producto agregado al carrito');
  };

  const handleBuyNow = () => {
    // Lógica para compra inmediata
    handleAddToCart();
    // Redirigir al carrito
    window.location.href = '/cart';
  };

  if (loading) {
    return (
      <div className="quickview-overlay">
        <div className="quickview-container loading">
          <div className="loading-spinner"></div>
          <p>Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="quickview-overlay">
        <div className="quickview-container">
          <div className="quickview-header">
            <h2>Producto no encontrado</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="quickview-content">
            <p>El producto solicitado no está disponible.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quickview-overlay" onClick={onClose}>
      <div className="quickview-container" onClick={(e) => e.stopPropagation()}>
        <div className="quickview-header">
          <h2>{product.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="quickview-content">
          <div className="quickview-gallery">
            <div className="main-image">
              <img 
                src={product.images[selectedImage]?.url || '/placeholder.jpg'} 
                alt={product.name}
              />
            </div>
            
            {product.images.length > 1 && (
              <div className="thumbnail-list">
                {product.images.map((image, index) => (
                  <div 
                    key={index}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={image.thumbnail || image.url} alt={`Vista ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="quickview-details">
            <div className="product-meta">
              <span className="product-sku">SKU: {product.sku}</span>
              <span className={`product-status ${product.status}`}>
                {product.status === 'in_stock' ? 'En Stock' : 
                 product.status === 'low_stock' ? 'Stock Bajo' : 'Agotado'}
              </span>
            </div>
            
            <div className="product-price">
              {product.discount_price ? (
                <>
                  <span className="original-price">${product.price.toFixed(2)}</span>
                  <span className="current-price">${product.discount_price.toFixed(2)}</span>
                  <span className="discount-percent">
                    {Math.round((1 - product.discount_price / product.price) * 100)}% OFF
                  </span>
                </>
              ) : (
                <span className="current-price">${product.price.toFixed(2)}</span>
              )}
            </div>
            
            <div className="product-rating">
              <div className="stars">
                {'★'.repeat(Math.floor(product.rating || 0))}
                {'☆'.repeat(5 - Math.floor(product.rating || 0))}
              </div>
              <span className="rating-value">({product.rating?.toFixed(1) || '0.0'})</span>
              <span className="review-count">{product.review_count || 0} reseñas</span>
            </div>
            
            <div className="product-description">
              <h4>Descripción</h4>
              <p>{product.short_description || product.description?.substring(0, 200) + '...'}</p>
            </div>
            
            {product.variants && product.variants.length > 0 && (
              <div className="product-variants">
                {product.variants.map((variant, index) => (
                  <div key={index} className="variant-group">
                    <label>{variant.name}:</label>
                    <div className="variant-options">
                      {variant.options.map((option, optIndex) => (
                        <button
                          key={optIndex}
                          type="button"
                          className={`variant-option ${
                            selectedVariants[variant.name] === option.value ? 'selected' : ''
                          }`}
                          onClick={() => handleVariantChange(variant.name, option.value)}
                        >
                          {variant.type === 'color' ? (
                            <span 
                              className="color-swatch"
                              style={{ backgroundColor: option.value }}
                              title={option.label}
                            ></span>
                          ) : (
                            option.label
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="product-quantity">
              <label>Cantidad:</label>
              <div className="quantity-selector">
                <button 
                  type="button"
                  className="quantity-btn minus"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock || 99}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="quantity-input"
                />
                <button 
                  type="button"
                  className="quantity-btn plus"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (product.stock || 99)}
                >
                  +
                </button>
                <span className="stock-info">
                  {product.stock || 0} disponibles
                </span>
              </div>
            </div>
            
            <div className="product-actions">
              <button 
                className="btn-primary add-to-cart"
                onClick={handleAddToCart}
                disabled={!product.stock || product.stock === 0}
              >
                {product.stock && product.stock > 0 ? (
                  <>
                    <span className="cart-icon">🛒</span>
                    Agregar al Carrito
                  </>
                ) : (
                  'Agotado'
                )}
              </button>
              
              <button 
                className="btn-secondary buy-now"
                onClick={handleBuyNow}
                disabled={!product.stock || product.stock === 0}
              >
                Comprar Ahora
              </button>
            </div>
            
            <div className="product-features">
              <h4>Características</h4>
              <ul>
                {product.features?.slice(0, 5).map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <div className="product-shipping">
              <h4>Envío y Devoluciones</h4>
              <div className="shipping-info">
                <span className="shipping-item">🚚 Envío gratis</span>
                <span className="shipping-item">🔄 30 días devolución</span>
                <span className="shipping-item">🔒 Pago seguro</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="quickview-footer">
          <button className="btn-text" onClick={onClose}>
            Continuar comprando
          </button>
          <button 
            className="btn-link"
            onClick={() => window.location.href = `/products/${productId}`}
          >
            Ver detalles completos →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductQuickView;