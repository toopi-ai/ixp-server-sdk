import type { Request, Response, NextFunction, Router } from 'express';
import type { z } from 'zod';

/**
 * Core IXP Types and Interfaces
 */

// Intent Definition
export interface IntentDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  component: string;
  version: string;
  deprecated?: boolean;
  crawlable?: boolean;
}

// Component Definition
export interface ComponentDefinition {
  name: string;
  framework: string;
  remoteUrl: string;
  exportName: string;
  propsSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  version: string;
  deprecated?: boolean;
  allowedOrigins: string[];
  bundleSize: string;
  performance: {
    tti: string;
    bundleSizeGzipped: string;
  };
  securityPolicy: {
    allowEval: boolean;
    maxBundleSize: string;
    sandboxed: boolean;
    csp?: Record<string, any>;
  };
}

// Intent Request/Response
export interface IntentRequest {
  name: string;
  parameters: Record<string, any>;
}

export interface IntentResponse {
  record: {
    moduleUrl: string;
    exportName: string;
    props: Record<string, any>;
  };
  component: ComponentDefinition;
  ttl: number;
}

// Configuration Interfaces
export interface IXPServerConfig {
  intents?: string | IntentDefinition[];
  components?: string | Record<string, ComponentDefinition> | {
    source?: string | Record<string, ComponentDefinition>;
    development?: {
      enabled?: boolean;
      hotReload?: boolean;
      watchFiles?: boolean;
      buildOnChange?: boolean;
      port?: number;
      cors?: {
        origins?: string[];
        credentials?: boolean;
      };
    };
    build?: {
      outputDir?: string;
      minify?: boolean;
      sourceMaps?: boolean;
      target?: string;
      externals?: string[];
    };
    validation?: {
      strict?: boolean;
      propsSchema?: boolean;
      bundleSize?: {
        maxSize?: string;
        warnSize?: string;
      };
      performance?: {
        maxTTI?: string;
        maxBundleSize?: string;
      };
    };
    security?: {
      defaultSandboxed?: boolean;
      allowEval?: boolean;
      defaultCSP?: Record<string, any>;
      allowedOrigins?: string[];
    };
    caching?: {
      enabled?: boolean;
      ttl?: number;
      strategy?: 'memory' | 'redis' | 'file';
    };
  };
  port?: number;
  theme?: Record<string, any>;
  cors?: {
    origins?: string[];
    credentials?: boolean;
    methods?: string[];
    allowedHeaders?: string[];
  };
  security?: {
    helmet?: boolean;
    csp?: Record<string, any>;
    rateLimit?: {
      windowMs?: number;
      max?: number;
    };
  };
  plugins?: IXPPlugin[];
  middleware?: IXPMiddleware[];
  dataProvider?: DataProvider;
  logging?: {
    level?: 'error' | 'warn' | 'info' | 'debug';
    format?: 'json' | 'text';
  };
  metrics?: {
    enabled?: boolean;
    endpoint?: string;
  };
  swagger?: {
    enabled?: boolean;
    endpoint?: string;
    title?: string;
    version?: string;
    description?: string;
  };
}

// Plugin System
export interface IXPPlugin {
  name: string;
  version: string;
  install: (server: IXPServerInstance) => void | Promise<void>;
  uninstall?: (server: IXPServerInstance) => void | Promise<void>;
}

export interface IXPMiddleware {
  name: string;
  handler: (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
  priority?: number;
  routes?: string[];
}

// Data Provider Interface
export interface DataProvider {
  getCrawlerContent?: (options: CrawlerContentOptions) => Promise<CrawlerContentResponse>;
  resolveIntentData?: (intent: IntentRequest, context?: any) => Promise<Record<string, any>>;
  resolveComponentData?: (componentName: string, queryParams: Record<string, any>, context?: any) => Promise<Record<string, any>>;
}

export interface CrawlerContentOptions {
  cursor?: string;
  limit?: number;
  lastUpdated?: string;
  format?: 'json' | 'ndjson';
  type?: string;
}

export interface CrawlerContentResponse {
  contents: ContentItem[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  lastUpdated: string;
}

export interface ContentItem {
  type: string;
  id: string;
  title: string;
  description: string;
  lastUpdated: string;
  [key: string]: any;
}

// Server Instance Interface
export interface IXPServerInstance {
  app: Router;
  config: IXPServerConfig;
  intentRegistry: IntentRegistry;
  componentRegistry: ComponentRegistry;
  intentResolver: IntentResolver;
  addPlugin: (plugin: IXPPlugin) => Promise<void>;
  removePlugin: (name: string) => Promise<void>;
  addMiddleware: (middleware: IXPMiddleware) => void;
  listen: (port?: number) => Promise<void>;
  close: () => Promise<void>;
}

// Registry Interfaces
export interface IntentRegistry {
  getAll(): IntentDefinition[];
  get(name: string): IntentDefinition | undefined;
  add(intent: IntentDefinition): void;
  remove(name: string): boolean;
  reload(): Promise<void>;
  enableFileWatching(): void;
  disableFileWatching(): void;
  findByCriteria(criteria: { crawlable?: boolean; deprecated?: boolean; component?: string }): IntentDefinition[];
  getStats(): { total: number; crawlable: number; deprecated: number; byComponent: Record<string, number> };
}

export interface ComponentRegistry {
  getAll(): ComponentDefinition[];
  get(name: string): ComponentDefinition | undefined;
  add(component: ComponentDefinition): void;
  remove(name: string): boolean;
  reload(): Promise<void>;
  enableFileWatching(): void;
  disableFileWatching(): void;
  isOriginAllowed(componentName: string, origin: string): boolean;
  findByCriteria(criteria: { framework?: string; deprecated?: boolean; sandboxed?: boolean }): ComponentDefinition[];
  getStats(): { total: number; byFramework: Record<string, number>; deprecated: number; sandboxed: number; averageBundleSize: string };
}

export interface IntentResolver {
  resolveIntent(request: IntentRequest, options?: any): Promise<IntentResponse>;
  validateParameters(intent: IntentDefinition, parameters: Record<string, any>): Promise<Record<string, any>>;
}

// Error Types
export interface IXPError extends Error {
  code: string;
  statusCode: number;
  timestamp: string;
  details?: any;
}

export interface IXPErrorResponse {
  error: {
    code: string;
    message: string;
    timestamp: string;
    details?: any;
  };
}

// Validation Schema Types
export type ZodSchema = z.ZodTypeAny;
export type ValidationResult<T = any> = {
  success: boolean;
  data?: T;
  errors?: string[];
};

// Metrics Types
export interface MetricsData {
  requests: {
    total: number;
    byIntent: Record<string, number>;
    byStatus: Record<string, number>;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
  };
  uptime: number;
  timestamp: string;
}

// Health Check Types
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      duration?: number;
    };
  };
}

// CLI Types
export interface CLICommand {
  name: string;
  description: string;
  options?: CLIOption[];
  action: (...args: any[]) => void | Promise<void>;
}

export interface CLIOption {
  flags: string;
  description: string;
  defaultValue?: any;
}

export interface ProjectTemplate {
  name: string;
  description: string;
  files: TemplateFile[];
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
}

export interface TemplateFile {
  path: string;
  content: string;
  executable?: boolean;
}

// Theme Configuration Types
export interface IXPTheme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  breakpoints: ThemeBreakpoints;
  components: ThemeComponents;
  mode: 'light' | 'dark';
  name: string;
  version: string;
}

export interface ThemeColors {
  primary: ColorPalette;
  secondary: ColorPalette;
  background: {
    default: string;
    paper: string;
    elevated: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  border: {
    default: string;
    light: string;
    focus: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface ThemeTypography {
  fontFamily: {
    sans: string[];
    mono: string[];
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ThemeSpacing {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
}

export interface ThemeBreakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ThemeComponents {
  button: ComponentTheme;
  card: ComponentTheme;
  input: ComponentTheme;
  modal: ComponentTheme;
  [key: string]: ComponentTheme;
}

export interface ComponentTheme {
  base: Record<string, any>;
  variants: Record<string, Record<string, any>>;
  sizes: Record<string, Record<string, any>>;
  states: Record<string, Record<string, any>>;
}

// Theme Context and Hook Types
export interface ThemeContextValue {
  theme: IXPTheme;
  setTheme: (theme: IXPTheme | string) => void;
  toggleMode: () => void;
  availableThemes: IXPTheme[];
  currentMode: 'light' | 'dark';
}

export interface UseThemeReturn {
  theme: IXPTheme;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  breakpoints: ThemeBreakpoints;
  components: ThemeComponents;
  mode: 'light' | 'dark';
  setTheme: (theme: IXPTheme | string) => void;
  toggleMode: () => void;
  css: (styles: Record<string, any>) => string;
  className: (styles: Record<string, any>) => string;
}