"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Permanently deletes the current user's account. Cascades (via FK
 * constraints defined in the schema) through public.users -> websites ->
 * audits/integrations/events, and audits -> recommendations.
 */
export async function deleteAccount(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    throw new Error("Could not delete your account. Please try again.");
  }

  await supabase.auth.signOut();
  redirect("/");
}
