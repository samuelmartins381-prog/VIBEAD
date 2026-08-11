import { createClient } from "@/lib/supabase/server";
import { startCheckout, openBillingPortal } from "@/lib/billing/actions";
import { PLAN_DETAILS } from "@/lib/stripe/plans";
import { deleteAccount } from "@/lib/account/actions";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";

const FREE_PLAN_FEATURES = ["1 website", "1 audit", "Basic recommendations"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("plan, stripe_customer_id")
    .eq("id", user!.id)
    .single();

  const plan = profile?.plan ?? "free";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Settings</h1>

      {checkout === "success" ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Subscription active — thanks for upgrading.
        </div>
      ) : checkout === "cancelled" ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          Checkout was cancelled. No changes were made.
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <dl className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-medium text-zinc-900">{user?.email}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">Plan</dt>
            <dd className="font-medium capitalize text-zinc-900">{plan}</dd>
          </div>
        </dl>
      </div>

      <div>
        <p className="mb-4 text-sm font-medium text-zinc-900">Billing</p>

        {plan === "free" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(["pro", "scale"] as const).map((key) => (
              <div key={key} className="rounded-xl border border-zinc-200 bg-white p-5">
                <p className="font-semibold text-zinc-900">{PLAN_DETAILS[key].name}</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{PLAN_DETAILS[key].price}</p>
                <form action={startCheckout.bind(null, key)} className="mt-4">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                  >
                    Upgrade to {PLAN_DETAILS[key].name}
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-600">
              You&apos;re on the <span className="font-medium capitalize text-zinc-900">{plan}</span> plan.
            </p>
            <form action={openBillingPortal} className="mt-4">
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                Manage billing
              </button>
            </form>
          </div>
        )}

        {plan === "free" && FREE_PLAN_FEATURES.length > 0 ? (
          <p className="mt-3 text-xs text-zinc-400">Free plan: {FREE_PLAN_FEATURES.join(" · ")}</p>
        ) : null}
      </div>

      <div className="rounded-xl border border-red-200 bg-white p-6">
        <p className="text-sm font-medium text-zinc-900">Danger zone</p>
        <p className="mt-1 text-sm text-zinc-500">
          Permanently deletes your account and all associated websites, audits, and data. This cannot be undone.
        </p>
        <form action={deleteAccount} className="mt-4">
          <ConfirmSubmitButton
            confirmMessage="Delete your account and all associated data? This can't be undone."
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete account
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
