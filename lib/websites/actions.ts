"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { runAudit } from "@/lib/audit/run-audit";

export type OnboardingState = { error: string | null };

const goals = [
  "make_first_100",
  "grow_existing_revenue",
  "find_best_model",
  "optimize_current",
] as const;

const onboardingSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Enter a URL")
    .transform((value) => (/^https?:\/\//i.test(value) ? value : `https://${value}`))
    .pipe(z.url("Enter a valid URL")),
  goal: z.enum(goals).optional(),
});

export async function startOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const parsed = onboardingSchema.safeParse({
    url: formData.get("url"),
    goal: formData.get("goal") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let domain: string;
  try {
    domain = new URL(parsed.data.url).hostname;
  } catch {
    return { error: "Enter a valid URL" };
  }

  const { data: website, error: websiteError } = await supabase
    .from("websites")
    .insert({ user_id: user.id, url: parsed.data.url, domain })
    .select("id")
    .single();

  if (websiteError || !website) {
    return { error: "Could not save your website. Please try again." };
  }

  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .insert({
      website_id: website.id,
      status: "pending",
      analysis: parsed.data.goal ? { goal: parsed.data.goal } : {},
    })
    .select("id")
    .single();

  if (auditError || !audit) {
    return { error: "Could not start the audit. Please try again." };
  }

  // Runs synchronously so the audit is ready by the time we redirect —
  // simplest correct behavior for the MVP without a polling/job queue.
  await runAudit(website.id, audit.id);

  redirect(`/dashboard/websites/${website.id}/audit`);
}
