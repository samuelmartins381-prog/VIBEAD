import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "",
    features: ["1 website", "1 audit", "Basic recommendations"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "€29",
    period: "/month",
    features: ["5 websites", "Unlimited audits", "Integrations", "Analytics", "Optimization"],
    cta: "Start Pro",
    highlighted: true,
  },
  {
    name: "Scale",
    price: "€99",
    period: "/month",
    features: ["Unlimited websites", "Advanced analytics", "Experiments", "Priority processing"],
    cta: "Start Scale",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-zinc-200 bg-zinc-50 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">Pricing</h2>
          <p className="mt-3 text-zinc-500">Start free. Upgrade when you have more sites to monetize.</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-2xl border p-8 ${
                plan.highlighted ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white"
              }`}
            >
              <h3 className={`font-semibold ${plan.highlighted ? "text-white" : "text-zinc-900"}`}>
                {plan.name}
              </h3>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                <span className={plan.highlighted ? "text-zinc-300" : "text-zinc-400"}>{plan.period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className={`flex gap-2 ${plan.highlighted ? "text-zinc-200" : "text-zinc-600"}`}>
                    <span aria-hidden>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-8 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  plan.highlighted
                    ? "bg-white text-zinc-900 hover:bg-zinc-100"
                    : "bg-zinc-900 text-white hover:bg-zinc-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
