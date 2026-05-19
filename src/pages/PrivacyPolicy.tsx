import { LEGAL_CONTACT_EMAIL } from '../legal/contactEmail'

/**
 * Privacy Policy — public page (/privacy).
 * Describes Firebase, Resend, cookies/storage, and absence of optional analytics in the current build.
 */

export function PrivacyPolicy() {
  return (
    <div className="min-h-[100dvh] bg-bg text-gray-300 flex flex-col">
      <header className="border-b border-white/10 bg-bg2 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <span className="font-condensed text-lg sm:text-xl font-black text-white tracking-tight">
            Practice<span className="text-accent">Builder</span>
          </span>
          <nav className="flex items-center gap-3 text-xs sm:text-sm">
            <a href="/terms" className="font-semibold text-gray-500 hover:text-accent transition-colors">
              Terms
            </a>
            <a href="/" className="font-semibold text-accent hover:text-accent/80 transition-colors whitespace-nowrap">
              ← Back to app
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-5 py-8 sm:py-12 pb-28 sm:pb-24">
        <article className="max-w-none text-[15px] sm:text-base leading-relaxed">
          <h1 className="font-condensed text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 mb-8">Last Updated: May 2026</p>

          <div className="rounded-xl border border-white/10 bg-bg2/50 px-4 py-3 mb-10 text-sm text-gray-400 leading-relaxed">
            This policy describes how <strong className="text-gray-200">Practice Plan Builder</strong> (&quot;we&quot;,
            &quot;us&quot;) handles personal information when you use our web application at{' '}
            <span className="text-gray-300">practice-plan-builder.web.app</span> and related Firebase-hosted URLs.
            The Service is operated by <strong className="text-gray-200">Pylyp Harmash</strong> (the &quot;Operator&quot;).
            This document is provided for transparency; it is not legal advice.
          </div>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">1. Canadian privacy framework</h2>
            <p className="text-gray-300 leading-relaxed">
              We collect, use, and disclose personal information in accordance with Canada&apos;s{' '}
              <strong className="text-white">Personal Information Protection and Electronic Documents Act</strong> (PIPEDA),
              where it applies, and with applicable provincial privacy laws. Users in Canada should also review any
              obligations that apply to their organization (for example, clubs or employers) when they upload information
              about athletes or staff.
            </p>
            <p className="text-gray-300 leading-relaxed">
              For disputes arising from privacy practices related to this Policy, the governing law for the Service is
              the <strong className="text-white">Province of Ontario</strong> and the{' '}
              <strong className="text-white">federal laws of Canada</strong> applicable therein (consistent with our Terms
              of Service), without prejudice to mandatory protections in other jurisdictions.
            </p>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">2. Categories of information we process</h2>
            <p className="text-gray-300 leading-relaxed">
              Depending on how you use the Service, we or our processors may process:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-300 marker:text-accent">
              <li>
                <strong className="text-white">Account &amp; authentication data:</strong> identifiers from Firebase
                Authentication (for example, email address, display name, photo URL, unique user ID) when you sign in or
                create a profile.
              </li>
              <li>
                <strong className="text-white">Profile &amp; roster information:</strong> coaching/player profile fields
                stored in our database (for example, name, group assignment, position, jersey, preferences such as
                practice-day email reminders).
              </li>
              <li>
                <strong className="text-white">Operational coaching content:</strong> schedules, practice plans, drills,
                attendance / sign-in records, availability messages, wellness-related inputs you or your organization
                submit through the Tool.
              </li>
              <li>
                <strong className="text-white">Technical &amp; security metadata:</strong> data incidentally processed by
                our hosting and authentication providers (for example, IP-derived security signals, server logs) as
                described in their documentation.
              </li>
            </ul>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">3. Purposes of processing</h2>
            <p className="text-gray-300 leading-relaxed">We use personal information to:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-300 marker:text-accent">
              <li>provide, secure, and maintain accounts and the Service;</li>
              <li>store and display coaching content you choose to enter;</li>
              <li>
                send <strong className="text-white">transactional / operational emails</strong> you request (for example,
                practice-day reminders processed via our email delivery provider);
              </li>
              <li>respond to support requests sent to the contact email below;</li>
              <li>meet legal, security, and fraud-prevention obligations.</li>
            </ul>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">4. Consent and withdrawal</h2>
            <p className="text-gray-300 leading-relaxed">
              By creating an account or continuing to use the Service after we present this Policy (including via the
              in-product privacy notice), you consent to the collection, use, and disclosure of personal information as
              described here, except where another lawful basis applies under Canadian law.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Where the Service offers optional communications (for example, practice-day email reminders), you may turn
              those features off in your profile/settings where available. You may withdraw consent for non-essential
              processing subject to legal or contractual restrictions; withdrawing consent may limit certain features.
            </p>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">
              5. Third-party processors (beyond our own code)
            </h2>
            <p className="text-gray-300 leading-relaxed">
              We rely on subprocessors to host and deliver the Service. As of this Policy, they include:
            </p>
            <ul className="list-disc pl-5 space-y-3 text-gray-300 marker:text-accent">
              <li>
                <strong className="text-white">Google Firebase / Google Cloud</strong> — authentication, Realtime Database,
                and web hosting for the application. Processing location and subprocessors are described in Google&apos;s
                documentation and privacy materials.
              </li>
              <li>
                <strong className="text-white">Google sign-in</strong> — if you choose &quot;Sign in with Google,&quot;
                Google acts as an identity provider and may process account identifiers according to{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent/80 underline underline-offset-2"
                >
                  Google&apos;s Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong className="text-white">Resend</strong> — delivery of certain transactional emails initiated by the
                Service (for example, practice reminders). Content and recipient addresses are transmitted to Resend only
                as needed to send those messages; see{' '}
                <a
                  href="https://resend.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent/80 underline underline-offset-2"
                >
                  Resend&apos;s Privacy Policy
                </a>
                .
              </li>
            </ul>
            <p className="text-gray-300 leading-relaxed">
              Personal information may be stored or processed <strong className="text-white">outside Canada</strong>{' '}
              (including in the United States) when using these providers. We use contractual and vendor safeguards
              appropriate to the risk; you should review subprocessors&apos; policies before using the Service if cross-border
              transfer is a concern for your organization.
            </p>
            <p className="text-gray-300 leading-relaxed">
              We do <strong className="text-white">not</strong> sell your personal information.
            </p>
          </section>

          <hr className="border-white/10 my-8" />

          <section id="cookies" className="space-y-3 mb-10 scroll-mt-24">
            <h2 className="font-condensed text-xl font-bold text-white">6. Cookies and similar technologies</h2>
            <p className="text-gray-300 leading-relaxed">
              We use <strong className="text-white">essential technologies</strong> needed to operate the Service,
              including browser storage mechanisms (such as <strong className="text-white">local storage</strong> or{' '}
              <strong className="text-white">indexedDB</strong>) that Firebase Authentication and related libraries may use
              to keep your session secure and persist sign-in state between visits.
            </p>
            <p className="text-gray-300 leading-relaxed">
              <strong className="text-white">Optional analytics &amp; advertising:</strong> The current production web client
              does <strong className="text-white">not</strong> load third-party advertising trackers or standalone marketing
              analytics products (for example, Google Analytics, Meta Pixel, or similar) beyond what Firebase/Google may
              handle as part of providing Authentication, database, and hosting services. If we introduce optional
              analytics or similar technologies that are not strictly necessary, we will update this Policy and, where
              required by law, provide an appropriate consent mechanism before activating them.
            </p>
            <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-gray-200 leading-relaxed">
              <strong className="text-accent">Cookie-style notice.</strong> Continued use of the Service with essential
              authentication and hosting technologies constitutes acknowledgment that such technologies are used as
              described above. Use the in-product acknowledgement (where shown) to confirm you have reviewed our Privacy
              Policy and subprocessors at a high level.
            </div>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">7. Retention</h2>
            <p className="text-gray-300 leading-relaxed">
              We retain personal information only as long as reasonably necessary to provide the Service, comply with law,
              resolve disputes, and enforce our agreements. You may request deletion or correction of certain profile data
              through account tools where available, or by contacting us; some residual backups or logs may persist for a
              limited period according to our providers&apos; retention practices.
            </p>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">8. Security</h2>
            <p className="text-gray-300 leading-relaxed">
              We implement reasonable administrative, technical, and organizational measures appropriate to the nature of
              the Service. No method of transmission over the Internet is completely secure; you use the Service at your own
              risk with respect to matters outside our reasonable control.
            </p>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">9. Access, correction, and complaints</h2>
            <p className="text-gray-300 leading-relaxed">
              Subject to applicable law, you may request access to or correction of personal information we hold about you
              by emailing{' '}
              <a
                href={`mailto:${LEGAL_CONTACT_EMAIL}`}
                className="text-accent font-semibold hover:text-accent/80 underline underline-offset-2 break-all"
              >
                {LEGAL_CONTACT_EMAIL}
              </a>
              . We may need to verify your identity before responding. You may also file a complaint with the Office of the
              Privacy Commissioner of Canada or another competent supervisory authority where permitted by law.
            </p>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">10. Minors and organizations</h2>
            <p className="text-gray-300 leading-relaxed">
              The Service may be used in contexts involving minors (for example, youth athletes). Organizations that invite
              minors to use the Service remain responsible for obtaining any required parental or guardian consent and for
              complying with applicable child-privacy rules beyond this Policy.
            </p>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">11. Changes</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will post the revised version with an updated &quot;Last
              Updated&quot; date. Material changes may be communicated through the Service or by email where appropriate.
            </p>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3">
            <h2 className="font-condensed text-xl font-bold text-white">12. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              Questions about this Privacy Policy or our privacy practices:{' '}
              <a
                href={`mailto:${LEGAL_CONTACT_EMAIL}`}
                className="text-accent font-semibold hover:text-accent/80 underline underline-offset-2 break-all"
              >
                {LEGAL_CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </article>
      </main>

      <footer className="border-t border-white/10 bg-bg2 py-4 flex-shrink-0">
        <p className="text-center text-xs text-gray-600 px-5">
          <a href="/terms" className="text-gray-500 hover:text-accent transition-colors">
            Terms of Service
          </a>
          <span className="mx-2 text-gray-700">·</span>
          <a href="/" className="text-gray-500 hover:text-accent transition-colors">
            Home
          </a>
        </p>
      </footer>
    </div>
  )
}
