export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-zinc-400">Last updated: {new Date().toISOString().slice(0, 10)}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-600">
        <section>
          <h2 className="text-base font-semibold text-zinc-900">What we provide</h2>
          <p className="mt-2">
            MonetizeOS analyzes websites you submit and provides monetization recommendations, an integration
            framework, tracking, and optimization tooling. We provide analysis and infrastructure — not a
            guarantee of any outcome.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">No revenue guarantee</h2>
          <p className="mt-2">
            Revenue estimates shown in the product (including the &quot;estimated potential&quot; ranges on
            audits) are hypothetical scenarios based on the information available at the time of analysis. They
            are not a guarantee of revenue, return on investment, or any specific outcome. Actual results depend
            on factors outside our control, including your traffic, execution, and market conditions.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">Acceptable use</h2>
          <p className="mt-2">
            Only submit websites you own or have permission to analyze. Don&apos;t use the service to attack,
            scan, or overload systems you don&apos;t control, or to attempt to access data belonging to other
            users.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">Subscriptions and billing</h2>
          <p className="mt-2">
            Paid plans are billed monthly through Stripe. You can upgrade, downgrade, or cancel at any time from
            the billing portal in Settings. Cancelling stops future billing; you keep access through the end of
            the current billing period.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">Termination</h2>
          <p className="mt-2">
            You can delete your account at any time from Settings, which permanently removes your data. We may
            suspend accounts that violate these terms or abuse the service (for example, submitting URLs intended
            to attack our infrastructure or someone else&apos;s).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">Liability</h2>
          <p className="mt-2">
            The service is provided &quot;as is.&quot; We&apos;re not liable for decisions made based on our
            recommendations or estimates, or for losses arising from your use of third-party integrations you
            choose to enable.
          </p>
        </section>
      </div>
    </div>
  );
}
