# Components API Reference

Components are the rendering layer of the IXP Server SDK. They define how intents are presented to users and handle the visual representation of your application's responses.

## Table of Contents

- [Overview](#overview)
- [Component Definition](#component-definition)
- [Component Registry](#component-registry)
- [Component Types](#component-types)
- [Props and Data Flow](#props-and-data-flow)
- [Lifecycle Methods](#lifecycle-methods)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Components in the IXP Server SDK are responsible for:

- Rendering intent responses
- Handling user interactions
- Managing component state
- Providing accessibility features
- Supporting server-side rendering

## Component Definition

### Basic Structure

```typescript
interface ComponentDefinition {
  name: string;
  description: string;
  version: string;
  type: ComponentType;
  props: {
    type: 'object';
    properties: Record<string, PropSchema>;
    required?: string[];
  };
  render: ComponentRenderer;
  metadata?: ComponentMetadata;
}

type ComponentType = 'functional' | 'class' | 'static' | 'interactive';
```

### Properties

#### `name` (required)
- **Type:** `string`
- **Description:** Unique identifier for the component
- **Example:** `"WeatherWidget"`, `"UserProfileCard"`

#### `description` (required)
- **Type:** `string`
- **Description:** Human-readable description of the component's purpose
- **Example:** `"Displays current weather information with forecast"`

#### `version` (required)
- **Type:** `string`
- **Description:** Version of the component definition
- **Example:** `"1.1.1"`

#### `type` (required)
- **Type:** `ComponentType`
- **Description:** The type of component
- **Options:**
  - `functional` - Stateless functional component
  - `class` - Stateful class component
  - `static` - Static HTML/text component
  - `interactive` - Component with user interactions

#### `props` (required)
- **Type:** `object`
- **Description:** JSON Schema defining the props this component accepts

#### `render` (required)
- **Type:** `ComponentRenderer`
- **Description:** Function that renders the component

#### `metadata` (optional)
- **Type:** `ComponentMetadata`
- **Description:** Additional component metadata

## Component Registry

The Component Registry manages all available components in your server.

### Creating a Component Registry

```typescript
import { ComponentRegistry } from 'ixp-server';

const registry = new ComponentRegistry();
```

### Registering Components

#### From File

```typescript
// Load from JSON file
await registry.loadFromFile('./config/components.json');

// Load from TypeScript/JavaScript file
await registry.loadFromModule('./components/index.ts');
```

#### Programmatically

```typescript
const weatherComponent = {
  name: 'WeatherWidget',
  description: 'Displays weather information',
  version: '1.1.1',
  type: 'functional',
  props: {
    type: 'object',
    properties: {
      location: { type: 'string' },
      temperature: { type: 'number' },
      condition: { type: 'string' }
    },
    required: ['location', 'temperature']
  },
  render: (props) => {
    return `
      <div class="weather-widget">
        <h3>Weather in ${props.location}</h3>
        <p class="temperature">${props.temperature}°C</p>
        <p class="condition">${props.condition}</p>
      </div>
    `;
  }
};

registry.register(weatherComponent);
```

### Registry Methods

#### `getComponent(name: string): ComponentDefinition | null`
Retrieve a specific component by name.

```typescript
const component = registry.getComponent('WeatherWidget');
if (component) {
  console.log(component.description);
}
```

#### `getAllComponents(): ComponentDefinition[]`
Get all registered components.

```typescript
const allComponents = registry.getAllComponents();
console.log(`Total components: ${allComponents.length}`);
```

#### `hasComponent(name: string): boolean`
Check if a component exists.

```typescript
if (registry.hasComponent('WeatherWidget')) {
  // Component exists
}
```

#### `validateComponent(component: ComponentDefinition): ValidationResult`
Validate a component definition.

```typescript
const result = registry.validateComponent(component);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## Component Types

### Functional Components

Stateless components that render based on props.

```typescript
const GreetingCard = {
  name: 'GreetingCard',
  description: 'Simple greeting card component',
  version: '1.1.1',
  type: 'functional',
  props: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      message: { type: 'string', default: 'Hello!' }
    },
    required: ['name']
  },
  render: (props) => {
    return `
      <div class="greeting-card">
        <h2>${props.message}</h2>
        <p>Welcome, ${props.name}!</p>
      </div>
    `;
  }
};
```

### Class Components

Stateful components with lifecycle methods.

```typescript
class CounterComponent {
  constructor(props) {
    this.props = props;
    this.state = { count: props.initialCount || 0 };
  }

  increment() {
    this.state.count++;
    this.forceUpdate();
  }

  render() {
    return `
      <div class="counter">
        <p>Count: ${this.state.count}</p>
        <button onclick="this.increment()">Increment</button>
      </div>
    `;
  }
}

const counterDefinition = {
  name: 'Counter',
  description: 'Interactive counter component',
  version: '1.1.1',
  type: 'class',
  props: {
    type: 'object',
    properties: {
      initialCount: { type: 'number', default: 0 }
    }
  },
  render: CounterComponent
};
```

### Static Components

Simple HTML/text components without dynamic behavior.

```typescript
const FooterComponent = {
  name: 'Footer',
  description: 'Static footer component',
  version: '1.1.1',
  type: 'static',
  props: {
    type: 'object',
    properties: {
      year: { type: 'number' },
      company: { type: 'string' }
    },
    required: ['company']
  },
  render: (props) => {
    const year = props.year || new Date().getFullYear();
    return `
      <footer class="site-footer">
        <p>&copy; ${year} ${props.company}. All rights reserved.</p>
      </footer>
    `;
  }
};
```

### Interactive Components

Components with user interaction capabilities.

```typescript
const SearchForm = {
  name: 'SearchForm',
  description: 'Interactive search form',
  version: '1.1.1',
  type: 'interactive',
  props: {
    type: 'object',
    properties: {
      placeholder: { type: 'string', default: 'Search...' },
      action: { type: 'string' },
      method: { type: 'string', default: 'GET' }
    },
    required: ['action']
  },
  render: (props) => {
    return `
      <form class="search-form" action="${props.action}" method="${props.method}">
        <input 
          type="text" 
          name="query" 
          placeholder="${props.placeholder}"
          required
        />
        <button type="submit">Search</button>
      </form>
    `;
  },
  interactions: {
    onSubmit: (event, props) => {
      // Handle form submission
      const formData = new FormData(event.target);
      const query = formData.get('query');
      // Process search query
    }
  }
};
```

## Props and Data Flow

### Prop Validation

Components use JSON Schema for prop validation:

```typescript
const props = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Component title'
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          active: { type: 'boolean', default: true }
        },
        required: ['id', 'name']
      },
      minItems: 0,
      maxItems: 50
    },
    config: {
      type: 'object',
      properties: {
        theme: { type: 'string', enum: ['light', 'dark'] },
        showIcons: { type: 'boolean', default: true }
      }
    }
  },
  required: ['title']
};
```

### Default Props

```typescript
const componentWithDefaults = {
  name: 'ProductCard',
  // ... other properties
  props: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      price: { type: 'number' },
      currency: { type: 'string', default: 'USD' },
      showDiscount: { type: 'boolean', default: false },
      rating: { type: 'number', minimum: 0, maximum: 5, default: 0 }
    },
    required: ['name', 'price']
  },
  render: (props) => {
    // Props will include defaults for missing values
    return `
      <div class="product-card">
        <h3>${props.name}</h3>
        <p class="price">${props.price} ${props.currency}</p>
        ${props.showDiscount ? '<span class="discount">On Sale!</span>' : ''}
        <div class="rating">Rating: ${props.rating}/5</div>
      </div>
    `;
  }
};
```

## Lifecycle Methods

### Component Lifecycle

For class components, the following lifecycle methods are available:

```typescript
class LifecycleComponent {
  constructor(props) {
    this.props = props;
    this.state = {};
  }

  // Called before component is rendered
  componentWillMount() {
    console.log('Component will mount');
  }

  // Called after component is rendered
  componentDidMount() {
    console.log('Component did mount');
    // Initialize event listeners, fetch data, etc.
  }

  // Called when props change
  componentWillReceiveProps(nextProps) {
    console.log('Component will receive props:', nextProps);
  }

  // Called before component updates
  componentWillUpdate(nextProps, nextState) {
    console.log('Component will update');
  }

  // Called after component updates
  componentDidUpdate(prevProps, prevState) {
    console.log('Component did update');
  }

  // Called before component is unmounted
  componentWillUnmount() {
    console.log('Component will unmount');
    // Clean up event listeners, timers, etc.
  }

  render() {
    return '<div>Lifecycle Component</div>';
  }
}
```

## Examples

### Simple Card Component

```typescript
const SimpleCard = {
  name: 'SimpleCard',
  description: 'A simple card component',
  version: '1.1.1',
  type: 'functional',
  props: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      content: { type: 'string' },
      imageUrl: { type: 'string', format: 'uri' }
    },
    required: ['title', 'content']
  },
  render: (props) => {
    return `
      <div class="simple-card">
        ${props.imageUrl ? `<img src="${props.imageUrl}" alt="${props.title}" />` : ''}
        <div class="card-content">
          <h3>${props.title}</h3>
          <p>${props.content}</p>
        </div>
      </div>
    `;
  },
  styles: `
    .simple-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      margin: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .simple-card img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 4px;
    }
    .card-content h3 {
      margin: 8px 0;
      color: #333;
    }
  `
};
```

### Data List Component

```typescript
const DataList = {
  name: 'DataList',
  description: 'Displays a list of data items',
  version: '1.1.1',
  type: 'functional',
  props: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            metadata: { type: 'object' }
          },
          required: ['id', 'title']
        }
      },
      emptyMessage: { type: 'string', default: 'No items found' },
      showMetadata: { type: 'boolean', default: false }
    },
    required: ['items']
  },
  render: (props) => {
    if (!props.items || props.items.length === 0) {
      return `<div class="empty-state">${props.emptyMessage}</div>`;
    }

    const itemsHtml = props.items.map(item => `
      <div class="data-item" data-id="${item.id}">
        <h4>${item.title}</h4>
        ${item.description ? `<p>${item.description}</p>` : ''}
        ${props.showMetadata && item.metadata ? `
          <div class="metadata">
            ${Object.entries(item.metadata).map(([key, value]) => 
              `<span class="meta-item"><strong>${key}:</strong> ${value}</span>`
            ).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    return `
      <div class="data-list">
        <div class="list-header">
          <span class="item-count">${props.items.length} items</span>
        </div>
        <div class="list-items">
          ${itemsHtml}
        </div>
      </div>
    `;
  }
};
```

### Interactive Form Component

```typescript
const ContactForm = {
  name: 'ContactForm',
  description: 'Interactive contact form',
  version: '1.1.1',
  type: 'interactive',
  props: {
    type: 'object',
    properties: {
      action: { type: 'string', format: 'uri' },
      method: { type: 'string', enum: ['GET', 'POST'], default: 'POST' },
      fields: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            label: { type: 'string' },
            type: { type: 'string', enum: ['text', 'email', 'tel', 'textarea'] },
            required: { type: 'boolean', default: false },
            placeholder: { type: 'string' }
          },
          required: ['name', 'label', 'type']
        }
      }
    },
    required: ['action', 'fields']
  },
  render: (props) => {
    const fieldsHtml = props.fields.map(field => {
      const inputType = field.type === 'textarea' ? 'textarea' : 'input';
      const typeAttr = field.type !== 'textarea' ? `type="${field.type}"` : '';
      const requiredAttr = field.required ? 'required' : '';
      const placeholderAttr = field.placeholder ? `placeholder="${field.placeholder}"` : '';
      
      return `
        <div class="form-field">
          <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
          ${inputType === 'textarea' ? 
            `<textarea name="${field.name}" id="${field.name}" ${requiredAttr} ${placeholderAttr}></textarea>` :
            `<input ${typeAttr} name="${field.name}" id="${field.name}" ${requiredAttr} ${placeholderAttr} />`
          }
        </div>
      `;
    }).join('');

    return `
      <form class="contact-form" action="${props.action}" method="${props.method}">
        ${fieldsHtml}
        <div class="form-actions">
          <button type="submit">Send Message</button>
          <button type="reset">Clear</button>
        </div>
      </form>
    `;
  },
  interactions: {
    onSubmit: async (event, props) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      
      try {
        const response = await fetch(props.action, {
          method: props.method,
          body: formData
        });
        
        if (response.ok) {
          // Show success message
          event.target.innerHTML = '<div class="success">Message sent successfully!</div>';
        } else {
          throw new Error('Failed to send message');
        }
      } catch (error) {
        // Show error message
        console.error('Form submission error:', error);
      }
    }
  }
};
```

## Best Practices

### 1. Component Design
- Keep components focused on a single responsibility
- Use descriptive names that indicate purpose
- Design for reusability across different contexts
- Follow consistent naming conventions

### 2. Props Management
- Always validate props with JSON Schema
- Provide sensible defaults for optional props
- Use clear, descriptive property names
- Group related props into objects when appropriate

### 3. Performance
- Minimize DOM manipulation in render functions
- Use efficient string concatenation or template literals
- Avoid heavy computations in render methods
- Cache expensive operations when possible

### 4. Accessibility
- Include proper ARIA attributes
- Ensure keyboard navigation support
- Use semantic HTML elements
- Provide alternative text for images

```typescript
// Good accessibility example
const AccessibleButton = {
  name: 'AccessibleButton',
  render: (props) => {
    return `
      <button 
        type="${props.type || 'button'}"
        aria-label="${props.ariaLabel || props.text}"
        ${props.disabled ? 'disabled aria-disabled="true"' : ''}
        class="btn ${props.variant || 'primary'}"
      >
        ${props.icon ? `<span class="icon" aria-hidden="true">${props.icon}</span>` : ''}
        <span>${props.text}</span>
      </button>
    `;
  }
};
```

### 5. Error Handling
- Gracefully handle missing or invalid props
- Provide fallback content for error states
- Log errors appropriately for debugging

```typescript
const RobustComponent = {
  name: 'RobustComponent',
  render: (props) => {
    try {
      // Validate required props
      if (!props.data) {
        return '<div class="error">No data provided</div>';
      }

      // Render component
      return `<div class="content">${props.data}</div>`;
    } catch (error) {
      console.error('Component render error:', error);
      return '<div class="error">Failed to render component</div>';
    }
  }
};
```

### 6. Testing
- Write unit tests for component logic
- Test with various prop combinations
- Verify accessibility features
- Test error conditions

## Related Documentation

- [Intents API](./intents.md) - Learn about intent definitions
- [Core API](./core.md) - Understand the core server functionality
- [Middleware](./middleware.md) - Add middleware to your components
- [Examples](../examples/basic.md) - See practical examples
