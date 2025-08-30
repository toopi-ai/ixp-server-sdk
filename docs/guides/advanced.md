# Advanced Guide

This guide covers advanced patterns, techniques, and architectural considerations for building sophisticated IXP Server applications.

## Table of Contents

- [Advanced Architecture Patterns](#advanced-architecture-patterns)
- [Custom Intent Resolution](#custom-intent-resolution)
- [Advanced Component Patterns](#advanced-component-patterns)
- [Middleware Composition](#middleware-composition)
- [Plugin Development](#plugin-development)
- [Performance Optimization](#performance-optimization)
- [Scalability Patterns](#scalability-patterns)
- [Advanced Security](#advanced-security)
- [Monitoring and Observability](#monitoring-and-observability)
- [Testing Strategies](#testing-strategies)
- [Deployment Patterns](#deployment-patterns)
- [Integration Patterns](#integration-patterns)

## Advanced Architecture Patterns

### Microservices Architecture

```typescript
// Service Registry Pattern
class ServiceRegistry {
  private services = new Map<string, ServiceInfo>();
  
  register(name: string, info: ServiceInfo) {
    this.services.set(name, {
      ...info,
      lastSeen: Date.now(),
      health: 'healthy'
    });
  }
  
  discover(name: string): ServiceInfo | null {
    return this.services.get(name) || null;
  }
  
  async healthCheck() {
    for (const [name, service] of this.services) {
      try {
        await fetch(`${service.url}/health`);
        service.health = 'healthy';
      } catch {
        service.health = 'unhealthy';
      }
    }
  }
}

// Distributed Intent Handler
class DistributedIntentHandler {
  constructor(
    private registry: ServiceRegistry,
    private loadBalancer: LoadBalancer
  ) {}
  
  async handleIntent(intent: string, params: any): Promise<any> {
    // Find services that can handle this intent
    const services = this.registry.findByCapability(intent);
    
    if (services.length === 0) {
      throw new Error(`No service found for intent: ${intent}`);
    }
    
    // Load balance the request
    const service = this.loadBalancer.select(services);
    
    // Forward the request
    return this.forwardRequest(service, intent, params);
  }
  
  private async forwardRequest(service: ServiceInfo, intent: string, params: any) {
    const response = await fetch(`${service.url}/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent, parameters: params })
    });
    
    if (!response.ok) {
      throw new Error(`Service ${service.name} returned ${response.status}`);
    }
    
    return response.json();
  }
}
```

### Event-Driven Architecture

```typescript
// Event Bus Implementation
class EventBus {
  private listeners = new Map<string, Set<EventListener>>();
  private middleware: EventMiddleware[] = [];
  
  on(event: string, listener: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }
  
  off(event: string, listener: EventListener) {
    this.listeners.get(event)?.delete(listener);
  }
  
  async emit(event: string, data: any, context?: EventContext) {
    const eventObj: Event = {
      name: event,
      data,
      timestamp: Date.now(),
      id: generateId(),
      context: context || {}
    };
    
    // Apply middleware
    for (const middleware of this.middleware) {
      await middleware(eventObj);
    }
    
    // Notify listeners
    const listeners = this.listeners.get(event) || new Set();
    const promises = Array.from(listeners).map(listener => 
      this.safeExecute(listener, eventObj)
    );
    
    await Promise.allSettled(promises);
  }
  
  private async safeExecute(listener: EventListener, event: Event) {
    try {
      await listener(event);
    } catch (error) {
      console.error(`Event listener error for ${event.name}:`, error);
      this.emit('error', { originalEvent: event, error });
    }
  }
}

// Intent Event Integration
class EventDrivenIntentHandler {
  constructor(
    private eventBus: EventBus,
    private intentHandler: IntentHandler
  ) {
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.eventBus.on('intent:before', this.beforeIntent.bind(this));
    this.eventBus.on('intent:after', this.afterIntent.bind(this));
    this.eventBus.on('intent:error', this.errorIntent.bind(this));
  }
  
  async handleIntent(intent: string, params: any, context: any) {
    const intentId = generateId();
    
    try {
      // Emit before event
      await this.eventBus.emit('intent:before', {
        intentId,
        intent,
        params,
        context
      });
      
      // Execute intent
      const result = await this.intentHandler(params, context);
      
      // Emit after event
      await this.eventBus.emit('intent:after', {
        intentId,
        intent,
        params,
        result,
        context
      });
      
      return result;
    } catch (error) {
      // Emit error event
      await this.eventBus.emit('intent:error', {
        intentId,
        intent,
        params,
        error,
        context
      });
      
      throw error;
    }
  }
  
  private async beforeIntent(event: Event) {
    // Log, validate, authenticate, etc.
    console.log(`Starting intent: ${event.data.intent}`);
  }
  
  private async afterIntent(event: Event) {
    // Log, cache, analytics, etc.
    console.log(`Completed intent: ${event.data.intent}`);
  }
  
  private async errorIntent(event: Event) {
    // Error handling, alerting, etc.
    console.error(`Intent error: ${event.data.intent}`, event.data.error);
  }
}
```

### CQRS (Command Query Responsibility Segregation)

```typescript
// Command and Query Separation
interface Command {
  type: string;
  payload: any;
  metadata?: any;
}

interface Query {
  type: string;
  parameters: any;
  metadata?: any;
}

class CommandBus {
  private handlers = new Map<string, CommandHandler>();
  
  register(commandType: string, handler: CommandHandler) {
    this.handlers.set(commandType, handler);
  }
  
  async execute(command: Command): Promise<void> {
    const handler = this.handlers.get(command.type);
    if (!handler) {
      throw new Error(`No handler for command: ${command.type}`);
    }
    
    await handler.handle(command);
  }
}

class QueryBus {
  private handlers = new Map<string, QueryHandler>();
  
  register(queryType: string, handler: QueryHandler) {
    this.handlers.set(queryType, handler);
  }
  
  async execute<T>(query: Query): Promise<T> {
    const handler = this.handlers.get(query.type);
    if (!handler) {
      throw new Error(`No handler for query: ${query.type}`);
    }
    
    return handler.handle(query);
  }
}

// CQRS Intent Handler
class CQRSIntentHandler {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus
  ) {}
  
  async handleIntent(intent: string, params: any): Promise<any> {
    // Determine if this is a command or query
    if (this.isCommand(intent)) {
      await this.commandBus.execute({
        type: intent,
        payload: params
      });
      
      return { success: true, message: 'Command executed' };
    } else {
      return this.queryBus.execute({
        type: intent,
        parameters: params
      });
    }
  }
  
  private isCommand(intent: string): boolean {
    const commandPrefixes = ['create', 'update', 'delete', 'set', 'add', 'remove'];
    return commandPrefixes.some(prefix => intent.startsWith(prefix));
  }
}
```

## Custom Intent Resolution

### Semantic Intent Matching

```typescript
import { encode } from 'sentence-transformers';

class SemanticIntentResolver {
  private intentEmbeddings = new Map<string, number[]>();
  private threshold = 0.8;
  
  async trainIntent(intent: Intent) {
    // Generate embeddings for intent examples
    const examples = intent.examples || [];
    const embeddings = await Promise.all(
      examples.map(example => encode(example))
    );
    
    // Average the embeddings
    const avgEmbedding = this.averageEmbeddings(embeddings);
    this.intentEmbeddings.set(intent.name, avgEmbedding);
  }
  
  async resolveIntent(userInput: string): Promise<string | null> {
    const inputEmbedding = await encode(userInput);
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [intentName, intentEmbedding] of this.intentEmbeddings) {
      const similarity = this.cosineSimilarity(inputEmbedding, intentEmbedding);
      
      if (similarity > bestScore && similarity >= this.threshold) {
        bestScore = similarity;
        bestMatch = intentName;
      }
    }
    
    return bestMatch;
  }
  
  private averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return [];
    
    const dimensions = embeddings[0].length;
    const result = new Array(dimensions).fill(0);
    
    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        result[i] += embedding[i];
      }
    }
    
    return result.map(sum => sum / embeddings.length);
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
```

### Multi-Stage Intent Resolution

```typescript
class MultiStageIntentResolver {
  private stages: IntentResolutionStage[] = [];
  
  addStage(stage: IntentResolutionStage) {
    this.stages.push(stage);
  }
  
  async resolve(input: string, context: any): Promise<IntentResolution> {
    let resolution: IntentResolution = {
      confidence: 0,
      intent: null,
      parameters: {},
      metadata: {}
    };
    
    for (const stage of this.stages) {
      const stageResult = await stage.resolve(input, context, resolution);
      
      // Merge results
      resolution = {
        confidence: Math.max(resolution.confidence, stageResult.confidence),
        intent: stageResult.intent || resolution.intent,
        parameters: { ...resolution.parameters, ...stageResult.parameters },
        metadata: { ...resolution.metadata, ...stageResult.metadata }
      };
      
      // Early exit if high confidence
      if (resolution.confidence >= 0.95) {
        break;
      }
    }
    
    return resolution;
  }
}

// Example stages
class KeywordStage implements IntentResolutionStage {
  private keywords = new Map<string, string[]>();
  
  async resolve(input: string, context: any, current: IntentResolution): Promise<IntentResolution> {
    const inputLower = input.toLowerCase();
    
    for (const [intent, words] of this.keywords) {
      const matches = words.filter(word => inputLower.includes(word));
      
      if (matches.length > 0) {
        const confidence = matches.length / words.length * 0.7; // Max 0.7 for keywords
        
        return {
          confidence,
          intent,
          parameters: {},
          metadata: { keywordMatches: matches }
        };
      }
    }
    
    return { confidence: 0, intent: null, parameters: {}, metadata: {} };
  }
}

class NLPStage implements IntentResolutionStage {
  constructor(private nlpService: NLPService) {}
  
  async resolve(input: string, context: any, current: IntentResolution): Promise<IntentResolution> {
    const result = await this.nlpService.analyze(input);
    
    return {
      confidence: result.confidence,
      intent: result.intent,
      parameters: result.entities,
      metadata: { nlpResult: result }
    };
  }
}

class ContextStage implements IntentResolutionStage {
  async resolve(input: string, context: any, current: IntentResolution): Promise<IntentResolution> {
    // Boost confidence based on context
    let confidenceBoost = 0;
    
    if (context.previousIntent && this.isRelated(current.intent, context.previousIntent)) {
      confidenceBoost += 0.1;
    }
    
    if (context.userProfile && this.matchesUserPreferences(current.intent, context.userProfile)) {
      confidenceBoost += 0.05;
    }
    
    return {
      ...current,
      confidence: Math.min(1.0, current.confidence + confidenceBoost),
      metadata: {
        ...current.metadata,
        contextBoost: confidenceBoost
      }
    };
  }
  
  private isRelated(intent1: string | null, intent2: string): boolean {
    // Implementation for checking intent relationships
    return false;
  }
  
  private matchesUserPreferences(intent: string | null, profile: any): boolean {
    // Implementation for checking user preferences
    return false;
  }
}
```

## Advanced Component Patterns

### Higher-Order Components

```typescript
// HOC for adding authentication
function withAuth<T extends ComponentProps>(WrappedComponent: Component<T>) {
  return {
    ...WrappedComponent,
    name: `WithAuth(${WrappedComponent.name})`,
    render: (props: T & { user?: User }) => {
      if (!props.user) {
        return {
          type: 'error',
          content: 'Authentication required',
          style: { color: 'red' }
        };
      }
      
      return WrappedComponent.render(props);
    }
  };
}

// HOC for adding loading states
function withLoading<T extends ComponentProps>(WrappedComponent: Component<T>) {
  return {
    ...WrappedComponent,
    name: `WithLoading(${WrappedComponent.name})`,
    render: (props: T & { loading?: boolean }) => {
      if (props.loading) {
        return {
          type: 'spinner',
          content: 'Loading...',
          style: { textAlign: 'center' }
        };
      }
      
      return WrappedComponent.render(props);
    }
  };
}

// HOC for error boundaries
function withErrorBoundary<T extends ComponentProps>(WrappedComponent: Component<T>) {
  return {
    ...WrappedComponent,
    name: `WithErrorBoundary(${WrappedComponent.name})`,
    render: (props: T) => {
      try {
        return WrappedComponent.render(props);
      } catch (error) {
        console.error(`Component ${WrappedComponent.name} error:`, error);
        
        return {
          type: 'error',
          content: 'Something went wrong',
          style: {
            padding: '16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '4px',
            color: '#dc2626'
          }
        };
      }
    }
  };
}

// Usage
const EnhancedWeatherCard = withErrorBoundary(
  withLoading(
    withAuth(weatherCardComponent)
  )
);
```

### Component Composition

```typescript
// Composable component system
class ComponentComposer {
  private components = new Map<string, Component>();
  
  register(component: Component) {
    this.components.set(component.name, component);
  }
  
  compose(composition: ComponentComposition): Component {
    return {
      name: composition.name,
      description: composition.description,
      props: this.mergeProps(composition.components),
      render: (props) => this.renderComposition(composition, props)
    };
  }
  
  private renderComposition(composition: ComponentComposition, props: any) {
    const children = composition.components.map(comp => {
      const component = this.components.get(comp.name);
      if (!component) {
        throw new Error(`Component not found: ${comp.name}`);
      }
      
      const componentProps = this.extractProps(props, comp.propMapping);
      return component.render(componentProps);
    });
    
    return {
      type: composition.layout || 'container',
      children,
      style: composition.style
    };
  }
  
  private mergeProps(components: ComponentRef[]): any {
    // Merge prop schemas from all components
    const merged = { type: 'object', properties: {}, required: [] };
    
    for (const comp of components) {
      const component = this.components.get(comp.name);
      if (component?.props) {
        Object.assign(merged.properties, component.props.properties);
        if (component.props.required) {
          merged.required.push(...component.props.required);
        }
      }
    }
    
    return merged;
  }
  
  private extractProps(allProps: any, mapping?: Record<string, string>): any {
    if (!mapping) return allProps;
    
    const extracted = {};
    for (const [componentProp, sourceProp] of Object.entries(mapping)) {
      extracted[componentProp] = allProps[sourceProp];
    }
    
    return extracted;
  }
}

// Usage
const composer = new ComponentComposer();

const dashboardComposition: ComponentComposition = {
  name: 'user-dashboard',
  description: 'User dashboard with weather and news',
  layout: 'grid',
  style: { gridTemplateColumns: '1fr 1fr', gap: '16px' },
  components: [
    {
      name: 'weather-card',
      propMapping: {
        location: 'userLocation',
        units: 'preferredUnits'
      }
    },
    {
      name: 'news-feed',
      propMapping: {
        category: 'newsCategory',
        limit: 'newsLimit'
      }
    }
  ]
};

const dashboardComponent = composer.compose(dashboardComposition);
```

## Middleware Composition

### Middleware Pipeline

```typescript
class MiddlewarePipeline {
  private middlewares: Middleware[] = [];
  
  use(middleware: Middleware) {
    this.middlewares.push(middleware);
    return this;
  }
  
  async execute(context: any, next?: () => Promise<void>): Promise<void> {
    let index = 0;
    
    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      
      index = i;
      
      const middleware = this.middlewares[i];
      
      if (!middleware) {
        if (next) {
          return next();
        }
        return;
      }
      
      return middleware.handler(context.req, context.res, () => dispatch(i + 1));
    };
    
    return dispatch(0);
  }
}

// Conditional middleware
class ConditionalMiddleware {
  constructor(
    private condition: (req: any, res: any) => boolean,
    private middleware: Middleware
  ) {}
  
  get handler() {
    return async (req: any, res: any, next: () => Promise<void>) => {
      if (this.condition(req, res)) {
        return this.middleware.handler(req, res, next);
      }
      return next();
    };
  }
}

// Middleware factory
class MiddlewareFactory {
  static createRateLimit(options: RateLimitOptions): Middleware {
    const store = new Map<string, { count: number; resetTime: number }>();
    
    return {
      name: 'rate-limit',
      type: 'request',
      handler: async (req, res, next) => {
        const key = this.getClientKey(req, options);
        const now = Date.now();
        
        let client = store.get(key);
        
        if (!client || now > client.resetTime) {
          client = {
            count: 1,
            resetTime: now + options.windowMs
          };
          store.set(key, client);
        } else {
          client.count++;
        }
        
        if (client.count > options.maxRequests) {
          res.status(429).json({
            error: 'Too many requests',
            retryAfter: Math.ceil((client.resetTime - now) / 1000)
          });
          return;
        }
        
        res.setHeader('X-RateLimit-Limit', options.maxRequests);
        res.setHeader('X-RateLimit-Remaining', options.maxRequests - client.count);
        res.setHeader('X-RateLimit-Reset', Math.ceil(client.resetTime / 1000));
        
        next();
      }
    };
  }
  
  static createAuth(options: AuthOptions): Middleware {
    return {
      name: 'auth',
      type: 'request',
      handler: async (req, res, next) => {
        // Skip authentication for certain paths
        if (options.skipPaths?.includes(req.path)) {
          return next();
        }
        
        const token = this.extractToken(req, options);
        
        if (!token) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }
        
        try {
          const user = await this.verifyToken(token, options);
          req.user = user;
          next();
        } catch (error) {
          res.status(401).json({ error: 'Invalid token' });
        }
      }
    };
  }
  
  private static getClientKey(req: any, options: RateLimitOptions): string {
    return options.keyGenerator ? options.keyGenerator(req) : req.ip;
  }
  
  private static extractToken(req: any, options: AuthOptions): string | null {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      return header.substring(7);
    }
    return null;
  }
  
  private static async verifyToken(token: string, options: AuthOptions): Promise<any> {
    // JWT verification logic
    return {}; // Placeholder
  }
}
```

## Plugin Development

### Advanced Plugin Architecture

```typescript
// Plugin lifecycle management
class PluginManager {
  private plugins = new Map<string, Plugin>();
  private hooks = new Map<string, Hook[]>();
  private dependencies = new Map<string, string[]>();
  
  async install(plugin: Plugin): Promise<void> {
    // Check dependencies
    await this.checkDependencies(plugin);
    
    // Install plugin
    this.plugins.set(plugin.name, plugin);
    
    // Register hooks
    if (plugin.hooks) {
      for (const [hookName, hook] of Object.entries(plugin.hooks)) {
        this.registerHook(hookName, hook);
      }
    }
    
    // Call install lifecycle
    if (plugin.install) {
      await plugin.install();
    }
    
    console.log(`Plugin ${plugin.name} installed successfully`);
  }
  
  async uninstall(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }
    
    // Check if other plugins depend on this one
    const dependents = this.findDependents(pluginName);
    if (dependents.length > 0) {
      throw new Error(`Cannot uninstall ${pluginName}: required by ${dependents.join(', ')}`);
    }
    
    // Call uninstall lifecycle
    if (plugin.uninstall) {
      await plugin.uninstall();
    }
    
    // Remove hooks
    if (plugin.hooks) {
      for (const hookName of Object.keys(plugin.hooks)) {
        this.unregisterHook(hookName, plugin.name);
      }
    }
    
    // Remove plugin
    this.plugins.delete(pluginName);
    
    console.log(`Plugin ${pluginName} uninstalled successfully`);
  }
  
  async executeHook(hookName: string, ...args: any[]): Promise<any[]> {
    const hooks = this.hooks.get(hookName) || [];
    const results = [];
    
    for (const hook of hooks) {
      try {
        const result = await hook.handler(...args);
        results.push(result);
      } catch (error) {
        console.error(`Hook ${hookName} error in plugin ${hook.pluginName}:`, error);
        if (hook.required) {
          throw error;
        }
      }
    }
    
    return results;
  }
  
  private async checkDependencies(plugin: Plugin): Promise<void> {
    if (!plugin.dependencies) return;
    
    for (const dep of plugin.dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Plugin ${plugin.name} requires ${dep}`);
      }
    }
    
    this.dependencies.set(plugin.name, plugin.dependencies);
  }
  
  private findDependents(pluginName: string): string[] {
    const dependents = [];
    
    for (const [name, deps] of this.dependencies) {
      if (deps.includes(pluginName)) {
        dependents.push(name);
      }
    }
    
    return dependents;
  }
  
  private registerHook(hookName: string, hook: Hook) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    
    this.hooks.get(hookName)!.push(hook);
    
    // Sort by priority
    this.hooks.get(hookName)!.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
  
  private unregisterHook(hookName: string, pluginName: string) {
    const hooks = this.hooks.get(hookName);
    if (hooks) {
      const filtered = hooks.filter(hook => hook.pluginName !== pluginName);
      this.hooks.set(hookName, filtered);
    }
  }
}

// Plugin communication
class PluginCommunicator {
  private channels = new Map<string, Set<PluginMessageHandler>>();
  
  subscribe(channel: string, handler: PluginMessageHandler, pluginName: string) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    
    this.channels.get(channel)!.add({
      ...handler,
      pluginName
    });
  }
  
  unsubscribe(channel: string, pluginName: string) {
    const handlers = this.channels.get(channel);
    if (handlers) {
      const filtered = Array.from(handlers).filter(h => h.pluginName !== pluginName);
      this.channels.set(channel, new Set(filtered));
    }
  }
  
  async publish(channel: string, message: any, sender: string): Promise<void> {
    const handlers = this.channels.get(channel) || new Set();
    
    const promises = Array.from(handlers)
      .filter(handler => handler.pluginName !== sender) // Don't send to self
      .map(handler => this.safeExecute(handler, message, sender));
    
    await Promise.allSettled(promises);
  }
  
  private async safeExecute(handler: PluginMessageHandler, message: any, sender: string) {
    try {
      await handler.handle(message, sender);
    } catch (error) {
      console.error(`Plugin message handler error in ${handler.pluginName}:`, error);
    }
  }
}
```

## Performance Optimization

### Caching Strategies

```typescript
// Multi-level caching
class CacheManager {
  private l1Cache: Map<string, CacheEntry> = new Map(); // Memory cache
  private l2Cache?: RedisCache; // Redis cache
  private l3Cache?: DatabaseCache; // Database cache
  
  constructor(options: CacheOptions) {
    if (options.redis) {
      this.l2Cache = new RedisCache(options.redis);
    }
    if (options.database) {
      this.l3Cache = new DatabaseCache(options.database);
    }
  }
  
  async get<T>(key: string): Promise<T | null> {
    // Try L1 cache first
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && !this.isExpired(l1Entry)) {
      return l1Entry.value;
    }
    
    // Try L2 cache
    if (this.l2Cache) {
      const l2Value = await this.l2Cache.get(key);
      if (l2Value !== null) {
        // Populate L1 cache
        this.l1Cache.set(key, {
          value: l2Value,
          timestamp: Date.now(),
          ttl: 300000 // 5 minutes
        });
        return l2Value;
      }
    }
    
    // Try L3 cache
    if (this.l3Cache) {
      const l3Value = await this.l3Cache.get(key);
      if (l3Value !== null) {
        // Populate L2 and L1 caches
        if (this.l2Cache) {
          await this.l2Cache.set(key, l3Value, 3600000); // 1 hour
        }
        this.l1Cache.set(key, {
          value: l3Value,
          timestamp: Date.now(),
          ttl: 300000
        });
        return l3Value;
      }
    }
    
    return null;
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Set in all cache levels
    this.l1Cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || 300000
    });
    
    if (this.l2Cache) {
      await this.l2Cache.set(key, value, ttl || 3600000);
    }
    
    if (this.l3Cache) {
      await this.l3Cache.set(key, value, ttl || 86400000); // 1 day
    }
  }
  
  async invalidate(key: string): Promise<void> {
    this.l1Cache.delete(key);
    
    if (this.l2Cache) {
      await this.l2Cache.delete(key);
    }
    
    if (this.l3Cache) {
      await this.l3Cache.delete(key);
    }
  }
  
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }
}

// Intent result caching
class CachedIntentHandler {
  constructor(
    private baseHandler: IntentHandler,
    private cache: CacheManager,
    private options: CacheOptions = {}
  ) {}
  
  async handle(params: any, context: any): Promise<any> {
    const cacheKey = this.generateCacheKey(params, context);
    
    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached && !this.shouldBypassCache(context)) {
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
          cacheKey
        }
      };
    }
    
    // Execute handler
    const result = await this.baseHandler(params, context);
    
    // Cache result if successful
    if (result.success && this.shouldCache(result, context)) {
      await this.cache.set(cacheKey, result, this.getTTL(result, context));
    }
    
    return result;
  }
  
  private generateCacheKey(params: any, context: any): string {
    const keyData = {
      params,
      userId: context.user?.id,
      ...this.options.keyFields
    };
    
    return `intent:${JSON.stringify(keyData)}`;
  }
  
  private shouldBypassCache(context: any): boolean {
    return context.bypassCache || context.user?.role === 'admin';
  }
  
  private shouldCache(result: any, context: any): boolean {
    return !result.error && !context.noCache;
  }
  
  private getTTL(result: any, context: any): number {
    return result.cacheTTL || this.options.defaultTTL || 300000;
  }
}
```

### Connection Pooling

```typescript
// Database connection pool
class ConnectionPool {
  private pool: Connection[] = [];
  private busy: Set<Connection> = new Set();
  private waiting: Array<{ resolve: Function; reject: Function }> = [];
  
  constructor(private options: PoolOptions) {
    this.initialize();
  }
  
  private async initialize() {
    for (let i = 0; i < this.options.min; i++) {
      const connection = await this.createConnection();
      this.pool.push(connection);
    }
  }
  
  async acquire(): Promise<Connection> {
    // Check for available connection
    const available = this.pool.find(conn => !this.busy.has(conn));
    
    if (available) {
      this.busy.add(available);
      return available;
    }
    
    // Create new connection if under max
    if (this.pool.length < this.options.max) {
      const connection = await this.createConnection();
      this.pool.push(connection);
      this.busy.add(connection);
      return connection;
    }
    
    // Wait for connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waiting.findIndex(w => w.resolve === resolve);
        if (index >= 0) {
          this.waiting.splice(index, 1);
          reject(new Error('Connection timeout'));
        }
      }, this.options.acquireTimeout || 30000);
      
      this.waiting.push({
        resolve: (conn: Connection) => {
          clearTimeout(timeout);
          resolve(conn);
        },
        reject
      });
    });
  }
  
  release(connection: Connection) {
    this.busy.delete(connection);
    
    // Serve waiting requests
    if (this.waiting.length > 0) {
      const waiter = this.waiting.shift()!;
      this.busy.add(connection);
      waiter.resolve(connection);
    }
  }
  
  async destroy() {
    // Close all connections
    await Promise.all(
      this.pool.map(conn => conn.close())
    );
    
    this.pool.length = 0;
    this.busy.clear();
    
    // Reject waiting requests
    this.waiting.forEach(waiter => {
      waiter.reject(new Error('Pool destroyed'));
    });
    this.waiting.length = 0;
  }
  
  private async createConnection(): Promise<Connection> {
    // Implementation depends on database type
    return new Connection(this.options.connectionString);
  }
}
```

## Scalability Patterns

### Load Balancing

```typescript
// Load balancer implementation
class LoadBalancer {
  private servers: ServerInfo[] = [];
  private strategy: LoadBalancingStrategy;
  
  constructor(strategy: LoadBalancingStrategy = new RoundRobinStrategy()) {
    this.strategy = strategy;
  }
  
  addServer(server: ServerInfo) {
    this.servers.push({
      ...server,
      healthy: true,
      connections: 0,
      lastCheck: Date.now()
    });
  }
  
  removeServer(serverId: string) {
    this.servers = this.servers.filter(s => s.id !== serverId);
  }
  
  async selectServer(): Promise<ServerInfo> {
    const healthyServers = this.servers.filter(s => s.healthy);
    
    if (healthyServers.length === 0) {
      throw new Error('No healthy servers available');
    }
    
    return this.strategy.select(healthyServers);
  }
  
  async healthCheck() {
    const checks = this.servers.map(server => this.checkServer(server));
    await Promise.allSettled(checks);
  }
  
  private async checkServer(server: ServerInfo) {
    try {
      const response = await fetch(`${server.url}/health`, {
        timeout: 5000
      });
      
      server.healthy = response.ok;
      server.lastCheck = Date.now();
    } catch (error) {
      server.healthy = false;
      server.lastCheck = Date.now();
    }
  }
}

// Load balancing strategies
class RoundRobinStrategy implements LoadBalancingStrategy {
  private currentIndex = 0;
  
  select(servers: ServerInfo[]): ServerInfo {
    const server = servers[this.currentIndex % servers.length];
    this.currentIndex++;
    return server;
  }
}

class WeightedRoundRobinStrategy implements LoadBalancingStrategy {
  private weights: Map<string, number> = new Map();
  private currentWeights: Map<string, number> = new Map();
  
  select(servers: ServerInfo[]): ServerInfo {
    let selected = servers[0];
    let maxWeight = 0;
    
    for (const server of servers) {
      const weight = this.weights.get(server.id) || 1;
      const currentWeight = (this.currentWeights.get(server.id) || 0) + weight;
      
      this.currentWeights.set(server.id, currentWeight);
      
      if (currentWeight > maxWeight) {
        maxWeight = currentWeight;
        selected = server;
      }
    }
    
    // Decrease selected server's current weight
    const totalWeight = servers.reduce((sum, s) => sum + (this.weights.get(s.id) || 1), 0);
    this.currentWeights.set(selected.id, maxWeight - totalWeight);
    
    return selected;
  }
}

class LeastConnectionsStrategy implements LoadBalancingStrategy {
  select(servers: ServerInfo[]): ServerInfo {
    return servers.reduce((min, server) => 
      server.connections < min.connections ? server : min
    );
  }
}
```

### Horizontal Scaling

```typescript
// Auto-scaling manager
class AutoScaler {
  private metrics: MetricsCollector;
  private scaleUpThreshold = 0.8;
  private scaleDownThreshold = 0.3;
  private cooldownPeriod = 300000; // 5 minutes
  private lastScaleAction = 0;
  
  constructor(
    private loadBalancer: LoadBalancer,
    private serverManager: ServerManager
  ) {
    this.metrics = new MetricsCollector();
    this.startMonitoring();
  }
  
  private startMonitoring() {
    setInterval(() => {
      this.checkScaling();
    }, 60000); // Check every minute
  }
  
  private async checkScaling() {
    const now = Date.now();
    
    // Respect cooldown period
    if (now - this.lastScaleAction < this.cooldownPeriod) {
      return;
    }
    
    const metrics = await this.metrics.getAverageMetrics(300000); // 5 minutes
    
    if (metrics.cpuUsage > this.scaleUpThreshold || metrics.memoryUsage > this.scaleUpThreshold) {
      await this.scaleUp();
      this.lastScaleAction = now;
    } else if (metrics.cpuUsage < this.scaleDownThreshold && metrics.memoryUsage < this.scaleDownThreshold) {
      await this.scaleDown();
      this.lastScaleAction = now;
    }
  }
  
  private async scaleUp() {
    console.log('Scaling up: Adding new server instance');
    
    try {
      const newServer = await this.serverManager.createInstance();
      this.loadBalancer.addServer(newServer);
      
      // Wait for server to be ready
      await this.waitForServerReady(newServer);
      
      console.log(`New server ${newServer.id} is ready`);
    } catch (error) {
      console.error('Failed to scale up:', error);
    }
  }
  
  private async scaleDown() {
    const servers = this.loadBalancer.getServers();
    
    if (servers.length <= 1) {
      return; // Don't scale below minimum
    }
    
    console.log('Scaling down: Removing server instance');
    
    try {
      // Find server with least connections
      const serverToRemove = servers.reduce((min, server) => 
        server.connections < min.connections ? server : min
      );
      
      // Gracefully drain connections
      await this.drainServer(serverToRemove);
      
      // Remove from load balancer
      this.loadBalancer.removeServer(serverToRemove.id);
      
      // Terminate server
      await this.serverManager.terminateInstance(serverToRemove.id);
      
      console.log(`Server ${serverToRemove.id} removed`);
    } catch (error) {
      console.error('Failed to scale down:', error);
    }
  }
  
  private async waitForServerReady(server: ServerInfo): Promise<void> {
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${server.url}/health`);
        if (response.ok) {
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error(`Server ${server.id} failed to become ready`);
  }
  
  private async drainServer(server: ServerInfo): Promise<void> {
    // Mark server as draining
    server.draining = true;
    
    // Wait for connections to finish
    const maxWait = 60000; // 1 minute
    const start = Date.now();
    
    while (server.connections > 0 && Date.now() - start < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

## Advanced Security

### Rate Limiting with Sliding Window

```typescript
class SlidingWindowRateLimit {
  private windows = new Map<string, TimeWindow>();
  
  constructor(
    private maxRequests: number,
    private windowSizeMs: number,
    private subWindowCount: number = 10
  ) {}
  
  async isAllowed(key: string): Promise<boolean> {
    const now = Date.now();
    const window = this.getOrCreateWindow(key, now);
    
    // Clean old sub-windows
    this.cleanOldSubWindows(window, now);
    
    // Count requests in current window
    const totalRequests = Array.from(window.subWindows.values())
      .reduce((sum, count) => sum + count, 0);
    
    if (totalRequests >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    const subWindowIndex = Math.floor(now / (this.windowSizeMs / this.subWindowCount));
    const currentCount = window.subWindows.get(subWindowIndex) || 0;
    window.subWindows.set(subWindowIndex, currentCount + 1);
    
    return true;
  }
  
  private getOrCreateWindow(key: string, now: number): TimeWindow {
    let window = this.windows.get(key);
    
    if (!window) {
      window = {
        subWindows: new Map(),
        lastAccess: now
      };
      this.windows.set(key, window);
    }
    
    window.lastAccess = now;
    return window;
  }
  
  private cleanOldSubWindows(window: TimeWindow, now: number) {
    const cutoff = now - this.windowSizeMs;
    const cutoffIndex = Math.floor(cutoff / (this.windowSizeMs / this.subWindowCount));
    
    for (const [index] of window.subWindows) {
      if (index <= cutoffIndex) {
        window.subWindows.delete(index);
      }
    }
  }
}
```

### Advanced Authentication

```typescript
// Multi-factor authentication
class MFAManager {
  private totpService: TOTPService;
  private smsService: SMSService;
  
  constructor() {
    this.totpService = new TOTPService();
    this.smsService = new SMSService();
  }
  
  async setupMFA(userId: string, method: MFAMethod): Promise<MFASetupResult> {
    switch (method) {
      case 'totp':
        return this.setupTOTP(userId);
      case 'sms':
        return this.setupSMS(userId);
      default:
        throw new Error(`Unsupported MFA method: ${method}`);
    }
  }
  
  async verifyMFA(userId: string, code: string, method: MFAMethod): Promise<boolean> {
    switch (method) {
      case 'totp':
        return this.verifyTOTP(userId, code);
      case 'sms':
        return this.verifySMS(userId, code);
      default:
        return false;
    }
  }
  
  private async setupTOTP(userId: string): Promise<MFASetupResult> {
    const secret = this.totpService.generateSecret();
    const qrCode = await this.totpService.generateQRCode(userId, secret);
    
    // Store secret (encrypted)
    await this.storeUserSecret(userId, 'totp', secret);
    
    return {
      method: 'totp',
      secret,
      qrCode,
      backupCodes: this.generateBackupCodes()
    };
  }
  
  private async setupSMS(userId: string): Promise<MFASetupResult> {
    const user = await this.getUserById(userId);
    
    if (!user.phoneNumber) {
      throw new Error('Phone number required for SMS MFA');
    }
    
    return {
      method: 'sms',
      phoneNumber: this.maskPhoneNumber(user.phoneNumber)
    };
  }
  
  private async verifyTOTP(userId: string, code: string): Promise<boolean> {
    const secret = await this.getUserSecret(userId, 'totp');
    return this.totpService.verify(code, secret);
  }
  
  private async verifySMS(userId: string, code: string): Promise<boolean> {
    const storedCode = await this.getStoredSMSCode(userId);
    return storedCode === code && !this.isCodeExpired(storedCode);
  }
  
  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
  }
  
  private maskPhoneNumber(phone: string): string {
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-***-$3');
  }
}
```

## Monitoring and Observability

### Comprehensive Metrics Collection

```typescript
class MetricsCollector {
  private metrics = new Map<string, Metric[]>();
  private gauges = new Map<string, number>();
  private counters = new Map<string, number>();
  
  // Counter metrics
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>) {
    const key = this.getMetricKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }
  
  // Gauge metrics
  setGauge(name: string, value: number, tags?: Record<string, string>) {
    const key = this.getMetricKey(name, tags);
    this.gauges.set(key, value);
  }
  
  // Histogram metrics
  recordHistogram(name: string, value: number, tags?: Record<string, string>) {
    const key = this.getMetricKey(name, tags);
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key)!.push({
      value,
      timestamp: Date.now(),
      tags
    });
    
    // Keep only recent metrics (last hour)
    const cutoff = Date.now() - 3600000;
    const filtered = this.metrics.get(key)!.filter(m => m.timestamp > cutoff);
    this.metrics.set(key, filtered);
  }
  
  // Timer utility
  startTimer(name: string, tags?: Record<string, string>) {
    const start = Date.now();
    
    return () => {
      const duration = Date.now() - start;
      this.recordHistogram(name, duration, tags);
      return duration;
    };
  }
  
  // Get metrics summary
  getMetricsSummary(): MetricsSummary {
    const summary: MetricsSummary = {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: {}
    };
    
    for (const [key, values] of this.metrics) {
      if (values.length > 0) {
        const sorted = values.map(v => v.value).sort((a, b) => a - b);
        
        summary.histograms[key] = {
          count: values.length,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          mean: sorted.reduce((sum, v) => sum + v, 0) / sorted.length,
          p50: this.percentile(sorted, 0.5),
          p95: this.percentile(sorted, 0.95),
          p99: this.percentile(sorted, 0.99)
        };
      }
    }
    
    return summary;
  }
  
  private getMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }
    
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    
    return `${name}{${tagString}}`;
  }
  
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }
}

// Application Performance Monitoring
class APMTracer {
  private activeSpans = new Map<string, Span>();
  
  startSpan(name: string, parentSpanId?: string): string {
    const spanId = this.generateSpanId();
    const span: Span = {
      id: spanId,
      name,
      startTime: Date.now(),
      parentId: parentSpanId,
      tags: {},
      logs: []
    };
    
    this.activeSpans.set(spanId, span);
    return spanId;
  }
  
  finishSpan(spanId: string, tags?: Record<string, any>) {
    const span = this.activeSpans.get(spanId);
    if (!span) return;
    
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    
    if (tags) {
      Object.assign(span.tags, tags);
    }
    
    // Send to tracing backend
    this.sendSpan(span);
    
    this.activeSpans.delete(spanId);
  }
  
  addSpanTag(spanId: string, key: string, value: any) {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.tags[key] = value;
    }
  }
  
  addSpanLog(spanId: string, message: string, level: string = 'info') {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: Date.now(),
        level,
        message
      });
    }
  }
  
  // Decorator for automatic tracing
  trace(operationName?: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      const traceName = operationName || `${target.constructor.name}.${propertyKey}`;
      
      descriptor.value = async function (...args: any[]) {
        const spanId = this.startSpan(traceName);
        
        try {
          const result = await originalMethod.apply(this, args);
          this.addSpanTag(spanId, 'success', true);
          return result;
        } catch (error) {
          this.addSpanTag(spanId, 'error', true);
          this.addSpanTag(spanId, 'error.message', error.message);
          throw error;
        } finally {
          this.finishSpan(spanId);
        }
      };
      
      return descriptor;
    };
  }
  
  private generateSpanId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
  private async sendSpan(span: Span) {
    // Send to tracing backend (Jaeger, Zipkin, etc.)
    console.log('Trace span:', span);
  }
}
```

## Summary

This advanced guide covers sophisticated patterns and techniques for building production-ready IXP Server applications. Key topics include:

- **Architecture Patterns**: Microservices, event-driven, and CQRS patterns for scalable systems
- **Intent Resolution**: Semantic matching and multi-stage resolution for better accuracy
- **Component Patterns**: Higher-order components and composition for reusable UI
- **Middleware**: Advanced pipeline composition and conditional execution
- **Plugin Development**: Lifecycle management and inter-plugin communication
- **Performance**: Multi-level caching and connection pooling strategies
- **Scalability**: Load balancing and auto-scaling implementations
- **Security**: Advanced rate limiting and multi-factor authentication
- **Monitoring**: Comprehensive metrics collection and distributed tracing

## Best Practices

### Development Workflow

1. **Start Simple**: Begin with basic patterns and gradually add complexity
2. **Measure First**: Implement monitoring before optimization
3. **Test Thoroughly**: Use comprehensive testing strategies for complex systems
4. **Document Everything**: Maintain clear documentation for advanced patterns
5. **Monitor Continuously**: Set up alerts and dashboards for production systems

### Performance Considerations

- Use caching strategically at multiple levels
- Implement connection pooling for database operations
- Monitor and optimize critical paths
- Consider async processing for heavy operations
- Use load balancing for horizontal scaling

### Security Guidelines

- Implement defense in depth
- Use rate limiting to prevent abuse
- Validate all inputs thoroughly
- Implement proper authentication and authorization
- Monitor for security events

### Scalability Planning

- Design for horizontal scaling from the start
- Use event-driven architecture for loose coupling
- Implement proper error handling and circuit breakers
- Plan for graceful degradation
- Monitor resource usage and scale proactively

## Next Steps

- Review the [Testing Guide](testing.md) for comprehensive testing strategies
- Check the [Real-World Examples](../examples/real-world.md) for practical implementations
- Explore the [API Reference](../api/) for detailed documentation
- Join the community for support and best practices sharing

## Resources

- [Performance Optimization Checklist](performance-checklist.md)
- [Security Best Practices](security-guide.md)
- [Monitoring Setup Guide](monitoring-setup.md)
- [Deployment Strategies](deployment-guide.md)