"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/auth/submit-button";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100";

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(requestPasswordReset, { error: null, success: false });

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
            MonetizeOS
          </Link>
          <h1 className="mt-6 text-xl font-semibold text-zinc-900">Reset your password</h1>
          <p className="mt-2 text-sm text-zinc-500">We&apos;ll email you a link to set a new password.</p>
        </div>

        <form action={formAction} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
              Email
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
          </div>

          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          {state.success ? (
            <p className="text-sm text-emerald-600">
              If an account exists for that email, a reset link is on its way.
            </p>
          ) : null}

          <SubmitButton>Send reset link</SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-medium text-zinc-900 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
