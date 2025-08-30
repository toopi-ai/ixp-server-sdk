import React from 'react';
import { Product } from '../data/mockData';
import ProductCard from './ProductCard';

export interface ProductListProps {
  products: Product[];
  loading?: boolean;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products, 
  loading = false, 
  onAddToCart, 
  onViewDetails 
}) => {
  if (loading) {
    return (
      <div className="product-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="product-list-empty">
        <h3>No products found</h3>
        <p>Try adjusting your search or browse our categories.</p>
      </div>
    );
  }

  return (
    <div className="product-list">
      <div className="product-grid">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            {...(onAddToCart && { onAddToCart })}
            {...(onViewDetails && { onViewDetails })}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductList;