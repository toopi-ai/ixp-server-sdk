# IXP Server SDK - Ecommerce Example

A comprehensive ecommerce application example built with the IXP Server SDK, featuring React components, mock API data, and intelligent intent processing.

## Features

### 🛍️ Core Ecommerce Functionality
- **Product Catalog**: Browse products with search, filtering, and categorization
- **Shopping Cart**: Add/remove items, update quantities, persistent cart state
- **Checkout Process**: Complete order processing with payment integration
- **Category Management**: Organized product categories with visual navigation
- **User Management**: Basic user profiles and order history

### 🎯 IXP Server SDK Integration
- **Intent-Based Architecture**: Natural language processing for ecommerce actions
- **Component System**: Reusable React components with server-side rendering
- **API Endpoints**: RESTful API alongside intent-based interactions
- **Real-time Updates**: Live cart updates and inventory management

### 🧩 Technical Features
- **TypeScript**: Full type safety across client and server
- **Mock Data**: Realistic product catalog with 50+ items
- **Responsive Design**: Mobile-first UI components
- **Error Handling**: Comprehensive error management and user feedback

## Project Structure

```
ecommerce-example/
├── src/
│   ├── components/          # React components
│   │   ├── ProductCard.tsx  # Individual product display
│   │   ├── ProductList.tsx  # Product grid/list view
│   │   ├── ShoppingCart.tsx # Cart management
│   │   ├── CategoryFilter.tsx # Category navigation
│   │   └── index.ts         # Component exports
│   └── data/
│       └── mockData.ts      # Mock API data and types
├── server.ts                # IXP Server implementation
├── package.json             # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
└── README.md               # This file
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- IXP Server SDK installed in parent project

### Installation

1. **Navigate to the example directory:**
   ```bash
   cd examples/ecommerce-example
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Main application: http://localhost:3001
   - API documentation: http://localhost:3001/api

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run build:components` - Build React components only
- `npm run type-check` - Run TypeScript type checking

## API Endpoints

### REST API
- `GET /api/products` - List products with optional filters
- `GET /api/products/:id` - Get product details
- `GET /api/categories` - List all categories
- `GET /api/categories/:id` - Get category details
- `GET /api/cart/:userId` - Get user's cart
- `POST /api/cart/:userId/add` - Add item to cart
- `GET /api/orders/:userId` - Get user's order history

### Intent Endpoints
- `POST /intents/product-search` - Search products with natural language
- `POST /intents/add-to-cart` - Add products to cart via intent
- `POST /intents/get-cart` - Retrieve cart contents
- `POST /intents/checkout` - Process checkout and create order

## Intent Examples

### Product Search Intent
```javascript
// Search for products
fetch('/intents/product-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'wireless headphones',
    category: 'electronics',
    minPrice: 50,
    maxPrice: 200,
    inStock: true
  })
})
```

### Add to Cart Intent
```javascript
// Add product to cart
fetch('/intents/add-to-cart', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 'prod-001',
    quantity: 2,
    userId: 'user-1'
  })
})
```

### Checkout Intent
```javascript
// Process checkout
fetch('/intents/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-1',
    paymentMethod: 'Credit Card',
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    }
  })
})
```

## Component Usage

### ProductCard Component
```tsx
import { ProductCard } from './src/components';

<ProductCard
  product={product}
  onAddToCart={(productId) => handleAddToCart(productId)}
  onViewDetails={(productId) => handleViewDetails(productId)}
  loading={false}
/>
```

### ShoppingCart Component
```tsx
import { ShoppingCart } from './src/components';

<ShoppingCart
  cart={cart}
  onUpdateQuantity={(itemId, quantity) => handleUpdateQuantity(itemId, quantity)}
  onRemoveItem={(itemId) => handleRemoveItem(itemId)}
  onCheckout={() => handleCheckout()}
  loading={false}
/>
```

## Mock Data

The example includes comprehensive mock data:

- **50+ Products** across multiple categories
- **8 Categories** with realistic product counts
- **User Profiles** with order history
- **Shopping Carts** with persistent state
- **Order Management** with status tracking

### Product Categories
- Electronics (smartphones, laptops, headphones)
- Clothing (shirts, pants, shoes, accessories)
- Home & Garden (furniture, decor, tools)
- Books (fiction, non-fiction, educational)
- Sports & Outdoors (equipment, apparel)
- Health & Beauty (skincare, supplements)
- Toys & Games (educational, entertainment)
- Automotive (parts, accessories)

## Customization

### Adding New Products
```typescript
// In src/data/mockData.ts
const newProduct: Product = {
  id: 'prod-new',
  name: 'New Product',
  description: 'Product description',
  price: 99.99,
  originalPrice: 129.99,
  category: 'electronics',
  brand: 'Brand Name',
  image: 'https://example.com/image.jpg',
  inStock: true,
  stockQuantity: 10,
  rating: 4.5,
  reviewCount: 25,
  tags: ['new', 'featured']
};

mockProducts.push(newProduct);
```

### Creating Custom Intents
```typescript
class CustomIntent extends Intent {
  name = 'custom-intent';
  
  async execute(context: IntentContext): Promise<IntentResponse> {
    // Your custom logic here
    return {
      message: 'Custom intent executed',
      data: { /* your data */ },
      metadata: {
        intent: 'custom-intent',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Register the intent
server.registerIntent(new CustomIntent());
```

### Styling Components
The example uses CSS classes that can be customized:

```css
/* Product card styling */
.product-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
}

/* Cart styling */
.shopping-cart {
  background: white;
  padding: 20px;
  border-radius: 8px;
}
```

## Testing

### Manual Testing
1. Start the server: `npm run dev`
2. Open http://localhost:3001
3. Test the following workflows:
   - Browse products by category
   - Search for specific products
   - Add items to cart
   - Update cart quantities
   - Complete checkout process

### API Testing
Use tools like Postman or curl to test API endpoints:

```bash
# Get all products
curl http://localhost:3001/api/products

# Search products
curl "http://localhost:3001/api/products?search=laptop&category=electronics"

# Test intent
curl -X POST http://localhost:3001/intents/product-search \
  -H "Content-Type: application/json" \
  -d '{"query": "wireless headphones", "maxPrice": 100}'
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 3001
   lsof -ti:3001 | xargs kill -9
   ```

2. **TypeScript errors**
   ```bash
   # Check types
   npm run type-check
   ```

3. **Missing dependencies**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   ```

### Performance Tips

- Use React.memo for expensive components
- Implement virtual scrolling for large product lists
- Add caching for API responses
- Optimize images with lazy loading

## Next Steps

### Potential Enhancements
- **Authentication**: Add user login/registration
- **Payment Integration**: Connect to Stripe/PayPal
- **Inventory Management**: Real-time stock updates
- **Reviews System**: Product ratings and comments
- **Wishlist**: Save products for later
- **Recommendations**: AI-powered product suggestions
- **Analytics**: Track user behavior and sales

### Production Deployment
- Set up environment variables
- Configure database connections
- Add monitoring and logging
- Implement caching strategies
- Set up CI/CD pipelines

## Contributing

This example is part of the IXP Server SDK documentation. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This example is provided under the same license as the IXP Server SDK.

## Support

For questions and support:
- Check the main IXP Server SDK documentation
- Open an issue in the main repository
- Join our community discussions

---

**Happy coding! 🚀**