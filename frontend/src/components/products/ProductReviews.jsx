import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/styles/Products/products.CSS';

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
    user_name: '',
    user_email: ''
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`/api/products/${productId}/reviews`);
      setReviews(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewReview({
      ...newReview,
      [e.target.name]: e.target.value
    });
  };

  const handleRatingChange = (rating) => {
    setNewReview({
      ...newReview,
      rating: rating
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/products/${productId}/reviews`, newReview);
      alert('Reseña enviada correctamente');
      setNewReview({
        rating: 5,
        title: '',
        comment: '',
        user_name: '',
        user_email: ''
      });
      setShowForm(false);
      fetchReviews();
    } catch (error) {
      alert('Error al enviar la reseña');
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating]++;
    });
    return distribution;
  };

  const renderStars = (rating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="product-reviews-container">
      <div className="reviews-header">
        <h2>Reseñas del Producto</h2>
        <div className="rating-summary">
          <div className="average-rating">
            <span className="rating-number">{calculateAverageRating()}</span>
            <div className="rating-stars">{renderStars(calculateAverageRating())}</div>
            <span className="rating-count">{reviews.length} reseñas</span>
          </div>
          
          <div className="rating-distribution">
            {Object.entries(getRatingDistribution()).reverse().map(([rating, count]) => (
              <div key={rating} className="distribution-row">
                <span className="rating-label">{rating} estrellas</span>
                <div className="distribution-bar">
                  <div 
                    className="distribution-fill"
                    style={{
                      width: `${(count / reviews.length) * 100 || 0}%`
                    }}
                  ></div>
                </div>
                <span className="distribution-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="reviews-content">
        <div className="reviews-list">
          <div className="reviews-header-bar">
            <h3>Reseñas de Clientes</h3>
            <button 
              className="btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancelar' : 'Escribir Reseña'}
            </button>
          </div>

          {showForm && (
            <div className="review-form-container">
              <h4>Escribe tu Reseña</h4>
              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label>Calificación:</label>
                  <div className="rating-input">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= newReview.rating ? 'selected' : ''}`}
                        onClick={() => handleRatingChange(star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Título:</label>
                  <input
                    type="text"
                    name="title"
                    value={newReview.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Comentario:</label>
                  <textarea
                    name="comment"
                    value={newReview.comment}
                    onChange={handleInputChange}
                    rows="4"
                    required
                  ></textarea>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre:</label>
                    <input
                      type="text"
                      name="user_name"
                      value={newReview.user_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      name="user_email"
                      value={newReview.user_email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <button type="submit" className="btn-primary">Enviar Reseña</button>
              </form>
            </div>
          )}

          {loading ? (
            <p>Cargando reseñas...</p>
          ) : reviews.length > 0 ? (
            <div className="reviews-grid">
              {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        {review.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4>{review.user_name}</h4>
                        <span className="review-date">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="review-rating">
                      {renderStars(review.rating)}
                      <span className="rating-value">{review.rating}.0</span>
                    </div>
                  </div>
                  
                  <h5 className="review-title">{review.title}</h5>
                  <p className="review-comment">{review.comment}</p>
                  
                  {review.response && (
                    <div className="review-response">
                      <strong>Respuesta del vendedor:</strong>
                      <p>{review.response}</p>
                      <span className="response-date">
                        {new Date(review.response_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  <div className="review-helpful">
                    <button className="helpful-btn">
                      👍 Útil ({review.helpful_count || 0})
                    </button>
                    <button className="report-btn">Reportar</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-reviews">
              <p>No hay reseñas para este producto. ¡Sé el primero en opinar!</p>
            </div>
          )}
        </div>

        <div className="reviews-stats">
          <h3>Estadísticas</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Total Reseñas</h4>
              <p className="stat-number">{reviews.length}</p>
            </div>
            
            <div className="stat-card">
              <h4>Calificación Promedio</h4>
              <p className="stat-number">{calculateAverageRating()}</p>
              <div className="stat-stars">{renderStars(calculateAverageRating())}</div>
            </div>
            
            <div className="stat-card">
              <h4>Reseñas con Respuesta</h4>
              <p className="stat-number">
                {reviews.filter(r => r.response).length}
              </p>
            </div>
            
            <div className="stat-card">
              <h4>Última Reseña</h4>
              <p className="stat-date">
                {reviews.length > 0 ? 
                  new Date(reviews[0].created_at).toLocaleDateString() : 
                  'N/A'}
              </p>
            </div>
          </div>
          
          <div className="recent-ratings">
            <h4>Calificaciones Recientes</h4>
            <div className="ratings-list">
              {reviews.slice(0, 5).map((review, index) => (
                <div key={index} className="rating-item">
                  <div className="rating-item-user">
                    <span className="user-initial">
                      {review.user_name.charAt(0)}
                    </span>
                    <span className="user-name">{review.user_name}</span>
                  </div>
                  <div className="rating-item-stars">
                    {renderStars(review.rating)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;