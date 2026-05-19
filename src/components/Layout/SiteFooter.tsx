/** Minimal site footer with link to public Terms page (`/terms`). */
export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="flex-shrink-0 border-t border-white/7 bg-bg2/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] sm:text-xs text-gray-600">
        <a
          href="/terms"
          className="text-gray-500 hover:text-accent transition-colors underline-offset-2 hover:underline font-medium"
        >
          Terms of Service
        </a>
        <span className="text-gray-700 hidden sm:inline" aria-hidden>
          ·
        </span>
        <a
          href="/privacy"
          className="text-gray-500 hover:text-accent transition-colors underline-offset-2 hover:underline font-medium"
        >
          Privacy Policy
        </a>
        <span className="text-gray-700 hidden sm:inline" aria-hidden>
          ·
        </span>
        <span className="text-gray-600">© {year} Practice Plan Builder</span>
      </div>
    </footer>
  )
}
