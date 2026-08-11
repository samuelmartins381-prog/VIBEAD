"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";

const emailSchema = z.string().trim().toLowerCase().email();
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export type AuthActionState = { error: string | null };

function siteUrl() {
  return publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signUp(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = z
    .object({ email: emailSchema, password: passwordSchema })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/onboarding");
}

export async function logIn(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1, "Password is required") })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Invalid email or password" };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type ResetPasswordState = { error: string | null; success: boolean };

export async function requestPasswordReset(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: "Enter a valid email address", success: false };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl()}/auth/callback?next=/update-password`,
  });

  // Always return success, whether or not the email exists, to avoid
  // leaking which addresses have an account.
  return { error: null, success: true };
}

export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
