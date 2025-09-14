import { IXPServer } from '../src/core/IXPServer';

// Create a new IXP Server instance
const server = new IXPServer({
  port: 3000,
  logging: { level: 'info' }
});

// Example: Register individual intents with default parameters
server.registerIntent({
  name: 'search-products',
  description: 'Search for products in the catalog',
  category: 'ecommerce',
  featured: true,
  icon: 'search',
  parameters: {
    query: { type: 'string', required: true },
    category: { type: 'string', default: 'all' },
    limit: { type: 'number', default: 10 }
  },
  component: 'ProductSearchComponent',
  version: '1.0.0'
});

// Example: Register menu categories with items
server.registerMenuCategory('main-navigation', [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Main dashboard view',
    icon: 'dashboard',
    action: 'navigate',
    parameters: { route: '/dashboard' }
  },
  {
    id: 'products',
    label: 'Products',
    description: 'Product management',
    icon: 'box',
    action: 'navigate',
    parameters: { route: '/products' }
  }
]);

server.registerMenuCategory('user-actions', [
  {
    id: 'profile',
    label: 'My Profile',
    icon: 'user',
    action: 'open-modal',
    parameters: { modal: 'user-profile' }
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: 'logout',
    action: 'logout'
  }
]);

// Example: Initialize registry with default configuration
server.initializeRegistry({
  defaultIntents: [
    {
      name: 'welcome',
      description: 'Welcome new users',
      category: 'onboarding',
      featured: true,
      parameters: {
        showTour: { type: 'boolean', default: true },
        tourSteps: { type: 'array', default: ['intro', 'features', 'settings'] }
      }
    },
    {
      name: 'help',
      description: 'Get help and support',
      category: 'support',
      parameters: {
        topic: { type: 'string', default: 'general' }
      }
    }
  ],
  defaultMenuItems: {
    'quick-actions': [
      { id: 'new-item', label: 'New Item', icon: 'plus', action: 'create' },
      { id: 'search', label: 'Search', icon: 'search', action: 'search' }
    ],
    'settings': [
      { id: 'preferences', label: 'Preferences', icon: 'settings' },
      { id: 'theme', label: 'Theme', icon: 'palette' }
    ]
  },
  autoRegisterComponents: true
});

// Example: Retrieve and display registry information
async function demonstrateRegistry() {
  try {
    await server.initialize();
    
    console.log('=== Intent Registry Demo ===');
    console.log('Total registered intents:', server.getRegisteredIntents().length);
    console.log('Featured intents:', server.getFeaturedIntents().length);
    console.log('Ecommerce intents:', server.getIntentsByCategory('ecommerce').length);
    
    console.log('\n=== Menu Registry Demo ===');
    console.log('Available menu categories:', server.getMenuCategories());
    console.log('Main navigation items:', server.getMenuItems('main-navigation').length);
    console.log('Quick actions:', server.getMenuItems('quick-actions').length);
    
    const allMenus = server.getAllMenuItems();
    console.log('\nAll menu categories and item counts:');
    Object.entries(allMenus).forEach(([category, items]) => {
      console.log(`  ${category}: ${items.length} items`);
    });
    
    console.log('\n=== Registry functionality working correctly! ===');
    
  } catch (error) {
    console.error('Error demonstrating registry:', error);
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateRegistry();
}

export { server };