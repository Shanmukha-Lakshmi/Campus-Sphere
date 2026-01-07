import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  totalEventRegistrations: number;
  totalWebinarRegistrations: number;
  totalCirculars: number;
  totalEvents: number;
  totalWebinars: number;
  recentRegistrations: {
    id: string;
    user_name: string;
    user_email: string;
    type: "event" | "webinar";
    title: string;
    registered_at: string;
  }[];
  eventStats: { event_id: string; title: string; count: number }[];
  webinarStats: { webinar_id: string; title: string; count: number }[];
}

export const useAnalytics = (isAdmin: boolean) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalEventRegistrations: 0,
    totalWebinarRegistrations: 0,
    totalCirculars: 0,
    totalEvents: 0,
    totalWebinars: 0,
    recentRegistrations: [],
    eventStats: [],
    webinarStats: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    try {
      // Fetch counts
      const [
        eventRegsResult,
        webinarRegsResult,
        circularsResult,
        eventsResult,
        webinarsResult,
      ] = await Promise.all([
        supabase.from("event_registrations").select("id", { count: "exact", head: true }),
        supabase.from("webinar_registrations").select("id", { count: "exact", head: true }),
        supabase.from("circulars").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("webinars").select("id", { count: "exact", head: true }),
      ]);

      // Fetch event registration stats
      const { data: eventRegs } = await supabase
        .from("event_registrations")
        .select(`
          event_id,
          events(title)
        `);

      const eventStatsMap = new Map<string, { title: string; count: number }>();
      eventRegs?.forEach((reg: any) => {
        const id = reg.event_id;
        const title = reg.events?.title || "Unknown Event";
        if (eventStatsMap.has(id)) {
          eventStatsMap.get(id)!.count++;
        } else {
          eventStatsMap.set(id, { title, count: 1 });
        }
      });

      // Fetch webinar registration stats
      const { data: webinarRegs } = await supabase
        .from("webinar_registrations")
        .select(`
          webinar_id,
          webinars(title)
        `);

      const webinarStatsMap = new Map<string, { title: string; count: number }>();
      webinarRegs?.forEach((reg: any) => {
        const id = reg.webinar_id;
        const title = reg.webinars?.title || "Unknown Webinar";
        if (webinarStatsMap.has(id)) {
          webinarStatsMap.get(id)!.count++;
        } else {
          webinarStatsMap.set(id, { title, count: 1 });
        }
      });

      setAnalytics({
        totalEventRegistrations: eventRegsResult.count || 0,
        totalWebinarRegistrations: webinarRegsResult.count || 0,
        totalCirculars: circularsResult.count || 0,
        totalEvents: eventsResult.count || 0,
        totalWebinars: webinarsResult.count || 0,
        recentRegistrations: [],
        eventStats: Array.from(eventStatsMap.entries()).map(([event_id, data]) => ({
          event_id,
          title: data.title,
          count: data.count,
        })),
        webinarStats: Array.from(webinarStatsMap.entries()).map(([webinar_id, data]) => ({
          webinar_id,
          title: data.title,
          count: data.count,
        })),
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [isAdmin]);

  return { analytics, loading, refetch: fetchAnalytics };
};
