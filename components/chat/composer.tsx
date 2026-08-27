"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowUp, Paperclip, X, FileText, Square } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useSpotlight } from "@/components/ui/spotlight"
import { GlassOrb, orbClass } from "@/components/ui/glass-orb"
import type { ModeConfig } from "./mode-config"

const MAX_ROWS_PX = 200

interface ComposerProps {
  mode: ModeConfig
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onStop: () => void
  isBusy: boolean
  file: File | null
  onFileSelect: (f: File) => void
  onFileClear: () => void
}

export function Composer({
  mode,
  value,
  onChange,
  onSend,
  onStop,
  isBusy,
  file,
  onFileSelect,
  onFileClear,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const { ref: spotRef, onPointerMove } = useSpotlight<HTMLDivElement>()

  const canSend = (value.trim().length > 0 || !!file) && !isBusy

  // Grow with content, then scroll. Collapsing to 0 before measuring is what
  // makes the box shrink again on delete — `auto` reports the current rendered
  // height, not the content height.
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "0px"
    const content = el.scrollHeight
    el.style.height = `${Math.min(content, MAX_ROWS_PX)}px`
    el.style.overflowY = content > MAX_ROWS_PX ? "auto" : "hidden"
  }, [])

  useLayoutEffect(resize, [value, resize])

  // The webfont swaps in after first paint and changes the line box, so the
  // mount-time measurement is stale. Re-measure once the face is ready.
  useEffect(() => {
    const id = requestAnimationFrame(resize)
    document.fonts?.ready.then(resize).catch(() => {})
    return () => cancelAnimationFrame(id)
  }, [resize])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter breaks the line.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (canSend) onSend()
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!mode.accepts) return
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) onFileSelect(dropped)
  }

  return (
    <div className="px-4 pb-4 sm:px-6 sm:pb-6">
      <div
        ref={spotRef}
        onPointerMove={onPointerMove}
        onDragOver={(e) => {
          e.preventDefault()
          if (mode.accepts) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          // The dock is the deepest piece of glass on the page: it has to hold
          // its own against a scrolling transcript directly behind it.
          "spotlight surface relative rounded-[28px] transition-colors duration-200",
          "shadow-[inset_0_1px_0_rgb(255_255_255/0.07),var(--e4)]",
          dragging && "border-signal/50"
        )}
      >
        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-3.5 py-3">
                <GlassOrb tone="signal" size="md" aria-hidden>
                  <FileText className="h-4 w-4" />
                </GlassOrb>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-primary-ink">{file.name}</p>
                  <p className="meta mt-0.5" data-numeric>
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onFileClear}
                  aria-label={`Remove ${file.name}`}
                  className={orbClass({ size: "md" })}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 p-2.5">
          {mode.accepts && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onFileSelect(f)
                  e.target.value = ""
                }}
                className="hidden"
                accept=".pdf,image/*"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach a report"
                className={orbClass({ size: "xl" })}
              >
                <Paperclip className="h-[18px] w-[18px]" />
              </button>
            </>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode.placeholder}
            aria-label={mode.placeholder}
            className="flex-1 resize-none overflow-hidden bg-transparent px-2 py-3 text-[0.9375rem] leading-relaxed text-primary-ink outline-none placeholder:text-tertiary-ink"
          />

          {/* One control, two jobs: send, or take the reply back. Stopping is
              the only escape from a long answer, so it must not hide. */}
          {isBusy ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop responding"
              className={orbClass({ size: "xl" })}
            >
              <Square className="h-[15px] w-[15px] fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              aria-label="Send message"
              className={cn(
                orbClass({ size: "xl", tone: canSend ? "solid" : "quiet", interactive: canSend }),
                !canSend && "cursor-not-allowed text-tertiary-ink opacity-60"
              )}
            >
              <ArrowUp className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>

      <p className="mx-auto mt-3 max-w-xl text-balance text-center text-[0.75rem] leading-relaxed text-tertiary-ink">
        {mode.disclaimer}
      </p>
    </div>
  )
}
