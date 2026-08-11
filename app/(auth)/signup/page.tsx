"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/auth/submit-button";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100";

export default function SignupPage() {
  const [state, formAction] = useActionState(signUp, { error: null });

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
            MonetizeOS
          </Link>
          <h1 className="mt-6 text-xl font-semibold text-zinc-900">Create your account</h1>
        </div>

        <form action={formAction} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
              Email
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
            <p className="text-xs text-zinc-400">At least 8 characters.</p>
          </div>

          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

          <SubmitButton>Create account</SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
