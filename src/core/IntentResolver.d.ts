import type { IntentDefinition, ComponentDefinition, IntentRequest, IntentResponse, IntentResolver as IIntentResolver, IntentRegistry, ComponentRegistry, DataProvider } from '../types/index';
/**
 * Intent Resolver - Handles intent resolution and parameter validation
 */
export declare class IntentResolver implements IIntentResolver {
    private intentRegistry;
    private componentRegistry;
    private dataProvider?;
    constructor(intentRegistry: IntentRegistry, componentRegistry: ComponentRegistry, dataProvider?: DataProvider | undefined);
    /**
     * Resolve intent to component descriptor
     */
    resolveIntent(request: IntentRequest, options?: any): Promise<IntentResponse>;
    /**
     * Validate intent parameters using Zod schemas
     */
    validateParameters(intentDef: IntentDefinition, parameters: Record<string, any>): Promise<Record<string, any>>;
    /**
     * Create Zod schema from JSON Schema definition
     */
    private createZodSchema;
    /**
     * Convert JSON Schema property to Zod schema
     */
    private convertJsonSchemaToZod;
    /**
     * Calculate TTL based on intent and component characteristics
     */
    private calculateTTL;
    /**
     * Validate component props against schema
     */
    validateComponentProps(componentDef: ComponentDefinition, props: Record<string, any>): Promise<Record<string, any>>;
    /**
     * Get resolution statistics
     */
    getStats(): {
        totalResolutions: number;
        successfulResolutions: number;
        failedResolutions: number;
        averageResolutionTime: number;
    };
}
//# sourceMappingURL=IntentResolver.d.ts.map