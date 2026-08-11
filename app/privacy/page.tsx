export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-400">Last updated: {new Date().toISOString().slice(0, 10)}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-600">
        <section>
          <h2 className="text-base font-semibold text-zinc-900">What we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Account info: your email address and authentication data, handled by Supabase Auth.</li>
            <li>Websites you submit for analysis: the URL, and the content our crawler reads from public pages of that site (title, headings, text, links — never private or password-protected pages).</li>
            <li>Audit results: the analysis, monetization score, and recommendations we generate for your websites.</li>
            <li>
              Tracking snippet events: if you install our SDK on your site, we receive pageview and click events
              tied to your site&apos;s identifier. The snippet does not use cookies, local storage, or any
              persistent visitor identifier — we can count events per site, not identify or follow individual
              visitors.
            </li>
            <li>Billing information: handled entirely by Stripe. We never see or store your card details.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">Why we collect it</h2>
          <p className="mt-2">
            To provide the product: running your audits, generating recommendations, showing you analytics for
            sites you&apos;ve connected, and processing subscription payments. We don&apos;t sell your data, and
            we don&apos;t use it to train models beyond what&apos;s needed to generate your own audit.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">Who we share it with</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Supabase — database and authentication.</li>
            <li>Anthropic — processes crawled website content to generate your audit&apos;s analysis.</li>
            <li>Stripe — processes payments for paid plans.</li>
          </ul>
          <p className="mt-2">Each acts as a data processor for us and does not use your data for their own purposes.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">Your rights</h2>
          <p className="mt-2">
            You can access, correct, or delete your data at any time. Deleting your account from Settings
            permanently removes your websites, audits, recommendations, integrations, and tracking events. This
            cannot be undone.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">Retention</h2>
          <p className="mt-2">
            We keep your data for as long as your account is active. If you delete your account, associated data
            is removed immediately from our primary database.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900">Contact</h2>
          <p className="mt-2">
            Questions about this policy or your data — reach out via the email associated with your account
            invitation, or through the contact details provided when you signed up.
          </p>
        </section>
      </div>
    </div>
  );
}
