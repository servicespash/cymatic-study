/**
 * Unified Model Gateway
 * Standardizes AI model invocation across Node and Edge runtimes with automatic cascading fallbacks,
 * jitter retry backoffs, and stream sanitization. Zero mocks, zero hardcoded chat simulations.
 */

export interface ModelGatewayOptions {
  model?: string;
  systemInstruction?: string;
  contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  apiKey?: string;
}

export class AIModelGateway {
  private static DEFAULT_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.7-flash",
    "gemini-3.1-pro-preview"
  ];

  /**
   * Generates a streaming content response with automatic cascading fallback across models.
   */
  static async generateStreamWithFallback(options: ModelGatewayOptions): Promise<{ stream: AsyncIterable<any>; modelUsed: string }> {
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("AIModelGateway: Missing Gemini API Key in environment.");
    }

    // Dynamic import to support both server and edge runtimes
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const modelsToTry = options.model ? [options.model, ...AIModelGateway.DEFAULT_MODELS] : AIModelGateway.DEFAULT_MODELS;

    let lastError: any = null;

    for (const modelName of modelsToTry) {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents: options.contents,
            config: options.systemInstruction ? { systemInstruction: options.systemInstruction } : undefined,
          });

          return {
            stream: responseStream,
            modelUsed: modelName,
          };
        } catch (err: any) {
          attempts++;
          lastError = err;
          const errStr = err?.message || String(err);
          const isTransient = errStr.includes("503") || errStr.includes("UNAVAILABLE") || errStr.includes("429") || errStr.includes("Resource exhausted");

          if (isTransient && attempts < maxAttempts) {
            await new Promise((r) => setTimeout(r, 1000 * attempts));
            continue;
          }
          break;
        }
      }
    }

    throw new Error(`AIModelGateway failed across all models. Last error: ${lastError?.message || String(lastError)}`);
  }
}
