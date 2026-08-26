import { cn } from "@/lib/utils"

/**
 * The MedicAI mark: a cross built from four gapped strokes inside concentric
 * rings — a reticle, not a caduceus. Drawn rather than imported so stroke
 * weight stays consistent with the lucide icon set at every size.
 *
 * `pulse` animates the outer ring only, and only while the assistant is
 * working — motion here means "processing", never decoration.
 */
export function MedicMark({
  className,
  pulse = false,
}: {
  className?: string
  pulse?: boolean
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("h-6 w-6", className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1.25"
        style={pulse ? { animation: "breathe 1.8s ease-in-out infinite" } : undefined}
      />
      <circle cx="16" cy="16" r="8.5" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.25" />
      <path
        d="M16 10.5v11M10.5 16h11"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}
