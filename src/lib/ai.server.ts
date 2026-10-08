import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, type ModelMessage } from "ai";
import type { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const RUN_HEADER = "X-Lovable-AIG-Run-ID";

export class AiError extends Error {
  constructor(public userMessage: string, public status?: number) {
    super(userMessage);
  }
}

function runIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId) headers.set(RUN_HEADER, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN_HEADER)?.trim() || undefined;
    return res;
  };
}

/** Streams a structured-output Responses call and returns the parsed object. */
export async function generateStructured<T>(opts: {
  schema: z.ZodType<T>;
  instructions: string;
  messages: ModelMessage[];
}): Promise<T> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new AiError("Styling is not configured yet.", 401);
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch(),
  });
  let failure: unknown;
  const result = streamText({
    model: provider.responses(MODEL),
    system: opts.instructions,
    messages: opts.messages,
    output: Output.object({ schema: opts.schema }),
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
    onError: ({ error }) => {
      failure = error;
    },
  });
  try {
    const out = await result.output;
    return out as T;
  } catch (e) {
    const err = (failure ?? e) as { statusCode?: number };
    console.error("AI call failed", failure ?? e);
    const s = err?.statusCode;
    if (s === 429) throw new AiError("Lunelle is busy right now. Please try again in a moment.", 429);
    if (s === 402) throw new AiError("AI credits have run out for this app. Please add credits to continue.", 402);
    throw new AiError("Something went wrong while generating your look. Try again.", s);
  }
}
