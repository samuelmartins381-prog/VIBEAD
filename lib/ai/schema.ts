import { z } from "zod";

export const MONETIZATION_MODELS = [
  "advertising",
  "affiliate",
  "subscription",
  "lead_generation",
  "sponsorship",
  "none",
] as const;

export const RECOMMENDATION_TYPES = [
  "ads",
  "affiliate",
  "subscription",
  "lead_generation",
  "sponsorship",
  "seo",
  "conversion",
  "retention",
  "other",
] as const;

// JSON Schema passed to output_config.format — see lib/ai/analyze-website.ts.
// Structured outputs don't support numeric/string length constraints, so
// ranges (e.g. 0-100) are enforced separately by auditAnalysisSchema below.
export const AUDIT_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    business_type: {
      type: "string",
      description:
        "One of: utility, saas, blog, directory, ecommerce, tool, game, educational, community, other",
    },
    target_audience: { type: "string", description: "Who this site appears to serve, in one sentence." },
    primary_use_case: { type: "string" },
    monetization_score: {
      type: "integer",
      description: "Overall monetization readiness, 0-100.",
    },
    recommended_model: { type: "string", enum: MONETIZATION_MODELS },
    secondary_model: {
      anyOf: [{ type: "string", enum: MONETIZATION_MODELS }, { type: "null" }],
      description: "A second viable model, or null if there isn't a clear one.",
    },
    recommendation_reason: {
      type: "string",
      description: "Why this model was chosen, referencing specific evidence from the site data.",
    },
    traffic_note: {
      type: "string",
      description:
        "Plain statement about traffic data availability, e.g. 'Traffic data unavailable — estimate based on scenario assumptions.'",
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: RECOMMENDATION_TYPES },
          title: { type: "string" },
          description: { type: "string" },
          reason: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          implementation_difficulty: { type: "string", enum: ["high", "medium", "low"] },
          expected_impact: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: [
          "type",
          "title",
          "description",
          "reason",
          "priority",
          "implementation_difficulty",
          "expected_impact",
        ],
        additionalProperties: false,
      },
    },
    estimated_revenue: {
      type: "object",
      properties: {
        low: { type: "number" },
        mid: { type: "number" },
        high: { type: "number" },
        currency: { type: "string" },
        period: { type: "string", enum: ["monthly"] },
        basis: {
          type: "string",
          description: "One sentence noting this is a hypothetical scenario, not a guarantee.",
        },
      },
      required: ["low", "mid", "high", "currency", "period", "basis"],
      additionalProperties: false,
    },
  },
  required: [
    "business_type",
    "target_audience",
    "primary_use_case",
    "monetization_score",
    "recommended_model",
    "secondary_model",
    "recommendation_reason",
    "traffic_note",
    "recommendations",
    "estimated_revenue",
  ],
  additionalProperties: false,
} as const;

export const auditAnalysisSchema = z.object({
  business_type: z.string(),
  target_audience: z.string(),
  primary_use_case: z.string(),
  monetization_score: z.coerce.number().int().min(0).max(100),
  recommended_model: z.enum(MONETIZATION_MODELS),
  secondary_model: z.enum(MONETIZATION_MODELS).nullable(),
  recommendation_reason: z.string(),
  traffic_note: z.string(),
  recommendations: z.array(
    z.object({
      type: z.enum(RECOMMENDATION_TYPES),
      title: z.string(),
      description: z.string(),
      reason: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      implementation_difficulty: z.enum(["high", "medium", "low"]),
      expected_impact: z.enum(["high", "medium", "low"]),
    })
  ),
  estimated_revenue: z.object({
    low: z.coerce.number().min(0),
    mid: z.coerce.number().min(0),
    high: z.coerce.number().min(0),
    currency: z.string(),
    period: z.literal("monthly"),
    basis: z.string(),
  }),
});

export type AuditAnalysis = z.infer<typeof auditAnalysisSchema>;
