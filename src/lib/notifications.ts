import { supabase } from "@/integrations/supabase/client";

type NotificationType = "event" | "webinar" | "circular" | "reminder" | "registration" | "general";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  referenceId?: string;
  referenceType?: string;
}

export const createNotification = async ({
  userId,
  title,
  message,
  type,
  referenceId,
  referenceType,
}: CreateNotificationParams) => {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    reference_id: referenceId,
    reference_type: referenceType,
  });

  if (error) {
    console.error("Failed to create notification:", error);
    return false;
  }
  return true;
};

// Helper to notify all users about a new event
export const notifyAllUsersAboutEvent = async (
  eventId: string,
  eventTitle: string,
  eventDate: string
) => {
  // Get all user IDs from profiles
  const { data: profiles } = await supabase.from("profiles").select("user_id");

  if (!profiles) return;

  const notifications = profiles.map((p) => ({
    user_id: p.user_id,
    title: "New Event: " + eventTitle,
    message: `A new event "${eventTitle}" has been scheduled for ${eventDate}. Register now!`,
    type: "event",
    reference_id: eventId,
    reference_type: "event",
  }));

  await supabase.from("notifications").insert(notifications);
};

// Helper to notify all users about a new webinar
export const notifyAllUsersAboutWebinar = async (
  webinarId: string,
  webinarTitle: string,
  webinarDate: string
) => {
  const { data: profiles } = await supabase.from("profiles").select("user_id");

  if (!profiles) return;

  const notifications = profiles.map((p) => ({
    user_id: p.user_id,
    title: "New Webinar: " + webinarTitle,
    message: `A new webinar "${webinarTitle}" has been scheduled for ${webinarDate}. Don't miss it!`,
    type: "webinar",
    reference_id: webinarId,
    reference_type: "webinar",
  }));

  await supabase.from("notifications").insert(notifications);
};

// Helper to notify all users about a new circular
export const notifyAllUsersAboutCircular = async (
  circularId: string,
  circularTitle: string,
  department: string
) => {
  const { data: profiles } = await supabase.from("profiles").select("user_id");

  if (!profiles) return;

  const notifications = profiles.map((p) => ({
    user_id: p.user_id,
    title: "New Circular: " + circularTitle,
    message: `A new circular from ${department} has been posted. Check it out!`,
    type: "circular",
    reference_id: circularId,
    reference_type: "circular",
  }));

  await supabase.from("notifications").insert(notifications);
};

// Generate Google Calendar link
export const generateGoogleCalendarLink = (
  title: string,
  description: string,
  date: string,
  time: string,
  location?: string,
  durationMinutes: number = 60
) => {
  const startDate = new Date(`${date}T${time}`);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: description,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    ...(location && { location }),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
