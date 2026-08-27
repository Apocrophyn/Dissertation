"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Copy-to-clipboard with its own confirmation state.
 *
 * Visible by default and only hidden-until-hover where hover actually exists —
 * otherwise touch users can never reach it.
 */
export function CopyButton({
  text,
  label = "Copy response",
  className,
}: {
  text: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      /* clipboard unavailable — the button simply does not confirm */
    }
  }, [text])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full text-tertiary-ink transition-all duration-200 hover:bg-white/[0.07] hover:text-primary-ink focus-visible:opacity-100",
        "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100",
        className
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-signal" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}
