/**
 * Render Middleware
 * 
 * Provides automatic component rendering based on the framework (React, Vue, or JS)
 * This middleware automatically handles the rendering of components based on the framework
 * specified in the component definition.
 */

import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { IntentRegistry } from '../core/IntentRegistry';
import { ComponentRegistry } from '../core/ComponentRegistry';
import { IntentResolver } from '../core/IntentResolver';
import { IXPError } from '../utils/errors';
import { Logger } from '../utils/logger';

export interface RenderMiddlewareOptions {
  /**
   * Base path for the render endpoint
   * @default '/render-ui'
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
export function createRenderMiddleware(
  intentRegistry: IntentRegistry,
  componentRegistry: ComponentRegistry,
  intentResolver: IntentResolver,
  options: RenderMiddlewareOptions = {}
) {
  const {
    basePath = '/render-ui',
    enableSSR = true,
    renderers = {},
    template,
    errorHandler
  } = options;

  const logger = new Logger();

  // Default renderers
  const defaultRenderers: Record<string, FrameworkRenderer> = {
    // Will be implemented separately
  };

  // Combine default and custom renderers
  const allRenderers = { ...defaultRenderers, ...renderers };

  return (router: Router) => {
    // Register render endpoint
    router.all(basePath, async (req: Request, res: Response) => {
      try {
        // Support both GET and POST methods
        const intent = req.method === 'GET' ? req.query.intent as string : req.body.intent;
        const parameters = req.method === 'GET' ? req.query : req.body.parameters;
        
        if (!intent) {
          return res.status(400).json({ error: 'Intent is required' });
        }

        // Find the intent definition
        const intentDef = intentRegistry.get(intent);
        if (!intentDef) {
          return res.status(404).json({ error: `Intent '${intent}' not found` });
        }

        // Resolve data for the intent
        const data = await intentResolver.resolveIntent({ name: intent, parameters });
        
        // Get component definition
        const componentDef = componentRegistry.get(intentDef.component);
        if (!componentDef) {
          return res.status(404).json({ error: `Component '${intentDef.component}' not found` });
        }

        // Get the appropriate renderer for the component's framework
        const renderer = allRenderers[componentDef.framework];
        if (!renderer) {
          return res.status(500).json({ 
            error: `No renderer available for framework '${componentDef.framework}'` 
          });
        }

        // Generate HTML
        let html;
        if (enableSSR) {
          try {
            // Server-side rendering
            const content = await renderer.renderToString(componentDef, data);
            html = renderer.generateTemplate(content, componentDef, data, intent, parameters);
          } catch (error) {
            logger.error('Error during server-side rendering:', error);
            // Fallback to client-side only rendering
            html = renderer.generateTemplate('', componentDef, data, intent, parameters);
          }
        } else {
          // Client-side only rendering
          html = renderer.generateTemplate('', componentDef, data, intent, parameters);
        }

        return res.send(html);
      } catch (error) {
        logger.error('Error rendering UI:', error);
        
        if (errorHandler) {
          return errorHandler(error as Error, req, res);
        }
        
        return res.status(500).json({ error: 'Failed to render UI' });
      }
    });

    // JSON rendering endpoint for IXP intents
    router.all(`${basePath}-json`, async (req: Request, res: Response) => {
      try {
        // Support both GET and POST methods
        const intent = req.method === 'GET' ? req.query.intent as string : req.body.intent;
        const parameters = req.method === 'GET' ? req.query : req.body.parameters;
        
        if (!intent) {
          return res.status(400).json({ error: 'Intent is required' });
        }

        // Find the intent definition
        const intentDef = intentRegistry.get(intent);
        if (!intentDef) {
          return res.status(404).json({ error: `Intent '${intent}' not found` });
        }

        // Resolve data for the intent
        const data = await intentResolver.resolveIntent({ name: intent, parameters });
        
        // Get component definition
        const componentDef = componentRegistry.get(intentDef.component);
        if (!componentDef) {
          return res.status(404).json({ error: `Component '${intentDef.component}' not found` });
        }

        return res.json({
          intent,
          parameters,
          component: intentDef.component,
          data,
          meta: {
            version: componentDef.version,
            framework: componentDef.framework,
            remoteUrl: componentDef.remoteUrl
          },
          performance: {
            renderTime: Date.now() // Just a timestamp for demo purposes
          }
        });
      } catch (error) {
        logger.error('Error rendering JSON:', error);
        
        if (errorHandler) {
          return errorHandler(error as Error, req, res);
        }
        
        return res.status(500).json({ error: 'Failed to render JSON' });
      }
    });

    return router;
  };
}