# Framework Integration Examples

This guide demonstrates how to integrate IXP Server with popular web frameworks and platforms.

## Table of Contents

- [React Integration](#react-integration)
- [Vue.js Integration](#vuejs-integration)
- [Angular Integration](#angular-integration)
- [Next.js Integration](#nextjs-integration)
- [Express.js Integration](#expressjs-integration)
- [NestJS Integration](#nestjs-integration)
- [Svelte Integration](#svelte-integration)
- [Mobile Integration](#mobile-integration)

## React Integration

### Setup and Configuration

```bash
# Install dependencies
npm install ixp-server-client react react-dom
npm install -D @types/react @types/react-dom
```

### IXP Client Hook

```typescript
// hooks/useIXPClient.ts
import { useState, useEffect, useCallback } from 'react';
import { IXPClient, IXPResponse } from 'ixp-server-client';

interface UseIXPClientOptions {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
}

interface IXPState {
  loading: boolean;
  error: string | null;
  response: IXPResponse | null;
}

export function useIXPClient(options: UseIXPClientOptions) {
  const [client] = useState(() => new IXPClient(options));
  const [state, setState] = useState<IXPState>({
    loading: false,
    error: null,
    response: null
  });
  
  const sendIntent = useCallback(async (intent: string, parameters?: any) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await client.sendIntent(intent, parameters);
      setState({
        loading: false,
        error: null,
        response
      });
      return response;
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        response: null
      });
      throw error;
    }
  }, [client]);
  
  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      response: null
    });
  }, []);
  
  return {
    client,
    ...state,
    sendIntent,
    reset
  };
}
```

### React Component Renderer

```typescript
// components/IXPComponentRenderer.tsx
import React from 'react';
import { IXPComponent } from 'ixp-server-client';

interface IXPComponentRendererProps {
  component: IXPComponent;
  onAction?: (action: string, data: any) => void;
}

export const IXPComponentRenderer: React.FC<IXPComponentRendererProps> = ({
  component,
  onAction
}) => {
  const handleAction = (action: string, data: any) => {
    onAction?.(action, data);
  };
  
  switch (component.name) {
    case 'product-card':
      return <ProductCard {...component.props} onAction={handleAction} />;
    
    case 'order-status':
      return <OrderStatus {...component.props} onAction={handleAction} />;
    
    case 'chat-message':
      return <ChatMessage {...component.props} onAction={handleAction} />;
    
    case 'form':
      return <DynamicForm {...component.props} onAction={handleAction} />;
    
    case 'data-table':
      return <DataTable {...component.props} onAction={handleAction} />;
    
    default:
      return <GenericComponent component={component} onAction={handleAction} />;
  }
};

// Product Card Component
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    description?: string;
    inStock: boolean;
  };
  onAction: (action: string, data: any) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAction }) => {
  return (
    <div className="product-card">
      <img 
        src={product.imageUrl} 
        alt={product.name}
        className="product-image"
      />
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}
        <div className="product-price">${product.price.toFixed(2)}</div>
        <div className="product-actions">
          <button
            className="btn btn-primary"
            disabled={!product.inStock}
            onClick={() => onAction('add-to-cart', { productId: product.id })}
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onAction('view-details', { productId: product.id })}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

// Generic Component Renderer
const GenericComponent: React.FC<{
  component: IXPComponent;
  onAction: (action: string, data: any) => void;
}> = ({ component, onAction }) => {
  return (
    <div className={`ixp-component ixp-${component.name}`}>
      <h4>Component: {component.name}</h4>
      <pre>{JSON.stringify(component.props, null, 2)}</pre>
      <button onClick={() => onAction('generic-action', component.props)}>
        Trigger Action
      </button>
    </div>
  );
};
```

### Chat Interface Example

```typescript
// components/ChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useIXPClient } from '../hooks/useIXPClient';
import { IXPComponentRenderer } from './IXPComponentRenderer';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  components?: any[];
  timestamp: Date;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { sendIntent, loading, error } = useIXPClient({
    baseURL: process.env.REACT_APP_IXP_SERVER_URL || 'http://localhost:3000',
    apiKey: process.env.REACT_APP_IXP_API_KEY
  });
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    try {
      const response = await sendIntent('chat', { message: input });
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.message || 'I received your message.',
        components: response.components,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  const handleComponentAction = async (action: string, data: any) => {
    try {
      const response = await sendIntent('handle-action', { action, data });
      
      if (response.message) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: response.message,
          components: response.components,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error('Action error:', err);
    }
  };
  
  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>IXP Assistant</h2>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message message-${message.type}`}>
            <div className="message-content">
              {message.content}
            </div>
            
            {message.components && (
              <div className="message-components">
                {message.components.map((component, index) => (
                  <IXPComponentRenderer
                    key={index}
                    component={component}
                    onAction={handleComponentAction}
                  />
                ))}
              </div>
            )}
            
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="message message-assistant">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button onClick={handleSendMessage} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
    </div>
  );
};
```

## Vue.js Integration

### Vue Composition API

```typescript
// composables/useIXPClient.ts
import { ref, reactive } from 'vue';
import { IXPClient, IXPResponse } from 'ixp-server-client';

interface IXPClientOptions {
  baseURL: string;
  apiKey?: string;
}

export function useIXPClient(options: IXPClientOptions) {
  const client = new IXPClient(options);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const response = ref<IXPResponse | null>(null);
  
  const sendIntent = async (intent: string, parameters?: any) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await client.sendIntent(intent, parameters);
      response.value = result;
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  const reset = () => {
    loading.value = false;
    error.value = null;
    response.value = null;
  };
  
  return {
    client,
    loading,
    error,
    response,
    sendIntent,
    reset
  };
}
```

### Vue Component

```vue
<!-- components/IXPChat.vue -->
<template>
  <div class="ixp-chat">
    <div class="chat-header">
      <h2>IXP Assistant</h2>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['message', `message-${message.type}`]"
      >
        <div class="message-content">{{ message.content }}</div>
        
        <div v-if="message.components" class="message-components">
          <IXPComponentRenderer
            v-for="(component, index) in message.components"
            :key="index"
            :component="component"
            @action="handleComponentAction"
          />
        </div>
        
        <div class="message-timestamp">
          {{ formatTime(message.timestamp) }}
        </div>
      </div>
      
      <div v-if="loading" class="message message-assistant">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <input
        v-model="input"
        @keyup.enter="sendMessage"
        :disabled="loading"
        placeholder="Type your message..."
      />
      <button @click="sendMessage" :disabled="loading || !input.trim()">
        Send
      </button>
    </div>
    
    <div v-if="error" class="error-message">
      Error: {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { useIXPClient } from '../composables/useIXPClient';
import IXPComponentRenderer from './IXPComponentRenderer.vue';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  components?: any[];
  timestamp: Date;
}

const messages = ref<Message[]>([]);
const input = ref('');
const messagesContainer = ref<HTMLElement>();

const { sendIntent, loading, error } = useIXPClient({
  baseURL: import.meta.env.VITE_IXP_SERVER_URL || 'http://localhost:3000',
  apiKey: import.meta.env.VITE_IXP_API_KEY
});

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString();
};

const sendMessage = async () => {
  if (!input.value.trim() || loading.value) return;
  
  const userMessage: Message = {
    id: Date.now().toString(),
    type: 'user',
    content: input.value,
    timestamp: new Date()
  };
  
  messages.value.push(userMessage);
  const messageText = input.value;
  input.value = '';
  
  await scrollToBottom();
  
  try {
    const response = await sendIntent('chat', { message: messageText });
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: response.message || 'I received your message.',
      components: response.components,
      timestamp: new Date()
    };
    
    messages.value.push(assistantMessage);
    await scrollToBottom();
  } catch (err) {
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.',
      timestamp: new Date()
    };
    
    messages.value.push(errorMessage);
    await scrollToBottom();
  }
};

const handleComponentAction = async (action: string, data: any) => {
  try {
    const response = await sendIntent('handle-action', { action, data });
    
    if (response.message) {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: response.message,
        components: response.components,
        timestamp: new Date()
      };
      
      messages.value.push(assistantMessage);
      await scrollToBottom();
    }
  } catch (err) {
    console.error('Action error:', err);
  }
};

onMounted(() => {
  // Add welcome message
  messages.value.push({
    id: '0',
    type: 'assistant',
    content: 'Hello! How can I help you today?',
    timestamp: new Date()
  });
});
</script>
```

## Angular Integration

### IXP Service

```typescript
// services/ixp.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { IXPClient, IXPResponse } from 'ixp-server-client';

interface IXPState {
  loading: boolean;
  error: string | null;
  response: IXPResponse | null;
}

@Injectable({
  providedIn: 'root'
})
export class IXPService {
  private client: IXPClient;
  private stateSubject = new BehaviorSubject<IXPState>({
    loading: false,
    error: null,
    response: null
  });
  
  public state$ = this.stateSubject.asObservable();
  
  constructor() {
    this.client = new IXPClient({
      baseURL: environment.ixpServerUrl,
      apiKey: environment.ixpApiKey
    });
  }
  
  sendIntent(intent: string, parameters?: any): Observable<IXPResponse> {
    this.updateState({ loading: true, error: null });
    
    return new Observable(observer => {
      this.client.sendIntent(intent, parameters)
        .then(response => {
          this.updateState({ loading: false, response });
          observer.next(response);
          observer.complete();
        })
        .catch(error => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.updateState({ loading: false, error: errorMessage });
          observer.error(error);
        });
    });
  }
  
  reset(): void {
    this.stateSubject.next({
      loading: false,
      error: null,
      response: null
    });
  }
  
  private updateState(updates: Partial<IXPState>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...updates });
  }
}
```

## Express.js Integration

### IXP Middleware

```typescript
// middleware/ixp.ts
import { Request, Response, NextFunction } from 'express';
import { IXPServer } from '@toopi/ixp-server-sdk';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      ixp?: IXPServer;
    }
  }
}

export function createIXPMiddleware(ixpServer: IXPServer) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.ixp = ixpServer;
    next();
  };
}

export function ixpHandler() {
  return async (req: Request, res: Response) => {
    try {
      const { intent, parameters } = req.body;
      const intentName = req.params.intent || intent;
      
      if (!intentName) {
        return res.status(400).json({
          error: 'Intent name is required'
        });
      }
      
      if (!req.ixp) {
        return res.status(500).json({
          error: 'IXP server not initialized'
        });
      }
      
      const response = await req.ixp.render(intentName, parameters || {});
      
      res.json({
        success: true,
        component: response,
        metadata: {
          intent: intentName,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('IXP handler error:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
```

### Express App Setup

```typescript
// app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { IXPServer } from '@toopi/ixp-server-sdk';
import { createIXPMiddleware, ixpHandler } from './middleware/ixp';
import { authMiddleware } from './middleware/auth';

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
app.use(authMiddleware);

// Create and configure IXP server
const ixpServer = new IXPServer({
  port: 3001, // Different port for IXP server
  cors: { origin: '*' }
});

// Register intents
ixpServer.registerIntent({
  name: 'chat',
  description: 'Handle chat messages',
  parameters: {
    type: 'object',
    properties: {
      message: { type: 'string' }
    },
    required: ['message']
  },
  component: 'ChatResponse'
});

ixpServer.registerIntent({
  name: 'product-search',
  description: 'Search for products',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      category: { type: 'string' },
      limit: { type: 'number', default: 10 }
    },
    required: ['query']
  },
  component: 'ProductList'
});

// Register components
ixpServer.registerComponent({
  name: 'ChatResponse',
  description: 'Display chat response',
  props: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      timestamp: { type: 'string' }
    },
    required: ['message']
  }
});

ixpServer.registerComponent({
  name: 'ProductList',
  description: 'Display list of products',
  props: {
    type: 'object',
    properties: {
      products: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            imageUrl: { type: 'string' }
          }
        }
      }
    },
    required: ['products']
  }
});

// Add IXP middleware
app.use(createIXPMiddleware(ixpServer));

// IXP routes
app.post('/api/ixp', ixpHandler());
app.post('/api/ixp/:intent', ixpHandler());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    ixp: {
      status: 'running'
    }
  });
});

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 3000;

// Start both Express and IXP servers
Promise.all([
  ixpServer.start(),
  new Promise<void>((resolve) => {
    app.listen(PORT, () => {
      console.log(`Express server running on port ${PORT}`);
      resolve();
    });
  })
]).then(() => {
  console.log('Both servers started successfully');
}).catch((error) => {
  console.error('Failed to start servers:', error);
  process.exit(1);
});

export default app;
```

## NestJS Integration

### IXP Module

```typescript
// ixp/ixp.module.ts
import { Module, DynamicModule } from '@nestjs/common';
import { IXPService } from './ixp.service';
import { IXPController } from './ixp.controller';
import { IXPConfigOptions } from './interfaces/ixp-config.interface';

@Module({})
export class IXPModule {
  static forRoot(options: IXPConfigOptions): DynamicModule {
    return {
      module: IXPModule,
      providers: [
        {
          provide: 'IXP_CONFIG',
          useValue: options
        },
        IXPService
      ],
      controllers: [IXPController],
      exports: [IXPService]
    };
  }
}
```

### IXP Service

```typescript
// ixp/ixp.service.ts
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { IXPServer } from '@toopi/ixp-server-sdk';
import { IXPConfigOptions } from './interfaces/ixp-config.interface';

@Injectable()
export class IXPService implements OnModuleInit {
  private ixpServer: IXPServer;
  
  constructor(
    @Inject('IXP_CONFIG') private config: IXPConfigOptions
  ) {}
  
  async onModuleInit() {
    this.ixpServer = new IXPServer(this.config.serverConfig);
    
    // Register intents and components from config
    if (this.config.intents) {
      for (const intent of this.config.intents) {
        this.ixpServer.registerIntent(intent);
      }
    }
    
    if (this.config.components) {
      for (const component of this.config.components) {
        this.ixpServer.registerComponent(component);
      }
    }
    
    await this.ixpServer.start();
    console.log('IXP Server initialized in NestJS');
  }
  
  async renderComponent(componentName: string, props: Record<string, any>) {
    return this.ixpServer.render(componentName, props);
  }
  
  getServer(): IXPServer {
    return this.ixpServer;
  }
}
```

### IXP Controller

```typescript
// ixp/ixp.controller.ts
import { Controller, Post, Body, Req, Res, Param } from '@nestjs/common';
import { Request, Response } from 'express';
import { IXPService } from './ixp.service';

@Controller('api/ixp')
export class IXPController {
  constructor(private readonly ixpService: IXPService) {}
  
  @Post()
  async processIntent(
    @Body() body: { intent: string; parameters?: any },
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const { intent, parameters } = body;
      
      const response = await this.ixpService.renderComponent(
        intent,
        parameters || {}
      );
      
      res.json({
        success: true,
        component: response,
        metadata: {
          intent,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('IXP processing error:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  @Post(':intent')
  async processNamedIntent(
    @Param('intent') intent: string,
    @Body() parameters: any,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const response = await this.ixpService.renderComponent(
        intent,
        parameters || {}
      );
      
      res.json({
        success: true,
        component: response,
        metadata: {
          intent,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('IXP processing error:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
```

## Mobile Integration

### React Native

```typescript
// hooks/useIXPClient.ts
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface IXPClientConfig {
  baseURL: string;
  apiKey?: string;
}

interface IXPResponse {
  success: boolean;
  message?: string;
  data?: any;
  components?: any[];
  error?: string;
}

export function useIXPClient(config: IXPClientConfig) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sendIntent = useCallback(async (
    intent: string,
    parameters?: any
  ): Promise<IXPResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      // Get auth token from storage
      const token = await AsyncStorage.getItem('auth_token');
      
      const response = await fetch(`${config.baseURL}/api/ixp/${intent}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'X-API-Key': config.apiKey }),
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(parameters || {})
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [config]);
  
  return {
    sendIntent,
    loading,
    error
  };
}
```

### Flutter Integration

```dart
// lib/services/ixp_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class IXPService {
  final String baseUrl;
  final String? apiKey;
  
  IXPService({
    required this.baseUrl,
    this.apiKey,
  });
  
  Future<Map<String, dynamic>> sendIntent(
    String intent,
    Map<String, dynamic>? parameters,
  ) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      
      final headers = {
        'Content-Type': 'application/json',
        if (apiKey != null) 'X-API-Key': apiKey!,
        if (token != null) 'Authorization': 'Bearer $token',
      };
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/ixp/$intent'),
        headers: headers,
        body: jsonEncode(parameters ?? {}),
      );
      
      if (response.statusCode != 200) {
        throw Exception('HTTP ${response.statusCode}: ${response.reasonPhrase}');
      }
      
      return jsonDecode(response.body);
    } catch (e) {
      throw Exception('IXP request failed: $e');
    }
  }
}
```

This comprehensive framework integration guide demonstrates how to seamlessly integrate IXP Server with popular web frameworks, providing developers with flexible options for building intelligent applications across different technology stacks.