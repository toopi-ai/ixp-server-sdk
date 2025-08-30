import React from 'react';
import { Category } from '../data/mockData';

export interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  loading?: boolean;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  loading = false
}) => {
  return (
    <div className="category-filter">
      <h3>Categories</h3>
      
      <div className="category-list">
        <button
          className={`category-item ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => onCategorySelect(null)}
          disabled={loading}
        >
          <span className="category-name">All Products</span>
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => onCategorySelect(category.id)}
            disabled={loading}
          >
            <img 
              src={category.image} 
              alt={category.name}
              className="category-icon"
            />
            <div className="category-info">
              <span className="category-name">{category.name}</span>
              <span className="product-count">{category.productCount} products</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;