import { useEffect, useState } from "react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = (userId: string | undefined) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!userId) return;

    // Mock fetch notifications
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Welcome to Campusphere',
        message: 'This is a mock notification.',
        type: 'info',
        reference_id: null,
        reference_type: null,
        is_read: false,
        created_at: new Date().toISOString()
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter((n) => !n.is_read).length);
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    // Mock mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    // Mock mark all as read
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    // Mock realtime subscription (omitted for now)

  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};

