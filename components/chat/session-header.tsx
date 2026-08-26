"use client"

import { PanelLeft, ShieldCheck } from "lucide-react"
import type { ModeConfig } from "./mode-config"

export function SessionHeader({
  mode,
  onToggleSidebar,
}: {
  mode: ModeConfig
  onToggleSidebar: () => void
}) {
  const Icon = mode.icon

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 sm:px-6">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="-ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-[var(--r-sm)] text-tertiary-ink transition-colors hover:bg-white/[0.06] hover:text-primary-ink lg:hidden"
      >
        <PanelLeft className="h-[18px] w-[18px]" />
      </button>

      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--r-sm)] border border-signal/25 bg-signal/10">
        <Icon className="h-4 w-4 text-signal" />
      </span>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[0.9375rem] font-semibold leading-tight tracking-[-0.015em] text-primary-ink">
          {mode.label}
        </h1>
        <p className="truncate text-[0.75rem] leading-normal text-tertiary-ink">{mode.tagline}</p>
      </div>

      {/* Trust signal — medical software should say what it is, always visible */}
      <div className="hidden items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 sm:flex">
        <ShieldCheck className="h-3.5 w-3.5 text-signal" />
        <span className="meta">Not a diagnosis</span>
      </div>
    </header>
  )
}
