import type { MetricsData } from '../types/index';

/**
 * Metrics Service for tracking server performance and usage
 */
export class MetricsService {
  private requests: {
    total: number;
    byIntent: Map<string, number>;
    byStatus: Map<string, number>;
  } = {
    total: 0,
    byIntent: new Map(),
    byStatus: new Map()
  };

  private performance: {
    responseTimes: number[];
    maxSamples: number;
  } = {
    responseTimes: [],
    maxSamples: 1000 // Keep last 1000 response times for calculations
  };

  private errors: {
    total: number;
    byType: Map<string, number>;
  } = {
    total: 0,
    byType: new Map()
  };

  private startTime: number;
  private enabled: boolean;

  constructor(config?: { enabled?: boolean }) {
    this.enabled = config?.enabled ?? true;
    this.startTime = Date.now();
  }

  /**
   * Record a request
   */
  recordRequest(path: string, statusCode: number, duration: number): void {
    if (!this.enabled) return;

    this.requests.total++;
    
    // Track by intent (extract intent name from path)
    const intentMatch = path.match(/\/render/);
    if (intentMatch) {
      // For render requests, we'd need to track the actual intent name
      // This would require additional context from the request body
      const intentKey = 'render_requests';
      this.requests.byIntent.set(intentKey, (this.requests.byIntent.get(intentKey) || 0) + 1);
    } else {
      const pathKey = path.replace(/^\/ixp\//, '') || 'root';
      this.requests.byIntent.set(pathKey, (this.requests.byIntent.get(pathKey) || 0) + 1);
    }
    
    // Track by status code
    const statusKey = Math.floor(statusCode / 100) + 'xx';
    this.requests.byStatus.set(statusKey, (this.requests.byStatus.get(statusKey) || 0) + 1);
    
    // Track response time
    this.performance.responseTimes.push(duration);
    
    // Keep only the last N samples to prevent memory growth
    if (this.performance.responseTimes.length > this.performance.maxSamples) {
      this.performance.responseTimes = this.performance.responseTimes.slice(-this.performance.maxSamples);
    }
  }

  /**
   * Record an error
   */
  recordError(error: any): void {
    if (!this.enabled) return;

    this.errors.total++;
    
    const errorType = error?.code || error?.name || 'UNKNOWN_ERROR';
    this.errors.byType.set(errorType, (this.errors.byType.get(errorType) || 0) + 1);
  }

  /**
   * Record intent resolution
   */
  recordIntentResolution(intentName: string, success: boolean, duration: number): void {
    if (!this.enabled) return;

    const key = `intent_${intentName}`;
    this.requests.byIntent.set(key, (this.requests.byIntent.get(key) || 0) + 1);
    
    if (success) {
      this.performance.responseTimes.push(duration);
    } else {
      this.recordError({ code: 'INTENT_RESOLUTION_FAILED', intentName });
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): MetricsData {
    const responseTimes = this.performance.responseTimes;
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);
    
    const p95ResponseTime = sortedTimes.length > 0 ? sortedTimes[p95Index] || 0 : 0;
    const p99ResponseTime = sortedTimes.length > 0 ? sortedTimes[p99Index] || 0 : 0;

    return {
      requests: {
        total: this.requests.total,
        byIntent: Object.fromEntries(this.requests.byIntent),
        byStatus: Object.fromEntries(this.requests.byStatus)
      },
      performance: {
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        p95ResponseTime: Math.round(p95ResponseTime * 100) / 100,
        p99ResponseTime: Math.round(p99ResponseTime * 100) / 100
      },
      errors: {
        total: this.errors.total,
        byType: Object.fromEntries(this.errors.byType)
      },
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    uptime: number;
  } {
    const metrics = this.getMetrics();
    const errorRate = metrics.requests.total > 0 
      ? (metrics.errors.total / metrics.requests.total) * 100 
      : 0;

    return {
      totalRequests: metrics.requests.total,
      errorRate: Math.round(errorRate * 100) / 100,
      averageResponseTime: metrics.performance.averageResponseTime,
      uptime: metrics.uptime
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.requests = {
      total: 0,
      byIntent: new Map(),
      byStatus: new Map()
    };
    
    this.performance = {
      responseTimes: [],
      maxSamples: this.performance.maxSamples
    };
    
    this.errors = {
      total: 0,
      byType: new Map()
    };
    
    this.startTime = Date.now();
  }

  /**
   * Enable or disable metrics collection
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if metrics collection is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get metrics in Prometheus format
   */
  getPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    const lines: string[] = [];

    // Request metrics
    lines.push('# HELP ixp_requests_total Total number of requests');
    lines.push('# TYPE ixp_requests_total counter');
    lines.push(`ixp_requests_total ${metrics.requests.total}`);
    lines.push('');

    // Request by intent
    lines.push('# HELP ixp_requests_by_intent_total Total requests by intent');
    lines.push('# TYPE ixp_requests_by_intent_total counter');
    for (const [intent, count] of Object.entries(metrics.requests.byIntent)) {
      lines.push(`ixp_requests_by_intent_total{intent="${intent}"} ${count}`);
    }
    lines.push('');

    // Response time metrics
    lines.push('# HELP ixp_response_time_ms Response time in milliseconds');
    lines.push('# TYPE ixp_response_time_ms histogram');
    lines.push(`ixp_response_time_ms_sum ${metrics.performance.averageResponseTime * metrics.requests.total}`);
    lines.push(`ixp_response_time_ms_count ${metrics.requests.total}`);
    lines.push('');

    // Error metrics
    lines.push('# HELP ixp_errors_total Total number of errors');
    lines.push('# TYPE ixp_errors_total counter');
    lines.push(`ixp_errors_total ${metrics.errors.total}`);
    lines.push('');

    // Uptime
    lines.push('# HELP ixp_uptime_seconds Server uptime in seconds');
    lines.push('# TYPE ixp_uptime_seconds gauge');
    lines.push(`ixp_uptime_seconds ${metrics.uptime}`);
    lines.push('');

    return lines.join('\n');
  }
}