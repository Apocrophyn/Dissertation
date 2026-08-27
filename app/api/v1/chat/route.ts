import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ChatAttachment, ChatRequest, ChatType } from '@/types/chat'

export const runtime = 'nodejs'

const MAX_MESSAGE_LENGTH = 8_000
const MAX_HISTORY_MESSAGES = 20
const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024

/**
 * The client renders GitHub-flavoured Markdown, so the model is told to write
 * it. Without this the answers arrive as one undifferentiated wall of prose
 * with literal asterisks in it.
 */
const FORMATTING = [
  'FORMAT — reply in GitHub-flavoured Markdown:',
  '- Open with one short plain-language paragraph that answers the question directly.',
  '- Use `##` sub-headings once a reply covers more than two distinct points.',
  '- Use `-` bullets for lists and numbered lists for ordered steps; keep each item to a line or two.',
  '- **Bold** the terms that matter, and always bold red-flag warnings.',
  '- Use a table only for genuinely tabular data, such as values against their reference ranges.',
  '- Never wrap the whole reply in a code fence, and never open with a heading that just restates the question.',
  '- No filler, no preamble, no sign-off.',
].join('\n')

const systemMessages: Record<ChatType, string> = {
  'symptom-checker':
    'You are MedicAI, a careful medical information assistant. Ask focused follow-up questions, explain possibilities in plain language, and give practical next steps. Never claim to diagnose. Clearly flag emergency warning signs and advise professional care when appropriate.',
  'report-analyzer':
    'You are MedicAI, a careful medical report explainer. Explain findings and abnormal values in plain language, preserve uncertainty, and suggest questions for the user to ask their clinician. Never present your explanation as a diagnosis.',
  'mental-health':
    'You are MedicAI, a supportive mental wellbeing assistant. Be empathetic, practical, and non-judgmental. Do not claim to be a therapist. If the user may be in immediate danger or considering self-harm, encourage immediate local emergency or crisis support.',
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'APIUserAbortError')
}

function isChatType(value: unknown): value is ChatType {
  return value === 'symptom-checker' || value === 'report-analyzer' || value === 'mental-health'
}

function validAttachment(value: unknown): value is ChatAttachment {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.name === 'string' &&
    typeof item.type === 'string' &&
    typeof item.dataUrl === 'string' &&
    item.dataUrl.startsWith('data:') &&
    item.dataUrl.length <= Math.ceil(MAX_ATTACHMENT_BYTES * 1.4)
  )
}

async function pdfText(attachment: ChatAttachment): Promise<string> {
  const marker = ';base64,'
  const markerIndex = attachment.dataUrl.indexOf(marker)
  if (markerIndex === -1) throw new Error('Invalid PDF attachment')
  const buffer = Buffer.from(attachment.dataUrl.slice(markerIndex + marker.length), 'base64')
  if (buffer.byteLength > MAX_ATTACHMENT_BYTES) throw new Error('Attachment is too large')
  const parsePdf = (await import('pdf-parse')).default
  const parsed = await parsePdf(buffer)
  return parsed.text.trim().slice(0, 30_000)
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'MedicAI is not configured yet.' }, { status: 503 })
    }

    const body = (await request.json()) as Partial<ChatRequest>
    if (!isChatType(body.type) || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'Invalid chat request.' }, { status: 400 })
    }

    const message = body.message.trim()
    if (!message && !body.attachment) {
      return NextResponse.json({ error: 'Enter a message or attach a report.' }, { status: 400 })
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })
    }

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (item) =>
              item &&
              (item.sender === 'user' || item.sender === 'assistant') &&
              typeof item.content === 'string'
          )
          .slice(-MAX_HISTORY_MESSAGES)
          .map((item) => ({
            role: item.sender as 'user' | 'assistant',
            content: item.content.slice(0, MAX_MESSAGE_LENGTH),
          }))
      : []

    let currentContent: OpenAI.Chat.Completions.ChatCompletionUserMessageParam['content'] = message
    if (body.attachment) {
      if (!validAttachment(body.attachment)) {
        return NextResponse.json({ error: 'Invalid or oversized attachment.' }, { status: 400 })
      }

      if (body.attachment.type.startsWith('image/')) {
        currentContent = [
          { type: 'text', text: message || 'Please explain this medical image or report.' },
          { type: 'image_url', image_url: { url: body.attachment.dataUrl, detail: 'high' } },
        ]
      } else if (body.attachment.type === 'application/pdf') {
        const extracted = await pdfText(body.attachment)
        if (!extracted) {
          return NextResponse.json(
            { error: 'No readable text was found in that PDF. Try an image or text-based PDF.' },
            { status: 400 }
          )
        }
        currentContent = `${message || 'Please explain this medical report.'}\n\nAttached PDF (${body.attachment.name}):\n${extracted}`
      } else {
        return NextResponse.json({ error: 'Only PDF and image attachments are supported.' }, { status: 400 })
      }
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create(
      {
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: `${systemMessages[body.type]}\n\n${FORMATTING}` },
          ...history,
          { role: 'user', content: currentContent },
        ],
        temperature: 0.5,
        max_tokens: 1_200,
        stream: true,
      },
      // The user can abandon a reply mid-flight; propagate that upstream so we
      // stop paying for tokens nobody will read.
      { signal: request.signal }
    )

    // Everything that can fail with a status code has already been checked, so
    // the response can start the moment the first token lands.
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content
            if (delta) controller.enqueue(encoder.encode(delta))
          }
        } catch (error) {
          // The headers are already sent, so this cannot become an error
          // status. Close cleanly and let the client keep the partial answer.
          if (!isAbort(error)) console.error('Chat stream interrupted:', error)
        } finally {
          controller.close()
        }
      },
      cancel() {
        completion.controller.abort()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        // Proxies that buffer would defeat the point of streaming at all.
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    if (isAbort(error)) return new Response(null, { status: 499 })
    console.error('Chat request failed:', error)
    const message = error instanceof Error && /attachment|PDF/i.test(error.message)
      ? error.message
      : 'MedicAI could not generate a response. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
