/**
 * Render Middleware
 *
 * Provides automatic component rendering based on the framework (React, Vue, or JS)
 * This middleware automatically handles the rendering of components based on the framework
 * specified in the component definition.
 */
import { Router, Request, Response } from 'express';
import { IntentRegistry } from '../core/IntentRegistry';
import { ComponentRegistry } from '../core/ComponentRegistry';
import { IntentResolver } from '../core/IntentResolver';
export interface RenderMiddlewareOptions {
    /**
     * Base path for the render endpoint
     * @default '/render'
     */
    basePath?: string;
    /**
     * Whether to enable server-side rendering
     * @default true
     */
    enableSSR?: boolean;
    /**
     * Custom renderer implementations
     */
    renderers?: Record<string, FrameworkRenderer>;
    /**
     * Custom HTML template
     */
    template?: string;
    /**
     * Custom error handler
     */
    errorHandler?: (error: Error, req: Request, res: Response) => void;
}
/**
 * Framework Renderer Interface
 */
export interface FrameworkRenderer {
    /**
     * Server-side render a component
     */
    renderToString: (component: any, props: any) => Promise<string>;
    /**
     * Generate client-side hydration script
     */
    generateHydrationScript: (componentDef: any, data: any, intent: string, parameters: any) => string;
    /**
     * Generate HTML template
     */
    generateTemplate: (content: string, componentDef: any, data: any, intent: string, parameters: any) => string;
}
/**
 * Create render middleware
 */
export declare function createRenderMiddleware(intentRegistry: IntentRegistry, componentRegistry: ComponentRegistry, intentResolver: IntentResolver, options?: RenderMiddlewareOptions): (router: Router) => Router;
//# sourceMappingURL=renderMiddleware.d.ts.map