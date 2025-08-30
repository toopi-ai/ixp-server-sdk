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