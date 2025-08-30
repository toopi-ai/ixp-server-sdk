import React from 'react';

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
}

export interface CategoryGridProps {
  categories: Category[];
  onCategorySelect?: (categoryId: string) => void;
  loading?: boolean;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  onCategorySelect,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="category-grid-loading">
        <div className="loading-spinner"></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="category-grid-empty">
        <p>No categories available</p>
      </div>
    );
  }

  return (
    <div className="category-grid">
      <h2 className="category-grid-title">Shop by Category</h2>
      <div className="category-grid-container">
        {categories.map((category) => (
          <div
            key={category.id}
            className="category-card"
            onClick={() => onCategorySelect?.(category.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onCategorySelect?.(category.id);
              }
            }}
          >
            <div className="category-image-container">
              <img
                src={category.image}
                alt={category.name}
                className="category-image"
                loading="lazy"
              />
              <div className="category-overlay">
                <span className="category-product-count">
                  {category.productCount} products
                </span>
              </div>
            </div>
            <div className="category-info">
              <h3 className="category-name">{category.name}</h3>
              <p className="category-description">{category.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;
