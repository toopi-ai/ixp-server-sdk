// Export types from mockData
export type { Product, Category, CartItem, Cart } from '../data/mockData';

// Import Category type for use in interfaces
import type { Category } from '../data/mockData';

// Export component props types
export interface CategoryFilterProps {
  categories: Category[];
  selectedCategory?: string;
  onCategorySelect: (categoryId: string) => void;
}

export interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  onSearch?: (query: string) => void;
}

export { default as CategoryFilter } from './CategoryFilter';
export { default as CategoryGrid } from './CategoryGrid';
export { default as ProductCard } from './ProductCard';
export { default as ProductList } from './ProductList';
export { default as ShoppingCart } from './ShoppingCart';
export { default as ThemeProvider, useTheme } from './ThemeProvider';
export { default as ThemeToggle } from './ThemeToggle';