import "server-only";
import Stripe from "stripe";
import { getServerEnv } from "@/lib/env";

let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (client) return client;
  const { STRIPE_SECRET_KEY } = getServerEnv();
  if (!STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  client = new Stripe(STRIPE_SECRET_KEY);
  return client;
}
