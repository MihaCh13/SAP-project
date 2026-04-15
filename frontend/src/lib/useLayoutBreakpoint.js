import { useEffect, useState } from 'react'

/** @typedef {'mobile' | 'tablet' | 'desktop'} LayoutBreakpoint */

/**
 * Mirrors product breakpoints: &lt;768 mobile, 768–1023 tablet, ≥1024 desktop.
 * @returns {LayoutBreakpoint}
 */
export function useLayoutBreakpoint() {
  const [bp, setBp] = useState(/** @type {LayoutBreakpoint} */ ('desktop'))

  useEffect(() => {
    function read() {
      const w = window.innerWidth
      if (w < 768) setBp('mobile')
      else if (w < 1024) setBp('tablet')
      else setBp('desktop')
    }
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])

  return bp
}
