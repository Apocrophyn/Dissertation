"use client"

import { format } from "date-fns"
import { FileText } from "lucide-react"
import { motion } from "framer-motion"
import type { Message } from "@/types/chat"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { GlassOrb } from "@/components/ui/glass-orb"
import { MedicMark } from "@/components/medic-mark"
import { MarkdownMessage } from "./markdown-message"
import { CopyButton } from "./copy-button"

const EASE = [0.16, 1, 0.3, 1] as const

interface ChatMessagesProps {
  messages: Message[]
  isTyping: boolean
  /** The message currently receiving tokens, if any. */
  streamingId: string | null
}

function FileChip({ name }: { name: string }) {
  return (
    <div className="mb-2.5 flex w-fit max-w-full items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-3">
      <GlassOrb size="sm" tone="signal" aria-hidden>
        <FileText className="h-3.5 w-3.5" />
      </GlassOrb>
      <span className="truncate text-xs text-secondary-ink">{name}</span>
    </div>
  )
}

function AssistantMessage({ message, streaming }: { message: Message; streaming: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE }}
      className="group flex gap-3.5"
      aria-busy={streaming || undefined}
    >
      <GlassOrb tone="signal" size="lg" halo working={streaming} className="self-start" aria-hidden>
        <MedicMark className="h-[22px] w-[22px]" working={streaming} />
      </GlassOrb>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2.5">
          <span className="text-[0.8125rem] font-semibold tracking-[-0.01em] text-primary-ink">
            MedicAI
          </span>
          <time className="meta" dateTime={new Date(message.timestamp).toISOString()}>
            {format(new Date(message.timestamp), "HH:mm")}
          </time>
          {/* A half-written answer is not worth copying. */}
          {!streaming && <CopyButton text={message.content} />}
        </div>

        {message.hasFile && message.fileName && <FileChip name={message.fileName} />}

        <MarkdownMessage content={message.content} streaming={streaming} />
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
        {/* The user's own words sit on lit glass — the one bright plane in the
            thread, so the eye finds the turn boundaries without a divider. */}
        <div className="rounded-[var(--r-xl)] rounded-br-lg border border-white/[0.1] bg-gradient-to-b from-white/[0.085] to-white/[0.035] px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.09),var(--e2)] backdrop-blur-md">
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
      role="status"
    >
      <GlassOrb tone="signal" size="lg" halo working className="self-start" aria-hidden>
        <MedicMark className="h-[22px] w-[22px]" working />
      </GlassOrb>
      <div className="flex items-center pt-1.5">
        <TextShimmer
          className="text-[0.9375rem] [--base-color:rgb(118_127_134)] [--base-gradient-color:rgb(95_227_179)]"
          duration={1.6}
        >
          Thinking through your question
        </TextShimmer>
      </div>
    </motion.div>
  )
}

export function ChatMessages({ messages, isTyping, streamingId }: ChatMessagesProps) {
  // Once tokens are landing the answer speaks for itself; the indicator would
  // only duplicate it.
  const showThinking = isTyping && !streamingId

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-7 px-4 py-8 sm:px-6">
      {messages.map((message) =>
        message.sender === "assistant" ? (
          <AssistantMessage
            key={message.id}
            message={message}
            streaming={message.id === streamingId}
          />
        ) : (
          <UserMessage key={message.id} message={message} />
        )
      )}
      {showThinking && <ThinkingIndicator />}
    </div>
  )
}
