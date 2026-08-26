"use client"

import { useCallback, useRef } from "react"

/**
 * Writes the pointer position into --mx/--my on the target element so the
 * `.spotlight` CSS in globals.css can paint a radial highlight and a masked
 * border trace at the cursor.
 *
 * Technique adapted from Component Atlas "SpotlightCard" — the original paints
 * a blue highlight on a standalone card; here it is generalised to any surface
 * and re-tinted to the MedicAI signal.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const frame = useRef<number>()

  const onPointerMove = useCallback((e: React.PointerEvent<T>) => {
    const el = ref.current
    if (!el) return
    // Coalesce to one write per frame — mousemove fires far faster than paint.
    if (frame.current) cancelAnimationFrame(frame.current)
    const { clientX, clientY } = e
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect()
      el.style.setProperty("--mx", `${clientX - r.left}px`)
      el.style.setProperty("--my", `${clientY - r.top}px`)
    })
  }, [])

  return { ref, onPointerMove }
}
