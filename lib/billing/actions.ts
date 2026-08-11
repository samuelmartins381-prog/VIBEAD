"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import { getPriceId, type PaidPlan } from "@/lib/stripe/plans";
import { publicEnv } from "@/lib/env";

function siteUrl() {
  return publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

async function getOrCreateStripeCustomerId(): Promise<{ userId: string; customerId: string; email: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("users").select("stripe_customer_id").eq("id", user.id).single();

  if (profile?.stripe_customer_id) {
    return { userId: user.id, customerId: profile.stripe_customer_id, email: user.email };
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });

  // users.stripe_customer_id/plan/subscription fields are not user-writable
  // via RLS (see migration 0002) — billing state is only ever set here and
  // in the Stripe webhook, both server-side, both via the admin client.
  const admin = createAdminClient();
  await admin.from("users").update({ stripe_customer_id: customer.id }).eq("id", user.id);

  return { userId: user.id, customerId: customer.id, email: user.email };
}

export async function startCheckout(plan: PaidPlan): Promise<void> {
  const { customerId } = await getOrCreateStripeCustomerId();
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: getPriceId(plan), quantity: 1 }],
    success_url: `${siteUrl()}/dashboard/settings?checkout=success`,
    cancel_url: `${siteUrl()}/dashboard/settings?checkout=cancelled`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  redirect(session.url);
}

export async function openBillingPortal(): Promise<void> {
  const { customerId } = await getOrCreateStripeCustomerId();
  const stripe = getStripeClient();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteUrl()}/dashboard/settings`,
  });

  redirect(session.url);
}
