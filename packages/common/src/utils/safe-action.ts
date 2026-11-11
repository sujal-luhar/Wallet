import { ZodError, ZodType } from "zod";
import { TxActionResponse } from "../tx.types";

// Instead of writting try/catch err logging in each action file repeatedly,
// we write the common logic right here as `safeAction`
// Another reason is saperation of concerns,
// It shouldn't be cluttered with infrastructure code 
// like request parsing or error formatting.
export function safeAction<TInput, TOutput extends TxActionResponse>(
    schema: ZodType<TInput>,
    action: (data: TInput) => Promise<TOutput>
) {
    return async (rawInput: unknown): Promise<TxActionResponse> => {
        try {
            const parsed = schema.parse(rawInput);
            const result = await action(parsed);
            return result;
        } catch (err: unknown) {
            console.error("[Server Action Error]:", err);

            if (err instanceof ZodError) {
                const message = err.issues.map((e) => e.message).join(", ");
                return { success: false, error: message };
            }
            
            const message = err instanceof Error ? err.message : "An unexpected error occurred.";
            return { success: false, error: message };
        }
    };
}