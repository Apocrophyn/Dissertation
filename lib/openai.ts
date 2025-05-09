import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing env.OPENAI_API_KEY');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatModelConfig {
  model: string;
  temperature: number;
  systemPrompt: string;
}

export const CHAT_MODELS: Record<'SYMPTOM' | 'REPORT' | 'MENTAL', ChatModelConfig> = {
  SYMPTOM: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.3,
    systemPrompt: 'You are a highly experienced medical doctor. Based on the following symptoms, provide a likely diagnosis and possible causes. List possible next steps. Keep it concise and professional.',
  },
  REPORT: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.3,
    systemPrompt: 'You are a medical AI trained to analyze patient reports. Given this report, summarize critical findings, flag abnormalities, and suggest next steps.',
  },
  MENTAL: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    systemPrompt: 'You are an empathetic AI therapist. Offer comforting and non-judgmental advice based on the user\'s input, encourage them, and provide mental wellness tips.',
  },
} as const; 