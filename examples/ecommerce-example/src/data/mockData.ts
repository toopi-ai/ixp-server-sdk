export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  brand: string;
  sku: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  parentId?: string;
  productCount: number;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  addedAt: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  addresses: Array<{
    id: string;
    type: 'billing' | 'shipping';
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
  }>;
}

// Mock Categories
export const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Electronics',
    description: 'Latest electronic devices and gadgets',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
    productCount: 25
  },
  {
    id: 'cat-2',
    name: 'Clothing',
    description: 'Fashion and apparel for all occasions',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    productCount: 18
  },
  {
    id: 'cat-3',
    name: 'Home & Garden',
    description: 'Everything for your home and garden',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    productCount: 12
  },
  {
    id: 'cat-4',
    name: 'Sports & Outdoors',
    description: 'Gear for active lifestyle',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    productCount: 15
  },
  {
    id: 'cat-5',
    name: 'Books',
    description: 'Books for every reader',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    productCount: 8
  }
];

// Mock Products
export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Wireless Bluetooth Headphones',
    description: 'Premium noise-cancelling wireless headphones with 30-hour battery life and superior sound quality.',
    price: 199.99,
    originalPrice: 249.99,
    category: 'cat-1',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400'
    ],
    inStock: true,
    stockQuantity: 25,
    rating: 4.5,
    reviewCount: 128,
    tags: ['wireless', 'bluetooth', 'noise-cancelling'],
    brand: 'AudioTech',
    sku: 'AT-WBH-001',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'prod-2',
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracker with heart rate monitoring, GPS, and 7-day battery life.',
    price: 299.99,
    category: 'cat-1',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400'
    ],
    inStock: true,
    stockQuantity: 15,
    rating: 4.7,
    reviewCount: 89,
    tags: ['fitness', 'smartwatch', 'gps'],
    brand: 'FitTech',
    sku: 'FT-SFW-002',
    createdAt: '2024-01-20T14:30:00Z'
  },
  {
    id: 'prod-3',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable and sustainable organic cotton t-shirt in various colors.',
    price: 29.99,
    category: 'cat-2',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      'https://images.unsplash.com/photo-1583743814966-8936f37f4678?w=400'
    ],
    inStock: true,
    stockQuantity: 50,
    rating: 4.3,
    reviewCount: 45,
    tags: ['organic', 'cotton', 'sustainable'],
    brand: 'EcoWear',
    sku: 'EW-OCT-003',
    createdAt: '2024-01-25T09:15:00Z'
  },
  {
    id: 'prod-4',
    name: 'Premium Coffee Maker',
    description: 'Professional-grade coffee maker with programmable settings and thermal carafe.',
    price: 149.99,
    originalPrice: 179.99,
    category: 'cat-3',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'
    ],
    inStock: true,
    stockQuantity: 12,
    rating: 4.6,
    reviewCount: 67,
    tags: ['coffee', 'kitchen', 'appliance'],
    brand: 'BrewMaster',
    sku: 'BM-PCM-004',
    createdAt: '2024-02-01T11:45:00Z'
  },
  {
    id: 'prod-5',
    name: 'Yoga Mat Pro',
    description: 'Non-slip premium yoga mat with alignment guides and carrying strap.',
    price: 79.99,
    category: 'cat-4',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    images: [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
      'https://images.unsplash.com/photo-1506629905607-d405b7a82d67?w=400'
    ],
    inStock: true,
    stockQuantity: 30,
    rating: 4.4,
    reviewCount: 92,
    tags: ['yoga', 'fitness', 'exercise'],
    brand: 'ZenFit',
    sku: 'ZF-YMP-005',
    createdAt: '2024-02-05T16:20:00Z'
  },
  {
    id: 'prod-6',
    name: 'JavaScript: The Complete Guide',
    description: 'Comprehensive guide to modern JavaScript programming with practical examples.',
    price: 49.99,
    category: 'cat-5',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    ],
    inStock: true,
    stockQuantity: 20,
    rating: 4.8,
    reviewCount: 156,
    tags: ['programming', 'javascript', 'education'],
    brand: 'TechBooks',
    sku: 'TB-JSG-006',
    createdAt: '2024-02-10T13:00:00Z'
  }
];

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    addresses: [
      {
        id: 'addr-1',
        type: 'shipping',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        isDefault: true
      }
    ]
  }
];

// Mock Carts
export const mockCarts: Cart[] = [
  {
    id: 'cart-1',
    userId: 'user-1',
    items: [
      {
        id: 'cart-item-1',
        productId: 'prod-1',
        quantity: 1,
        price: 199.99,
        addedAt: '2024-02-15T10:30:00Z'
      },
      {
        id: 'cart-item-2',
        productId: 'prod-3',
        quantity: 2,
        price: 29.99,
        addedAt: '2024-02-15T11:00:00Z'
      }
    ],
    total: 259.97,
    createdAt: '2024-02-15T10:30:00Z',
    updatedAt: '2024-02-15T11:00:00Z'
  }
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: 'order-1',
    userId: 'user-1',
    items: [
      {
        id: 'order-item-1',
        productId: 'prod-2',
        quantity: 1,
        price: 299.99,
        addedAt: '2024-02-10T15:00:00Z'
      }
    ],
    total: 299.99,
    status: 'delivered',
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    paymentMethod: 'Credit Card',
    createdAt: '2024-02-10T15:00:00Z',
    updatedAt: '2024-02-12T09:30:00Z'
  }
];

// Helper functions
export function getProductById(id: string): Product | undefined {
  return mockProducts.find(product => product.id === id);
}

export function getProductsByCategory(categoryId: string): Product[] {
  return mockProducts.filter(product => product.category === categoryId);
}

export function getCategoryById(id: string): Category | undefined {
  return mockCategories.find(category => category.id === id);
}

export function searchProducts(query: string): Product[] {
  const lowercaseQuery = query.toLowerCase();
  return mockProducts.filter(product => 
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.description.toLowerCase().includes(lowercaseQuery) ||
    product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

export function getCartByUserId(userId: string): Cart | undefined {
  return mockCarts.find(cart => cart.userId === userId);
}

export function getOrdersByUserId(userId: string): Order[] {
  return mockOrders.filter(order => order.userId === userId);
}