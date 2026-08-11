const methods = [
  {
    name: "Advertising",
    description: "Monetize traffic with contextual ads when purchase intent is low but usage is frequent.",
  },
  {
    name: "Affiliate",
    description: "Earn commission by recommending products your audience is already comparing.",
  },
  {
    name: "Subscription",
    description: "Charge for recurring value when users come back often and rely on your tool.",
  },
  {
    name: "Lead generation",
    description: "Turn qualified visitors into leads for high-value niches and services.",
  },
  {
    name: "Sponsorship",
    description: "Partner with brands when you've built a loyal audience or community.",
  },
  {
    name: "Freemium upsell",
    description: "Layer premium features on top of a free tool once usage patterns are clear.",
  },
];

export function Methods() {
  return (
    <section id="methods" className="border-b border-zinc-200 bg-zinc-50 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">Monetization methods</h2>
          <p className="mt-3 text-zinc-500">
            We don&apos;t push one model on every site — the engine matches the method to your traffic and content.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {methods.map((m) => (
            <div key={m.name} className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="font-semibold text-zinc-900">{m.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{m.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
