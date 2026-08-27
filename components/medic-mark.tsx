import { cn } from "@/lib/utils"
import { GlassOrb } from "@/components/ui/glass-orb"

/**
 * The MedicAI mark: an aperture, not a caduceus.
 *
 * Three concentric moves read as one object — a dim rim, a lit crown where
 * the light source sits, and a single bright arc at the top-right that breaks
 * the symmetry and gives the mark something to be recognised by. Inside sits
 * a shallow well with a rounded cross.
 *
 * Drawn rather than imported so the stroke weight stays consistent with the
 * lucide set at every size, and built from plain opacities rather than <defs>
 * so any number of instances can share the page without duplicate gradient ids.
 *
 * `working` revolves the bright arc — motion here means "processing", never
 * decoration.
 */
export function MedicMark({
  className,
  working = false,
}: {
  className?: string
  working?: boolean
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn("h-6 w-6", className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Rim — the full circle, at the edge of perception */}
      <circle cx="20" cy="20" r="18.25" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" />

      {/* Lit crown — upper-left through top, where the light falls */}
      <path
        d="M8.27 33.98A18.25 18.25 0 0 1 20 1.75"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* The signature arc */}
      <path
        d="M20 1.75A18.25 18.25 0 0 1 34.95 9.53"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        style={
          working
            ? { transformOrigin: "50% 50%", animation: "revolve 2.6s linear infinite" }
            : undefined
        }
      />

      {/* The well */}
      <circle
        cx="20"
        cy="20"
        r="12.25"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.25"
      />

      {/* The cross */}
      <path d="M20 13v14M13 20h14" stroke="currentColor" strokeWidth="3.25" strokeLinecap="round" />
    </svg>
  )
}

/**
 * The full lockup: mark seated in signal glass, wordmark beside it.
 * `size` is the only dial — everything else scales from the mark.
 */
export function MedicLogo({
  size = "md",
  showWordmark = true,
  working = false,
  className,
}: {
  size?: "md" | "lg"
  showWordmark?: boolean
  working?: boolean
  className?: string
}) {
  const large = size === "lg"

  return (
    <span className={cn("flex items-center gap-3", className)}>
      <GlassOrb
        tone="signal"
        size={large ? "hero" : "lg"}
        halo
        sheen
        working={working}
        aria-hidden
      >
        <MedicMark className={large ? "h-9 w-9" : "h-[22px] w-[22px]"} working={working} />
      </GlassOrb>

      {showWordmark && (
        <span className="min-w-0">
          <span
            className={cn(
              "block font-bold leading-none tracking-[-0.035em] text-primary-ink",
              large ? "text-[1.5rem]" : "text-[1.0625rem]"
            )}
          >
            Medic
            <span className="text-signal">AI</span>
          </span>
          <span className="meta mt-1 block leading-none">Healthcare assistant</span>
        </span>
      )}
    </span>
  )
}
