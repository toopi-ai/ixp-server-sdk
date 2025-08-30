import * as fs from 'fs';
import * as path from 'path';
import { build, BuildResult } from 'esbuild';
import { createHash } from 'crypto';
import type { ComponentDefinition } from '../types/index';

/**
 * Component Builder Configuration
 */
export interface ComponentBuildConfig {
  framework: 'react' | 'vue' | 'vanilla';
  componentsDir: string;
  outDir: string;
  registryFile: string;
  apiBase?: string;
  allowedOrigins?: string[];
  theme?: Record<string, any>;
  budgets?: {
    bundleKB?: number;
    ttiMs?: number;
    memoryMB?: number;
  };
  csp?: {
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    connectSrc?: string[];
  };
}

/**
 * Component Build Result
 */
export interface ComponentBuildResult {
  name: string;
  bundlePath: string;
  bundleSize: string;
  bundleSizeBytes: number;
  bundleSizeGzipped: string;
  assets: {
    css?: string[];
    images?: string[];
  };
  performance: {
    buildTime: number;
    tti: string;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Component Registry Output
 */
export interface ComponentRegistryOutput {
  components: ComponentDefinition[];
  lastUpdated: string;
  buildInfo: {
    framework: string;
    totalComponents: number;
    totalBundleSize: string;
    buildTime: number;
  };
}

/**
 * ComponentBuilder - Handles compilation and bundling of components
 */
export class ComponentBuilder {
  private config: ComponentBuildConfig;
  private buildResults: Map<string, ComponentBuildResult> = new Map();

  constructor(config: ComponentBuildConfig) {
    this.config = config;
    this.ensureDirectories();
  }

  /**
   * Ensure output directories exist
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.config.outDir)) {
      fs.mkdirSync(this.config.outDir, { recursive: true });
    }

    const registryDir = path.dirname(this.config.registryFile);
    if (!fs.existsSync(registryDir)) {
      fs.mkdirSync(registryDir, { recursive: true });
    }
  }

  /**
   * Build all components in the components directory
   */
  async buildAll(): Promise<ComponentBuildResult[]> {
    const startTime = Date.now();
    const results: ComponentBuildResult[] = [];

    if (!fs.existsSync(this.config.componentsDir)) {
      throw new Error(`Components directory not found: ${this.config.componentsDir}`);
    }

    const componentDirs = fs.readdirSync(this.config.componentsDir, { withFileTypes: true })
      .filter((dirent: fs.Dirent) => dirent.isDirectory())
      .map((dirent: fs.Dirent) => dirent.name);

    console.log(`🔨 Building ${componentDirs.length} components...`);

    for (const componentName of componentDirs) {
      try {
        const result = await this.buildComponent(componentName);
        results.push(result);
        this.buildResults.set(componentName, result);
        console.log(`✅ Built ${componentName} (${result.bundleSize})`);
      } catch (error) {
        console.error(`❌ Failed to build ${componentName}:`, error);
        results.push({
          name: componentName,
          bundlePath: '',
          bundleSize: '0KB',
          bundleSizeBytes: 0,
          bundleSizeGzipped: '0KB',
          assets: {},
          performance: { buildTime: 0, tti: '0ms' },
          errors: [error instanceof Error ? error.message : String(error)],
          warnings: []
        });
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`🎉 Build completed in ${totalTime}ms`);

    // Generate component registry
    await this.generateRegistry(results);

    return results;
  }

  /**
   * Build a single component
   */
  async buildComponent(componentName: string): Promise<ComponentBuildResult> {
    const startTime = Date.now();
    const componentDir = path.join(this.config.componentsDir, componentName);
    const outputPath = path.join(this.config.outDir, `${componentName}.esm.js`);

    // Find entry file based on framework
    const entryFile = this.findEntryFile(componentDir);
    if (!entryFile) {
      throw new Error(`No entry file found for component ${componentName}`);
    }

    // Load props schema
    const propsSchemaPath = path.join(componentDir, 'props.schema.json');
    if (!fs.existsSync(propsSchemaPath)) {
      throw new Error(`Props schema not found for component ${componentName}`);
    }

    // Build with esbuild
    const buildResult = await build({
      entryPoints: [entryFile],
      bundle: true,
      format: 'esm',
      target: 'es2020',
      outfile: outputPath,
      external: this.getExternalDependencies(),
      define: {
        'process.env.NODE_ENV': '"production"',
        'process.env.IXP_API_BASE': `"${this.config.apiBase || ''}"`,
        'process.env.IXP_THEME': JSON.stringify(this.config.theme || {})
      },
      minify: true,
      sourcemap: false,
      metafile: true,
      write: true,
      plugins: [
        this.createFrameworkPlugin(),
        this.createIXPSDKPlugin()
      ]
    });

    const buildTime = Date.now() - startTime;
    const bundleStats = fs.statSync(outputPath);
    const bundleSizeBytes = bundleStats.size;
    const bundleSize = this.formatBytes(bundleSizeBytes);

    // Calculate gzipped size (approximate)
    const bundleSizeGzipped = this.formatBytes(Math.floor(bundleSizeBytes * 0.3));

    // Copy CSS files if they exist
    const assets = await this.copyAssets(componentDir, componentName);

    // Validate bundle size against budget
    if (this.config.budgets?.bundleKB && bundleSizeBytes > this.config.budgets.bundleKB * 1024) {
      throw new Error(`Bundle size ${bundleSize} exceeds budget of ${this.config.budgets.bundleKB}KB`);
    }

    return {
      name: componentName,
      bundlePath: outputPath,
      bundleSize,
      bundleSizeBytes,
      bundleSizeGzipped,
      assets,
      performance: {
        buildTime,
        tti: this.estimateTTI(bundleSizeBytes)
      },
      errors: buildResult.errors.map((e: any) => e.text),
      warnings: buildResult.warnings.map((w: any) => w.text)
    };
  }

  /**
   * Find entry file for component based on framework
   */
  private findEntryFile(componentDir: string): string | null {
    const extensions = {
      react: ['.tsx', '.jsx', '.ts', '.js'],
      vue: ['.vue', '.ts', '.js'],
      vanilla: ['.js', '.ts']
    };

    const possibleExtensions = extensions[this.config.framework] || extensions.vanilla;

    for (const ext of possibleExtensions) {
      const filePath = path.join(componentDir, `index${ext}`);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }

    return null;
  }

  /**
   * Get external dependencies that should not be bundled
   */
  private getExternalDependencies(): string[] {
    const common = ['@ixp/sdk'];
    
    switch (this.config.framework) {
      case 'react':
        return [...common, 'react', 'react-dom'];
      case 'vue':
        return [...common, 'vue'];
      default:
        return common;
    }
  }

  /**
   * Create framework-specific esbuild plugin
   */
  private createFrameworkPlugin(): any {
    return {
      name: 'ixp-framework',
      setup(build: any) {
        // Framework-specific transformations can be added here
        if (this.config.framework === 'vue') {
          // Vue SFC compilation would go here
        }
      }
    };
  }

  /**
   * Create IXP SDK integration plugin
   */
  private createIXPSDKPlugin(): any {
    return {
      name: 'ixp-sdk',
      setup(build: any) {
        // Inject IXP SDK runtime
        build.onResolve({ filter: /^@ixp\/sdk$/ }, () => {
          return {
            path: path.resolve(process.cwd(), 'src/runtime/ixp-sdk.js'),
            namespace: 'ixp-sdk'
          };
        });
      }
    };
  }

  /**
   * Copy component assets (CSS, images, etc.)
   */
  private async copyAssets(componentDir: string, componentName: string): Promise<{ css?: string[]; images?: string[] }> {
    const assets: { css?: string[]; images?: string[] } = {};

    // Copy CSS files
    const cssFiles = ['styles.css', 'index.css', `${componentName}.css`];
    const copiedCSS: string[] = [];

    for (const cssFile of cssFiles) {
      const srcPath = path.join(componentDir, cssFile);
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(this.config.outDir, `${componentName}.css`);
        fs.copyFileSync(srcPath, destPath);
        copiedCSS.push(destPath);
      }
    }

    if (copiedCSS.length > 0) {
      assets.css = copiedCSS;
    }

    return assets;
  }

  /**
   * Generate component registry file
   */
  private async generateRegistry(buildResults: ComponentBuildResult[]): Promise<void> {
    const components: ComponentDefinition[] = [];
    let totalBundleSize = 0;
    const buildStartTime = Date.now();

    for (const result of buildResults) {
      if (result.errors.length > 0) continue;

      const componentDir = path.join(this.config.componentsDir, result.name);
      const propsSchemaPath = path.join(componentDir, 'props.schema.json');
      
      let propsSchema: any = { type: 'object', properties: {} };
      if (fs.existsSync(propsSchemaPath)) {
        propsSchema = JSON.parse(fs.readFileSync(propsSchemaPath, 'utf8'));
      }

      const component: ComponentDefinition = {
        name: result.name,
        framework: this.config.framework,
        remoteUrl: `/${path.relative(process.cwd(), result.bundlePath)}`,
        exportName: 'default',
        propsSchema,
        version: '1.0.0',
        allowedOrigins: this.config.allowedOrigins || ['*'],
        bundleSize: result.bundleSize,
        performance: {
          tti: result.performance.tti,
          bundleSizeGzipped: result.bundleSizeGzipped
        },
        securityPolicy: {
          allowEval: false,
          maxBundleSize: this.config.budgets?.bundleKB ? `${this.config.budgets.bundleKB}KB` : '200KB',
          sandboxed: true
        }
      };

      components.push(component);
      totalBundleSize += result.bundleSizeBytes;
    }

    const registry: ComponentRegistryOutput = {
      components,
      lastUpdated: new Date().toISOString(),
      buildInfo: {
        framework: this.config.framework,
        totalComponents: components.length,
        totalBundleSize: this.formatBytes(totalBundleSize),
        buildTime: Date.now() - buildStartTime
      }
    };

    fs.writeFileSync(this.config.registryFile, JSON.stringify(registry, null, 2));
    console.log(`📋 Generated registry with ${components.length} components`);
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0KB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const sizeIndex = Math.min(i, sizes.length - 1);
    const unit = sizes[sizeIndex] || 'B';
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + unit;
  }

  /**
   * Estimate Time to Interactive based on bundle size
   */
  private estimateTTI(bundleSizeBytes: number): string {
    // Rough estimation: 1KB = 1ms on average device
    const estimatedMs = Math.round(bundleSizeBytes / 1024 * 10);
    return `${estimatedMs}ms`;
  }

  /**
   * Get build results
   */
  getBuildResults(): Map<string, ComponentBuildResult> {
    return new Map(this.buildResults);
  }

  /**
   * Clean build output
   */
  async clean(): Promise<void> {
    if (fs.existsSync(this.config.outDir)) {
      fs.rmSync(this.config.outDir, { recursive: true, force: true });
    }
    this.buildResults.clear();
    console.log('🧹 Cleaned build output');
  }
}