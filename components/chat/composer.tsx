"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowUp, Paperclip, X, FileText, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useSpotlight } from "@/components/ui/spotlight"
import type { ModeConfig } from "./mode-config"

const MAX_ROWS_PX = 200

interface ComposerProps {
  mode: ModeConfig
  value: string
  onChange: (v: string) => void
  onSend: () => void
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
          "spotlight surface rounded-[var(--r-xl)] transition-colors duration-200",
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
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--r-sm)] bg-signal/10">
                  <FileText className="h-4 w-4 text-signal" />
                </div>
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
                  className="grid h-8 w-8 place-items-center rounded-[var(--r-sm)] text-tertiary-ink transition-colors hover:bg-white/[0.06] hover:text-primary-ink"
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
                className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--r-md)] text-tertiary-ink transition-colors hover:bg-white/[0.06] hover:text-primary-ink sm:h-10 sm:w-10"
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
            className="flex-1 resize-none overflow-hidden bg-transparent px-2 py-2.5 text-[0.9375rem] leading-relaxed text-primary-ink outline-none placeholder:text-tertiary-ink"
          />

          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            aria-label={isBusy ? "MedicAI is responding" : "Send message"}
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-[var(--r-md)] transition-all duration-200 sm:h-10 sm:w-10",
              canSend
                ? "bg-signal text-ink-000 shadow-[0_2px_12px_-2px_rgb(var(--signal)/0.5)] hover:brightness-110 active:scale-95"
                : "bg-white/[0.06] text-tertiary-ink cursor-not-allowed"
            )}
          >
            {isBusy ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : (
              <ArrowUp className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
      </div>

      <p className="mx-auto mt-3 max-w-xl text-center text-[0.75rem] leading-relaxed text-tertiary-ink">
        {mode.disclaimer}
      </p>
    </div>
  )
}
