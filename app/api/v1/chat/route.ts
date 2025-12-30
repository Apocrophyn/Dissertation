import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { ChatRequest, ChatResponse } from '@/types/chat';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Map frontend chat types to database enum
const chatTypeMap = {
  'symptom-checker': 'symptom',
  'report-analyzer': 'report',
  'mental-health': 'mental'
} as const;

// Function to convert image URL to base64
async function getImageAsBase64(supabase: any, filePath: string): Promise<string> {
  try {
    // Download the file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('medical-reports')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download image: ${downloadError.message}`);
    }

    // Convert blob to base64
    const buffer = Buffer.from(await fileData.arrayBuffer());
    return `data:${fileData.type};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { type, message, fileUrl } = body;

    // Get file info if fileUrl is provided
    let fileInfo = null;
    if (fileUrl) {
      const supabase = createClient();
      const fileId = fileUrl.split('/').pop(); // Get ID from URL
      
      // Get file metadata from database
      const { data: fileData, error: fileError } = await supabase
        .from('uploads')
        .select('file_url, file_name, file_type')
        .eq('id', fileId)
        .single();

      if (fileError) {
        console.error('Error fetching file metadata:', fileError);
      } else if (fileData) {
        fileInfo = {
          path: fileData.file_url,
          name: fileData.file_name,
          type: fileData.file_type
        };
      }
    }

    // Prepare system message based on chat type
    const systemMessages = {
      'symptom-checker': 'You are a medical AI assistant helping with symptom checking. Be thorough but cautious in your assessment.',
      'report-analyzer': 'You are a medical AI assistant analyzing medical reports and test results. Focus on explaining the results clearly and professionally. When analyzing reports, highlight any abnormal values and explain their significance.',
      'mental-health': 'You are a supportive mental health AI assistant. Be empathetic and professional.',
    };

    // Prepare messages array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemMessages[type] }
    ];

    // Add user message with file if present
    if (fileInfo?.type.includes('image/')) {
      // Get image as base64
      const base64Image = await getImageAsBase64(createClient(), fileInfo.path);
      
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: message },
          {
            type: 'image_url',
            image_url: {
              url: base64Image.startsWith('data:') ? base64Image : `data:${fileInfo.type};base64,${base64Image}`,
              detail: 'high'
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: fileInfo 
          ? `${message}\n\nFile Name: ${fileInfo.name}` 
          : message
      });
    }

    // Get OpenAI response
    const completion = await openai.chat.completions.create({
      model: fileInfo?.type.includes('image/') ? 'gpt-4.1-mini' : 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 4096
    });

    const aiResponse = completion.choices[0].message.content || 'Sorry, I could not generate a response.';

    // Store the conversation in Supabase
    try {
      const supabase = createClient();
      
      // Insert message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          message_text: message,
          response_text: aiResponse,
          chat_type: chatTypeMap[type]
        });

      if (messageError) {
        console.error('Error storing message:', messageError);
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    const response: ChatResponse = {
      message: aiResponse,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 