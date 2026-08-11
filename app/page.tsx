import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ExampleAudit } from "@/components/landing/example-audit";
import { Methods } from "@/components/landing/methods";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <LandingNav />
      <Hero />
      <HowItWorks />
      <ExampleAudit />
      <Methods />
      <DashboardPreview />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
