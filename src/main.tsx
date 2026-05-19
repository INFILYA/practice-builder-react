import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { TermsOfService } from './pages/TermsOfService'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { CookieConsentBanner } from './components/Layout/CookieConsentBanner'
import './index.css'

function normalizePath(pathname: string): string {
  let p = pathname
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p || '/'
}

function Root() {
  const path = normalizePath(window.location.pathname)

  const page =
    path === '/terms' ? <TermsOfService /> : path === '/privacy' ? <PrivacyPolicy /> : <App />

  return (
    <>
      {page}
      <CookieConsentBanner />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
