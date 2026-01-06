import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "faculty" | "club_member" | "admin";

export const useUserRole = (userId: string | undefined) => {
  const [role, setRole] = useState<AppRole>("student");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
        }

        if (data?.role) {
          setRole(data.role as AppRole);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [userId]);

  const canCreateCirculars = role === "faculty" || role === "admin";
  const canCreateEvents = role === "club_member" || role === "admin";
  const canCreateWebinars = role === "faculty" || role === "admin";

  return { role, loading, canCreateCirculars, canCreateEvents, canCreateWebinars };
};
