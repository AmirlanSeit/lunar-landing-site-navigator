import { useState, type FormEvent } from 'react'
import { createCustomSite } from '../lib/custom-site'
import { loadSiteData } from '../lib/data'
import type { Site } from '../lib/types'
import './CustomSiteForm.css'

export function CustomSiteForm({ onAdd }: { onAdd: (site: Site) => void }) {
  const [name, setName] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [added, setAdded] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setError('')
    setAdded('')
    try {
      const site = createCustomSite({ name, lat, lon })
      setLoading(true)
      await loadSiteData(site)
      onAdd(site)
      setAdded(site.name)
      setName('')
      setLat('')
      setLon('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add this site. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="custom-site-form" onSubmit={handleSubmit} noValidate aria-labelledby="custom-site-title" aria-busy={loading}>
      <h2 id="custom-site-title" className="section-title">Add a custom site</h2>
      <p className="custom-site-note">South of 83.5°S, the horizon comes from LRO LOLA terrain (120 m grid). Elsewhere it is flat, so real hills are not modeled.</p>
      <fieldset disabled={loading}>
        <legend className="custom-site-legend">Lunar coordinates</legend>
        <div className="control">
          <label htmlFor="custom-name">Name (optional)</label>
          <input id="custom-name" type="text" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="My landing site" />
        </div>
        <div className="control">
          <label htmlFor="custom-lat">Latitude</label>
          <input id="custom-lat" type="number" min={-90} max={90} step="any" required value={lat} onChange={(event) => setLat(event.target.value)} placeholder="-89.5" aria-describedby="custom-lat-hint" />
          <span id="custom-lat-hint" className="custom-site-hint">−90 to 90°; south is negative</span>
        </div>
        <div className="control">
          <label htmlFor="custom-lon">Longitude</label>
          <input id="custom-lon" type="number" min={-180} max={360} step="any" required value={lon} onChange={(event) => setLon(event.target.value)} placeholder="0" aria-describedby="custom-lon-hint" />
          <span id="custom-lon-hint" className="custom-site-hint">−180 to 360° east</span>
        </div>
        <button type="submit" className="custom-site-submit">{loading ? 'Adding…' : 'Add to squad'}</button>
      </fieldset>
      {loading && <p className="custom-site-status" role="status">Loading Sun and Earth positions from JPL Horizons and the terrain horizon… This can take up to a minute.</p>}
      {error && <p className="custom-site-error" role="alert">{error}</p>}
      {added && <p className="custom-site-status" role="status">{added} added to the squad and selected as the originally planned site.</p>}
    </form>
  )
}
