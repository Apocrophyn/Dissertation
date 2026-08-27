"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

/**
 * The circular liquid-glass vessel every icon in MedicAI sits in.
 *
 * The glass itself lives in `.orb` in globals.css — this component only
 * decides size, state, and whether a bloom or a working ring is attached.
 * Keeping the paint in CSS means an orb costs one element, so it can be used
 * at message density without a per-icon render cost.
 *
 * `tone`:
 *   quiet   — the default. Neutral glass; the icon carries the meaning.
 *   signal  — lit from within. Only where the accent means something:
 *             the active mode, the assistant, an armed control.
 *   solid   — filled accent. Exactly one per screen (send).
 */
type OrbTone = "quiet" | "signal" | "solid"
type OrbSize = "sm" | "md" | "lg" | "xl" | "hero"

const SIZES: Record<OrbSize, string> = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-10 w-10",
  xl: "h-11 w-11",
  hero: "h-[4.5rem] w-[4.5rem]",
}

const TONES: Record<OrbTone, string> = {
  quiet: "",
  signal: "orb-signal",
  solid: "orb-solid",
}

/**
 * The same glass, as a bare class string — for elements that must be a real
 * <button> or <a> rather than the <span> GlassOrb renders.
 */
export function orbClass({
  size = "md",
  tone = "quiet",
  interactive = true,
  flat = false,
}: {
  size?: OrbSize
  tone?: OrbTone
  interactive?: boolean
  flat?: boolean
} = {}) {
  return cn("orb", SIZES[size], TONES[tone], interactive && "orb-interactive", flat && "orb-flat")
}

export interface GlassOrbProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: OrbSize
  tone?: OrbTone
  /** Adds hover lift, specular sweep and press feedback. */
  interactive?: boolean
  /** Drops the backdrop filter. For orbs used at list density. */
  flat?: boolean
  /** Runs the sweep continuously — brand lockups only. */
  sheen?: boolean
  /** Accent bloom behind the glass. */
  halo?: boolean
  /** A single arc travelling the rim: "working", never decoration. */
  working?: boolean
}

export const GlassOrb = forwardRef<HTMLSpanElement, GlassOrbProps>(function GlassOrb(
  { size = "md", tone = "quiet", interactive, flat, sheen, halo, working, className, children, ...rest },
  ref
) {
  // The halo and the arc both have to sit outside the glass: the orb clips its
  // own overflow to contain the sheen, which would otherwise cut them off at
  // the rim. When either is asked for, the orb gains a positioning shell.
  const shelled = halo || working

  const orb = (
    <span
      ref={ref}
      className={cn(
        "orb",
        SIZES[size],
        TONES[tone],
        interactive && "orb-interactive",
        flat && "orb-flat",
        sheen && "orb-sheen",
        !shelled && className
      )}
      {...(shelled ? {} : rest)}
    >
      {children}
    </span>
  )

  if (!shelled) return orb

  return (
    <span
      className={cn(
        "relative isolate inline-grid shrink-0 place-items-center",
        working && "arc-ring",
        className
      )}
      {...rest}
    >
      {halo && <span aria-hidden className="orb-halo" />}
      {orb}
    </span>
  )
})
