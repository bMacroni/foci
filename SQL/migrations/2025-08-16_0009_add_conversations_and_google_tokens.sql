-- Create tables for conversations and Google OAuth tokens

-- conversation_threads: user-owned threads, soft deletable, with timestamps
CREATE TABLE IF NOT EXISTS public.conversation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- conversation_messages: messages linked to a thread and user, with optional metadata
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.conversation_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- google_tokens: persisted Google OAuth tokens per user (expiry_date stored as milliseconds since epoch)
CREATE TABLE IF NOT EXISTS public.google_tokens (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  token_type TEXT,
  scope TEXT,
  expiry_date BIGINT, -- milliseconds since epoch
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers to maintain updated_at
CREATE TRIGGER update_conversation_threads_updated_at
  BEFORE UPDATE ON public.conversation_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_messages_updated_at
  BEFORE UPDATE ON public.conversation_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_tokens_updated_at
  BEFORE UPDATE ON public.google_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_conversation_threads_user_id
  ON public.conversation_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_threads_updated_at
  ON public.conversation_threads(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_thread_id
  ON public.conversation_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_id
  ON public.conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at
  ON public.conversation_messages(created_at);

-- RLS
ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- conversation_threads policies (user owns their threads)
CREATE POLICY "Users can view own conversation_threads" ON public.conversation_threads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversation_threads" ON public.conversation_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversation_threads" ON public.conversation_threads
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversation_threads" ON public.conversation_threads
  FOR DELETE USING (auth.uid() = user_id);

-- conversation_messages policies (messages belong to the same user who owns the thread)
CREATE POLICY "Users can view own conversation_messages" ON public.conversation_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversation_messages" ON public.conversation_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.conversation_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own conversation_messages" ON public.conversation_messages
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversation_messages" ON public.conversation_messages
  FOR DELETE USING (auth.uid() = user_id);

-- google_tokens policies (each user can only access their own tokens)
CREATE POLICY "Users can view own google_tokens" ON public.google_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own google_tokens" ON public.google_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own google_tokens" ON public.google_tokens
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own google_tokens" ON public.google_tokens
  FOR DELETE USING (auth.uid() = user_id);


