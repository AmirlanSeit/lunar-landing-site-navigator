import { useState } from 'react'

/** Copies the current URL – which always mirrors the scenario – to the clipboard. */
export function ShareButton() {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link to share the scenario:', url)
    }
  }

  return (
    <button className="share-button" onClick={share} aria-live="polite">
      {copied ? 'Link copied' : 'Share scenario'}
    </button>
  )
}
