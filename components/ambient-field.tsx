/**
 * The far layer. Three stacked planes give the graphite ground depth without
 * a WebGL context: two slow-drifting blooms, a fine instrument grid, and a
 * static grain that stops the gradients from banding on wide displays.
 *
 * Purely decorative and non-interactive — hidden from assistive tech.
 */
export function AmbientField() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Instrument grid — the precision cue, at the edge of perception */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(255 255 255 / 0.022) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.022) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, #000 30%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, #000 30%, transparent 78%)",
        }}
      />

      {/* Signal bloom — the only place the accent appears unprompted */}
      <div
        className="absolute -top-[24rem] left-1/2 h-[52rem] w-[52rem] -translate-x-1/2 rounded-full blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--signal) / 0.08) 0%, rgb(var(--signal) / 0.03) 40%, transparent 70%)",
          animation: "drift 28s var(--ease) infinite",
        }}
      />

      {/* Counterweight bloom — keeps the composition from sitting dead-centre */}
      <div
        className="absolute -bottom-[30rem] -right-[16rem] h-[46rem] w-[46rem] rounded-full blur-[160px]"
        style={{
          background:
            "radial-gradient(circle, rgb(120 140 160 / 0.07) 0%, transparent 68%)",
          animation: "drift 36s var(--ease) infinite reverse",
        }}
      />

      {/* Grain — kills gradient banding, adds a film-like tooth */}
      <div
        className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}
