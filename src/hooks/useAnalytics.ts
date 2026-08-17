import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";

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

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Events Listener
    const unsubEvents = onSnapshot(
      collection(db, "events"),
      (snapshot) => {
        let totalEvents = 0;
        let totalEventRegistrations = 0;
        const eventStats: any[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          totalEvents++;
          const count = data.registered_users ? data.registered_users.length : 0;
          totalEventRegistrations += count;
          if (count > 0) {
            eventStats.push({ event_id: doc.id, title: data.title, count });
          }
        });

        // Sort by count desc
        eventStats.sort((a, b) => b.count - a.count);

        setAnalytics(prev => ({
          ...prev,
          totalEvents,
          totalEventRegistrations,
          eventStats
        }));
      },
      (error) => {
        console.error("Events listener error:", error);
      }
    );

    // 2. Webinars Listener
    const unsubWebinars = onSnapshot(
      collection(db, "webinars"),
      (snapshot) => {
        let totalWebinars = 0;
        let totalWebinarRegistrations = 0;
        const webinarStats: any[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          totalWebinars++;
          const count = data.registered_users ? data.registered_users.length : 0;
          totalWebinarRegistrations += count;
          if (count > 0) {
            webinarStats.push({ webinar_id: doc.id, title: data.title, count });
          }
        });

        // Sort by count desc
        webinarStats.sort((a, b) => b.count - a.count);

        setAnalytics(prev => ({
          ...prev,
          totalWebinars,
          totalWebinarRegistrations,
          webinarStats
        }));
      },
      (error) => {
        console.error("Webinars listener error:", error);
      }
    );

    // 3. Circulars Listener
    const unsubCirculars = onSnapshot(
      collection(db, "circulars"),
      (snapshot) => {
        setAnalytics(prev => ({
          ...prev,
          totalCirculars: snapshot.size
        }));
      },
      (error) => {
        console.error("Circulars listener error:", error);
      }
    );

    // Initial loading state handling - we assume data comes in quickly with Firestore
    // Ideally we'd wait for all initial snapshots, but for simplicity we turn off loading after a short delay
    // or we could track which ones have returned.
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => {
      unsubEvents();
      unsubWebinars();
      unsubCirculars();
      clearTimeout(timer);
    };
  }, [isAdmin]);

  return { analytics, loading };
};

