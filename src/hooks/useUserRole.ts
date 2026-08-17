import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export type AppRole = "student" | "faculty" | "club_member" | "admin";

export const useUserRole = (userId: string | undefined) => {
  const [role, setRole] = useState<AppRole>("student");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!userId) {
        console.log("No userId provided to useUserRole");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching role for user:", userId);
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const fetchedRole = (userData.role as AppRole) || "student";
          console.log("Role fetched successfully:", fetchedRole);
          setRole(fetchedRole);
        } else {
          console.warn("User document does not exist in Firestore");
          setRole("student");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("student");
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

