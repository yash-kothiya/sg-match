/**
 * The only file that talks to the Gemini API (plain REST, no SDK). It has no `server-only` import so that
 * scripts (the knowledge-base seeder, `bun run ai:check`) can use it. App code goes through
 * `services/gemini.service.ts`, which supplies the key and model ids from env.
 *
 * Gemini model ids, endpoints and limits change. If a call fails, check the current docs at
 * https://ai.google.dev/gemini-api/docs and adjust THIS file; nothing else knows about Gemini.
 */

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export type GeminiErrorCode = "QUOTA_EXCEEDED" | "TIMEOUT" | "LLM_UNAVAILABLE" | "CONFIG";

export class GeminiError extends Error {
  constructor(
    public code: GeminiErrorCode,
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

export type GeminiConfig = {
  apiKey: string;
  embeddingModel: string;
  chatModel: string;
  /** Tried in order when the chat model keeps returning 5xx (Gemini capacity varies model by model). */
  chatFallbackModels?: string[];
  dimensions: number;
};

async function call<T>(path: string, body: unknown, apiKey: string, timeoutMs: number): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new GeminiError("TIMEOUT", "The model took too long to respond");
    }
    throw new GeminiError("LLM_UNAVAILABLE", `Could not reach the model: ${(error as Error).message}`);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    // Never put the key or the full response in the message; keep a short reason for the logs.
    const reason = text.replace(/\s+/g, " ").slice(0, 300);
    if (response.status === 429) throw new GeminiError("QUOTA_EXCEEDED", `Quota exceeded: ${reason}`, 429);
    if (response.status === 401 || response.status === 403) throw new GeminiError("CONFIG", `Gemini rejected the API key (${response.status})`, response.status);
    throw new GeminiError("LLM_UNAVAILABLE", `Gemini returned ${response.status}: ${reason}`, response.status);
  }
  return (await response.json()) as T;
}

/** Truncated embeddings are only meaningful as directions, so scale to unit length. Safe if already normalised. */
export function normalize(vector: number[]): number[] {
  const length = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));
  return length === 0 ? vector : vector.map((x) => x / length);
}

/** `gemini-embedding-2*` has no task_type; the task is written into the text. Older models take a taskType. */
const usesPromptTasks = (model: string) => /embedding-2/.test(model);

function embeddingRequest(config: GeminiConfig, text: string, kind: "document" | "query", title?: string) {
  const prompted = usesPromptTasks(config.embeddingModel);
  const content = prompted
    ? kind === "query"
      ? `task: search result | query: ${text}`
      : `title: ${title ?? "none"} | text: ${text}`
    : text;
  return {
    model: `models/${config.embeddingModel}`,
    content: { parts: [{ text: content }] },
    outputDimensionality: config.dimensions,
    ...(prompted ? {} : { taskType: kind === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT" }),
  };
}

export async function embedQuery(config: GeminiConfig, text: string, timeoutMs = 15_000): Promise<number[]> {
  const { embedding } = await call<{ embedding?: { values?: number[] } }>(
    `models/${config.embeddingModel}:embedContent`,
    embeddingRequest(config, text, "query"),
    config.apiKey,
    timeoutMs,
  );
  return checkVector(embedding?.values, config.dimensions);
}

/** Embeds document passages in one request each batch. `items` carry the document title for the prompt format. */
export async function embedDocuments(
  config: GeminiConfig,
  items: { title: string; text: string }[],
  timeoutMs = 30_000,
): Promise<number[][]> {
  if (items.length === 0) return [];
  const { embeddings } = await call<{ embeddings?: { values?: number[] }[] }>(
    `models/${config.embeddingModel}:batchEmbedContents`,
    { requests: items.map((item) => embeddingRequest(config, item.text, "document", item.title)) },
    config.apiKey,
    timeoutMs,
  );
  if (!embeddings || embeddings.length !== items.length) {
    throw new GeminiError("LLM_UNAVAILABLE", "The embedding service returned an unexpected number of vectors");
  }
  return embeddings.map((e) => checkVector(e.values, config.dimensions));
}

function checkVector(values: number[] | undefined, dimensions: number): number[] {
  if (!values || values.length !== dimensions) {
    throw new GeminiError(
      "CONFIG",
      `Expected a ${dimensions}-dimension embedding but got ${values?.length ?? 0}. Check GEMINI_EMBEDDING_MODEL and EMBEDDING_DIMENSIONS.`,
    );
  }
  return normalize(values);
}

type GenerateResponse = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
};

/**
 * Asks the chat model for JSON that matches `schema`. Returns the raw JSON text (the caller validates it).
 * Thinking is switched off where the model allows it, because thinking tokens can eat the output budget.
 */
export async function generateJson(
  config: GeminiConfig,
  input: { system: string; user: string; schema: object; maxOutputTokens: number; temperature?: number },
  timeoutMs: number,
): Promise<string> {
  const body = (withThinking: boolean) => ({
    systemInstruction: { parts: [{ text: input.system }] },
    contents: [{ role: "user", parts: [{ text: input.user }] }],
    generationConfig: {
      temperature: input.temperature ?? 0.2,
      maxOutputTokens: input.maxOutputTokens,
      responseMimeType: "application/json",
      responseJsonSchema: input.schema,
      ...(withThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  });

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const models = [config.chatModel, ...(config.chatFallbackModels ?? [])];
  // One overall budget, so trying several models can't make a question hang for minutes.
  const deadline = Date.now() + timeoutMs * 2;

  let result: GenerateResponse | undefined;
  let lastError: GeminiError | undefined;

  for (const model of models) {
    // Models differ in what they accept, and Gemini has short demand spikes. Two narrow fallbacks per model:
    //  - a 400 may mean this model rejects the thinking setting, so try once without it;
    //  - a 5xx is usually momentary, so wait briefly and try once more, then move to the next model.
    let withThinking = true;
    let retried5xx = false;
    for (let attempt = 0; attempt < 3 && !result; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining < 2000) throw lastError ?? new GeminiError("TIMEOUT", "The model took too long to respond");
      try {
        result = await call<GenerateResponse>(
          `models/${model}:generateContent`,
          body(withThinking),
          config.apiKey,
          Math.min(timeoutMs, remaining),
        );
      } catch (error) {
        if (!(error instanceof GeminiError)) throw error;
        lastError = error;
        if (error.status === 400 && withThinking) {
          withThinking = false;
        } else if (error.status !== undefined && error.status >= 500 && !retried5xx) {
          retried5xx = true;
          await sleep(1000);
        } else if (error.status !== undefined && error.status >= 500) {
          break; // still failing: try the next model
        } else {
          throw error; // quota, bad key, bad request: another model won't help
        }
      }
    }
    if (result) break;
  }
  if (!result) throw lastError ?? new GeminiError("LLM_UNAVAILABLE", "The model did not respond");

  const candidate = result.candidates?.[0];
  const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!text) {
    const why = result.promptFeedback?.blockReason ?? candidate?.finishReason ?? "no content";
    throw new GeminiError("LLM_UNAVAILABLE", `The model returned no answer (${why})`);
  }
  return text;
}
