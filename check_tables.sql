-- Check messages table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages';

-- Check uploads table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'uploads';

-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (tablename = 'messages' OR tablename = 'uploads');

-- Check if chat_type enum exists
SELECT typname, enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE typname = 'chat_type'; 