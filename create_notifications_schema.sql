-- Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'warning', 'booking', 'job', 'system'
    action_link VARCHAR(255),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (e.g. mark as read)
CREATE POLICY "Users can update own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Admins or System can insert notifications
-- For simplicity in a prototype without backend, we might allow authenticated users to create notifications
-- (e.g. User A books Mentor B -> User A creates a notification for Mentor B).
-- In production, this should be done via Edge Functions or strict triggers.
-- Here we allow authenticated users to insert notifications to ANY user (needed for client-side inserts like bookings/approvals)
CREATE POLICY "Authenticated users can insert notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create an index to speed up fetching unread notifications
CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_idx 
ON public.notifications (user_id, is_read);

-- BẬT REALTIME CHO BẢNG NOTIFICATIONS (Bắt buộc để chuông nhảy số không cần F5)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
