# Medical AI Assistant

A sophisticated medical chatbot that provides symptom checking, medical report analysis, and mental health support using advanced AI technology.

## Features

- **Symptom Checker**: AI-powered symptom analysis and preliminary diagnosis
- **Report Analyzer**: Medical report interpretation and key findings extraction
- **Mental Health Support**: Empathetic AI-driven mental health assistance

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **UI Components**: Shadcn/ui, Radix UI, Framer Motion
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI GPT-4 Turbo
- **File Processing**: Multer, PDF-parse, Tesseract.js

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Apocrophyn/Dissertation.git
cd Dissertation
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment

This project is configured for deployment on Vercel. Connect your GitHub repository to Vercel for automatic deployments.

## License

This project is part of a dissertation and is protected under academic guidelines. 