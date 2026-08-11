const faqs = [
  {
    q: "Do you guarantee revenue?",
    a: "No. We provide analysis, recommendations, integration infrastructure, tracking, and optimization. Estimates shown are hypothetical scenarios, not promises.",
  },
  {
    q: "What if my site has almost no traffic?",
    a: "The audit will say so plainly and prioritize acquisition and conversion recommendations over monetization ones — monetizing zero traffic isn't useful advice.",
  },
  {
    q: "Do I need to know anything about ads or affiliate marketing?",
    a: "No. The monetization engine picks a strategy for you and explains why; you approve and install it.",
  },
  {
    q: "How does the tracking snippet work?",
    a: "A single script tag on your site. It only collects what's needed for monetization and analytics, and respects consent where legally required.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, from the billing portal. Your data and audits stay available on the Free plan.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="border-b border-zinc-200 bg-white px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900">
          Frequently asked questions
        </h2>

        <div className="mt-12 divide-y divide-zinc-200 border-t border-zinc-200">
          {faqs.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-zinc-900">
                {item.q}
                <span className="ml-4 text-zinc-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
