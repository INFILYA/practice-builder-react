import { LEGAL_CONTACT_EMAIL } from '../legal/contactEmail'

/** Terms of Service — public legal page (/terms). */

export function TermsOfService() {
  return (
    <div className="min-h-[100dvh] bg-bg text-gray-300 flex flex-col">
      <header className="border-b border-white/10 bg-bg2 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <span className="font-condensed text-lg sm:text-xl font-black text-white tracking-tight">
            Practice<span className="text-accent">Builder</span>
          </span>
          <nav className="flex items-center gap-3 text-xs sm:text-sm">
            <a href="/privacy" className="font-semibold text-gray-500 hover:text-accent transition-colors">
              Privacy
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
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500 mb-8">Last Updated: May 2026</p>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing and using Practice Plan Builder (the &quot;Service&quot;), you agree to be bound by these Terms
              of Service. If you do not agree, please do not use the Service.
            </p>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">2. Description of Service</h2>
            <p className="text-gray-300 leading-relaxed">
              Practice Plan Builder is a digital SaaS tool designed to assist sports coaches in organizing and creating
              practice plans. We provide access to the software infrastructure and interface (&quot;the Tool&quot;).
              Pylyp Harmash (the &quot;Developer&quot;) provides the platform only; the Service does not dictate specific
              training methodologies, and users are entirely responsible for the content they input.
            </p>
            <div className="rounded-xl border border-accent/25 bg-accent/5 px-4 py-3 mt-4">
              <p className="text-sm text-gray-200 leading-relaxed">
                <strong className="text-accent">Tool / infrastructure only.</strong> The Service is software for organizing
                plans and related workflows. The Developer does{' '}
                <strong className="text-white">not</strong> own your uploaded training data (you retain your content —
                see §3), and is{' '}
                <strong className="text-white">not</strong> responsible for coaching decisions, athlete health, or any
                athletic performance or injury outcomes arising from use of the Tool.
              </p>
            </div>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-4 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">3. Intellectual Property</h2>
            <ul className="list-disc pl-5 space-y-3 text-gray-300 leading-relaxed marker:text-accent">
              <li>
                <strong className="text-white">The Tool:</strong> All rights, title, and interest in and to the Service
                (including code, architecture, design, and logic) are and will remain the exclusive property of the
                Developer.
              </li>
              <li>
                <strong className="text-white">Your Content:</strong> You retain all rights to the specific practice
                data, drills, and training plans you input into the Tool. By using the Service, you grant us a limited
                license to host and display your content solely for your operational use.
              </li>
            </ul>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">4. License to Use</h2>
            <p className="text-gray-300 leading-relaxed">
              We grant you a personal, non-transferable, and non-exclusive license to use the Service for your
              professional or personal coaching activities. You may not copy, modify, reverse engineer, or resell access
              to the Tool to third parties without express written consent.
            </p>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">5. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              The Service is provided &quot;as is&quot; without any warranties. The Developer shall not be liable for any
              indirect, incidental, or consequential damages resulting from the use or inability to use the Tool,
              including but not limited to loss of data, system downtime, or any athletic performance/injury outcomes.
            </p>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3 mb-10">
            <h2 className="font-condensed text-xl font-bold text-white">6. Governing Law</h2>
            <p className="text-gray-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the{' '}
              <strong className="text-white">Province of Ontario</strong> and the{' '}
              <strong className="text-white">federal laws of Canada</strong> applicable therein.
            </p>
          </section>

          <hr className="border-white/10 my-8" />

          <section className="space-y-3">
            <h2 className="font-condensed text-xl font-bold text-white">7. Contact Information</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about these Terms, please contact support at:{' '}
              <a
                href={`mailto:${LEGAL_CONTACT_EMAIL}`}
                className="text-accent font-semibold hover:text-accent/80 underline underline-offset-2 break-all"
              >
                {LEGAL_CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </article>
      </main>

      <footer className="border-t border-white/10 bg-bg2 py-4 flex-shrink-0">
        <p className="text-center text-xs text-gray-600 px-5">
          <a href="/privacy" className="text-gray-500 hover:text-accent transition-colors">
            Privacy Policy
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
