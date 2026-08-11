import Link from "next/link";
import { OnboardingWizard } from "@/components/onboarding/wizard";

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
