import type { Metadata } from 'next';
import { Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms that govern your use of University Campus Private Tours — covering eligibility, accounts, bookings, payments, refunds, guide obligations, liability, and dispute resolution.',
};

export default function TermsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-maroon-gradient pt-[var(--header-h)] text-ivory">
        <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl"
          aria-hidden
        />
        <div className="container-page relative py-16 sm:py-20">
          <div className="max-w-3xl">
            <span className="eyebrow text-gold-300">
              <span className="h-px w-6 bg-gold-300/60" /> Legal
            </span>
            <h1 className="mt-4 flex items-center gap-3 font-display text-4xl font-semibold leading-[1.1] sm:text-5xl">
              <Scale className="text-gold-300" size={36} aria-hidden />
              Terms of Service
            </h1>
            <p className="mt-4 text-sm font-medium uppercase tracking-wider text-ivory/60">
              Last updated: June 15, 2026
            </p>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-ivory/75">
              The agreement that governs how families and student guides use University Campus
              Private Tours to book and host campus visits.
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
                Welcome to University Campus Private Tours (&ldquo;UCPT,&rdquo; &ldquo;we,&rdquo;
                &ldquo;us,&rdquo; or &ldquo;our&rdquo;). These Terms of Service (the
                &ldquo;Terms&rdquo;) form a binding agreement between you and UCPT and govern your
                access to and use of our website, marketplace, and related services (the
                &ldquo;Platform&rdquo;). Please read them carefully.
              </p>

              <h2>1. Acceptance of these Terms</h2>
              <p>
                By creating an account, booking a tour, listing yourself as a student guide, or
                otherwise using the Platform, you agree to be bound by these Terms and our Privacy
                Policy. If you do not agree, you may not use the Platform. If you are using the
                Platform on behalf of a family or organization, you represent that you are
                authorized to accept these Terms on their behalf.
              </p>

              <h2>2. Eligibility</h2>
              <p>
                You must be at least 18 years old to create an account, make a booking, or act as a
                guide. Families booking on behalf of a prospective student who is a minor may do so,
                but a parent or legal guardian must provide consent and supervise the experience.
                Minors may not register, book, or attend a tour without verified guardian consent.
              </p>
              <ul>
                <li>Account holders confirm they meet these age and consent requirements.</li>
                <li>Guides must be currently enrolled students who pass our verification process.</li>
                <li>We may refuse, suspend, or remove any account at our discretion.</li>
              </ul>

              <h2>3. Your account</h2>
              <p>
                You are responsible for the accuracy of the information you provide and for keeping
                your login credentials secure. You must notify us promptly of any unauthorized use
                of your account. You are responsible for all activity that occurs under your account.
              </p>

              <h2>4. Bookings &amp; payments</h2>
              <p>
                When you request a tour or video consultation, your selected payment method is
                authorized but only charged once the guide accepts the request. If the guide declines
                or does not respond within the stated window, no charge is made.
              </p>
              <h3>Service fees and commission</h3>
              <p>
                UCPT charges a platform commission, which is included in the price shown at checkout.
                Guides receive their payout, net of commission, after the tour is completed. All
                prices are displayed in the applicable currency before you confirm.
              </p>
              <h3>Cancellations &amp; refunds</h3>
              <ul>
                <li>
                  <strong>Family cancels 24 hours or more before the start time:</strong> full
                  refund.
                </li>
                <li>
                  <strong>Family cancels within 24 hours of the start time:</strong> non-refundable.
                </li>
                <li>
                  <strong>Guide cancels (any time):</strong> full refund to the family, and the
                  cancellation may affect the guide&rsquo;s standing.
                </li>
              </ul>
              <p>
                Refunds are returned to the original payment method and may take several business days
                to appear, depending on your bank or card issuer.
              </p>

              <h2>5. Guide obligations</h2>
              <p>If you offer tours as a student guide, you agree to:</p>
              <ul>
                <li>Provide honest, accurate information about your enrollment, major, and campus.</li>
                <li>Honor accepted bookings and arrive on time, prepared, and professional.</li>
                <li>Prioritize the safety and comfort of families throughout the experience.</li>
                <li>
                  Comply with your university&rsquo;s policies and all applicable laws, and never
                  imply official endorsement by a university unless authorized.
                </li>
              </ul>

              <h2>6. Prohibited conduct</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Harass, threaten, discriminate against, or endanger any user.</li>
                <li>Provide false information or impersonate another person or institution.</li>
                <li>Circumvent the Platform to arrange or pay for tours off-platform.</li>
                <li>Post unlawful, infringing, or misleading content.</li>
                <li>Attempt to disrupt, reverse engineer, or gain unauthorized access to the Platform.</li>
              </ul>

              <h2>7. Disclaimer &amp; limitation of liability</h2>
              <p>
                The Platform connects families with independent student guides; guides are not
                employees or agents of UCPT. To the fullest extent permitted by law, the Platform and
                its content are provided &ldquo;as is&rdquo; without warranties of any kind. UCPT is
                not liable for the conduct of any user, for any indirect, incidental, or
                consequential damages, or for amounts exceeding the fees you paid to us in the twelve
                months preceding the claim.
              </p>

              <h2>8. Dispute resolution</h2>
              <p>
                If you have a concern about a booking, please contact us first so we can help resolve
                it. Most issues are settled quickly through our support team. Any dispute that cannot
                be resolved informally will be governed by the laws of the jurisdiction in which UCPT
                operates, and you agree to resolve such disputes individually rather than as part of
                a class action, to the extent permitted by law.
              </p>

              <h2>9. Changes to these Terms</h2>
              <p>
                We may update these Terms from time to time. When we make material changes, we will
                update the &ldquo;Last updated&rdquo; date and, where appropriate, notify you. Your
                continued use of the Platform after changes take effect constitutes acceptance of the
                revised Terms.
              </p>

              <h2>10. Contact us</h2>
              <p>
                Questions about these Terms? Reach our team at{' '}
                <a href="mailto:legal@ucpt.example">legal@ucpt.example</a> and we will be glad to
                help.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
