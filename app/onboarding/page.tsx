import Link from "next/link";
import { OnboardingWizard } from "@/components/onboarding/wizard";

// The onboarding server action runs the full audit pipeline (crawl + AI +
// monetization engine) synchronously before redirecting, which can take
// longer than the platform's default function timeout.
export const maxDuration = 60;

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16">
      <Link href="/" className="mb-8 text-lg font-semibold tracking-tight text-zinc-900">
        MonetizeOS
      </Link>
      <OnboardingWizard />
    </div>
  );
}
