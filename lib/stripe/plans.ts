import "server-only";
import { getServerEnv } from "@/lib/env";
import type { Plan } from "@/types/database";

export type PaidPlan = Extract<Plan, "pro" | "scale">;

export const PLAN_DETAILS: Record<PaidPlan, { name: string; price: string; websiteLimit: number | null }> = {
  pro: { name: "Pro", price: "€29/month", websiteLimit: 5 },
  scale: { name: "Scale", price: "€99/month", websiteLimit: null },
};

export function getPriceId(plan: PaidPlan): string {
  const { STRIPE_PRICE_PRO, STRIPE_PRICE_SCALE } = getServerEnv();
  const priceId = plan === "pro" ? STRIPE_PRICE_PRO : STRIPE_PRICE_SCALE;
  if (!priceId) {
    throw new Error(`STRIPE_PRICE_${plan.toUpperCase()} is not configured`);
  }
  return priceId;
}

export function planForPriceId(priceId: string | null | undefined): Plan {
  if (!priceId) return "free";
  const { STRIPE_PRICE_PRO, STRIPE_PRICE_SCALE } = getServerEnv();
  if (priceId === STRIPE_PRICE_PRO) return "pro";
  if (priceId === STRIPE_PRICE_SCALE) return "scale";
  return "free";
}
