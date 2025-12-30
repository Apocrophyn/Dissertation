-- Create chat_type enum
CREATE TYPE chat_type AS ENUM ('symptom', 'report', 'mental');

-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    chat_type chat_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create uploads table
CREATE TABLE uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_url TEXT NOT NULL,
    analysis_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Create public access policies for demo
CREATE POLICY "Public read access to messages"
    ON messages FOR SELECT
    USING (true);

CREATE POLICY "Public insert access to messages"
    ON messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public read access to uploads"
    ON uploads FOR SELECT
    USING (true);

CREATE POLICY "Public insert access to uploads"
    ON uploads FOR INSERT
    WITH CHECK (true); 