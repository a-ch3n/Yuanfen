import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "privacy policy — yuanfen",
  description: "How yuanfen collects, uses, and protects your information.",
};

export default function PrivacyPage() {
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
            <Link href="/terms" className="hover:text-[#9b1c1c]">terms</Link>
          </div>
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-5 py-16 md:py-24">
        <p className="text-xs uppercase tracking-[0.35em] text-[#b8860b]">
          legal
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[#7a1f1f] md:text-6xl">
          privacy policy
        </h1>
        <p className="mt-3 text-sm text-stone-500">last updated: {updated}</p>

        <div className="mt-12 space-y-10 leading-7 text-stone-700">
          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">overview</h2>
            <p className="mt-3">
              Yuanfen (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates joinyuanfen.com (the
              &quot;Service&quot;), an SMS-based matchmaking platform. This Privacy
              Policy explains what information we collect, how we use it, and
              the choices you have. By using the Service, you agree to the
              terms of this Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              information we collect
            </h2>
            <p className="mt-3">
              We collect the following information directly from you:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2">
              <li>
                <span className="font-medium">Phone number</span> — submitted
                via our waitlist form or sent to our SMS shortcode.
              </li>
              <li>
                <span className="font-medium">Onboarding responses</span> —
                your name, age, city, and answers to our matchmaking questions,
                provided over SMS.
              </li>
              <li>
                <span className="font-medium">Message history</span> — SMS
                messages exchanged between you and Yuanfen.
              </li>
              <li>
                <span className="font-medium">Email address</span> — if
                provided through the waitlist form.
              </li>
            </ul>
            <p className="mt-3">
              We do not collect photos, payment information, social security
              numbers, government IDs, location data, or biometric data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              how we use your information
            </h2>
            <p className="mt-3">We use your information solely to:</p>
            <ul className="mt-3 list-disc pl-6 space-y-2">
              <li>Operate the matchmaking service</li>
              <li>
                Send you SMS messages related to onboarding, match
                notifications, and account updates
              </li>
              <li>
                Generate a private personality profile to identify compatible
                matches
              </li>
              <li>
                Share your first name and phone number with another user
                <span className="font-medium"> only after both parties
                explicitly reply YES </span>
                to a mutual introduction
              </li>
              <li>
                Respond to support requests and improve the Service
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              we do not sell or share your information
            </h2>
            <p className="mt-3">
              We do not sell, rent, lease, or trade your personal information
              to any third party. We do not share your information with
              advertisers, data brokers, or marketing companies. Your phone
              number and personal responses are never used for advertising
              purposes, including by third parties or affiliates.
            </p>
            <p className="mt-3">
              <span className="font-medium">
                Mobile information will not be shared with third parties or
                affiliates for marketing or promotional purposes.
              </span>{" "}
              No mobile information will be shared with third parties or
              affiliates for marketing or promotional purposes. Information
              sharing to subcontractors in support services, such as customer
              service, is permitted. All other use case categories exclude
              text messaging originator opt-in data and consent; this
              information will not be shared with any third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              service providers
            </h2>
            <p className="mt-3">
              We rely on the following service providers to operate Yuanfen.
              Each receives only the minimum information necessary to perform
              its function:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2">
              <li>
                <span className="font-medium">Twilio</span> — sends and
                receives SMS messages. Twilio receives your phone number and
                message contents.
              </li>
              <li>
                <span className="font-medium">OpenAI</span> — analyzes your
                onboarding answers to build a personality profile. OpenAI
                receives only the text of your answers, not your phone number
                or name.
              </li>
              <li>
                <span className="font-medium">Railway</span> — hosts our
                application and database.
              </li>
              <li>
                <span className="font-medium">Vercel</span> — hosts our
                website.
              </li>
            </ul>
            <p className="mt-3">
              These providers are bound by their own privacy policies and
              contractual obligations to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">sms consent and frequency</h2>
            <p className="mt-3">
              By submitting your phone number through our waitlist form, you
              consent to receive SMS messages from Yuanfen for onboarding,
              match notifications, and account updates. Message frequency
              varies but is typically 1 to 10 messages per week. Message and
              data rates may apply.
            </p>
            <p className="mt-3">
              You can opt out at any time by replying <strong>STOP</strong> to
              any message. For help, reply <strong>HELP</strong>. After you
              reply STOP, you will receive a single confirmation message and
              then no further messages from us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              your rights
            </h2>
            <p className="mt-3">You have the right to:</p>
            <ul className="mt-3 list-disc pl-6 space-y-2">
              <li>Request a copy of the data we hold about you</li>
              <li>
                Request that we correct or delete your information
              </li>
              <li>Opt out of SMS messages at any time (reply STOP)</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{" "}
              <a
                href="mailto:hello@joinyuanfen.com"
                className="text-[#9b1c1c] underline"
              >
                hello@joinyuanfen.com
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              data retention
            </h2>
            <p className="mt-3">
              We keep your information for as long as your account is active.
              If you opt out via STOP or request deletion, we will remove your
              personal information within 30 days, except where retention is
              required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">security</h2>
            <p className="mt-3">
              We use industry-standard practices to protect your information,
              including encrypted database storage and HTTPS for all web
              traffic. No method of transmission over the internet is 100%
              secure, but we work to safeguard your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">children</h2>
            <p className="mt-3">
              Yuanfen is intended for users 18 and older. We do not knowingly
              collect information from anyone under 18. If we learn we have
              collected information from a minor, we will delete it
              immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">
              changes to this policy
            </h2>
            <p className="mt-3">
              We may update this Privacy Policy from time to time. We will
              post the updated version at this URL with a new &quot;last
              updated&quot; date. Material changes will be communicated by
              SMS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#7a1f1f]">contact</h2>
            <p className="mt-3">
              Questions about this Privacy Policy can be sent to{" "}
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
