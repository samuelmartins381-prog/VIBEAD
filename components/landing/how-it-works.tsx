const steps = [
  {
    step: "01",
    title: "Enter your URL",
    description: "Paste the link to your site, tool, or micro-SaaS. That's the only input we need.",
  },
  {
    step: "02",
    title: "We analyze it",
    description:
      "Our crawler and AI examine your content, audience, and existing monetization to understand what you've built.",
  },
  {
    step: "03",
    title: "Get your monetization score",
    description:
      "A 0–100 score, a recommended strategy, and a ranked list of opportunities with estimated impact.",
  },
  {
    step: "04",
    title: "Install & optimize",
    description:
      "Add a single tracking snippet, turn on integrations, and let continuous optimization take it from there.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-zinc-200 bg-zinc-50 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">How it works</h2>
          <p className="mt-3 text-zinc-500">From URL to a measurable path to monetization, in minutes.</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step}>
              <span className="text-sm font-medium text-zinc-400">{s.step}</span>
              <h3 className="mt-3 text-base font-semibold text-zinc-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
