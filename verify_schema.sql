-- Drop existing table if it exists
DROP TABLE IF EXISTS uploads;

-- Recreate the uploads table with correct structure
CREATE TABLE uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    analysis_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public read access to uploads"
    ON uploads FOR SELECT
    USING (true);

CREATE POLICY "Public insert access to uploads"
    ON uploads FOR INSERT
    WITH CHECK (true); 