import React from 'react';
import { Product } from '../data/mockData';

export interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  onViewDetails 
}) => {
  const handleAddToCart = () => {
    onAddToCart?.(product.id);
  };

  const handleViewDetails = () => {
    onViewDetails?.(product.id);
  };

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img 
          src={product.image} 
          alt={product.name}
          className="product-image"
          onClick={handleViewDetails}
        />
        {discountPercentage > 0 && (
          <div className="discount-badge">
            -{discountPercentage}%
          </div>
        )}
        {!product.inStock && (
          <div className="out-of-stock-overlay">
            Out of Stock
          </div>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-name" onClick={handleViewDetails}>
          {product.name}
        </h3>
        
        <p className="product-description">
          {product.description.length > 100 
            ? `${product.description.substring(0, 100)}...` 
            : product.description
          }
        </p>
        
        <div className="product-rating">
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <span 
                key={i} 
                className={`star ${i < Math.floor(product.rating) ? 'filled' : ''}`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="rating-text">
            {product.rating} ({product.reviewCount} reviews)
          </span>
        </div>
        
        <div className="product-price">
          <span className="current-price">${product.price}</span>
          {product.originalPrice && (
            <span className="original-price">${product.originalPrice}</span>
          )}
        </div>
        
        <div className="product-meta">
          <span className="brand">{product.brand}</span>
          <span className="stock-info">
            {product.inStock 
              ? `${product.stockQuantity} in stock` 
              : 'Out of stock'
            }
          </span>
        </div>
        
        <div className="product-tags">
          {product.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="product-actions">
        <button 
          className="btn btn-primary add-to-cart"
          onClick={handleAddToCart}
          disabled={!product.inStock}
        >
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
        
        <button 
          className="btn btn-secondary view-details"
          onClick={handleViewDetails}
        >
          View Details
        </button>
      </div>
      
      <style>{`
        .product-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .product-image-container {
          position: relative;
          margin-bottom: 12px;
        }
        
        .product-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .discount-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #ff4444;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .out-of-stock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border-radius: 4px;
        }
        
        .product-info {
          flex: 1;
          margin-bottom: 16px;
        }
        
        .product-name {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px 0;
          cursor: pointer;
          color: #333;
        }
        
        .product-name:hover {
          color: #007bff;
        }
        
        .product-description {
          color: #666;
          font-size: 14px;
          line-height: 1.4;
          margin: 0 0 12px 0;
        }
        
        .product-rating {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .stars {
          display: flex;
        }
        
        .star {
          color: #ddd;
          font-size: 16px;
        }
        
        .star.filled {
          color: #ffc107;
        }
        
        .rating-text {
          font-size: 12px;
          color: #666;
        }
        
        .product-price {
          margin-bottom: 8px;
        }
        
        .current-price {
          font-size: 20px;
          font-weight: 700;
          color: #007bff;
        }
        
        .original-price {
          font-size: 16px;
          color: #999;
          text-decoration: line-through;
          margin-left: 8px;
        }
        
        .product-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
        }
        
        .brand {
          color: #666;
          font-weight: 500;
        }
        
        .stock-info {
          color: #28a745;
        }
        
        .product-tags {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        
        .tag {
          background: #f8f9fa;
          color: #666;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 10px;
          border: 1px solid #e9ecef;
        }
        
        .product-actions {
          display: flex;
          gap: 8px;
        }
        
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s;
          flex: 1;
        }
        
        .btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        
        .btn-primary {
          background: #007bff;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover {
          background: #545b62;
        }
      `}</style>
    </div>
  );
};

export default ProductCard;