"use client"

import { ArrowUpRight } from "lucide-react"
import { MedicLogo } from "@/components/medic-mark"
import { GlassOrb } from "@/components/ui/glass-orb"
import { useSpotlight } from "@/components/ui/spotlight"
import type { ModeConfig } from "./mode-config"

/**
 * Entrance is CSS rather than JS-driven: these elements carry the first thing
 * the user reads, so they must not depend on a requestAnimationFrame loop to
 * become visible. `prefers-reduced-motion` collapses the whole sequence.
 */
function Suggestion({ text, onPick, delay }: { text: string; onPick: () => void; delay: number }) {
  const { ref, onPointerMove } = useSpotlight<HTMLButtonElement>()

  return (
    <button
      ref={ref}
      onPointerMove={onPointerMove}
      onClick={onPick}
      type="button"
      style={{ animationDelay: `${delay}ms` }}
      className="spotlight surface-flat animate-rise group flex w-full items-center gap-3 rounded-full py-2 pl-4 pr-2 text-left transition-colors duration-200 hover:bg-white/[0.05]"
    >
      <span className="flex-1 py-1 text-sm leading-snug text-secondary-ink transition-colors group-hover:text-primary-ink">
        {text}
      </span>
      <GlassOrb
        size="md"
        aria-hidden
        className="transition-colors duration-200 group-hover:text-signal"
      >
        <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </GlassOrb>
    </button>
  )
}

export function EmptyState({
  mode,
  onPick,
}: {
  mode: ModeConfig
  onPick: (text: string) => void
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="animate-rise mb-8 flex justify-center">
          <MedicLogo size="lg" showWordmark={false} />
        </div>

        {/* h2: SessionHeader owns the page's single h1 */}
        <h2
          style={{ animationDelay: "60ms" }}
          className="animate-rise text-center text-[length:clamp(1.875rem,4.5vw,2.75rem)] font-extrabold leading-[1.08] tracking-[-0.045em] text-primary-ink"
        >
          {mode.prompt}
        </h2>

        <p
          style={{ animationDelay: "110ms" }}
          className="animate-rise measure mx-auto mt-3.5 text-balance text-center text-[0.9375rem] leading-relaxed text-secondary-ink"
        >
          {mode.greeting}
        </p>

        <div className="mt-10 grid gap-2 sm:grid-cols-2">
          {mode.suggestions.map((text, i) => (
            <Suggestion key={text} text={text} delay={180 + i * 60} onPick={() => onPick(text)} />
          ))}
        </div>
      </div>
    </div>
  )
}
