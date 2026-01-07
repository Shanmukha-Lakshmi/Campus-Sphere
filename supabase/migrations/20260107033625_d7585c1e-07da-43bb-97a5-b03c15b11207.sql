-- Create webinar_registrations table
CREATE TABLE public.webinar_registrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    webinar_id UUID NOT NULL REFERENCES public.webinars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(webinar_id, user_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    reference_id UUID,
    reference_type TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics_logs table for tracking
CREATE TABLE public.analytics_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    user_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scheduled_reminders table for tracking sent reminders
CREATE TABLE public.scheduled_reminders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reference_id UUID NOT NULL,
    reference_type TEXT NOT NULL,
    reminder_type TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(reference_id, reference_type, reminder_type)
);

-- Enable RLS on all new tables
ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;

-- Webinar registrations policies
CREATE POLICY "Users can view their registrations" ON public.webinar_registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Webinar creators can view all registrations" ON public.webinar_registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM webinars w WHERE w.id = webinar_id AND w.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can register for webinars" ON public.webinar_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unregister from webinars" ON public.webinar_registrations
    FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Analytics policies (admin only for viewing, system can insert)
CREATE POLICY "Admins can view analytics" ON public.analytics_logs
    FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can log analytics" ON public.analytics_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Scheduled reminders policies
CREATE POLICY "Admins can view reminders" ON public.scheduled_reminders
    FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can manage reminders" ON public.scheduled_reminders
    FOR ALL USING (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_webinar_registrations_webinar ON public.webinar_registrations(webinar_id);
CREATE INDEX idx_webinar_registrations_user ON public.webinar_registrations(user_id);
CREATE INDEX idx_analytics_logs_type ON public.analytics_logs(event_type);
CREATE INDEX idx_analytics_logs_reference ON public.analytics_logs(reference_id, reference_type);
CREATE INDEX idx_scheduled_reminders_scheduled ON public.scheduled_reminders(scheduled_for) WHERE sent_at IS NULL;