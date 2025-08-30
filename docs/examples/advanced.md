# Advanced Examples

This document provides complex, real-world examples demonstrating advanced features and patterns with the IXP Server SDK.

## Table of Contents

- [Multi-Service Architecture](#multi-service-architecture)
- [Advanced Intent Composition](#advanced-intent-composition)
- [Complex Component Systems](#complex-component-systems)
- [Custom Middleware Pipeline](#custom-middleware-pipeline)
- [Plugin Ecosystem](#plugin-ecosystem)
- [Performance Optimization](#performance-optimization)
- [Security Implementation](#security-implementation)
- [Microservices Integration](#microservices-integration)

## Multi-Service Architecture

### Service Registry Pattern

```typescript
// services/ServiceRegistry.ts
import { EventEmitter } from 'events';
import { IXPServer } from '@ixp/server-sdk';

interface ServiceDefinition {
  id: string;
  name: string;
  version: string;
  endpoint: string;
  health: string;
  capabilities: string[];
  metadata: Record<string, any>;
}

export class ServiceRegistry extends EventEmitter {
  private services = new Map<string, ServiceDefinition>();
  private healthChecks = new Map<string, NodeJS.Timeout>();

  async register(service: ServiceDefinition): Promise<void> {
    this.services.set(service.id, service);
    this.startHealthCheck(service);
    this.emit('service:registered', service);
    
    console.log(`Service registered: ${service.name} (${service.id})`);
  }

  async unregister(serviceId: string): Promise<void> {
    const service = this.services.get(serviceId);
    if (service) {
      this.stopHealthCheck(serviceId);
      this.services.delete(serviceId);
      this.emit('service:unregistered', service);
      
      console.log(`Service unregistered: ${service.name} (${serviceId})`);
    }
  }

  getService(serviceId: string): ServiceDefinition | undefined {
    return this.services.get(serviceId);
  }

  getServicesByCapability(capability: string): ServiceDefinition[] {
    return Array.from(this.services.values())
      .filter(service => service.capabilities.includes(capability));
  }

  getAllServices(): ServiceDefinition[] {
    return Array.from(this.services.values());
  }

  private startHealthCheck(service: ServiceDefinition): void {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(service.health);
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        this.emit('service:healthy', service);
      } catch (error) {
        console.error(`Health check failed for ${service.name}:`, error);
        this.emit('service:unhealthy', service, error);
      }
    }, 30000); // Check every 30 seconds

    this.healthChecks.set(service.id, interval);
  }

  private stopHealthCheck(serviceId: string): void {
    const interval = this.healthChecks.get(serviceId);
    if (interval) {
      clearInterval(interval);
      this.healthChecks.delete(serviceId);
    }
  }
}
```

### Distributed Intent Processing

```typescript
// services/DistributedIntentProcessor.ts
import { Intent, IntentContext, IntentResult } from '@ixp/server-sdk';
import { ServiceRegistry } from './ServiceRegistry';

export class DistributedIntentProcessor {
  constructor(
    private serviceRegistry: ServiceRegistry,
    private loadBalancer: LoadBalancer
  ) {}

  async processIntent(
    intentName: string,
    context: IntentContext
  ): Promise<IntentResult> {
    // Find services that can handle this intent
    const services = this.serviceRegistry
      .getServicesByCapability(`intent:${intentName}`);

    if (services.length === 0) {
      throw new Error(`No services available for intent: ${intentName}`);
    }

    // Select service using load balancing
    const selectedService = this.loadBalancer.selectService(services);

    try {
      // Process intent on selected service
      const result = await this.callRemoteIntent(
        selectedService,
        intentName,
        context
      );

      // Update load balancer metrics
      this.loadBalancer.recordSuccess(selectedService.id);
      
      return result;
    } catch (error) {
      // Record failure and try fallback
      this.loadBalancer.recordFailure(selectedService.id);
      
      // Try fallback service if available
      const fallbackServices = services.filter(s => s.id !== selectedService.id);
      if (fallbackServices.length > 0) {
        return this.processIntent(intentName, context);
      }
      
      throw error;
    }
  }

  private async callRemoteIntent(
    service: ServiceDefinition,
    intentName: string,
    context: IntentContext
  ): Promise<IntentResult> {
    const response = await fetch(`${service.endpoint}/intents/${intentName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Token': process.env.SERVICE_TOKEN || ''
      },
      body: JSON.stringify(context)
    });

    if (!response.ok) {
      throw new Error(`Remote intent call failed: ${response.status}`);
    }

    return response.json();
  }
}
```

### Load Balancer Implementation

```typescript
// services/LoadBalancer.ts
interface ServiceMetrics {
  successCount: number;
  failureCount: number;
  avgResponseTime: number;
  lastUsed: number;
}

export class LoadBalancer {
  private metrics = new Map<string, ServiceMetrics>();
  private strategy: 'round-robin' | 'least-connections' | 'weighted' = 'weighted';

  selectService(services: ServiceDefinition[]): ServiceDefinition {
    switch (this.strategy) {
      case 'round-robin':
        return this.roundRobinSelect(services);
      case 'least-connections':
        return this.leastConnectionsSelect(services);
      case 'weighted':
        return this.weightedSelect(services);
      default:
        return services[0];
    }
  }

  recordSuccess(serviceId: string, responseTime?: number): void {
    const metrics = this.getOrCreateMetrics(serviceId);
    metrics.successCount++;
    metrics.lastUsed = Date.now();
    
    if (responseTime) {
      metrics.avgResponseTime = 
        (metrics.avgResponseTime + responseTime) / 2;
    }
  }

  recordFailure(serviceId: string): void {
    const metrics = this.getOrCreateMetrics(serviceId);
    metrics.failureCount++;
  }

  private weightedSelect(services: ServiceDefinition[]): ServiceDefinition {
    const weights = services.map(service => {
      const metrics = this.metrics.get(service.id);
      if (!metrics) return 1;

      const successRate = metrics.successCount / 
        (metrics.successCount + metrics.failureCount);
      const responseTimeFactor = 1000 / (metrics.avgResponseTime || 1000);
      
      return successRate * responseTimeFactor;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (let i = 0; i < services.length; i++) {
      currentWeight += weights[i];
      if (random <= currentWeight) {
        return services[i];
      }
    }

    return services[0];
  }

  private roundRobinSelect(services: ServiceDefinition[]): ServiceDefinition {
    // Simple round-robin implementation
    const now = Date.now();
    let oldestService = services[0];
    let oldestTime = this.metrics.get(services[0].id)?.lastUsed || 0;

    for (const service of services) {
      const lastUsed = this.metrics.get(service.id)?.lastUsed || 0;
      if (lastUsed < oldestTime) {
        oldestService = service;
        oldestTime = lastUsed;
      }
    }

    return oldestService;
  }

  private leastConnectionsSelect(services: ServiceDefinition[]): ServiceDefinition {
    // For this example, we'll use success count as a proxy for connections
    let leastBusyService = services[0];
    let leastConnections = this.metrics.get(services[0].id)?.successCount || 0;

    for (const service of services) {
      const connections = this.metrics.get(service.id)?.successCount || 0;
      if (connections < leastConnections) {
        leastBusyService = service;
        leastConnections = connections;
      }
    }

    return leastBusyService;
  }

  private getOrCreateMetrics(serviceId: string): ServiceMetrics {
    if (!this.metrics.has(serviceId)) {
      this.metrics.set(serviceId, {
        successCount: 0,
        failureCount: 0,
        avgResponseTime: 0,
        lastUsed: 0
      });
    }
    return this.metrics.get(serviceId)!;
  }
}
```

## Advanced Intent Composition

### Intent Orchestration Engine

```typescript
// intents/OrchestrationEngine.ts
import { Intent, IntentContext, IntentResult } from '@ixp/server-sdk';

interface WorkflowStep {
  id: string;
  intentName: string;
  condition?: (context: IntentContext, results: Map<string, any>) => boolean;
  transform?: (input: any) => any;
  parallel?: boolean;
}

interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  errorHandling: 'stop' | 'continue' | 'retry';
}

export class IntentOrchestrationEngine {
  private workflows = new Map<string, Workflow>();
  private intentRegistry: Map<string, Intent>;

  constructor(intentRegistry: Map<string, Intent>) {
    this.intentRegistry = intentRegistry;
  }

  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  async executeWorkflow(
    workflowId: string,
    context: IntentContext
  ): Promise<IntentResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const results = new Map<string, any>();
    const parallelGroups: WorkflowStep[][] = [];
    let currentGroup: WorkflowStep[] = [];

    // Group steps by parallel execution
    for (const step of workflow.steps) {
      if (step.parallel && currentGroup.length > 0) {
        currentGroup.push(step);
      } else {
        if (currentGroup.length > 0) {
          parallelGroups.push(currentGroup);
        }
        currentGroup = [step];
      }
    }
    if (currentGroup.length > 0) {
      parallelGroups.push(currentGroup);
    }

    // Execute step groups
    for (const group of parallelGroups) {
      if (group.length === 1) {
        // Sequential execution
        const result = await this.executeStep(group[0], context, results);
        results.set(group[0].id, result);
      } else {
        // Parallel execution
        const promises = group.map(step => 
          this.executeStep(step, context, results)
        );
        const groupResults = await Promise.all(promises);
        
        group.forEach((step, index) => {
          results.set(step.id, groupResults[index]);
        });
      }
    }

    // Combine results
    return this.combineResults(results, workflow);
  }

  private async executeStep(
    step: WorkflowStep,
    context: IntentContext,
    previousResults: Map<string, any>
  ): Promise<any> {
    // Check condition if present
    if (step.condition && !step.condition(context, previousResults)) {
      return null;
    }

    const intent = this.intentRegistry.get(step.intentName);
    if (!intent) {
      throw new Error(`Intent not found: ${step.intentName}`);
    }

    // Transform input if needed
    let stepContext = context;
    if (step.transform) {
      stepContext = {
        ...context,
        input: step.transform(context.input)
      };
    }

    try {
      return await intent.handler(stepContext);
    } catch (error) {
      console.error(`Step ${step.id} failed:`, error);
      throw error;
    }
  }

  private combineResults(
    results: Map<string, any>,
    workflow: Workflow
  ): IntentResult {
    const combinedData = {};
    const components = [];

    for (const [stepId, result] of results) {
      if (result) {
        if (result.component) {
          components.push(result.component);
        }
        if (result.data) {
          Object.assign(combinedData, result.data);
        }
      }
    }

    return {
      component: components.length > 0 ? 'WorkflowResult' : undefined,
      props: {
        workflowId: workflow.id,
        results: combinedData,
        components
      },
      data: combinedData
    };
  }
}
```

### Complex Intent with State Management

```typescript
// intents/ConversationIntent.ts
import { Intent, IntentContext } from '@ixp/server-sdk';

interface ConversationState {
  userId: string;
  sessionId: string;
  currentStep: string;
  data: Record<string, any>;
  history: Array<{
    timestamp: number;
    input: string;
    output: any;
  }>;
}

export class ConversationIntent implements Intent {
  id = 'conversation';
  name = 'Multi-turn Conversation';
  description = 'Handles complex multi-turn conversations with state';

  private stateStore = new Map<string, ConversationState>();
  private conversationFlows = new Map<string, ConversationFlow>();

  constructor() {
    this.initializeFlows();
  }

  async handler(context: IntentContext): Promise<any> {
    const { userId, sessionId, input } = context;
    const stateKey = `${userId}:${sessionId}`;
    
    // Get or create conversation state
    let state = this.stateStore.get(stateKey);
    if (!state) {
      state = {
        userId,
        sessionId,
        currentStep: 'start',
        data: {},
        history: []
      };
      this.stateStore.set(stateKey, state);
    }

    // Add to history
    state.history.push({
      timestamp: Date.now(),
      input,
      output: null
    });

    // Process current step
    const flow = this.conversationFlows.get('default');
    if (!flow) {
      throw new Error('No conversation flow defined');
    }

    const currentStep = flow.steps.get(state.currentStep);
    if (!currentStep) {
      throw new Error(`Invalid step: ${state.currentStep}`);
    }

    // Execute step logic
    const result = await currentStep.execute(input, state);
    
    // Update state
    if (result.nextStep) {
      state.currentStep = result.nextStep;
    }
    if (result.data) {
      Object.assign(state.data, result.data);
    }

    // Update history with output
    state.history[state.history.length - 1].output = result;

    return {
      component: 'ConversationStep',
      props: {
        step: state.currentStep,
        message: result.message,
        options: result.options,
        data: state.data
      },
      data: {
        conversationState: state,
        isComplete: result.isComplete
      }
    };
  }

  private initializeFlows(): void {
    const defaultFlow = new ConversationFlow('default');
    
    // Define conversation steps
    defaultFlow.addStep('start', new GreetingStep());
    defaultFlow.addStep('collect_info', new InfoCollectionStep());
    defaultFlow.addStep('process', new ProcessingStep());
    defaultFlow.addStep('complete', new CompletionStep());
    
    this.conversationFlows.set('default', defaultFlow);
  }
}

// Conversation flow classes
class ConversationFlow {
  steps = new Map<string, ConversationStep>();

  constructor(public id: string) {}

  addStep(id: string, step: ConversationStep): void {
    this.steps.set(id, step);
  }
}

abstract class ConversationStep {
  abstract execute(
    input: string,
    state: ConversationState
  ): Promise<{
    message: string;
    nextStep?: string;
    options?: string[];
    data?: Record<string, any>;
    isComplete?: boolean;
  }>;
}

class GreetingStep extends ConversationStep {
  async execute(input: string, state: ConversationState) {
    return {
      message: `Hello! I'm here to help you. What would you like to do today?`,
      nextStep: 'collect_info',
      options: ['Get information', 'Process data', 'Help']
    };
  }
}

class InfoCollectionStep extends ConversationStep {
  async execute(input: string, state: ConversationState) {
    // Parse user input and collect required information
    const info = this.parseUserInput(input);
    
    return {
      message: `I understand you want to ${info.action}. Let me help you with that.`,
      nextStep: 'process',
      data: { userAction: info.action, parameters: info.parameters }
    };
  }

  private parseUserInput(input: string): { action: string; parameters: any } {
    // Simple NLP parsing (in real implementation, use proper NLP)
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('information') || lowerInput.includes('info')) {
      return { action: 'get_info', parameters: {} };
    } else if (lowerInput.includes('process') || lowerInput.includes('data')) {
      return { action: 'process_data', parameters: {} };
    } else {
      return { action: 'help', parameters: {} };
    }
  }
}

class ProcessingStep extends ConversationStep {
  async execute(input: string, state: ConversationState) {
    const action = state.data.userAction;
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      message: `I've completed the ${action} for you. Is there anything else you need?`,
      nextStep: 'complete',
      data: { result: `Processed: ${action}` }
    };
  }
}

class CompletionStep extends ConversationStep {
  async execute(input: string, state: ConversationState) {
    return {
      message: `Thank you for using our service! Have a great day!`,
      isComplete: true
    };
  }
}
```

## Complex Component Systems

### Dynamic Component Factory

```typescript
// components/ComponentFactory.ts
import { Component, ComponentProps } from '@ixp/server-sdk';

interface ComponentDefinition {
  name: string;
  version: string;
  dependencies: string[];
  props: Record<string, any>;
  template: string;
  styles?: string;
  scripts?: string;
}

export class ComponentFactory {
  private components = new Map<string, ComponentDefinition>();
  private cache = new Map<string, Component>();
  private loader: ComponentLoader;

  constructor() {
    this.loader = new ComponentLoader();
  }

  async registerComponent(definition: ComponentDefinition): Promise<void> {
    // Validate dependencies
    await this.validateDependencies(definition.dependencies);
    
    this.components.set(definition.name, definition);
    
    // Pre-compile if needed
    if (definition.template.includes('{{')) {
      await this.precompileTemplate(definition);
    }
  }

  async createComponent(
    name: string,
    props: ComponentProps
  ): Promise<Component> {
    const cacheKey = `${name}:${JSON.stringify(props)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const definition = this.components.get(name);
    if (!definition) {
      throw new Error(`Component not found: ${name}`);
    }

    // Load dependencies
    await this.loadDependencies(definition.dependencies);

    // Create component instance
    const component = await this.instantiateComponent(definition, props);
    
    // Cache the component
    this.cache.set(cacheKey, component);
    
    return component;
  }

  private async validateDependencies(dependencies: string[]): Promise<void> {
    for (const dep of dependencies) {
      if (!this.components.has(dep)) {
        // Try to load from external source
        try {
          await this.loader.loadComponent(dep);
        } catch (error) {
          throw new Error(`Dependency not found: ${dep}`);
        }
      }
    }
  }

  private async loadDependencies(dependencies: string[]): Promise<void> {
    const loadPromises = dependencies.map(dep => 
      this.createComponent(dep, {})
    );
    await Promise.all(loadPromises);
  }

  private async precompileTemplate(definition: ComponentDefinition): Promise<void> {
    // Simple template compilation (use a real template engine in production)
    const compiled = definition.template.replace(
      /\{\{\s*(\w+)\s*\}\}/g,
      (match, propName) => `\${props.${propName} || ''}`
    );
    
    definition.template = compiled;
  }

  private async instantiateComponent(
    definition: ComponentDefinition,
    props: ComponentProps
  ): Promise<Component> {
    return {
      name: definition.name,
      render: async (renderProps: ComponentProps) => {
        const mergedProps = { ...props, ...renderProps };
        
        // Execute template with props
        const html = this.executeTemplate(definition.template, mergedProps);
        
        return {
          html,
          css: definition.styles,
          js: definition.scripts
        };
      }
    };
  }

  private executeTemplate(template: string, props: ComponentProps): string {
    // Simple template execution (use a real template engine in production)
    try {
      const func = new Function('props', `return \`${template}\`;`);
      return func(props);
    } catch (error) {
      console.error('Template execution error:', error);
      return '<div>Error rendering component</div>';
    }
  }
}

class ComponentLoader {
  async loadComponent(name: string): Promise<ComponentDefinition> {
    // Load component from external source (registry, file system, etc.)
    const response = await fetch(`/api/components/${name}`);
    if (!response.ok) {
      throw new Error(`Failed to load component: ${name}`);
    }
    return response.json();
  }
}
```

### Reactive Component System

```typescript
// components/ReactiveComponent.ts
import { EventEmitter } from 'events';

interface ReactiveState {
  [key: string]: any;
}

interface StateChange {
  path: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

export class ReactiveComponent extends EventEmitter {
  private state: ReactiveState = {};
  private watchers = new Map<string, Array<(value: any) => void>>();
  private computed = new Map<string, () => any>();
  private stateHistory: StateChange[] = [];

  constructor(initialState: ReactiveState = {}) {
    super();
    this.state = this.createReactiveProxy(initialState);
  }

  // Create a proxy to intercept state changes
  private createReactiveProxy(target: ReactiveState): ReactiveState {
    return new Proxy(target, {
      set: (obj, prop, value) => {
        const oldValue = obj[prop as string];
        obj[prop as string] = value;
        
        // Record state change
        const change: StateChange = {
          path: prop as string,
          oldValue,
          newValue: value,
          timestamp: Date.now()
        };
        this.stateHistory.push(change);
        
        // Trigger watchers
        this.triggerWatchers(prop as string, value, oldValue);
        
        // Emit change event
        this.emit('state:change', change);
        
        return true;
      },
      
      get: (obj, prop) => {
        // Check if it's a computed property
        if (this.computed.has(prop as string)) {
          return this.computed.get(prop as string)!();
        }
        
        return obj[prop as string];
      }
    });
  }

  // Watch for state changes
  watch(path: string, callback: (value: any, oldValue?: any) => void): () => void {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, []);
    }
    
    this.watchers.get(path)!.push(callback);
    
    // Return unwatch function
    return () => {
      const watchers = this.watchers.get(path);
      if (watchers) {
        const index = watchers.indexOf(callback);
        if (index > -1) {
          watchers.splice(index, 1);
        }
      }
    };
  }

  // Define computed properties
  computed(name: string, computeFn: () => any): void {
    this.computed.set(name, computeFn);
  }

  // Get current state
  getState(): ReactiveState {
    return { ...this.state };
  }

  // Set state (batch update)
  setState(updates: Partial<ReactiveState>): void {
    Object.assign(this.state, updates);
  }

  // Get state history
  getHistory(): StateChange[] {
    return [...this.stateHistory];
  }

  // Undo last change
  undo(): boolean {
    if (this.stateHistory.length === 0) {
      return false;
    }
    
    const lastChange = this.stateHistory.pop()!;
    this.state[lastChange.path] = lastChange.oldValue;
    
    return true;
  }

  private triggerWatchers(path: string, newValue: any, oldValue: any): void {
    const watchers = this.watchers.get(path);
    if (watchers) {
      watchers.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error('Watcher error:', error);
        }
      });
    }
  }
}

// Example usage of reactive component
export class InteractiveForm extends ReactiveComponent {
  constructor() {
    super({
      formData: {},
      errors: {},
      isValid: false,
      isSubmitting: false
    });

    this.setupValidation();
    this.setupComputedProperties();
  }

  private setupValidation(): void {
    // Watch form data changes for validation
    this.watch('formData', (formData) => {
      this.validateForm(formData);
    });
  }

  private setupComputedProperties(): void {
    // Computed property for form validity
    this.computed('isValid', () => {
      const errors = this.state.errors;
      return Object.keys(errors).length === 0;
    });

    // Computed property for submit button text
    this.computed('submitButtonText', () => {
      return this.state.isSubmitting ? 'Submitting...' : 'Submit';
    });
  }

  private validateForm(formData: any): void {
    const errors: any = {};

    // Example validation rules
    if (!formData.email || !formData.email.includes('@')) {
      errors.email = 'Valid email is required';
    }

    if (!formData.name || formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    this.setState({ errors });
  }

  async submitForm(): Promise<void> {
    if (!this.state.isValid) {
      return;
    }

    this.setState({ isSubmitting: true });

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.emit('form:submitted', this.state.formData);
      this.setState({ isSubmitting: false });
    } catch (error) {
      this.setState({ 
        isSubmitting: false,
        errors: { submit: 'Submission failed. Please try again.' }
      });
    }
  }
}
```

## Custom Middleware Pipeline

### Advanced Middleware Chain

```typescript
// middleware/AdvancedMiddlewareChain.ts
import { Request, Response, NextFunction } from 'express';

interface MiddlewareContext {
  startTime: number;
  requestId: string;
  user?: any;
  metadata: Record<string, any>;
}

interface AdvancedMiddleware {
  name: string;
  priority: number;
  condition?: (req: Request) => boolean;
  before?: (req: Request, res: Response, context: MiddlewareContext) => Promise<void>;
  after?: (req: Request, res: Response, context: MiddlewareContext) => Promise<void>;
  error?: (error: Error, req: Request, res: Response, context: MiddlewareContext) => Promise<void>;
}

export class AdvancedMiddlewareChain {
  private middlewares: AdvancedMiddleware[] = [];
  private contexts = new WeakMap<Request, MiddlewareContext>();

  register(middleware: AdvancedMiddleware): void {
    this.middlewares.push(middleware);
    // Sort by priority (higher priority first)
    this.middlewares.sort((a, b) => b.priority - a.priority);
  }

  createHandler() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const context: MiddlewareContext = {
        startTime: Date.now(),
        requestId: this.generateRequestId(),
        metadata: {}
      };
      
      this.contexts.set(req, context);

      try {
        // Execute before hooks
        await this.executeBefore(req, res, context);
        
        // Set up after hooks to run when response finishes
        res.on('finish', () => {
          this.executeAfter(req, res, context);
        });
        
        next();
      } catch (error) {
        await this.executeError(error as Error, req, res, context);
      }
    };
  }

  private async executeBefore(
    req: Request,
    res: Response,
    context: MiddlewareContext
  ): Promise<void> {
    for (const middleware of this.middlewares) {
      if (middleware.condition && !middleware.condition(req)) {
        continue;
      }
      
      if (middleware.before) {
        await middleware.before(req, res, context);
      }
    }
  }

  private async executeAfter(
    req: Request,
    res: Response,
    context: MiddlewareContext
  ): Promise<void> {
    // Execute in reverse order
    for (let i = this.middlewares.length - 1; i >= 0; i--) {
      const middleware = this.middlewares[i];
      
      if (middleware.condition && !middleware.condition(req)) {
        continue;
      }
      
      if (middleware.after) {
        try {
          await middleware.after(req, res, context);
        } catch (error) {
          console.error(`After hook error in ${middleware.name}:`, error);
        }
      }
    }
  }

  private async executeError(
    error: Error,
    req: Request,
    res: Response,
    context: MiddlewareContext
  ): Promise<void> {
    for (const middleware of this.middlewares) {
      if (middleware.error) {
        try {
          await middleware.error(error, req, res, context);
        } catch (hookError) {
          console.error(`Error hook failed in ${middleware.name}:`, hookError);
        }
      }
    }
    
    // If no middleware handled the error, send default response
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### Security Middleware Suite

```typescript
// middleware/SecurityMiddleware.ts
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response } from 'express';

export class SecurityMiddleware {
  // Rate limiting with different tiers
  static createRateLimiter(tier: 'basic' | 'premium' | 'enterprise') {
    const configs = {
      basic: { windowMs: 15 * 60 * 1000, max: 100 },
      premium: { windowMs: 15 * 60 * 1000, max: 1000 },
      enterprise: { windowMs: 15 * 60 * 1000, max: 10000 }
    };

    return rateLimit({
      ...configs[tier],
      keyGenerator: (req: Request) => {
        // Use user ID if authenticated, otherwise IP
        return req.user?.id || req.ip;
      },
      handler: (req: Request, res: Response) => {
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil(configs[tier].windowMs / 1000)
        });
      }
    });
  }

  // Input sanitization
  static sanitizeInput() {
    return (req: Request, res: Response, next: Function) => {
      const sanitize = (obj: any): any => {
        if (typeof obj === 'string') {
          return obj
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .trim();
        }
        
        if (Array.isArray(obj)) {
          return obj.map(sanitize);
        }
        
        if (obj && typeof obj === 'object') {
          const sanitized: any = {};
          for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitize(value);
          }
          return sanitized;
        }
        
        return obj;
      };

      if (req.body) {
        req.body = sanitize(req.body);
      }
      
      if (req.query) {
        req.query = sanitize(req.query);
      }
      
      next();
    };
  }

  // JWT validation with refresh
  static jwtAuth(options: { secret: string; refreshSecret: string }) {
    return async (req: Request, res: Response, next: Function) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      try {
        const decoded = jwt.verify(token, options.secret);
        req.user = decoded;
        next();
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          // Try to refresh token
          const refreshToken = req.headers['x-refresh-token'];
          if (refreshToken) {
            try {
              const refreshDecoded = jwt.verify(refreshToken, options.refreshSecret);
              const newToken = jwt.sign(
                { userId: refreshDecoded.userId },
                options.secret,
                { expiresIn: '1h' }
              );
              
              res.setHeader('X-New-Token', newToken);
              req.user = refreshDecoded;
              next();
            } catch (refreshError) {
              res.status(401).json({ error: 'Invalid refresh token' });
            }
          } else {
            res.status(401).json({ error: 'Token expired' });
          }
        } else {
          res.status(401).json({ error: 'Invalid token' });
        }
      }
    };
  }

  // Request validation
  static validateRequest(schema: any) {
    return (req: Request, res: Response, next: Function) => {
      const { error } = schema.validate({
        body: req.body,
        query: req.query,
        params: req.params
      });

      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map((d: any) => d.message)
        });
      }

      next();
    };
  }
}
```

## Plugin Ecosystem

### Plugin Manager with Hot Reloading

```typescript
// plugins/PluginManager.ts
import { EventEmitter } from 'events';
import { watch } from 'fs';
import { Plugin, IXPServer } from '@ixp/server-sdk';

interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  dependencies: string[];
  permissions: string[];
  config?: Record<string, any>;
}

interface LoadedPlugin {
  metadata: PluginMetadata;
  instance: Plugin;
  filePath: string;
  loadTime: number;
  isActive: boolean;
}

export class PluginManager extends EventEmitter {
  private plugins = new Map<string, LoadedPlugin>();
  private watchers = new Map<string, any>();
  private server: IXPServer;
  private hotReloadEnabled = false;

  constructor(server: IXPServer, options: { hotReload?: boolean } = {}) {
    super();
    this.server = server;
    this.hotReloadEnabled = options.hotReload || false;
  }

  async loadPlugin(filePath: string): Promise<void> {
    try {
      // Clear require cache for hot reloading
      if (require.cache[filePath]) {
        delete require.cache[filePath];
      }

      const pluginModule = require(filePath);
      const PluginClass = pluginModule.default || pluginModule;
      
      if (!PluginClass || typeof PluginClass !== 'function') {
        throw new Error('Plugin must export a class');
      }

      const instance = new PluginClass();
      
      if (!instance.metadata) {
        throw new Error('Plugin must have metadata');
      }

      const metadata = instance.metadata as PluginMetadata;
      
      // Check dependencies
      await this.checkDependencies(metadata.dependencies);
      
      // Initialize plugin
      await instance.initialize(this.server);
      
      const loadedPlugin: LoadedPlugin = {
        metadata,
        instance,
        filePath,
        loadTime: Date.now(),
        isActive: true
      };
      
      this.plugins.set(metadata.id, loadedPlugin);
      
      // Set up hot reloading
      if (this.hotReloadEnabled) {
        this.setupHotReload(filePath, metadata.id);
      }
      
      this.emit('plugin:loaded', loadedPlugin);
      console.log(`Plugin loaded: ${metadata.name} v${metadata.version}`);
      
    } catch (error) {
      console.error(`Failed to load plugin from ${filePath}:`, error);
      throw error;
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    try {
      // Cleanup plugin
      if (plugin.instance.destroy) {
        await plugin.instance.destroy();
      }
      
      // Stop watching for changes
      const watcher = this.watchers.get(pluginId);
      if (watcher) {
        watcher.close();
        this.watchers.delete(pluginId);
      }
      
      // Clear from cache
      if (require.cache[plugin.filePath]) {
        delete require.cache[plugin.filePath];
      }
      
      this.plugins.delete(pluginId);
      
      this.emit('plugin:unloaded', plugin);
      console.log(`Plugin unloaded: ${plugin.metadata.name}`);
      
    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error);
      throw error;
    }
  }

  async reloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    const filePath = plugin.filePath;
    
    await this.unloadPlugin(pluginId);
    await this.loadPlugin(filePath);
    
    this.emit('plugin:reloaded', pluginId);
  }

  getPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values());
  }

  getActivePlugins(): LoadedPlugin[] {
    return this.getAllPlugins().filter(p => p.isActive);
  }

  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (plugin.isActive) {
      return;
    }

    if (plugin.instance.activate) {
      await plugin.instance.activate();
    }
    
    plugin.isActive = true;
    this.emit('plugin:activated', plugin);
  }

  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (!plugin.isActive) {
      return;
    }

    if (plugin.instance.deactivate) {
      await plugin.instance.deactivate();
    }
    
    plugin.isActive = false;
    this.emit('plugin:deactivated', plugin);
  }

  private async checkDependencies(dependencies: string[]): Promise<void> {
    for (const dep of dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Missing dependency: ${dep}`);
      }
      
      const depPlugin = this.plugins.get(dep)!;
      if (!depPlugin.isActive) {
        throw new Error(`Dependency not active: ${dep}`);
      }
    }
  }

  private setupHotReload(filePath: string, pluginId: string): void {
    const watcher = watch(filePath, (eventType) => {
      if (eventType === 'change') {
        console.log(`Plugin file changed: ${filePath}`);
        
        // Debounce reloads
        setTimeout(async () => {
          try {
            await this.reloadPlugin(pluginId);
            console.log(`Plugin hot-reloaded: ${pluginId}`);
          } catch (error) {
            console.error(`Hot reload failed for ${pluginId}:`, error);
          }
        }, 1000);
      }
    });
    
    this.watchers.set(pluginId, watcher);
  }
}
```

### Advanced Analytics Plugin

```typescript
// plugins/AdvancedAnalyticsPlugin.ts
import { Plugin, IXPServer } from '@ixp/server-sdk';
import { EventEmitter } from 'events';

interface AnalyticsEvent {
  id: string;
  type: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  data: Record<string, any>;
  metadata: {
    userAgent?: string;
    ip?: string;
    referer?: string;
  };
}

interface MetricAggregation {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export class AdvancedAnalyticsPlugin implements Plugin {
  name = 'advanced-analytics';
  version = '2.0.0';
  
  metadata = {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    version: '2.0.0',
    author: 'IXP Team',
    description: 'Comprehensive analytics and metrics collection',
    dependencies: [],
    permissions: ['read:requests', 'write:metrics']
  };

  private events: AnalyticsEvent[] = [];
  private metrics = new Map<string, number[]>();
  private realTimeMetrics = new EventEmitter();
  private aggregationInterval: NodeJS.Timeout;
  private server: IXPServer;

  async initialize(server: IXPServer): Promise<void> {
    this.server = server;
    
    // Track all requests
    server.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        this.trackEvent({
          type: 'request',
          data: {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
            contentLength: res.get('content-length') || 0
          },
          userId: req.user?.id,
          sessionId: req.sessionID,
          metadata: {
            userAgent: req.get('user-agent'),
            ip: req.ip,
            referer: req.get('referer')
          }
        });
        
        this.recordMetric('request_duration', duration);
        this.recordMetric(`status_${res.statusCode}`, 1);
      });
      
      next();
    });

    // Track intent processing
    server.on('intent:processed', (data) => {
      this.trackEvent({
        type: 'intent_processed',
        data: {
          intentName: data.intentName,
          confidence: data.confidence,
          processingTime: data.processingTime
        },
        userId: data.userId,
        sessionId: data.sessionId
      });
    });

    // Set up real-time aggregation
    this.aggregationInterval = setInterval(() => {
      this.aggregateMetrics();
    }, 60000); // Every minute

    // Add analytics endpoints
    this.setupEndpoints();
    
    console.log('Advanced Analytics Plugin initialized');
  }

  async destroy(): Promise<void> {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    
    // Export final metrics
    await this.exportMetrics();
    
    console.log('Advanced Analytics Plugin destroyed');
  }

  private trackEvent(eventData: Partial<AnalyticsEvent>): void {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      metadata: {},
      ...eventData
    } as AnalyticsEvent;
    
    this.events.push(event);
    
    // Emit real-time event
    this.realTimeMetrics.emit('event', event);
    
    // Keep only last 10000 events in memory
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }
  }

  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 1000 values per metric
    if (values.length > 1000) {
      values.shift();
    }
  }

  private aggregateMetrics(): void {
    const aggregations = new Map<string, MetricAggregation>();
    
    for (const [name, values] of this.metrics) {
      if (values.length === 0) continue;
      
      const sorted = [...values].sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      
      aggregations.set(name, {
        count: values.length,
        sum,
        avg: sum / values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        percentiles: {
          p50: sorted[Math.floor(sorted.length * 0.5)],
          p90: sorted[Math.floor(sorted.length * 0.9)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)]
        }
      });
    }
    
    // Emit aggregated metrics
    this.realTimeMetrics.emit('aggregation', aggregations);
  }

  private setupEndpoints(): void {
    // Real-time metrics endpoint
    this.server.get('/analytics/realtime', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      const sendEvent = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };
      
      this.realTimeMetrics.on('event', sendEvent);
      this.realTimeMetrics.on('aggregation', sendEvent);
      
      req.on('close', () => {
        this.realTimeMetrics.off('event', sendEvent);
        this.realTimeMetrics.off('aggregation', sendEvent);
      });
    });

    // Metrics summary endpoint
    this.server.get('/analytics/metrics', (req, res) => {
      const summary = {};
      
      for (const [name, values] of this.metrics) {
        if (values.length > 0) {
          const sorted = [...values].sort((a, b) => a - b);
          const sum = values.reduce((a, b) => a + b, 0);
          
          summary[name] = {
            count: values.length,
            avg: sum / values.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            p95: sorted[Math.floor(sorted.length * 0.95)]
          };
        }
      }
      
      res.json(summary);
    });

    // Events query endpoint
    this.server.get('/analytics/events', (req, res) => {
      const { type, userId, limit = 100, offset = 0 } = req.query;
      
      let filteredEvents = this.events;
      
      if (type) {
        filteredEvents = filteredEvents.filter(e => e.type === type);
      }
      
      if (userId) {
        filteredEvents = filteredEvents.filter(e => e.userId === userId);
      }
      
      const paginatedEvents = filteredEvents
        .slice(Number(offset), Number(offset) + Number(limit));
      
      res.json({
        events: paginatedEvents,
        total: filteredEvents.length,
        offset: Number(offset),
        limit: Number(limit)
      });
    });
  }

  private async exportMetrics(): Promise<void> {
    // Export to external analytics service
    const exportData = {
      timestamp: Date.now(),
      metrics: Object.fromEntries(this.metrics),
      events: this.events.slice(-1000) // Last 1000 events
    };
    
    // In a real implementation, send to external service
    console.log('Exporting analytics data:', {
      metricsCount: this.metrics.size,
      eventsCount: exportData.events.length
    });
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## Performance Optimization

### Advanced Caching System

```typescript
// cache/AdvancedCacheSystem.ts
import { EventEmitter } from 'events';

interface CacheEntry<T> {
  value: T;
  ttl: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  memoryUsage: number;
}

export class AdvancedCacheSystem<T = any> extends EventEmitter {
  private cache = new Map<string, CacheEntry<T>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    memoryUsage: 0
  };
  
  private maxSize: number;
  private defaultTtl: number;
  private cleanupInterval: NodeJS.Timeout;
  private tagIndex = new Map<string, Set<string>>();

  constructor(options: {
    maxSize?: number;
    defaultTtl?: number;
    cleanupInterval?: number;
  } = {}) {
    super();
    
    this.maxSize = options.maxSize || 1000;
    this.defaultTtl = options.defaultTtl || 3600000; // 1 hour
    
    // Start cleanup process
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, options.cleanupInterval || 60000); // Every minute
  }

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.emit('miss', key);
      return null;
    }
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      this.emit('miss', key);
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.stats.hits++;
    this.emit('hit', key);
    
    return entry.value;
  }

  async set(
    key: string,
    value: T,
    options: {
      ttl?: number;
      tags?: string[];
    } = {}
  ): Promise<void> {
    const ttl = options.ttl || this.defaultTtl;
    const tags = options.tags || [];
    
    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize) {
      await this.evictLeastUsed();
    }
    
    const entry: CacheEntry<T> = {
      value,
      ttl,
      createdAt: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      tags
    };
    
    this.cache.set(key, entry);
    this.updateTagIndex(key, tags);
    
    this.stats.sets++;
    this.updateMemoryUsage();
    this.emit('set', key, value);
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    
    this.cache.delete(key);
    this.removeFromTagIndex(key, entry.tags);
    
    this.stats.deletes++;
    this.updateMemoryUsage();
    this.emit('delete', key);
    
    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
    this.updateMemoryUsage();
    this.emit('clear');
  }

  // Invalidate by tags
  async invalidateByTag(tag: string): Promise<number> {
    const keys = this.tagIndex.get(tag);
    if (!keys) {
      return 0;
    }
    
    let count = 0;
    for (const key of keys) {
      if (await this.delete(key)) {
        count++;
      }
    }
    
    return count;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.createdAt > entry.ttl;
  }

  private async evictLeastUsed(): Promise<void> {
    let leastUsedKey: string | null = null;
    let leastUsedEntry: CacheEntry<T> | null = null;
    
    for (const [key, entry] of this.cache) {
      if (!leastUsedEntry || 
          entry.accessCount < leastUsedEntry.accessCount ||
          (entry.accessCount === leastUsedEntry.accessCount && 
           entry.lastAccessed < leastUsedEntry.lastAccessed)) {
        leastUsedKey = key;
        leastUsedEntry = entry;
      }
    }
    
    if (leastUsedKey) {
      await this.delete(leastUsedKey);
      this.stats.evictions++;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (now - entry.createdAt > entry.ttl) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.delete(key);
    }
    
    this.emit('cleanup', expiredKeys.length);
  }

  private updateTagIndex(key: string, tags: string[]): void {
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  private removeFromTagIndex(key: string, tags: string[]): void {
    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }
  }

  private updateMemoryUsage(): void {
    // Rough estimation of memory usage
    let usage = 0;
    for (const [key, entry] of this.cache) {
      usage += key.length * 2; // String characters
      usage += JSON.stringify(entry.value).length * 2;
      usage += 64; // Overhead for entry metadata
    }
    this.stats.memoryUsage = usage;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}
```

### Usage Example

```typescript
// Advanced server setup
const server = new IXPServer({
  port: 3000,
  middleware: [
    new SecurityMiddleware(),
    new AdvancedMiddlewareChain([
      new AuthenticationMiddleware(),
      new RateLimitingMiddleware(),
      new ValidationMiddleware()
    ])
  ]
});

// Initialize services
const serviceRegistry = new ServiceRegistry();
const intentProcessor = new DistributedIntentProcessor(serviceRegistry);
const loadBalancer = new LoadBalancer();
const pluginManager = new PluginManager();
const cacheSystem = new AdvancedCacheSystem<any>({
  maxSize: 10000,
  defaultTtl: 300000, // 5 minutes
  cleanupInterval: 60000 // 1 minute
});

// Register services
serviceRegistry.register('intent-processor', intentProcessor);
serviceRegistry.register('load-balancer', loadBalancer);
serviceRegistry.register('cache', cacheSystem);

// Load plugins
await pluginManager.loadPlugin(new AdvancedAnalyticsPlugin());

// Create orchestration engine
const orchestrationEngine = new IntentOrchestrationEngine();

// Register complex intents
orchestrationEngine.registerIntent(new ConversationIntent({
  name: 'multi-turn-booking',
  steps: [
    { name: 'collect-destination', required: true },
    { name: 'collect-dates', required: true },
    { name: 'collect-preferences', required: false },
    { name: 'confirm-booking', required: true }
  ]
}));

// Setup component factory
const componentFactory = new ComponentFactory();
componentFactory.register('reactive-dashboard', ReactiveComponent);

// Start server
server.start();
console.log('Advanced IXP Server running on port 3000');
```

## Running the Examples

### Prerequisites

```bash
# Install dependencies
npm install

# Install additional packages for advanced examples
npm install redis ioredis bull ws socket.io
npm install --save-dev @types/redis @types/ws
```

### Environment Setup

```bash
# Create .env file
cat > .env << EOF
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:password@localhost:5432/ixp_advanced
JWT_SECRET=your-jwt-secret-key
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
EOF
```

### Running Individual Examples

```bash
# Multi-service architecture
npx tsx examples/advanced/multi-service.ts

# Intent orchestration
npx tsx examples/advanced/intent-orchestration.ts

# Component system
npx tsx examples/advanced/component-system.ts

# Middleware pipeline
npx tsx examples/advanced/middleware-pipeline.ts

# Plugin ecosystem
npx tsx examples/advanced/plugin-ecosystem.ts

# Performance optimization
npx tsx examples/advanced/performance-optimization.ts
```

### Testing Advanced Features

```bash
# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance

# Run load tests
npm run test:load
```

## Key Takeaways

- **Scalability**: Use service registry and load balancing for horizontal scaling
- **Modularity**: Implement plugin architecture for extensible functionality
- **Performance**: Leverage advanced caching and optimization techniques
- **Reliability**: Implement comprehensive error handling and recovery mechanisms
- **Maintainability**: Use composition patterns and dependency injection
- **Monitoring**: Integrate analytics and performance monitoring from the start

These advanced examples demonstrate production-ready patterns for building scalable, maintainable, and high-performance applications with the IXP Server SDK.
```