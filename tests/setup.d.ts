/**
 * Test Setup for IXP Server SDK
 */
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidIXPError(): R;
            toBeValidIntentDefinition(): R;
            toBeValidComponentDefinition(): R;
        }
    }
}
export {};
//# sourceMappingURL=setup.d.ts.map