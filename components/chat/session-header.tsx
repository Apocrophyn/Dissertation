"use client"

import { PanelLeft, ShieldCheck } from "lucide-react"
import { GlassOrb, orbClass } from "@/components/ui/glass-orb"
import type { ModeConfig } from "./mode-config"

export function SessionHeader({
  mode,
  title,
  onToggleSidebar,
}: {
  mode: ModeConfig
  title: string
  onToggleSidebar: () => void
}) {
  const Icon = mode.icon

  return (
    <header className="sticky top-0 z-30 flex h-[4.5rem] shrink-0 items-center gap-3 border-b border-white/[0.06] bg-ink-000/60 px-3 backdrop-blur-xl sm:px-5">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className={`${orbClass({ size: "xl" })} lg:hidden`}
      >
        <PanelLeft className="h-[18px] w-[18px]" />
      </button>

      <GlassOrb tone="signal" size="lg" halo aria-hidden>
        <Icon className="h-[18px] w-[18px]" />
      </GlassOrb>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[0.9375rem] font-semibold leading-tight tracking-[-0.02em] text-primary-ink">
          {title}
        </h1>
        <p className="truncate text-[0.75rem] leading-normal text-tertiary-ink">
          {mode.label} · {mode.tagline}
        </p>
      </div>

      {/* Trust signal — medical software should say what it is, always visible */}
      <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] sm:flex">
        <GlassOrb size="sm" tone="signal" aria-hidden>
          <ShieldCheck className="h-3.5 w-3.5" />
        </GlassOrb>
        <span className="meta">Not a diagnosis</span>
      </div>
    </header>
  )
}
