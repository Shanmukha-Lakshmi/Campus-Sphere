import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc
} from "firebase/firestore";

export const useWebinarRegistrations = (userId: string | undefined) => {
  const { toast } = useToast();
  const [registeredWebinars, setRegisteredWebinars] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, "webinar_registrations"),
        where("user_id", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      const webinarIds = new Set<string>();
      querySnapshot.forEach((doc) => {
        webinarIds.add(doc.data().webinar_id);
      });

      setRegisteredWebinars(webinarIds);
    } catch (error) {
      console.error("Error fetching webinar registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const registerForWebinar = async (webinarId: string, webinarTitle: string) => {
    if (!userId) return false;

    try {
      await addDoc(collection(db, "webinar_registrations"), {
        user_id: userId,
        webinar_id: webinarId,
        registered_at: new Date().toISOString()
      });

      toast({
        title: "Registered!",
        description: "You have successfully registered for this webinar.",
      });

      setRegisteredWebinars((prev) => new Set([...prev, webinarId]));
      return true;
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const unregisterFromWebinar = async (webinarId: string) => {
    if (!userId) return false;

    try {
      // Find the document to delete
      const q = query(
        collection(db, "webinar_registrations"),
        where("user_id", "==", userId),
        where("webinar_id", "==", webinarId)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        await deleteDoc(doc(db, "webinar_registrations", querySnapshot.docs[0].id));

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
      }
      return false;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
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


