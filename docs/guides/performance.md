# Performance Optimization Guide

This guide covers performance optimization strategies and best practices for IXP Server applications.

## Table of Contents

- [Performance Overview](#performance-overview)
- [Application Performance](#application-performance)
- [Database Optimization](#database-optimization)
- [Caching Strategies](#caching-strategies)
- [Memory Management](#memory-management)
- [Network Optimization](#network-optimization)
- [Monitoring and Profiling](#monitoring-and-profiling)
- [Load Testing](#load-testing)
- [Best Practices](#best-practices)

## Performance Overview

### Key Metrics

```typescript
interface PerformanceMetrics {
  responseTime: number;     // Average response time (ms)
  throughput: number;       // Requests per second
  errorRate: number;        // Error percentage
  cpuUsage: number;         // CPU utilization (%)
  memoryUsage: number;      // Memory usage (MB)
  dbConnections: number;    // Active DB connections
}
```

### Performance Targets

```typescript
const performanceTargets = {
  responseTime: {
    p50: 100,   // 50th percentile < 100ms
    p95: 500,   // 95th percentile < 500ms
    p99: 1000   // 99th percentile < 1000ms
  },
  throughput: {
    minimum: 1000,  // At least 1000 RPS
    target: 5000    // Target 5000 RPS
  },
  errorRate: {
    maximum: 0.1    // Less than 0.1% errors
  }
};
```

## Application Performance

### Intent Processing Optimization

```typescript
// Optimized intent matcher with caching
class OptimizedIntentMatcher {
  private cache = new Map<string, Intent>();
  private compiledPatterns = new Map<string, RegExp>();

  constructor(private intents: Intent[]) {
    this.precompilePatterns();
  }

  private precompilePatterns(): void {
    this.intents.forEach(intent => {
      if (intent.pattern) {
        this.compiledPatterns.set(
          intent.id,
          new RegExp(intent.pattern, 'i')
        );
      }
    });
  }

  async match(input: string): Promise<Intent | null> {
    // Check cache first
    const cacheKey = this.getCacheKey(input);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Fast pattern matching
    for (const intent of this.intents) {
      const pattern = this.compiledPatterns.get(intent.id);
      if (pattern && pattern.test(input)) {
        this.cache.set(cacheKey, intent);
        return intent;
      }
    }

    return null;
  }

  private getCacheKey(input: string): string {
    return input.toLowerCase().trim();
  }
}
```

### Async Processing

```typescript
// Parallel intent processing
class ParallelIntentProcessor {
  async processIntents(inputs: string[]): Promise<ProcessedIntent[]> {
    const promises = inputs.map(input => 
      this.processIntent(input)
    );

    return Promise.all(promises);
  }

  async processBatch(inputs: string[], batchSize = 10): Promise<ProcessedIntent[]> {
    const results: ProcessedIntent[] = [];
    
    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      const batchResults = await this.processIntents(batch);
      results.push(...batchResults);
    }

    return results;
  }
}
```

### Component Optimization

```typescript
// Lazy loading components
class ComponentLoader {
  private componentCache = new Map<string, Component>();
  private loadingPromises = new Map<string, Promise<Component>>();

  async loadComponent(name: string): Promise<Component> {
    // Return cached component
    if (this.componentCache.has(name)) {
      return this.componentCache.get(name)!;
    }

    // Return existing loading promise
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name)!;
    }

    // Start loading
    const loadingPromise = this.doLoadComponent(name);
    this.loadingPromises.set(name, loadingPromise);

    try {
      const component = await loadingPromise;
      this.componentCache.set(name, component);
      return component;
    } finally {
      this.loadingPromises.delete(name);
    }
  }

  private async doLoadComponent(name: string): Promise<Component> {
    const module = await import(`./components/${name}`);
    return new module.default();
  }
}
```

## Database Optimization

### Connection Pooling

```typescript
// Optimized database configuration
const dbConfig = {
  pool: {
    min: 5,           // Minimum connections
    max: 20,          // Maximum connections
    idle: 10000,      // Idle timeout (10s)
    acquire: 60000,   // Acquire timeout (60s)
    evict: 1000       // Eviction interval (1s)
  },
  dialectOptions: {
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000
  }
};
```

### Query Optimization

```typescript
// Efficient queries with proper indexing
class OptimizedQueries {
  // Use indexes for frequent queries
  async findUserByEmail(email: string): Promise<User | null> {
    return User.findOne({
      where: { email },
      attributes: ['id', 'email', 'name'], // Select only needed fields
      raw: true // Return plain object instead of model instance
    });
  }

  // Batch queries to reduce round trips
  async findUsersByIds(ids: number[]): Promise<User[]> {
    return User.findAll({
      where: {
        id: {
          [Op.in]: ids
        }
      },
      raw: true
    });
  }

  // Use pagination for large datasets
  async findUsersWithPagination(
    page: number,
    limit: number
  ): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await User.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      raw: true
    });

    return {
      users: rows,
      total: count
    };
  }
}
```

### Database Indexes

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_intents_pattern ON intents(pattern);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);

-- Composite indexes for complex queries
CREATE INDEX idx_user_sessions ON sessions(user_id, created_at);
CREATE INDEX idx_intent_context ON intent_contexts(intent_id, context_type);
```

## Caching Strategies

### Multi-Level Caching

```typescript
// Implement multiple cache layers
class MultiLevelCache {
  constructor(
    private memoryCache: MemoryCache,
    private redisCache: RedisCache
  ) {}

  async get<T>(key: string): Promise<T | null> {
    // L1: Memory cache (fastest)
    let value = await this.memoryCache.get<T>(key);
    if (value !== null) {
      return value;
    }

    // L2: Redis cache
    value = await this.redisCache.get<T>(key);
    if (value !== null) {
      // Populate memory cache
      await this.memoryCache.set(key, value, 300); // 5 minutes
      return value;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // Set in both caches
    await Promise.all([
      this.memoryCache.set(key, value, Math.min(ttl, 300)),
      this.redisCache.set(key, value, ttl)
    ]);
  }
}
```

### Cache Warming

```typescript
// Pre-populate cache with frequently accessed data
class CacheWarmer {
  constructor(
    private cache: MultiLevelCache,
    private dataService: DataService
  ) {}

  async warmCache(): Promise<void> {
    console.log('Starting cache warming...');

    await Promise.all([
      this.warmUserCache(),
      this.warmIntentCache(),
      this.warmConfigCache()
    ]);

    console.log('Cache warming completed');
  }

  private async warmUserCache(): Promise<void> {
    const activeUsers = await this.dataService.getActiveUsers();
    
    await Promise.all(
      activeUsers.map(user =>
        this.cache.set(`user:${user.id}`, user, 3600)
      )
    );
  }

  private async warmIntentCache(): Promise<void> {
    const intents = await this.dataService.getAllIntents();
    await this.cache.set('intents:all', intents, 7200);
  }
}
```

## Memory Management

### Memory Monitoring

```typescript
// Monitor memory usage
class MemoryMonitor {
  private readonly maxMemoryUsage = 0.8; // 80% of available memory

  startMonitoring(): void {
    setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds
  }

  private checkMemoryUsage(): void {
    const usage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const usagePercent = usage.heapUsed / totalMemory;

    if (usagePercent > this.maxMemoryUsage) {
      console.warn('High memory usage detected:', {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
        usagePercent: Math.round(usagePercent * 100)
      });

      this.triggerGarbageCollection();
    }
  }

  private triggerGarbageCollection(): void {
    if (global.gc) {
      global.gc();
      console.log('Garbage collection triggered');
    }
  }
}
```

### Object Pooling

```typescript
// Reuse objects to reduce GC pressure
class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire(): T {
    const obj = this.pool.pop();
    return obj || this.createFn();
  }

  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}

// Usage example
const contextPool = new ObjectPool(
  () => ({ user: null, session: null, data: {} }),
  (ctx) => {
    ctx.user = null;
    ctx.session = null;
    ctx.data = {};
  }
);
```

## Network Optimization

### Response Compression

```typescript
// Enable compression middleware
app.use(compression({
  level: 6,           // Compression level (1-9)
  threshold: 1024,    // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Use compression for text-based responses
    return compression.filter(req, res);
  }
}));
```

### HTTP/2 Support

```typescript
// Enable HTTP/2 for better performance
import http2 from 'http2';
import fs from 'fs';

const server = http2.createSecureServer({
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
});

server.on('stream', (stream, headers) => {
  // Handle HTTP/2 streams
  stream.respond({
    'content-type': 'application/json',
    ':status': 200
  });
  
  stream.end(JSON.stringify({ message: 'Hello HTTP/2!' }));
});
```

### Connection Keep-Alive

```typescript
// Configure keep-alive settings
const server = app.listen(port, () => {
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000;   // 66 seconds
});
```

## Monitoring and Profiling

### Performance Metrics Collection

```typescript
// Collect detailed performance metrics
class PerformanceCollector {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }

  getStats(name: string): PerformanceStats | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
}
```

### Request Timing Middleware

```typescript
// Measure request processing time
function timingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    performanceCollector.recordMetric('request_duration', duration);
    performanceCollector.recordMetric(`request_duration_${req.method}`, duration);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn('Slow request detected:', {
        method: req.method,
        url: req.url,
        duration: Math.round(duration),
        userAgent: req.get('User-Agent')
      });
    }
  });
  
  next();
}
```

## Load Testing

### Artillery Configuration

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 100
      name: "Sustained load"
  payload:
    path: "test-data.csv"
    fields:
      - "userId"
      - "message"

scenarios:
  - name: "Intent Processing"
    weight: 70
    flow:
      - post:
          url: "/api/intents/process"
          json:
            message: "{{ message }}"
            userId: "{{ userId }}"
      - think: 1

  - name: "User Session"
    weight: 30
    flow:
      - get:
          url: "/api/users/{{ userId }}/session"
      - think: 2
```

### Load Testing Script

```typescript
// load-test.ts
import { spawn } from 'child_process';

class LoadTester {
  async runLoadTest(configFile: string): Promise<void> {
    console.log('Starting load test...');
    
    const artillery = spawn('artillery', ['run', configFile], {
      stdio: 'inherit'
    });
    
    return new Promise((resolve, reject) => {
      artillery.on('close', (code) => {
        if (code === 0) {
          console.log('Load test completed successfully');
          resolve();
        } else {
          reject(new Error(`Load test failed with code ${code}`));
        }
      });
    });
  }

  async runPerformanceTest(): Promise<void> {
    // Start monitoring
    const monitor = new PerformanceMonitor();
    monitor.start();
    
    try {
      await this.runLoadTest('artillery-config.yml');
      
      // Generate performance report
      const report = monitor.generateReport();
      console.log('Performance Report:', report);
      
    } finally {
      monitor.stop();
    }
  }
}
```

## Best Practices

### Performance Checklist

```typescript
// Performance optimization checklist
const performanceChecklist = {
  application: [
    'Enable compression middleware',
    'Implement request/response caching',
    'Use connection pooling for databases',
    'Optimize database queries and indexes',
    'Implement lazy loading for components',
    'Use async/await for I/O operations',
    'Enable HTTP/2 support',
    'Configure proper keep-alive settings'
  ],
  
  monitoring: [
    'Set up performance metrics collection',
    'Monitor memory usage and GC',
    'Track response times and throughput',
    'Set up alerting for performance issues',
    'Regular load testing',
    'Profile application under load'
  ],
  
  deployment: [
    'Use CDN for static assets',
    'Enable horizontal scaling',
    'Configure load balancer properly',
    'Use container orchestration',
    'Implement health checks',
    'Set up auto-scaling policies'
  ]
};
```

### Performance Testing Strategy

```typescript
// Comprehensive performance testing
class PerformanceTestSuite {
  async runAllTests(): Promise<void> {
    console.log('Running performance test suite...');
    
    await this.runUnitPerformanceTests();
    await this.runIntegrationPerformanceTests();
    await this.runLoadTests();
    await this.runStressTests();
    
    console.log('Performance test suite completed');
  }

  private async runUnitPerformanceTests(): Promise<void> {
    // Test individual component performance
    const intentMatcher = new OptimizedIntentMatcher(testIntents);
    
    const startTime = performance.now();
    for (let i = 0; i < 10000; i++) {
      await intentMatcher.match('test message');
    }
    const endTime = performance.now();
    
    const avgTime = (endTime - startTime) / 10000;
    console.log(`Intent matching avg time: ${avgTime.toFixed(2)}ms`);
    
    // Assert performance requirements
    if (avgTime > 1) {
      throw new Error('Intent matching too slow');
    }
  }

  private async runLoadTests(): Promise<void> {
    // Run load tests with different scenarios
    const scenarios = [
      { name: 'Low Load', rps: 100, duration: 60 },
      { name: 'Medium Load', rps: 500, duration: 120 },
      { name: 'High Load', rps: 1000, duration: 180 }
    ];
    
    for (const scenario of scenarios) {
      console.log(`Running ${scenario.name} test...`);
      await this.runLoadScenario(scenario);
    }
  }
}
```

### Optimization Guidelines

1. **Measure First**: Always profile before optimizing
2. **Focus on Bottlenecks**: Optimize the slowest parts first
3. **Cache Strategically**: Cache expensive operations and frequently accessed data
4. **Optimize Database**: Use proper indexes, connection pooling, and query optimization
5. **Monitor Continuously**: Set up comprehensive monitoring and alerting
6. **Test Regularly**: Run performance tests as part of CI/CD pipeline
7. **Scale Horizontally**: Design for horizontal scaling from the start
8. **Use Async Operations**: Avoid blocking operations in the main thread

## Conclusion

Performance optimization is an ongoing process that requires:

- **Continuous Monitoring**: Track key metrics and identify bottlenecks
- **Regular Testing**: Perform load testing and performance profiling
- **Proactive Optimization**: Address performance issues before they impact users
- **Scalable Architecture**: Design systems that can handle growth
- **Best Practices**: Follow established patterns and guidelines

By implementing these strategies and maintaining a performance-focused mindset, you can ensure your IXP Server applications deliver excellent user experiences at scale.
