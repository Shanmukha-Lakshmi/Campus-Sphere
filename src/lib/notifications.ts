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
  // Mock create notification
  console.log("Mock create notification:", { userId, title, message });
  return true;
};

// Helper to notify all users about a new event
export const notifyAllUsersAboutEvent = async (
  eventId: string,
  eventTitle: string,
  eventDate: string
) => {
  // Mock notify all
  console.log("Mock notify all users about event:", eventTitle);
};

// Helper to notify all users about a new webinar
export const notifyAllUsersAboutWebinar = async (
  webinarId: string,
  webinarTitle: string,
  webinarDate: string
) => {
  // Mock notify all
  console.log("Mock notify all users about webinar:", webinarTitle);
};

// Helper to notify all users about a new circular
export const notifyAllUsersAboutCircular = async (
  circularId: string,
  circularTitle: string,
  department: string
) => {
  // Mock notify all
  console.log("Mock notify all users about circular:", circularTitle);
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
