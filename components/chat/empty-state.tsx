"use client"

import { ArrowUpRight } from "lucide-react"
import { MedicMark } from "@/components/medic-mark"
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
      className="spotlight surface-flat animate-rise group flex w-full items-center gap-3 rounded-[var(--r-md)] px-4 py-3.5 text-left transition-colors duration-200 hover:bg-white/[0.045]"
    >
      <span className="flex-1 text-sm leading-snug text-secondary-ink transition-colors group-hover:text-primary-ink">
        {text}
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-tertiary-ink transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal" />
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
        <div className="animate-rise relative mx-auto mb-7 grid h-16 w-16 place-items-center">
          <div
            className="absolute inset-0 rounded-full blur-xl"
            style={{
              background: "radial-gradient(circle, rgb(var(--signal) / 0.22), transparent 70%)",
            }}
          />
          <div className="relative grid h-16 w-16 place-items-center rounded-[var(--r-lg)] border border-white/[0.08] bg-ink-100/60">
            <MedicMark className="h-8 w-8 text-signal" />
          </div>
        </div>

        {/* h2: SessionHeader owns the page's single h1 */}
        <h2
          style={{ animationDelay: "60ms" }}
          className="animate-rise text-center text-[length:clamp(1.75rem,4vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.04em] text-primary-ink"
        >
          {mode.prompt}
        </h2>

        <p
          style={{ animationDelay: "110ms" }}
          className="animate-rise measure mx-auto mt-3 text-center text-[0.9375rem] leading-relaxed text-secondary-ink"
        >
          {mode.greeting}
        </p>

        <div className="mt-9 grid gap-2 sm:grid-cols-2">
          {mode.suggestions.map((text, i) => (
            <Suggestion key={text} text={text} delay={180 + i * 60} onPick={() => onPick(text)} />
          ))}
        </div>
      </div>
    </div>
  )
}
