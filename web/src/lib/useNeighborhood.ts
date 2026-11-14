import { useEffect, useState } from 'react'
import { loadNeighborhood, type Neighborhood } from './neighborhood'

/** Neighborhood data for a site, or null while loading / when the site has none. */
export function useNeighborhood(siteId: string | null | undefined): Neighborhood | null {
  const [state, setState] = useState<{ id: string; data: Neighborhood | null } | null>(null)
  useEffect(() => {
    if (!siteId) return
    let live = true
    loadNeighborhood(siteId).then((data) => live && setState({ id: siteId, data }))
    return () => { live = false }
  }, [siteId])
  return state && state.id === siteId ? state.data : null
}
