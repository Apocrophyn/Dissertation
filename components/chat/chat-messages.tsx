"use client"

import { format } from "date-fns"
import { FileText, Check, Copy } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import type { Message } from "@/types/chat"
import { useAnimatedText } from "@/components/ui/animated-text"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { MedicMark } from "@/components/medic-mark"
import { cn } from "@/lib/utils"

const EASE = [0.16, 1, 0.3, 1] as const

interface ChatMessagesProps {
  messages: Message[]
  isTyping: boolean
}

/** **bold** → <strong>. Escapes first so message content can never inject markup. */
function formatMessage(content: string) {
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
}

function CopyButton({ text }: { text: string }) {
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
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy response"}
      // Visible by default; only hidden-until-hover where hover actually exists,
      // otherwise touch users can never reach it.
      className="grid h-8 w-8 place-items-center rounded-md text-tertiary-ink transition-all duration-200 hover:bg-white/[0.06] hover:text-primary-ink focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-signal" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function FileChip({ name }: { name: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2 rounded-[var(--r-sm)] border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5">
      <FileText className="h-3.5 w-3.5 shrink-0 text-signal" />
      <span className="truncate text-xs text-secondary-ink">{name}</span>
    </div>
  )
}

function AssistantMessage({ message }: { message: Message }) {
  // Only stream messages that just arrived; history renders instantly.
  const [isAnimating, setIsAnimating] = useState(
    () => Date.now() - new Date(message.timestamp).getTime() < 1000
  )
  const animatedText = useAnimatedText(isAnimating ? message.content : "", " ")

  useEffect(() => {
    if (!isAnimating) return
    const timer = setTimeout(() => setIsAnimating(false), 5000)
    return () => clearTimeout(timer)
  }, [isAnimating])

  const displayText = isAnimating && animatedText ? animatedText : message.content

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE }}
      className="group flex gap-3.5"
    >
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[var(--r-sm)] border border-white/[0.08] bg-ink-100">
        <MedicMark className="h-[18px] w-[18px] text-signal" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2.5">
          <span className="text-[0.8125rem] font-semibold text-primary-ink">MedicAI</span>
          <time className="meta" dateTime={new Date(message.timestamp).toISOString()}>
            {format(new Date(message.timestamp), "HH:mm")}
          </time>
          <CopyButton text={message.content} />
        </div>

        {message.hasFile && message.fileName && <FileChip name={message.fileName} />}

        <div
          className="measure break-words text-[0.9375rem] leading-[1.7] text-secondary-ink [&_strong]:font-semibold [&_strong]:text-primary-ink"
          dangerouslySetInnerHTML={{ __html: formatMessage(displayText) }}
        />
      </div>
    </motion.div>
  )
}

function UserMessage({ message }: { message: Message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE }}
      className="flex justify-end"
    >
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className="rounded-[var(--r-lg)] rounded-br-md border border-white/[0.09] bg-white/[0.055] px-4 py-3">
          {message.hasFile && message.fileName && <FileChip name={message.fileName} />}
          <p className="whitespace-pre-wrap break-words text-[0.9375rem] leading-[1.65] text-primary-ink">
            {message.content}
          </p>
        </div>
        <time
          className="meta mt-1.5 block text-right"
          dateTime={new Date(message.timestamp).toISOString()}
        >
          {format(new Date(message.timestamp), "HH:mm")}
        </time>
      </div>
    </motion.div>
  )
}

function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE }}
      className="flex gap-3.5"
    >
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[var(--r-sm)] border border-white/[0.08] bg-ink-100">
        <MedicMark className="h-[18px] w-[18px] text-signal" pulse />
      </div>
      <div className="flex items-center pt-1.5">
        <TextShimmer className="text-[0.9375rem] [--base-color:rgb(118_127_134)] [--base-gradient-color:rgb(95_227_179)]" duration={1.6}>
          Thinking through your question
        </TextShimmer>
      </div>
    </motion.div>
  )
}

export function ChatMessages({ messages, isTyping }: ChatMessagesProps) {
  return (
    <div className={cn("mx-auto flex max-w-3xl flex-col gap-7 px-4 py-8 sm:px-6")}>
      {messages.map((message) =>
        message.sender === "assistant" ? (
          <AssistantMessage key={message.id} message={message} />
        ) : (
          <UserMessage key={message.id} message={message} />
        )
      )}
      {isTyping && <ThinkingIndicator />}
    </div>
  )
}
