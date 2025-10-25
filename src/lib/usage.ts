import { z } from "zod";

export type LanguageModelUsage = {
  tokenCount: number;
  cost: number;
};

export const UsageDataSchema = z.object({
  promptTokens: z.number().optional(),
  completionTokens: z.number().optional(),
  totalTokens: z.number().optional(),
});

export type UsageData = z.infer<typeof UsageDataSchema>;

export const CostUSDSchema = z.object({
  cacheReadUSD: z.number().optional(),
  inputUSD: z.number().optional(),
  outputUSD: z.number().optional(),
  reasoningUSD: z.number().optional(),
  totalUSD: z.number().optional(),
});

export type CostUSD = z.infer<typeof CostUSDSchema>;

export const ContextSchema = z.object({
  totalMax: z.number().optional(),
  combinedMax: z.number().optional(),
  inputMax: z.number().optional(),
});

export type Context = z.infer<typeof ContextSchema>;

export const AppUsageSchema = z.object({
  tokenCount: z.number(),
  cost: z.number(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  cachedInputTokens: z.number().optional(),
}).merge(UsageDataSchema).extend({
  modelId: z.string().optional(),
  reasoningTokens: z.number().optional(),
  costUSD: CostUSDSchema.optional(),
  context: ContextSchema.optional(),
});

export type AppUsage = z.infer<typeof AppUsageSchema>;
