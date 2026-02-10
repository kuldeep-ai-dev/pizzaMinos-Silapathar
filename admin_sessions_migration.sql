-- Create admin_sessions table to track active devices
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    ip_address TEXT,
    location TEXT, -- e.g., "Silapathar, Assam, India"
    user_agent TEXT,
    last_active_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all for authenticated service role (server actions)
CREATE POLICY "Allow server actions" ON public.admin_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_last_active ON public.admin_sessions (last_active_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_session_id ON public.admin_sessions (session_id);
