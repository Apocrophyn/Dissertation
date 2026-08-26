import { Activity, FileText, HeartPulse, type LucideIcon } from "lucide-react"
import type { ChatType } from "@/types/chat"

export interface ModeConfig {
  id: ChatType
  /** Short label — sidebar, chips, session titles. */
  label: string
  /** What this mode actually does, in the user's language. */
  tagline: string
  icon: LucideIcon
  /** Opening line the assistant says. */
  greeting: string
  /** Title for a freshly created session. */
  sessionTitle: string
  /** Composer placeholder — names the action, not the field. */
  placeholder: string
  /** Empty-state heading. Question form: the user answers it by typing. */
  prompt: string
  /** Concrete starting points. Real phrasing, not feature names. */
  suggestions: string[]
  /** Mode-specific safety line. Medical software earns trust by saying limits out loud. */
  disclaimer: string
  /** Whether this mode accepts file attachments. */
  accepts: boolean
}

export const MODES: Record<ChatType, ModeConfig> = {
  "symptom-checker": {
    id: "symptom-checker",
    label: "Symptoms",
    tagline: "Talk through what you're feeling",
    icon: Activity,
    greeting: "Tell me what's going on and I'll help you think it through.",
    sessionTitle: "Symptom consultation",
    placeholder: "Describe what you're feeling…",
    prompt: "What's been bothering you?",
    suggestions: [
      "I've had a headache for three days",
      "My throat hurts and I have a fever",
      "Sharp pain in my lower back when I bend",
      "I keep feeling dizzy when I stand up",
    ],
    disclaimer:
      "MedicAI can help you understand symptoms, but it cannot diagnose. Seek urgent care for chest pain, trouble breathing, or sudden severe symptoms.",
    accepts: false,
  },
  "report-analyzer": {
    id: "report-analyzer",
    label: "Reports",
    tagline: "Make sense of test results",
    icon: FileText,
    greeting: "Upload a report or lab result and I'll walk you through what it says.",
    sessionTitle: "Report analysis",
    placeholder: "Ask about your report…",
    prompt: "What would you like explained?",
    suggestions: [
      "Explain my blood test results",
      "What does this X-ray report mean?",
      "Which of these values are outside the normal range?",
      "Summarise this in plain language",
    ],
    disclaimer:
      "Explanations are for understanding only. Your clinician interprets results in the context of your history — always confirm with them.",
    accepts: true,
  },
  "mental-health": {
    id: "mental-health",
    label: "Wellbeing",
    tagline: "A space to think out loud",
    icon: HeartPulse,
    greeting: "I'm here to listen. What's on your mind today?",
    sessionTitle: "Wellbeing session",
    placeholder: "Share what's on your mind…",
    prompt: "How are you doing today?",
    suggestions: [
      "I've been feeling anxious most days",
      "I can't switch off at night",
      "Work has been overwhelming lately",
      "I want help building a calmer routine",
    ],
    disclaimer:
      "This is supportive conversation, not therapy or crisis care. If you're in danger or thinking of harming yourself, contact your local emergency number or a crisis line now.",
    accepts: false,
  },
}

export const MODE_ORDER: ChatType[] = ["symptom-checker", "report-analyzer", "mental-health"]

export function getMode(type: ChatType): ModeConfig {
  return MODES[type]
}
