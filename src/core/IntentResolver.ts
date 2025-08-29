import { z } from 'zod';
import type {
  IntentDefinition,
  ComponentDefinition,
  IntentRequest,
  IntentResponse,
  IntentResolver as IIntentResolver,
  IntentRegistry,
  ComponentRegistry,
  DataProvider
} from '../types/index';
import { IXPError } from '../utils/errors';

/**
 * Intent Resolver - Handles intent resolution and parameter validation
 */
export class IntentResolver implements IIntentResolver {
  constructor(
    private intentRegistry: IntentRegistry,
    private componentRegistry: ComponentRegistry,
    private dataProvider?: DataProvider
  ) {}

  /**
   * Resolve intent to component descriptor
   */
  async resolveIntent(request: IntentRequest, options?: any): Promise<IntentResponse> {
    const { name, parameters } = request;
    
    // Find intent definition
    const intentDef = this.intentRegistry.get(name);
    if (!intentDef) {
      throw new IXPError(
        `Intent '${name}' not found`,
        'INTENT_NOT_SUPPORTED',
        404
      );
    }

    // Check if intent is deprecated
    if (intentDef.deprecated) {
      console.warn(`⚠️ Intent '${name}' is deprecated`);
    }

    // Validate parameters
    const validatedParams = await this.validateParameters(intentDef, parameters);

    // Get component definition
    const componentDef = this.componentRegistry.get(intentDef.component);
    if (!componentDef) {
      throw new IXPError(
        `Component '${intentDef.component}' not found`,
        'COMPONENT_NOT_FOUND',
        404
      );
    }

    // Check if component is deprecated
    if (componentDef.deprecated) {
      console.warn(`⚠️ Component '${intentDef.component}' is deprecated`);
    }

    // Resolve additional data if data provider is available
    let resolvedData = validatedParams;
    if (this.dataProvider?.resolveIntentData) {
      try {
        const additionalData = await this.dataProvider.resolveIntentData(request, options);
        resolvedData = { ...validatedParams, ...additionalData };
      } catch (error) {
        console.warn('Failed to resolve additional intent data:', error);
      }
    }

    // Generate component descriptor
    const response: IntentResponse = {
      record: {
        moduleUrl: componentDef.remoteUrl,
        exportName: componentDef.exportName,
        props: {
          ...resolvedData,
          ...(options || {})
        }
      },
      component: componentDef,
      ttl: this.calculateTTL(intentDef, componentDef)
    };

    return response;
  }

  /**
   * Validate intent parameters using Zod schemas
   */
  async validateParameters(
    intentDef: IntentDefinition,
    parameters: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      // Create Zod schema from intent parameters
      const schema = this.createZodSchema(intentDef.parameters);
      
      // Validate parameters
      const result = schema.parse(parameters);
      
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => {
          const path = err.path.length > 0 ? ` at '${err.path.join('.')}'` : '';
          return `${err.message}${path}`;
        });
        
        throw new IXPError(
          `Parameter validation failed: ${errors.join(', ')}`,
          'INVALID_REQUEST',
          400,
          { validationErrors: error.errors }
        );
      }
      throw error;
    }
  }

  /**
   * Create Zod schema from JSON Schema definition
   */
  private createZodSchema(parametersDef: IntentDefinition['parameters']): z.ZodTypeAny {
    const shape: Record<string, z.ZodTypeAny> = {};
    const requiredFields = parametersDef.required || [];
    
    for (const [key, propDef] of Object.entries(parametersDef.properties)) {
      let fieldSchema = this.convertJsonSchemaToZod(propDef);
      
      // Make field optional unless it's explicitly in the required array
      if (!requiredFields.includes(key)) {
        fieldSchema = fieldSchema.optional();
      }
      
      shape[key] = fieldSchema;
    }

    return z.object(shape);
  }

  /**
   * Convert JSON Schema property to Zod schema
   */
  private convertJsonSchemaToZod(propDef: any): z.ZodTypeAny {
    // Handle object types with nested properties
    if (propDef.type === 'object' && propDef.properties) {
      const shape: Record<string, z.ZodTypeAny> = {};
      const requiredFields = propDef.required || [];
      
      for (const [key, nestedProp] of Object.entries(propDef.properties)) {
        let fieldSchema = this.convertJsonSchemaToZod(nestedProp);
        
        // Only make field required if it's explicitly in the required array
        if (!requiredFields.includes(key)) {
          fieldSchema = fieldSchema.optional();
        }
        
        shape[key] = fieldSchema;
      }
      
      return z.object(shape);
    }

    // Handle primitive types
    switch (propDef.type) {
      case 'string': {
        let stringSchema = z.string();
        
        // Handle enum values
        if (propDef.enum && Array.isArray(propDef.enum) && propDef.enum.length > 0) {
          return z.enum(propDef.enum as [string, ...string[]]);
        }
        
        // Handle string constraints
        if (propDef.minLength !== undefined) {
          stringSchema = stringSchema.min(propDef.minLength);
        }
        if (propDef.maxLength !== undefined) {
          stringSchema = stringSchema.max(propDef.maxLength);
        }
        if (propDef.pattern) {
          stringSchema = stringSchema.regex(new RegExp(propDef.pattern));
        }
        
        return stringSchema;
      }
      
      case 'number': {
        let numberSchema = z.number();
        
        if (propDef.minimum !== undefined) {
          numberSchema = numberSchema.min(propDef.minimum);
        }
        if (propDef.maximum !== undefined) {
          numberSchema = numberSchema.max(propDef.maximum);
        }
        
        return numberSchema;
      }
      
      case 'integer': {
        let intSchema = z.number().int();
        
        if (propDef.minimum !== undefined) {
          intSchema = intSchema.min(propDef.minimum);
        }
        if (propDef.maximum !== undefined) {
          intSchema = intSchema.max(propDef.maximum);
        }
        
        return intSchema;
      }
      
      case 'boolean':
        return z.boolean();
      
      case 'array': {
        let arraySchema = z.array(z.any());
        
        if (propDef.minItems !== undefined) {
          arraySchema = arraySchema.min(propDef.minItems);
        }
        if (propDef.maxItems !== undefined) {
          arraySchema = arraySchema.max(propDef.maxItems);
        }
        
        return arraySchema;
      }
      
      case 'object':
        return z.record(z.any());
      
      default:
        console.warn(`Unknown JSON Schema type: ${propDef.type}, falling back to z.any()`);
        return z.any();
    }
  }

  /**
   * Calculate TTL based on intent and component characteristics
   */
  private calculateTTL(intentDef: IntentDefinition, componentDef: ComponentDefinition): number {
    // Base TTL
    let ttl = 300; // 5 minutes default
    
    // Reduce TTL for deprecated components
    if (intentDef.deprecated || componentDef.deprecated) {
      ttl = Math.min(ttl, 60); // 1 minute for deprecated
    }
    
    // Increase TTL for static/crawlable content
    if (intentDef.crawlable) {
      ttl = Math.max(ttl, 600); // 10 minutes for crawlable content
    }
    
    // Adjust based on component performance
    if (componentDef.performance?.bundleSizeGzipped) {
      const sizeMatch = componentDef.performance.bundleSizeGzipped.match(/(\d+)KB/);
      if (sizeMatch && sizeMatch[1]) {
        const sizeKB = parseInt(sizeMatch[1]);
        if (sizeKB > 50) {
          ttl = Math.max(ttl, 900); // 15 minutes for large components
        }
      }
    }
    
    return ttl;
  }

  /**
   * Validate component props against schema
   */
  async validateComponentProps(
    componentDef: ComponentDefinition,
    props: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      const schema = this.createZodSchema(componentDef.propsSchema);
      return schema.parse(props);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new IXPError(
          `Component props validation failed: ${error.errors.map(e => e.message).join(', ')}`,
          'INVALID_COMPONENT_PROPS',
          400,
          { validationErrors: error.errors }
        );
      }
      throw error;
    }
  }

  /**
   * Get resolution statistics
   */
  getStats(): {
    totalResolutions: number;
    successfulResolutions: number;
    failedResolutions: number;
    averageResolutionTime: number;
  } {
    // This would be implemented with actual metrics collection
    // For now, return placeholder data
    return {
      totalResolutions: 0,
      successfulResolutions: 0,
      failedResolutions: 0,
      averageResolutionTime: 0
    };
  }
}