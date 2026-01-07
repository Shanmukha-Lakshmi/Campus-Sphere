-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can manage reminders" ON public.scheduled_reminders;

-- Create proper policies for scheduled_reminders
CREATE POLICY "Admins can manage reminders" ON public.scheduled_reminders
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Faculty can view reminders for their content" ON public.scheduled_reminders
    FOR SELECT USING (
        has_role(auth.uid(), 'faculty'::app_role) AND (
            (reference_type = 'webinar' AND EXISTS (
                SELECT 1 FROM webinars w WHERE w.id = reference_id AND w.created_by = auth.uid()
            ))
            OR
            (reference_type = 'event' AND EXISTS (
                SELECT 1 FROM events e WHERE e.id = reference_id AND e.created_by = auth.uid()
            ))
        )
    );