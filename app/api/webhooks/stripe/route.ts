import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { planForPriceId } from "@/lib/stripe/plans";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function updateUserForCustomer(
  customerId: string,
  fields: { plan: "free" | "pro" | "scale"; stripe_subscription_id: string | null; stripe_subscription_status: string | null }
) {
  const supabase = createAdminClient();
  await supabase.from("users").update(fields).eq("stripe_customer_id", customerId);
}

export async function POST(request: NextRequest) {
  const { STRIPE_WEBHOOK_SECRET } = getServerEnv();
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (customerId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        await updateUserForCustomer(customerId, {
          plan: planForPriceId(priceId) as "pro" | "scale",
          stripe_subscription_id: subscription.id,
          stripe_subscription_status: subscription.status,
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const priceId = subscription.items.data[0]?.price.id;
      const isActive = subscription.status === "active" || subscription.status === "trialing";
      await updateUserForCustomer(customerId, {
        plan: isActive ? (planForPriceId(priceId) as "pro" | "scale") : "free",
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: subscription.status,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      await updateUserForCustomer(customerId, {
        plan: "free",
        stripe_subscription_id: null,
        stripe_subscription_status: "canceled",
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
