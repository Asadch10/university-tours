import type { Metadata } from 'next';
import { Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How University Campus Private Tours collects, uses, shares, and protects your data — including payments via Stripe, masked contact details, security practices, and your GDPR and CCPA rights.',
};

export default function PrivacyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-maroon-gradient pt-[var(--header-h)] text-ivory">
        <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
        <div
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl"
          aria-hidden
        />
        <div className="container-page relative py-16 sm:py-20">
          <div className="max-w-3xl">
            <span className="eyebrow text-gold-300">
              <span className="h-px w-6 bg-gold-300/60" /> Legal
            </span>
            <h1 className="mt-4 flex items-center gap-3 font-display text-4xl font-semibold leading-[1.1] sm:text-5xl">
              <Lock className="text-gold-300" size={34} aria-hidden />
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm font-medium uppercase tracking-wider text-ivory/60">
              Last updated: June 15, 2026
            </p>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-ivory/75">
              What we collect, how we use it, and the controls you have — written to be clear, not
              clever.
            </p>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <div className="prose prose-ink max-w-none prose-headings:font-display prose-headings:text-ink-900 prose-a:text-maroon-800 prose-a:font-medium hover:prose-a:text-maroon-900">
              <p className="lead">
                University Campus Private Tours (&ldquo;UCPT,&rdquo; &ldquo;we,&rdquo;
                &ldquo;us&rdquo;) respects your privacy. This policy explains what personal data we
                collect, how we use and share it, and the rights you have over it. By using the
                Platform, you agree to the practices described here.
              </p>

              <h2>1. Data we collect</h2>
              <ul>
                <li>
                  <strong>Account data:</strong> name, email, password, role (family or guide), and
                  profile details you choose to add.
                </li>
                <li>
                  <strong>Booking data:</strong> the tours you request, messages exchanged,
                  schedules, and reviews.
                </li>
                <li>
                  <strong>Payment data:</strong> processed securely by{' '}
                  <a href="https://stripe.com" rel="noopener noreferrer" target="_blank">
                    Stripe
                  </a>
                  . We never store full card numbers; we receive only limited transaction details.
                </li>
                <li>
                  <strong>Verification data (guides):</strong> enrollment and identity documents used
                  to confirm you are a current student.
                </li>
                <li>
                  <strong>Usage data:</strong> device, browser, pages viewed, and similar analytics
                  that help us improve the Platform.
                </li>
              </ul>

              <h2>2. How we use your data</h2>
              <ul>
                <li>To create and manage your account and process bookings and payments.</li>
                <li>To verify student guides and keep the marketplace safe.</li>
                <li>To provide support and send service-related communications.</li>
                <li>To improve, personalize, and secure the Platform.</li>
                <li>To comply with legal obligations and enforce our Terms.</li>
              </ul>

              <h2>3. How we share your data</h2>
              <p>
                We do not sell your personal data. We share it only as needed to operate the
                Platform:
              </p>
              <ul>
                <li>
                  <strong>With guides:</strong> a family&rsquo;s contact details remain masked until a
                  booking is confirmed; only then is the necessary information shared to coordinate
                  the tour.
                </li>
                <li>
                  <strong>With service providers:</strong> such as Stripe for payments and
                  infrastructure partners, under contracts that protect your data.
                </li>
                <li>
                  <strong>For legal reasons:</strong> when required by law or to protect rights,
                  safety, and security.
                </li>
              </ul>

              <h2>4. Cookies</h2>
              <p>
                We use cookies and similar technologies to keep you signed in, remember preferences,
                and understand how the Platform is used. You can control cookies through your browser
                settings; disabling some may affect functionality.
              </p>

              <h2>5. Security</h2>
              <p>
                We protect your data with encryption in transit and at rest, access controls, and
                regular review of our practices. Sensitive verification and identity documents are
                restricted to authorized administrators only. No method of transmission or storage is
                completely secure, but we work hard to safeguard your information.
              </p>

              <h2>6. Your rights</h2>
              <p>
                Depending on where you live, you may have rights under laws such as the GDPR and CCPA,
                including the right to:
              </p>
              <ul>
                <li>Access and export a copy of your personal data.</li>
                <li>Correct inaccurate data.</li>
                <li>Request deletion of your data.</li>
                <li>Object to or restrict certain processing.</li>
                <li>Opt out of the &ldquo;sale&rdquo; of personal data (we do not sell it).</li>
              </ul>
              <p>
                To exercise any of these rights, contact us using the details below. We will not
                discriminate against you for doing so.
              </p>

              <h2>7. Children&rsquo;s privacy</h2>
              <p>
                The Platform is intended for adults. We do not knowingly collect personal data from
                children under 18 without verified parent or guardian consent. Where a tour involves a
                prospective student who is a minor, a parent or guardian must book, supervise, and
                consent on their behalf. If you believe a minor has provided data without consent,
                contact us and we will delete it promptly.
              </p>

              <h2>8. Data retention</h2>
              <p>
                We keep personal data only as long as needed to provide the Platform, meet legal and
                tax obligations, resolve disputes, and enforce our agreements. When data is no longer
                needed, we delete or anonymize it.
              </p>

              <h2>9. Contact us</h2>
              <p>
                For privacy questions or to exercise your rights, email our privacy team at{' '}
                <a href="mailto:privacy@ucpt.example">privacy@ucpt.example</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
