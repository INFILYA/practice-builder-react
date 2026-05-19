import { useEffect, useState } from 'react'

const STORAGE_KEY = 'ppb_privacy_notice_v1'

export function CookieConsentBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      setShow(localStorage.getItem(STORAGE_KEY) !== '1')
    } catch {
      setShow(true)
    }
  }, [])

  const acknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore quota / private mode */
    }
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed bottom-0 inset-x-0 z-[100] border-t border-white/10 bg-bg2/95 backdrop-blur-md shadow-[0_-8px_32px_rgba(0,0,0,0.45)] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 sm:flex sm:items-end sm:gap-4">
        <div className="flex-1 min-w-0 mb-3 sm:mb-0">
          <p id="cookie-banner-title" className="text-xs font-bold text-white uppercase tracking-wider mb-1">
            Privacy &amp; cookies
          </p>
          <p id="cookie-banner-desc" className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
            We use <strong className="text-gray-300">essential</strong> technologies (including browser storage) so you can
            stay signed in and use Practice Plan Builder. The Service runs on{' '}
            <strong className="text-gray-300">Firebase (Google)</strong> and may send operational emails via{' '}
            <strong className="text-gray-300">Resend</strong>.{' '}
            <strong className="text-gray-300">We do not currently add optional analytics or advertising trackers</strong>{' '}
            beyond what those providers use to deliver auth, database, and hosting. See our{' '}
            <a href="/privacy#cookies" className="text-accent font-semibold hover:text-accent/80 underline underline-offset-2">
              Privacy Policy
            </a>{' '}
            for details and subprocessors.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
          <a
            href="/privacy"
            className="sm:order-first text-center py-2 px-3 rounded-lg border border-white/15 text-xs font-semibold text-gray-300 hover:bg-white/5 transition-colors"
          >
            Full policy
          </a>
          <button
            type="button"
            onClick={acknowledge}
            className="py-2 px-4 rounded-lg bg-accent text-black text-xs font-bold hover:bg-accent/90 transition-colors"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  )
}
