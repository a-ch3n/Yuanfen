import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "terms of service — yuanfen",
  description:
    "Terms of service for yuanfen, including SMS program details, message frequency, and opt-out instructions.",
};

export default function TermsPage() {
  const updated = "May 23, 2026";

  return (
    <main className="min-h-screen bg-[#fffaf0] text-stone-900">
      <nav className="sticky top-0 z-50 border-b border-[#d4af37]/20 bg-[#fffaf0]/75 px-5 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between text-sm">
          <Link href="/" className="font-semibold tracking-tight text-[#9b1c1c]">
            yuanfen
          </Link>
          <div className="flex gap-6 text-stone-500">
            <Link href="/" className="hover:text-[#9b1c1c]">home</Link>
            <Link href="/privacy" className="hover:text-[#9b1c1c]">privacy</Link>
          </div>
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-5 py-16 md:py-24">
        <p className="text-xs uppercase tracking-[0.35em] text-[#b8860b]">
          legal
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[#7a1f1f] md:text-6xl">
          terms of service
        </h1>
        <p className="mt-3 text-sm text-stone-500">last updated: {updated}</p>

        <div className="mt-12 space-y-10 leading-7 text-stone-700">
          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              sms program details
            </h2>
            <dl className="mt-4 space-y-3">
              <div className="grid grid-cols-[180px_1fr] gap-4">
                <dt className="text-stone-500">Program name</dt>
                <dd>Yuanfen</dd>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-4">
                <dt className="text-stone-500">Description</dt>
                <dd>
                  An SMS-based matchmaking service. We send onboarding
                  questions, match notifications, and account updates over
                  SMS.
                </dd>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-4">
                <dt className="text-stone-500">Message frequency</dt>
                <dd>
                  Recurring. Typically 1 to 10 messages per week, depending on
                  onboarding stage and match activity.
                </dd>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-4">
                <dt className="text-stone-500">Cost</dt>
                <dd>Message and data rates may apply.</dd>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-4">
                <dt className="text-stone-500">Carriers</dt>
                <dd>
                  Supported on all major US carriers. Yuanfen and the carriers
                  are not liable for delayed or undelivered messages.
                </dd>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-4">
                <dt className="text-stone-500">Support</dt>
                <dd>
                  <a
                    href="mailto:hello@joinyuanfen.com"
                    className="text-[#9b1c1c] underline"
                  >
                    hello@joinyuanfen.com
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-[#d4af37]/40 bg-white/60 p-6">
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              opt-out and help
            </h2>
            <p className="mt-3">
              <strong>To opt out at any time, reply STOP</strong> to any
              message you receive from Yuanfen. You will receive a single
              confirmation message and no further messages will be sent unless
              you opt back in.
            </p>
            <p className="mt-3">
              <strong>For help, reply HELP</strong> to any message. You will
              receive a reply with contact information and instructions.
            </p>
            <p className="mt-3">
              You can also opt out or request help by emailing{" "}
              <a
                href="mailto:hello@joinyuanfen.com"
                className="text-[#9b1c1c] underline"
              >
                hello@joinyuanfen.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">consent</h2>
            <p className="mt-3">
              By submitting your phone number through the waitlist form at
              joinyuanfen.com or by texting our number, you expressly consent
              to receive SMS messages from Yuanfen for onboarding, match
              notifications, and account updates. Consent is not a condition
              of any purchase. You must be 18 or older to consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              eligibility
            </h2>
            <p className="mt-3">
              You must be at least 18 years old and a resident of the United
              States to use Yuanfen. By using the Service, you represent that
              you meet these requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              acceptable use
            </h2>
            <p className="mt-3">
              You agree not to use Yuanfen to:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2">
              <li>Harass, threaten, or abuse other users</li>
              <li>Impersonate any person or entity</li>
              <li>Send spam, advertising, or unsolicited messages</li>
              <li>Provide false or misleading information</li>
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to access information you are not authorized to view</li>
            </ul>
            <p className="mt-3">
              Violation of these terms may result in immediate suspension or
              termination of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              your responsibility for connections
            </h2>
            <p className="mt-3">
              Yuanfen facilitates introductions between consenting users. When
              both parties reply YES to a mutual introduction, contact
              information is shared. What happens after that is between you
              and the other person. We are not responsible for the conduct,
              accuracy, or safety of any user. Meet in person at your own
              discretion and use common sense.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              no guarantee
            </h2>
            <p className="mt-3">
              We do not guarantee that you will be matched with anyone, that
              any match will lead to a relationship, or that the Service will
              be uninterrupted or error-free. The Service is provided
              &quot;as is.&quot;
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              termination
            </h2>
            <p className="mt-3">
              You may stop using the Service at any time by replying STOP. We
              may suspend or terminate your account if you violate these
              Terms, for any reason, at our sole discretion. We will use
              reasonable efforts to notify you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              limitation of liability
            </h2>
            <p className="mt-3">
              To the maximum extent permitted by law, Yuanfen and its
              operators are not liable for any indirect, incidental, special,
              consequential, or punitive damages arising from your use of the
              Service. Our total liability to you for any claim shall not
              exceed one hundred US dollars (USD $100).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">privacy</h2>
            <p className="mt-3">
              Your privacy is important to us. Please review our{" "}
              <Link href="/privacy" className="text-[#9b1c1c] underline">
                Privacy Policy
              </Link>{" "}
              to understand how we collect, use, and protect your
              information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              changes to these terms
            </h2>
            <p className="mt-3">
              We may update these Terms from time to time. Material changes
              will be communicated by SMS or posted at this URL with a new
              &quot;last updated&quot; date. Continued use of the Service
              after changes means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              governing law
            </h2>
            <p className="mt-3">
              These Terms are governed by the laws of the United States and
              the state in which Yuanfen is operated, without regard to
              conflict-of-law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">contact</h2>
            <p className="mt-3">
              Questions about these Terms can be sent to{" "}
              <a
                href="mailto:hello@joinyuanfen.com"
                className="text-[#9b1c1c] underline"
              >
                hello@joinyuanfen.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-16 border-t border-[#d4af37]/30 pt-8 text-sm text-stone-500">
          <Link href="/" className="hover:text-[#9b1c1c]">
            ← back to yuanfen
          </Link>
        </div>
      </article>
    </main>
  );
}
