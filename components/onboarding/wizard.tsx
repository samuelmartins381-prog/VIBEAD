"use client";

import { useActionState, useState } from "react";
import { startOnboarding } from "@/lib/websites/actions";
import { SubmitButton } from "@/components/auth/submit-button";

const GOALS = [
  { value: "make_first_100", label: "Make my first €100" },
  { value: "grow_existing_revenue", label: "Grow existing revenue" },
  { value: "find_best_model", label: "Find the best monetization model" },
  { value: "optimize_current", label: "Optimize current monetization" },
] as const;

export function OnboardingWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState<string>(GOALS[0].value);
  const [state, formAction] = useActionState(startOnboarding, { error: null });

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1.5 w-10 rounded-full ${n <= step ? "bg-zinc-900" : "bg-zinc-200"}`}
          />
        ))}
      </div>

      {step === 1 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">What&apos;s your website?</h1>
          <p className="mt-1.5 text-sm text-zinc-500">Paste the URL of the site you want to monetize.</p>
          <input
            autoFocus
            type="text"
            inputMode="url"
            placeholder="example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim()) setStep(2);
            }}
            className="mt-6 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
          />
          <button
            type="button"
            disabled={!url.trim()}
            onClick={() => setStep(2)}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">What&apos;s your goal?</h1>
          <p className="mt-1.5 text-sm text-zinc-500">This helps us tailor the recommendations.</p>
          <div className="mt-6 space-y-2">
            {GOALS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGoal(g.value)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                  goal === g.value
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <form action={formAction} className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <input type="hidden" name="url" value={url} />
          <input type="hidden" name="goal" value={goal} />
          <h1 className="text-xl font-semibold text-zinc-900">Ready to analyze</h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            We&apos;ll crawl <span className="font-medium text-zinc-700">{url}</span>, understand your
            audience, and build monetization recommendations.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-zinc-500">
            <li>Crawling website</li>
            <li>Understanding audience</li>
            <li>Analyzing monetization</li>
            <li>Building recommendations</li>
          </ul>

          {state.error ? <p className="mt-4 text-sm text-red-600">{state.error}</p> : null}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Back
            </button>
            <div className="flex-1">
              <SubmitButton>Analyze my website</SubmitButton>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}
