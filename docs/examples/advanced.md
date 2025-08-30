# Advanced Examples

This document provides complex, real-world examples demonstrating advanced features and patterns with the IXP Server SDK.

## Table of Contents

- [Multi-Service Architecture](#multi-service-architecture)
- [Advanced Intent Composition](#advanced-intent-composition)
- [Complex Component Systems](#complex-component-systems)
- [Custom Middleware Pipeline](#custom-middleware-pipeline)
- [Performance Optimization](#performance-optimization)
- [Security Implementation](#security-implementation)
- [Real-time Data Integration](#real-time-data-integration)
- [Advanced Error Handling](#advanced-error-handling)

## Multi-Service Architecture

### Service Registry Pattern

```typescript
// services/ServiceRegistry.ts
import { EventEmitter } from 'events';
import { IXPServer } from 'ixp-server';

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

### Distributed IXP Server Setup

```typescript
// services/DistributedIXPServer.ts
import { IXPServer } from 'ixp-server';
import { ServiceRegistry } from './ServiceRegistry';
import { Request, Response, NextFunction } from 'express';

export class DistributedIXPServer {
  private server: IXPServer;
  private serviceRegistry: ServiceRegistry;
  private serviceId: string;

  constructor(config: {
    port: number;
    serviceId: string;
    registryEndpoint?: string;
  }) {
    this.serviceId = config.serviceId;
    this.serviceRegistry = new ServiceRegistry();
    
    this.server = new IXPServer({
      port: config.port,
      middleware: [
        this.serviceDiscoveryMiddleware.bind(this),
        this.loadBalancingMiddleware.bind(this),
        this.circuitBreakerMiddleware.bind(this)
      ]
    });

    this.setupServiceRegistration(config);
  }

  private async setupServiceRegistration(config: any) {
    // Register this service instance
    const serviceDefinition: ServiceDefinition = {
      id: this.serviceId,
      name: 'IXP Server Instance',
      version: '1.0.0',
      endpoint: `http://localhost:${config.port}`,
      health: `http://localhost:${config.port}/health`,
      capabilities: ['intent:processing', 'component:rendering'],
      metadata: {
        startTime: new Date().toISOString(),
        nodeVersion: process.version
      }
    };

    await this.serviceRegistry.register(serviceDefinition);
  }

  registerDistributedIntent(intentDef: {
    name: string;
    description: string;
    parameters: any;
    component: string;
    version: string;
    distributed?: {
      strategy: 'round-robin' | 'least-load' | 'geo-proximity';
      fallback?: boolean;
      timeout?: number;
    };
  }) {
    this.server.registerIntent({
      name: intentDef.name,
      description: intentDef.description,
      parameters: intentDef.parameters,
      component: intentDef.component,
      version: intentDef.version,
      metadata: {
        distributed: intentDef.distributed || { strategy: 'round-robin' }
      }
    });
  }

  private serviceDiscoveryMiddleware(req: Request, res: Response, next: NextFunction) {
    // Add service discovery information to request
    (req as any).services = this.serviceRegistry.getAllServices();
    (req as any).serviceRegistry = this.serviceRegistry;
    next();
  }

  private loadBalancingMiddleware(req: Request, res: Response, next: NextFunction) {
    // Implement load balancing logic for distributed requests
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      // Record metrics for load balancing decisions
      console.log(`Request processed in ${duration}ms`);
    });
    
    next();
  }

  private circuitBreakerMiddleware(req: Request, res: Response, next: NextFunction) {
    // Implement circuit breaker pattern for service resilience
    const serviceHealth = this.serviceRegistry.getAllServices()
      .filter(service => service.capabilities.includes('intent:processing'));
    
    if (serviceHealth.length === 0) {
      return res.status(503).json({ 
        error: 'No healthy services available',
        circuitBreaker: 'open'
      });
    }
    
    next();
  }

  async start() {
    await this.server.start();
    console.log(`Distributed IXP Server ${this.serviceId} started`);
  }

  async stop() {
    await this.serviceRegistry.unregister(this.serviceId);
    await this.server.stop();
  }
}
```

## Advanced Intent Composition

### Workflow Engine for Intent Orchestration

```typescript
// intents/WorkflowEngine.ts
import { IXPServer } from 'ixp-server';

interface WorkflowStep {
  id: string;
  intentName: string;
  condition?: (context: any, results: Map<string, any>) => boolean;
  transform?: (input: any) => any;
  parallel?: boolean;
  retries?: number;
  timeout?: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  errorHandling: 'stop' | 'continue' | 'retry';
  maxRetries?: number;
}

export class WorkflowEngine {
  private workflows = new Map<string, Workflow>();
  private server: IXPServer;

  constructor(server: IXPServer) {
    this.server = server;
    this.registerWorkflowIntents();
  }

  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
    
    // Register a dynamic intent for this workflow
    this.server.registerIntent({
      name: `workflow_${workflow.id}`,
      description: `Execute workflow: ${workflow.description}`,
      parameters: {
        type: 'object',
        properties: {
          input: {
            type: 'object',
            description: 'Input data for the workflow'
          },
          context: {
            type: 'object',
            description: 'Additional context for workflow execution',
            default: {}
          }
        },
        required: ['input']
      },
      component: 'WorkflowResult',
      version: '1.0.0',
      metadata: {
        workflowId: workflow.id,
        isWorkflow: true
      }
    });
  }

  private registerWorkflowIntents() {
    // Register workflow execution component
    this.server.registerComponent({
      name: 'WorkflowResult',
      description: 'Display workflow execution results',
      props: {
        type: 'object',
        properties: {
          workflowId: { type: 'string' },
          status: { type: 'string' },
          results: { type: 'object' },
          executionTime: { type: 'number' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                status: { type: 'string' },
                result: { type: 'object' },
                duration: { type: 'number' }
              }
            }
          }
        },
        required: ['workflowId', 'status']
      },
      render: async (props) => {
        const { workflowId, status, results, executionTime, steps } = props;
        
        return {
          type: 'div',
          props: { className: `workflow-result status-${status}` },
          children: [
            {
              type: 'header',
              props: { className: 'workflow-header' },
              children: [
                {
                  type: 'h2',
                  children: [`Workflow: ${workflowId}`]
                },
                {
                  type: 'div',
                  props: { className: 'workflow-status' },
                  children: [
                    {
                      type: 'span',
                      props: { className: `status-badge ${status}` },
                      children: [status.toUpperCase()]
                    },
                    executionTime && {
                      type: 'span',
                      props: { className: 'execution-time' },
                      children: [`${executionTime}ms`]
                    }
                  ].filter(Boolean)
                }
              ]
            },
            steps && {
              type: 'div',
              props: { className: 'workflow-steps' },
              children: [
                {
                  type: 'h3',
                  children: ['Execution Steps']
                },
                {
                  type: 'div',
                  props: { className: 'steps-list' },
                  children: steps.map((step: any) => ({
                    type: 'div',
                    props: { 
                      className: `step-item status-${step.status}`,
                      'data-step-id': step.id
                    },
                    children: [
                      {
                        type: 'div',
                        props: { className: 'step-header' },
                        children: [
                          {
                            type: 'span',
                            props: { className: 'step-id' },
                            children: [step.id]
                          },
                          {
                            type: 'span',
                            props: { className: 'step-status' },
                            children: [step.status]
                          },
                          step.duration && {
                            type: 'span',
                            props: { className: 'step-duration' },
                            children: [`${step.duration}ms`]
                          }
                        ].filter(Boolean)
                      },
                      step.result && {
                        type: 'div',
                        props: { className: 'step-result' },
                        children: [
                          {
                            type: 'pre',
                            children: [JSON.stringify(step.result, null, 2)]
                          }
                        ]
                      }
                    ].filter(Boolean)
                  }))
                }
              ]
            },
            results && {
              type: 'div',
              props: { className: 'workflow-results' },
              children: [
                {
                  type: 'h3',
                  children: ['Final Results']
                },
                {
                  type: 'pre',
                  props: { className: 'results-json' },
                  children: [JSON.stringify(results, null, 2)]
                }
              ]
            }
          ].filter(Boolean)
        };
      }
    });
  }

  async executeWorkflow(workflowId: string, input: any, context: any = {}): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const startTime = Date.now();
    const results = new Map<string, any>();
    const stepResults: any[] = [];
    
    try {
      // Group steps by parallel execution
      const stepGroups = this.groupStepsByParallelism(workflow.steps);
      
      for (const group of stepGroups) {
        if (group.length === 1) {
          // Sequential execution
          const stepResult = await this.executeStep(group[0], input, context, results);
          results.set(group[0].id, stepResult.result);
          stepResults.push(stepResult);
        } else {
          // Parallel execution
          const promises = group.map(step => 
            this.executeStep(step, input, context, results)
          );
          const groupResults = await Promise.all(promises);
          
          group.forEach((step, index) => {
            results.set(step.id, groupResults[index].result);
            stepResults.push(groupResults[index]);
          });
        }
      }

      const executionTime = Date.now() - startTime;
      const finalResults = this.combineResults(results);

      return {
        workflowId,
        status: 'completed',
        results: finalResults,
        executionTime,
        steps: stepResults
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        workflowId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        steps: stepResults
      };
    }
  }

  private groupStepsByParallelism(steps: WorkflowStep[]): WorkflowStep[][] {
    const groups: WorkflowStep[][] = [];
    let currentGroup: WorkflowStep[] = [];

    for (const step of steps) {
      if (step.parallel && currentGroup.length > 0) {
        currentGroup.push(step);
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [step];
      }
    }
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  private async executeStep(
    step: WorkflowStep,
    input: any,
    context: any,
    previousResults: Map<string, any>
  ): Promise<any> {
    const stepStartTime = Date.now();
    
    try {
      // Check condition if present
      if (step.condition && !step.condition(context, previousResults)) {
        return {
          id: step.id,
          status: 'skipped',
          result: null,
          duration: Date.now() - stepStartTime
        };
      }

      // Transform input if needed
      let stepInput = input;
      if (step.transform) {
        stepInput = step.transform(input);
      }

      // Execute the intent via server rendering
      const renderResult = await this.server.render({
        intent: {
          name: step.intentName,
          parameters: stepInput
        }
      });

      return {
        id: step.id,
        status: 'completed',
        result: renderResult,
        duration: Date.now() - stepStartTime
      };

    } catch (error) {
      return {
        id: step.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - stepStartTime
      };
    }
  }

  private combineResults(results: Map<string, any>): any {
    const combined: any = {};
    
    for (const [stepId, result] of results) {
      if (result && typeof result === 'object') {
        combined[stepId] = result;
      }
    }
    
    return combined;
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

## Security Implementation

### Input Validation and Sanitization

```typescript
// security/InputValidator.ts
import { Request, Response, NextFunction } from 'express';

interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  sanitize?: boolean;
  allowedValues?: any[];
}

interface ValidationSchema {
  body?: ValidationRule[];
  query?: ValidationRule[];
  params?: ValidationRule[];
}

export class InputValidator {
  static validate(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      const errors: string[] = [];

      // Validate body
      if (schema.body) {
        const bodyErrors = this.validateObject(req.body, schema.body, 'body');
        errors.push(...bodyErrors);
      }

      // Validate query parameters
      if (schema.query) {
        const queryErrors = this.validateObject(req.query, schema.query, 'query');
        errors.push(...queryErrors);
      }

      // Validate URL parameters
      if (schema.params) {
        const paramErrors = this.validateObject(req.params, schema.params, 'params');
        errors.push(...paramErrors);
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }

      next();
    };
  }

  private static validateObject(
    obj: any,
    rules: ValidationRule[],
    context: string
  ): string[] {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = obj[rule.field];
      const fieldPath = `${context}.${rule.field}`;

      // Check required fields
      if (rule.required && (value === undefined || value === null)) {
        errors.push(`${fieldPath} is required`);
        continue;
      }

      // Skip validation if field is not present and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      if (!this.validateType(value, rule.type)) {
        errors.push(`${fieldPath} must be of type ${rule.type}`);
        continue;
      }

      // String-specific validations
      if (rule.type === 'string' && typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${fieldPath} must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${fieldPath} must be no more than ${rule.maxLength} characters`);
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${fieldPath} format is invalid`);
        }
      }

      // Allowed values validation
      if (rule.allowedValues && !rule.allowedValues.includes(value)) {
        errors.push(`${fieldPath} must be one of: ${rule.allowedValues.join(', ')}`);
      }

      // Sanitize if requested
      if (rule.sanitize && typeof value === 'string') {
        obj[rule.field] = this.sanitizeString(value);
      }
    }

    return errors;
  }

  private static validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return false;
    }
  }

  private static sanitizeString(input: string): string {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }
}
```

## Real-time Data Integration

### WebSocket Integration

```typescript
// realtime/WebSocketManager.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { IXPServer } from 'ixp-server';

interface SocketSession {
  id: string;
  userId?: string;
  rooms: Set<string>;
  metadata: Record<string, any>;
  connectedAt: number;
}

export class WebSocketManager {
  private io: SocketIOServer;
  private sessions = new Map<string, SocketSession>();
  private server: IXPServer;

  constructor(httpServer: HTTPServer, ixpServer: IXPServer) {
    this.server = ixpServer;
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Create session
      const session: SocketSession = {
        id: socket.id,
        rooms: new Set(),
        metadata: {},
        connectedAt: Date.now()
      };
      this.sessions.set(socket.id, session);

      // Handle authentication
      socket.on('authenticate', async (data) => {
        try {
          const { token } = data;
          // Validate token and get user info
          const user = await this.validateToken(token);
          session.userId = user.id;
          session.metadata.user = user;
          
          socket.emit('authenticated', { success: true, user });
        } catch (error) {
          socket.emit('authentication_error', { 
            error: error instanceof Error ? error.message : 'Authentication failed' 
          });
        }
      });

      // Handle room joining
      socket.on('join_room', (roomName: string) => {
        socket.join(roomName);
        session.rooms.add(roomName);
        socket.emit('joined_room', { room: roomName });
      });

      // Handle room leaving
      socket.on('leave_room', (roomName: string) => {
        socket.leave(roomName);
        session.rooms.delete(roomName);
        socket.emit('left_room', { room: roomName });
      });

      // Handle real-time intent processing
      socket.on('process_intent', async (data) => {
        try {
          const { intent, parameters } = data;
          
          // Process intent through IXP server
          const result = await this.server.render({
            intent: {
              name: intent,
              parameters
            }
          });

          socket.emit('intent_result', {
            success: true,
            result,
            requestId: data.requestId
          });

          // Broadcast to relevant rooms if needed
          if (data.broadcast) {
            this.broadcastToRooms(data.broadcast.rooms, 'intent_broadcast', {
              intent,
              result,
              from: session.userId
            });
          }

        } catch (error) {
          socket.emit('intent_error', {
            error: error instanceof Error ? error.message : 'Intent processing failed',
            requestId: data.requestId
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.sessions.delete(socket.id);
      });
    });
  }

  // Broadcast to specific rooms
  broadcastToRooms(rooms: string[], event: string, data: any): void {
    for (const room of rooms) {
      this.io.to(room).emit(event, data);
    }
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // Send to specific user
  sendToUser(userId: string, event: string, data: any): boolean {
    const session = Array.from(this.sessions.values())
      .find(s => s.userId === userId);
    
    if (session) {
      this.io.to(session.id).emit(event, data);
      return true;
    }
    
    return false;
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return Array.from(this.sessions.values())
      .filter(s => s.userId).length;
  }

  // Get sessions by room
  getSessionsByRoom(roomName: string): SocketSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.rooms.has(roomName));
  }

  private async validateToken(token: string): Promise<any> {
    // Implement token validation logic
    // This should integrate with your authentication system
    throw new Error('Token validation not implemented');
  }
}
```

## Advanced Error Handling

### Comprehensive Error Management

```typescript
// errors/ErrorManager.ts
import { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';

interface ErrorContext {
  requestId: string;
  userId?: string;
  timestamp: number;
  url: string;
  method: string;
  userAgent?: string;
  ip: string;
}

interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  handled: boolean;
}

export class ErrorManager extends EventEmitter {
  private errorReports: ErrorReport[] = [];
  private errorCounts = new Map<string, number>();
  private rateLimits = new Map<string, number>();

  constructor() {
    super();
    this.setupGlobalErrorHandlers();
  }

  // Express error middleware
  middleware() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
      const context: ErrorContext = {
        requestId: this.generateRequestId(),
        userId: (req as any).user?.id,
        timestamp: Date.now(),
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };

      const report = this.createErrorReport(error, context);
      this.handleError(report);

      // Send appropriate response
      if (!res.headersSent) {
        const statusCode = this.getStatusCode(error);
        const response = this.formatErrorResponse(error, report.id, statusCode);
        res.status(statusCode).json(response);
      }
    };
  }

  // Handle different types of errors
  private createErrorReport(error: Error, context: ErrorContext): ErrorReport {
    const report: ErrorReport = {
      id: this.generateErrorId(),
      error,
      context,
      severity: this.determineSeverity(error),
      category: this.categorizeError(error),
      handled: false
    };

    this.errorReports.push(report);
    
    // Keep only last 1000 error reports
    if (this.errorReports.length > 1000) {
      this.errorReports = this.errorReports.slice(-1000);
    }

    return report;
  }

  private handleError(report: ErrorReport): void {
    // Update error counts
    const errorKey = `${report.category}:${report.error.name}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Check for error rate limiting
    if (this.shouldRateLimit(errorKey)) {
      console.warn(`Error rate limit exceeded for ${errorKey}`);
      return;
    }

    // Log error based on severity
    this.logError(report);

    // Emit error event for external handlers
    this.emit('error', report);

    // Handle critical errors
    if (report.severity === 'critical') {
      this.handleCriticalError(report);
    }

    report.handled = true;
  }

  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    // Determine severity based on error type and message
    if (error.name === 'ValidationError') return 'low';
    if (error.name === 'UnauthorizedError') return 'medium';
    if (error.name === 'DatabaseError') return 'high';
    if (error.message.includes('ECONNREFUSED')) return 'critical';
    if (error.message.includes('out of memory')) return 'critical';
    
    return 'medium';
  }

  private categorizeError(error: Error): string {
    // Categorize errors for better organization
    if (error.name.includes('Validation')) return 'validation';
    if (error.name.includes('Auth')) return 'authentication';
    if (error.name.includes('Database')) return 'database';
    if (error.name.includes('Network')) return 'network';
    if (error.name.includes('Permission')) return 'authorization';
    
    return 'general';
  }

  private getStatusCode(error: Error): number {
    // Map error types to HTTP status codes
    if (error.name === 'ValidationError') return 400;
    if (error.name === 'UnauthorizedError') return 401;
    if (error.name === 'ForbiddenError') return 403;
    if (error.name === 'NotFoundError') return 404;
    if (error.name === 'ConflictError') return 409;
    if (error.name === 'RateLimitError') return 429;
    
    return 500;
  }

  private formatErrorResponse(error: Error, errorId: string, statusCode: number): any {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const response: any = {
      error: {
        id: errorId,
        message: error.message,
        type: error.name,
        timestamp: new Date().toISOString()
      }
    };

    // Include stack trace in development
    if (isDevelopment) {
      response.error.stack = error.stack;
    }

    // Add helpful information for specific error types
    if (statusCode === 400) {
      response.error.hint = 'Please check your request parameters and try again.';
    } else if (statusCode === 401) {
      response.error.hint = 'Please authenticate and try again.';
    } else if (statusCode === 403) {
      response.error.hint = 'You do not have permission to perform this action.';
    } else if (statusCode === 429) {
      response.error.hint = 'Too many requests. Please wait before trying again.';
    }

    return response;
  }

  private logError(report: ErrorReport): void {
    const logLevel = this.getLogLevel(report.severity);
    const logMessage = this.formatLogMessage(report);

    switch (logLevel) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'info':
        console.info(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  private getLogLevel(severity: string): string {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      case 'low':
        return 'info';
      default:
        return 'log';
    }
  }

  private formatLogMessage(report: ErrorReport): string {
    return `[${report.severity.toUpperCase()}] ${report.category}/${report.error.name}: ${report.error.message} (ID: ${report.id}, User: ${report.context.userId || 'anonymous'}, URL: ${report.context.url})`;
  }

  private shouldRateLimit(errorKey: string): boolean {
    const count = this.errorCounts.get(errorKey) || 0;
    const limit = this.rateLimits.get(errorKey) || 10; // Default limit
    
    return count > limit;
  }

  private handleCriticalError(report: ErrorReport): void {
    // Handle critical errors - could send alerts, notifications, etc.
    console.error(`🚨 CRITICAL ERROR: ${report.error.message}`);
    
    // In a real application, you might:
    // - Send alerts to monitoring systems
    // - Notify administrators
    // - Trigger automated recovery procedures
    
    this.emit('critical_error', report);
  }

  private setupGlobalErrorHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      const context: ErrorContext = {
        requestId: 'global',
        timestamp: Date.now(),
        url: 'N/A',
        method: 'N/A',
        ip: 'N/A'
      };
      
      const report = this.createErrorReport(error, context);
      report.severity = 'critical';
      this.handleError(report);
      
      // Exit process after logging
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      
      const context: ErrorContext = {
        requestId: 'promise',
        timestamp: Date.now(),
        url: 'N/A',
        method: 'N/A',
        ip: 'N/A'
      };
      
      const report = this.createErrorReport(error, context);
      report.severity = 'high';
      this.handleError(report);
    });
  }

  // Utility methods
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for monitoring
  getErrorStats(): any {
    return {
      totalErrors: this.errorReports.length,
      errorsByCategory: this.getErrorsByCategory(),
      errorsBySeverity: this.getErrorsBySeverity(),
      recentErrors: this.errorReports.slice(-10)
    };
  }

  private getErrorsByCategory(): Record<string, number> {
    const categories: Record<string, number> = {};
    
    for (const report of this.errorReports) {
      categories[report.category] = (categories[report.category] || 0) + 1;
    }
    
    return categories;
  }

  private getErrorsBySeverity(): Record<string, number> {
    const severities: Record<string, number> = {};
    
    for (const report of this.errorReports) {
      severities[report.severity] = (severities[report.severity] || 0) + 1;
    }
    
    return severities;
  }
}
```

## Complete Advanced Server Example

```typescript
// examples/CompleteAdvancedServer.ts
import { IXPServer } from 'ixp-server';
import { createServer } from 'http';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { RateLimitMiddleware } from '../middleware/RateLimitMiddleware';
import { InputValidator } from '../security/InputValidator';
import { WebSocketManager } from '../realtime/WebSocketManager';
import { ErrorManager } from '../errors/ErrorManager';
import { AdvancedCacheSystem } from '../cache/AdvancedCacheSystem';
import { WorkflowEngine } from '../intents/WorkflowEngine';

// Configuration
const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  cacheSize: 10000,
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100
};

// Initialize core systems
const errorManager = new ErrorManager();
const cacheSystem = new AdvancedCacheSystem({
  maxSize: config.cacheSize,
  defaultTtl: 300000 // 5 minutes
});

// Initialize middleware
const authMiddleware = new AuthMiddleware({
  jwtSecret: config.jwtSecret,
  tokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  roleHierarchy: {
    'user': [],
    'moderator': ['user'],
    'admin': ['moderator', 'user']
  },
  intentPermissions: {
    'admin_dashboard': ['admin:read'],
    'user_management': ['admin:write']
  }
});

const rateLimitMiddleware = new RateLimitMiddleware({
  windowMs: config.rateLimitWindow,
  maxRequests: config.rateLimitMax
});

// Create IXP Server
const ixpServer = new IXPServer({
  port: config.port,
  middleware: [
    rateLimitMiddleware.middleware(),
    authMiddleware.authenticate(),
    authMiddleware.authorizeIntent(),
    errorManager.middleware()
  ]
});

// Create HTTP server for WebSocket integration
const httpServer = createServer(ixpServer.app);
const wsManager = new WebSocketManager(httpServer, ixpServer);

// Initialize workflow engine
const workflowEngine = new WorkflowEngine(ixpServer);

// Register advanced intents with validation
ixpServer.registerIntent({
  name: 'create_user',
  description: 'Create a new user account',
  parameters: {
    type: 'object',
    properties: {
      email: { type: 'string' },
      password: { type: 'string' },
      name: { type: 'string' }
    },
    required: ['email', 'password', 'name']
  },
  component: 'UserCreationResult',
  version: '1.0.0',
  middleware: [
    InputValidator.validate({
      body: [
        {
          field: 'email',
          type: 'string',
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          sanitize: true
        },
        {
          field: 'password',
          type: 'string',
          required: true,
          minLength: 8
        },
        {
          field: 'name',
          type: 'string',
          required: true,
          minLength: 2,
          maxLength: 50,
          sanitize: true
        }
      ]
    })
  ]
});

// Register components
ixpServer.registerComponent({
  name: 'UserCreationResult',
  description: 'Display user creation result',
  props: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      user: { type: 'object' },
      error: { type: 'string' }
    },
    required: ['success']
  },
  render: async (props) => {
    const { success, user, error } = props;
    
    return {
      type: 'div',
      props: { className: `user-creation ${success ? 'success' : 'error'}` },
      children: [
        {
          type: 'h2',
          children: [success ? 'User Created Successfully' : 'User Creation Failed']
        },
        success && user ? {
          type: 'div',
          props: { className: 'user-info' },
          children: [
            {
              type: 'p',
              children: [`Welcome, ${user.name}!`]
            },
            {
              type: 'p',
              children: [`Email: ${user.email}`]
            }
          ]
        } : null,
        error ? {
          type: 'div',
          props: { className: 'error-message' },
          children: [error]
        } : null
      ].filter(Boolean)
    };
  }
});

// Set up monitoring endpoints
ixpServer.app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cache: cacheSystem.getStats(),
    errors: errorManager.getErrorStats()
  });
});

// Error monitoring
errorManager.on('critical_error', (report) => {
  // Send alert to monitoring system
  console.error('🚨 Critical error detected:', report);
});

// Cache monitoring
cacheSystem.on('eviction', (key) => {
  console.log(`Cache eviction: ${key}`);
});

// Start server
httpServer.listen(config.port, () => {
  console.log(`🚀 Advanced IXP Server running on port ${config.port}`);
  console.log(`📊 Health check available at http://localhost:${config.port}/health`);
  console.log(`🔌 WebSocket server enabled`);
  console.log(`🛡️  Security middleware active`);
  console.log(`📈 Monitoring and error handling enabled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  
  // Close HTTP server
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
  
  // Cleanup cache
  cacheSystem.destroy();
  
  // Exit process
  process.exit(0);
});
```

## Key Takeaways

- **Scalability**: Use service registry and load balancing for horizontal scaling
- **Security**: Implement comprehensive authentication, authorization, and input validation
- **Performance**: Leverage advanced caching and optimization techniques
- **Reliability**: Implement comprehensive error handling and recovery mechanisms
- **Real-time**: Integrate WebSocket support for real-time features
- **Monitoring**: Include health checks, metrics, and error tracking from the start
- **Maintainability**: Use composition patterns and dependency injection

These advanced examples demonstrate production-ready patterns for building scalable, maintainable, and high-performance applications with the IXP Server SDK.