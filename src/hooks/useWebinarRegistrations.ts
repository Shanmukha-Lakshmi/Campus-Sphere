import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useWebinarRegistrations = (userId: string | undefined) => {
  const { toast } = useToast();
  const [registeredWebinars, setRegisteredWebinars] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("webinar_registrations")
      .select("webinar_id")
      .eq("user_id", userId);

    if (!error && data) {
      setRegisteredWebinars(new Set(data.map((r) => r.webinar_id)));
    }
    setLoading(false);
  };

  const registerForWebinar = async (webinarId: string, webinarTitle: string) => {
    if (!userId) return false;

    const { error } = await supabase.from("webinar_registrations").insert({
      webinar_id: webinarId,
      user_id: userId,
    });

    if (error) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    // Log analytics
    await supabase.from("analytics_logs").insert({
      event_type: "webinar_registration",
      reference_id: webinarId,
      reference_type: "webinar",
      user_id: userId,
      metadata: { webinar_title: webinarTitle },
    });

    toast({
      title: "Registered!",
      description: "You have successfully registered for this webinar.",
    });

    setRegisteredWebinars((prev) => new Set([...prev, webinarId]));
    return true;
  };

  const unregisterFromWebinar = async (webinarId: string) => {
    if (!userId) return false;

    const { error } = await supabase
      .from("webinar_registrations")
      .delete()
      .eq("webinar_id", webinarId)
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Failed to unregister",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Unregistered",
      description: "You have been removed from this webinar.",
    });

    setRegisteredWebinars((prev) => {
      const next = new Set(prev);
      next.delete(webinarId);
      return next;
    });
    return true;
  };

  useEffect(() => {
    fetchRegistrations();
  }, [userId]);

  return {
    registeredWebinars,
    loading,
    registerForWebinar,
    unregisterFromWebinar,
    isRegistered: (webinarId: string) => registeredWebinars.has(webinarId),
    refetch: fetchRegistrations,
  };
};
