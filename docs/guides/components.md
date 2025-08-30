# Building Components Guide

This guide covers how to build and integrate components with the IXP Server SDK using different frameworks and approaches.

## Table of Contents

- [Component Overview](#component-overview)
- [React Components](#react-components)
- [Vue Components](#vue-components)
- [Vanilla JavaScript Components](#vanilla-javascript-components)
- [Component Registration](#component-registration)
- [Props and Data Flow](#props-and-data-flow)
- [Component Lifecycle](#component-lifecycle)
- [State Management](#state-management)
- [Event Handling](#event-handling)
- [Styling Components](#styling-components)
- [Testing Components](#testing-components)
- [Best Practices](#best-practices)

## Component Overview

Components in IXP Server are reusable UI elements that can be rendered as part of intent responses. They can be built using various frameworks or vanilla JavaScript and are registered with the server for use in intent handlers.

### Component Types

- **Functional Components**: Simple, stateless components
- **Class Components**: Stateful components with lifecycle methods
- **Static Components**: Pre-rendered HTML/JSON components
- **Interactive Components**: Components with client-side interactivity

## React Components

### Basic React Component

```typescript
import React from 'react';
import { ComponentProps } from 'ixp-server';

interface WeatherCardProps extends ComponentProps {
  temperature: number;
  location: string;
  condition: string;
  humidity?: number;
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  temperature,
  location,
  condition,
  humidity
}) => {
  return (
    <div className="weather-card">
      <h2>{location}</h2>
      <div className="temperature">{temperature}°C</div>
      <div className="condition">{condition}</div>
      {humidity && (
        <div className="humidity">Humidity: {humidity}%</div>
      )}
    </div>
  );
};

export default WeatherCard;
```

### Interactive React Component

```typescript
import React, { useState, useCallback } from 'react';
import { ComponentProps, useIXPContext } from 'ixp-server';

interface CounterProps extends ComponentProps {
  initialValue?: number;
  step?: number;
}

const Counter: React.FC<CounterProps> = ({
  initialValue = 0,
  step = 1
}) => {
  const [count, setCount] = useState(initialValue);
  const { emit } = useIXPContext();

  const increment = useCallback(() => {
    const newCount = count + step;
    setCount(newCount);
    emit('counter-changed', { count: newCount });
  }, [count, step, emit]);

  const decrement = useCallback(() => {
    const newCount = count - step;
    setCount(newCount);
    emit('counter-changed', { count: newCount });
  }, [count, step, emit]);

  return (
    <div className="counter">
      <button onClick={decrement}>-</button>
      <span className="count">{count}</span>
      <button onClick={increment}>+</button>
    </div>
  );
};

export default Counter;
```

### React Component with Hooks

```typescript
import React, { useEffect, useState } from 'react';
import { ComponentProps, useIXPData } from 'ixp-server';

interface UserProfileProps extends ComponentProps {
  userId: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { fetchData } = useIXPData();

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const userData = await fetchData(`/users/${userId}`);
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId, fetchData]);

  if (loading) {
    return <div className="loading">Loading user profile...</div>;
  }

  if (!user) {
    return <div className="error">User not found</div>;
  }

  return (
    <div className="user-profile">
      <img src={user.avatar} alt={user.name} className="avatar" />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <div className="bio">{user.bio}</div>
    </div>
  );
};

export default UserProfile;
```

## Vue Components

### Basic Vue Component

```vue
<template>
  <div class="product-card">
    <img :src="image" :alt="name" class="product-image" />
    <h3>{{ name }}</h3>
    <p class="price">${{ price }}</p>
    <p class="description">{{ description }}</p>
    <button @click="addToCart" :disabled="!inStock">
      {{ inStock ? 'Add to Cart' : 'Out of Stock' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ComponentProps } from 'ixp-server';

interface ProductCardProps extends ComponentProps {
  name: string;
  price: number;
  description: string;
  image: string;
  inStock: boolean;
}

const props = defineProps<ProductCardProps>();
const emit = defineEmits<{
  'add-to-cart': [productId: string];
}>();

const addToCart = () => {
  if (props.inStock) {
    emit('add-to-cart', props.id);
  }
};
</script>

<style scoped>
.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  max-width: 300px;
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
}

.price {
  font-size: 1.2em;
  font-weight: bold;
  color: #2c5aa0;
}
</style>
```

### Vue Component with Composition API

```vue
<template>
  <div class="todo-list">
    <h3>Todo List</h3>
    <form @submit.prevent="addTodo">
      <input
        v-model="newTodo"
        placeholder="Add a new todo..."
        required
      />
      <button type="submit">Add</button>
    </form>
    <ul>
      <li
        v-for="todo in todos"
        :key="todo.id"
        :class="{ completed: todo.completed }"
      >
        <input
          type="checkbox"
          v-model="todo.completed"
          @change="updateTodo(todo)"
        />
        <span>{{ todo.text }}</span>
        <button @click="removeTodo(todo.id)">Remove</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ComponentProps, useIXPContext } from 'ixp-server';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoListProps extends ComponentProps {
  initialTodos?: Todo[];
}

const props = defineProps<TodoListProps>();
const { emit } = useIXPContext();

const newTodo = ref('');
const todos = reactive(props.initialTodos || []);

const addTodo = () => {
  const todo: Todo = {
    id: Date.now().toString(),
    text: newTodo.value,
    completed: false
  };
  todos.push(todo);
  newTodo.value = '';
  emit('todo-added', todo);
};

const updateTodo = (todo: Todo) => {
  emit('todo-updated', todo);
};

const removeTodo = (id: string) => {
  const index = todos.findIndex(todo => todo.id === id);
  if (index > -1) {
    const removed = todos.splice(index, 1)[0];
    emit('todo-removed', removed);
  }
};
</script>
```

## Vanilla JavaScript Components

### Basic Vanilla Component

```typescript
import { Component, ComponentProps } from 'ixp-server';

interface AlertProps extends ComponentProps {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  dismissible?: boolean;
}

class AlertComponent extends Component<AlertProps> {
  render() {
    const { message, type, dismissible = true } = this.props;
    
    return {
      type: 'div',
      className: `alert alert-${type}`,
      children: [
        {
          type: 'span',
          className: 'alert-message',
          textContent: message
        },
        ...(dismissible ? [{
          type: 'button',
          className: 'alert-close',
          textContent: '×',
          onclick: () => this.dismiss()
        }] : [])
      ]
    };
  }

  private dismiss() {
    this.emit('alert-dismissed', { message: this.props.message });
    this.destroy();
  }
}

export default AlertComponent;
```

### Interactive Vanilla Component

```typescript
import { Component, ComponentProps } from 'ixp-server';

interface TabsProps extends ComponentProps {
  tabs: Array<{
    id: string;
    label: string;
    content: string;
  }>;
  activeTab?: string;
}

class TabsComponent extends Component<TabsProps> {
  private activeTabId: string;

  constructor(props: TabsProps) {
    super(props);
    this.activeTabId = props.activeTab || props.tabs[0]?.id || '';
  }

  render() {
    const { tabs } = this.props;
    
    return {
      type: 'div',
      className: 'tabs-container',
      children: [
        {
          type: 'div',
          className: 'tabs-header',
          children: tabs.map(tab => ({
            type: 'button',
            className: `tab-button ${tab.id === this.activeTabId ? 'active' : ''}`,
            textContent: tab.label,
            onclick: () => this.setActiveTab(tab.id)
          }))
        },
        {
          type: 'div',
          className: 'tabs-content',
          children: tabs
            .filter(tab => tab.id === this.activeTabId)
            .map(tab => ({
              type: 'div',
              className: 'tab-panel',
              innerHTML: tab.content
            }))
        }
      ]
    };
  }

  private setActiveTab(tabId: string) {
    this.activeTabId = tabId;
    this.emit('tab-changed', { activeTab: tabId });
    this.update();
  }
}

export default TabsComponent;
```

## Component Registration

### Registering Components with the Server

```typescript
import { createIXPServer } from 'ixp-server';
import WeatherCard from './components/WeatherCard';
import Counter from './components/Counter';
import ProductCard from './components/ProductCard.vue';
import AlertComponent from './components/AlertComponent';

const server = createIXPServer({
  // Server configuration
});

// Register React components
server.registerComponent('weather-card', WeatherCard);
server.registerComponent('counter', Counter);

// Register Vue components
server.registerComponent('product-card', ProductCard);

// Register vanilla components
server.registerComponent('alert', AlertComponent);

// Register with configuration
server.registerComponent('user-profile', UserProfile, {
  cache: true,
  cacheTTL: 300, // 5 minutes
  preload: ['userId']
});
```

### Bulk Registration

```typescript
import * as components from './components';

// Register all components from a module
Object.entries(components).forEach(([name, component]) => {
  const componentName = name.toLowerCase().replace(/component$/, '');
  server.registerComponent(componentName, component);
});

// Or use a registration helper
const componentRegistry = {
  'weather-card': WeatherCard,
  'product-list': ProductList,
  'user-profile': UserProfile,
  'navigation': Navigation
};

server.registerComponents(componentRegistry);
```

## Props and Data Flow

### Defining Props Interface

```typescript
import { ComponentProps } from 'ixp-server';

// Base props that all components receive
interface BaseComponentProps extends ComponentProps {
  id: string;
  className?: string;
  style?: Record<string, string>;
}

// Specific component props
interface DataTableProps extends BaseComponentProps {
  data: Array<Record<string, any>>;
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    formatter?: (value: any) => string;
  }>;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
}
```

### Props Validation

```typescript
import { Component, validateProps } from 'ixp-server';

class DataTable extends Component<DataTableProps> {
  static propSchema = {
    data: { type: 'array', required: true },
    columns: { type: 'array', required: true },
    pagination: {
      type: 'object',
      properties: {
        page: { type: 'number', minimum: 1 },
        pageSize: { type: 'number', minimum: 1, maximum: 100 },
        total: { type: 'number', minimum: 0 }
      }
    }
  };

  constructor(props: DataTableProps) {
    super(props);
    
    // Validate props
    const validation = validateProps(props, DataTable.propSchema);
    if (!validation.valid) {
      throw new Error(`Invalid props: ${validation.errors.join(', ')}`);
    }
  }
}
```

## Component Lifecycle

### Lifecycle Methods

```typescript
class LifecycleComponent extends Component {
  // Called when component is created
  onCreate() {
    console.log('Component created');
    this.setupEventListeners();
  }

  // Called before component is rendered
  onBeforeRender() {
    console.log('About to render');
    this.prepareData();
  }

  // Called after component is rendered
  onAfterRender() {
    console.log('Component rendered');
    this.initializeInteractivity();
  }

  // Called when props change
  onPropsChange(newProps: any, oldProps: any) {
    console.log('Props changed', { newProps, oldProps });
    if (newProps.data !== oldProps.data) {
      this.refreshData();
    }
  }

  // Called when component is destroyed
  onDestroy() {
    console.log('Component destroyed');
    this.cleanup();
  }

  private setupEventListeners() {
    // Setup event listeners
  }

  private prepareData() {
    // Prepare data for rendering
  }

  private initializeInteractivity() {
    // Initialize client-side interactions
  }

  private refreshData() {
    // Refresh component data
  }

  private cleanup() {
    // Cleanup resources
  }
}
```

## State Management

### Local State

```typescript
class StatefulComponent extends Component {
  private state = {
    loading: false,
    data: null,
    error: null
  };

  async loadData() {
    this.setState({ loading: true, error: null });
    
    try {
      const data = await this.fetchData();
      this.setState({ data, loading: false });
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  }

  private setState(newState: Partial<typeof this.state>) {
    this.state = { ...this.state, ...newState };
    this.update(); // Trigger re-render
  }

  render() {
    const { loading, data, error } = this.state;
    
    if (loading) {
      return { type: 'div', textContent: 'Loading...' };
    }
    
    if (error) {
      return { type: 'div', className: 'error', textContent: error };
    }
    
    return {
      type: 'div',
      children: [
        // Render data
      ]
    };
  }
}
```

### Global State

```typescript
import { useStore } from 'ixp-server';

class ConnectedComponent extends Component {
  private store = useStore();
  private unsubscribe: () => void;

  onCreate() {
    // Subscribe to store changes
    this.unsubscribe = this.store.subscribe((state) => {
      this.onStoreChange(state);
    });
  }

  onDestroy() {
    // Unsubscribe from store
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private onStoreChange(state: any) {
    // Handle store state changes
    this.update();
  }

  private updateStore(action: any) {
    this.store.dispatch(action);
  }
}
```

## Event Handling

### Component Events

```typescript
class EventComponent extends Component {
  render() {
    return {
      type: 'div',
      children: [
        {
          type: 'button',
          textContent: 'Click me',
          onclick: this.handleClick.bind(this)
        },
        {
          type: 'input',
          type: 'text',
          onchange: this.handleInputChange.bind(this)
        }
      ]
    };
  }

  private handleClick(event: Event) {
    console.log('Button clicked');
    this.emit('button-clicked', { timestamp: Date.now() });
  }

  private handleInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.emit('input-changed', { value: target.value });
  }
}
```

### Custom Events

```typescript
class CustomEventComponent extends Component {
  private emitCustomEvent(data: any) {
    // Emit to parent components
    this.emit('custom-event', data);
    
    // Emit to global event bus
    this.server.emit('global-custom-event', data);
    
    // Emit to specific components
    this.server.emitToComponent('target-component', 'message', data);
  }

  onCreate() {
    // Listen for events from other components
    this.on('external-event', this.handleExternalEvent.bind(this));
    
    // Listen for global events
    this.server.on('global-event', this.handleGlobalEvent.bind(this));
  }

  private handleExternalEvent(data: any) {
    console.log('Received external event:', data);
  }

  private handleGlobalEvent(data: any) {
    console.log('Received global event:', data);
  }
}
```

## Styling Components

### CSS-in-JS

```typescript
class StyledComponent extends Component {
  private getStyles() {
    return {
      container: {
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: '#f5f5f5',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      },
      title: {
        fontSize: '1.5em',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#333'
      },
      content: {
        lineHeight: '1.6',
        color: '#666'
      }
    };
  }

  render() {
    const styles = this.getStyles();
    
    return {
      type: 'div',
      style: styles.container,
      children: [
        {
          type: 'h2',
          style: styles.title,
          textContent: this.props.title
        },
        {
          type: 'div',
          style: styles.content,
          textContent: this.props.content
        }
      ]
    };
  }
}
```

### CSS Classes

```typescript
class CSSClassComponent extends Component {
  render() {
    const { variant = 'default', size = 'medium' } = this.props;
    
    return {
      type: 'div',
      className: `component component--${variant} component--${size}`,
      children: [
        // Component content
      ]
    };
  }

  // Include CSS in component
  static styles = `
    .component {
      padding: 16px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }
    
    .component--primary {
      background-color: #007bff;
      color: white;
    }
    
    .component--secondary {
      background-color: #6c757d;
      color: white;
    }
    
    .component--small {
      padding: 8px;
      font-size: 0.875em;
    }
    
    .component--large {
      padding: 24px;
      font-size: 1.125em;
    }
  `;
}
```

## Testing Components

### Unit Testing

```typescript
import { renderComponent, createMockServer } from 'ixp-server/testing';
import WeatherCard from '../WeatherCard';

describe('WeatherCard', () => {
  let server: any;

  beforeEach(() => {
    server = createMockServer();
  });

  it('should render weather information', () => {
    const props = {
      temperature: 25,
      location: 'New York',
      condition: 'Sunny'
    };

    const result = renderComponent(WeatherCard, props, server);
    
    expect(result).toContain('New York');
    expect(result).toContain('25°C');
    expect(result).toContain('Sunny');
  });

  it('should handle missing humidity', () => {
    const props = {
      temperature: 20,
      location: 'London',
      condition: 'Cloudy'
    };

    const result = renderComponent(WeatherCard, props, server);
    
    expect(result).not.toContain('Humidity');
  });

  it('should emit events on interaction', async () => {
    const props = { initialValue: 0 };
    const component = renderComponent(Counter, props, server);
    
    const eventSpy = jest.fn();
    component.on('counter-changed', eventSpy);
    
    // Simulate button click
    await component.click('.increment-button');
    
    expect(eventSpy).toHaveBeenCalledWith({ count: 1 });
  });
});
```

### Integration Testing

```typescript
import { createTestServer } from 'ixp-server/testing';

describe('Component Integration', () => {
  let server: any;

  beforeEach(async () => {
    server = createTestServer();
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('should render components in intent response', async () => {
    const response = await server.processIntent('get-weather', {
      location: 'Paris'
    });

    expect(response.components).toHaveLength(1);
    expect(response.components[0].type).toBe('weather-card');
    expect(response.components[0].props.location).toBe('Paris');
  });
});
```

## Best Practices

### Component Design

1. **Keep components focused**: Each component should have a single responsibility
2. **Make components reusable**: Design for reuse across different contexts
3. **Use TypeScript**: Leverage type safety for props and state
4. **Handle errors gracefully**: Implement proper error boundaries
5. **Optimize performance**: Use memoization and lazy loading when appropriate

### Props Management

1. **Define clear interfaces**: Use TypeScript interfaces for props
2. **Provide defaults**: Set sensible default values for optional props
3. **Validate props**: Implement runtime prop validation
4. **Keep props immutable**: Don't modify props directly
5. **Use composition**: Prefer composition over inheritance

### State Management

1. **Minimize state**: Keep component state as minimal as possible
2. **Lift state up**: Move shared state to parent components
3. **Use global state wisely**: Only use global state for truly global data
4. **Handle async state**: Properly manage loading and error states
5. **Avoid state mutations**: Always create new state objects

### Performance

1. **Lazy load components**: Load components only when needed
2. **Use caching**: Cache expensive computations and API calls
3. **Optimize renders**: Minimize unnecessary re-renders
4. **Bundle splitting**: Split large components into separate bundles
5. **Monitor performance**: Use profiling tools to identify bottlenecks

### Testing

1. **Test behavior, not implementation**: Focus on what the component does
2. **Use realistic data**: Test with data similar to production
3. **Test error cases**: Ensure components handle errors gracefully
4. **Mock dependencies**: Use mocks for external dependencies
5. **Test accessibility**: Ensure components are accessible to all users

This guide provides a comprehensive overview of building components with the IXP Server SDK. For more specific examples and advanced patterns, refer to the [Examples](../examples/) section of the documentation.