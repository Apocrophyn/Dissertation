"use client"

import { memo } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { CopyButton } from "./copy-button"
import { cn } from "@/lib/utils"

/**
 * Assistant responses rendered as real documents.
 *
 * The model already writes GitHub-flavoured Markdown — headings, bold, lists,
 * tables, code. Previously all of that arrived as literal asterisks; this
 * renders it. Typography lives in `.prose-ai` (globals.css) so the styling is
 * one source of truth rather than fifty utility classes on fifty nodes.
 *
 * Raw HTML is deliberately not enabled: react-markdown drops it by default,
 * and model output is untrusted input.
 */
const components: Components = {
  a: ({ children, href }) => (
    // Model-supplied links leave the app, so they open away from the session
    // and are stripped of referrer/opener.
    <a href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  ),

  // A fenced block is a thing you copy, so it carries its own copy affordance.
  pre: ({ children }) => {
    const text = plainText(children)
    return (
      <div className="group/code relative">
        <pre>{children}</pre>
        <CopyButton
          text={text}
          label="Copy code"
          className="absolute right-2 top-2 bg-ink-000/70 backdrop-blur-sm [@media(hover:hover)]:group-hover/code:opacity-100"
        />
      </div>
    )
  },

  // GFM tables overflow on narrow screens; the scroll must be theirs, not
  // the whole message thread's.
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-[var(--r-md)] border border-white/[0.06]">
      <table>{children}</table>
    </div>
  ),
}

/** Recovers the text of a rendered code block so it can be copied. */
function plainText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(plainText).join("")
  if (typeof node === "object" && "props" in node) {
    return plainText((node as { props: { children?: React.ReactNode } }).props.children)
  }
  return ""
}

export const MarkdownMessage = memo(function MarkdownMessage({
  content,
  streaming = false,
  className,
}: {
  content: string
  /** Appends the write head. Only true while tokens are still arriving. */
  streaming?: boolean
  className?: string
}) {
  return (
    <div className={cn("prose-ai measure", streaming && "prose-ai-streaming", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
})
