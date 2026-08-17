import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GraduationCap,
  Calendar,
  FileText,
  Video,
  LogOut,
  User,
  Clock,
  MapPin,
  ExternalLink,
  Plus,
  ChevronRight,
  CalendarPlus,
  BarChart3,
  Pencil,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { CreateCircularDialog } from "@/components/dashboard/CreateCircularDialog";
import { CreateEventDialog } from "@/components/dashboard/CreateEventDialog";
import { CreateWebinarDialog } from "@/components/dashboard/CreateWebinarDialog";
import { NotificationsDropdown } from "@/components/dashboard/NotificationsDropdown";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { generateGoogleCalendarLink } from "@/lib/notifications";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from "firebase/firestore";

interface Circular {
  id: string;
  title: string;
  department: string | string[];
  type: string;
  created_at: string;
  image_url?: string;
  content?: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  club_name: string;
  event_date: string;
  event_time: string;
  venue: string;
  max_participants?: number | null;
  registration_required?: boolean;
  registered_users?: string[];
  image_url?: string;
}

interface Webinar {
  id: string;
  title: string;
  description: string | null;
  faculty_name: string | null;
  webinar_date: string;
  webinar_time: string;
  meeting_link: string;
  max_participants?: number | null;
  registration_required?: boolean;
  registered_users?: string[];
  image_url?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any | null>(null);
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);

  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [webinars, setWebinars] = useState<Webinar[]>([]);

  const [showCircularDialog, setShowCircularDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showWebinarDialog, setShowWebinarDialog] = useState(false);

  const [editingCircular, setEditingCircular] = useState<Circular | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
  const [editingWebinar, setEditingWebinar] = useState<Webinar | undefined>(undefined);

  const [activeTab, setActiveTab] = useState("circulars");

  const { role, canCreateCirculars, canCreateEvents, canCreateWebinars } = useUserRole(user?.uid);
  const isAdmin = role === "admin";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser?.uid);
      if (currentUser) {
        setUser(currentUser);
        try {
          // Fetch additional user details (full_name) from Firestore
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          console.log("User doc exists:", userDoc.exists(), "Data:", userDoc.data());
          if (userDoc.exists()) {
            setUserName(userDoc.data().full_name || currentUser.displayName || "User");
          } else {
            console.warn("User document not found in Firestore");
            setUserName(currentUser.displayName || "User");
          }
        } catch (fsErr) {
          console.error("Error fetching user profile from Firestore:", fsErr);
          setUserName(currentUser.displayName || "User");
        }
      } else {
        console.log("No user authenticated, redirecting to auth");
        setUser(null);
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      // Real-time listeners for data
      const qCirculars = query(collection(db, "circulars"), orderBy("created_at", "desc"));
      const unsubCirculars = onSnapshot(
        qCirculars,
        (snapshot) => {
          console.log("Circulars loaded:", snapshot.size);
          setCirculars(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Circular)));
        },
        (error) => {
          console.error("Circulars listener error:", error);
          toast({
            title: "Error loading circulars",
            description: error.message,
            variant: "destructive",
          });
        }
      );

      const qEvents = query(collection(db, "events"), orderBy("created_at", "desc"));
      const unsubEvents = onSnapshot(
        qEvents,
        (snapshot) => {
          console.log("Events loaded:", snapshot.size);
          setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)));
        },
        (error) => {
          console.error("Events listener error:", error);
          toast({
            title: "Error loading events",
            description: error.message,
            variant: "destructive",
          });
        }
      );

      const qWebinars = query(collection(db, "webinars"), orderBy("created_at", "desc"));
      const unsubWebinars = onSnapshot(
        qWebinars,
        (snapshot) => {
          console.log("Webinars loaded:", snapshot.size);
          setWebinars(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Webinar)));
        },
        (error) => {
          console.error("Webinars listener error:", error);
          toast({
            title: "Error loading webinars",
            description: error.message,
            variant: "destructive",
          });
        }
      );

      return () => {
        unsubCirculars();
        unsubEvents();
        unsubWebinars();
      };
    }
  }, [user, toast]);

  // Delete Handler
  const handleDelete = async (collectionName: string, id: string) => {
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, collectionName, id));
      toast({
        title: "Success",
        description: "Item deleted successfully.",
      });
      // No need to manually refresh if onSnapshot is used, but for safety:
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive",
      });
    }
  };

  const handleRegisterEvent = async (eventId: string, title: string, isRegistered: boolean) => {
    if (!user) return;

    // Find the event to check limits
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Check if full (only when registering)
    if (!isRegistered && event.max_participants && (event.registered_users?.length || 0) >= event.max_participants) {
      toast({
        title: "Event Full",
        description: "This event has reached maximum participants.",
        variant: "destructive",
      });
      return;
    }

    try {
      const eventRef = doc(db, "events", eventId);
      if (isRegistered) {
        await updateDoc(eventRef, {
          registered_users: arrayRemove(user.uid)
        });
        toast({ title: "Unregistered", description: `You have unregistered from ${title}.` });
      } else {
        await updateDoc(eventRef, {
          registered_users: arrayUnion(user.uid)
        });
        toast({ title: "Registered!", description: `Successfully registered for ${title}.` });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update registration status.",
        variant: "destructive",
      });
    }
  };

  const handleRegisterWebinar = async (webinarId: string, title: string, isRegistered: boolean) => {
    if (!user) return;

    // Find the webinar to check limits
    const webinar = webinars.find(w => w.id === webinarId);
    if (!webinar) return;

    // Check if full (only when registering)
    if (!isRegistered && webinar.max_participants && (webinar.registered_users?.length || 0) >= webinar.max_participants) {
      toast({
        title: "Webinar Full",
        description: "This webinar has reached maximum participants.",
        variant: "destructive",
      });
      return;
    }

    try {
      const webinarRef = doc(db, "webinars", webinarId);
      if (isRegistered) {
        await updateDoc(webinarRef, {
          registered_users: arrayRemove(user.uid)
        });
        toast({ title: "Unregistered", description: `You have unregistered from ${title}.` });
      } else {
        await updateDoc(webinarRef, {
          registered_users: arrayUnion(user.uid)
        });
        toast({ title: "Registered!", description: `Successfully registered for ${title}.` });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update registration status.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleAddToCalendar = (
    title: string,
    description: string | null,
    date: string,
    time: string,
    location?: string
  ) => {
    const link = generateGoogleCalendarLink(
      title,
      description || "",
      date,
      time,
      location
    );
    window.open(link, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const registeredEventsCount = events.filter(e => e.registered_users?.includes(user?.uid)).length;
  const registeredWebinarsCount = webinars.filter(w => w.registered_users?.includes(user?.uid)).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container-custom px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-xl font-serif font-bold text-primary">Campusphere</span>
            </div>

            <div className="flex items-center gap-4">
              <NotificationsDropdown userId={user?.uid} />

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{role.replace("_", " ")}</p>
                </div>
                <div className="p-2 rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom px-4 md:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Welcome back, {userName.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening on campus today.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="feature-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{circulars.length}</p>
                  <p className="text-sm text-muted-foreground">Circulars</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="feature-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-accent/10">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{events.length}</p>
                  <p className="text-sm text-muted-foreground">Upcoming Events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="feature-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gold/20">
                  <Video className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{webinars.length}</p>
                  <p className="text-sm text-muted-foreground">Webinars</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="feature-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <BarChart3 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{registeredEventsCount + registeredWebinarsCount}</p>
                  <p className="text-sm text-muted-foreground">Registered</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Dashboard for Admin */}
        {isAdmin && (
          <div className="mb-8">
            <AnalyticsDashboard isAdmin={isAdmin} />
          </div>
        )}

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 gap-2">
            <TabsTrigger value="circulars" className="gap-2">
              <FileText className="h-4 w-4" />
              Circulars
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="webinars" className="gap-2">
              <Video className="h-4 w-4" />
              Webinars
            </TabsTrigger>
          </TabsList>

          {/* Circulars Tab */}
          <TabsContent value="circulars" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Latest Circulars</h2>
              {canCreateCirculars && (
                <Button
                  className="btn-primary-gradient gap-2"
                  onClick={() => {
                    setEditingCircular(undefined);
                    setShowCircularDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Post Circular
                </Button>
              )}
            </div>

            <ScrollArea className="h-[600px] pr-4">
              <div className="grid gap-4">
                {circulars.length === 0 ? (
                  <Card className="feature-card">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No circulars yet. {canCreateCirculars && "Click 'Post Circular' to create one."}
                    </CardContent>
                  </Card>
                ) : (
                  circulars.map((circular) => (
                    <Card key={circular.id} className="feature-card">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4">
                          {circular.image_url && (
                            <div className="w-full h-48 rounded-md overflow-hidden bg-muted">
                              <img src={circular.image_url} alt={circular.title} className="w-full h-full object-cover" />
                            </div>
                          )}

                          <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                              <div className="p-3 rounded-lg bg-primary/10 h-fit">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">{circular.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {Array.isArray(circular.department)
                                    ? circular.department.join(", ")
                                    : circular.department}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">{formatDate(circular.created_at)}</p>
                                <p className="text-sm mt-2 whitespace-pre-wrap">{circular.content}</p>
                              </div>
                            </div>
                            <Badge variant={circular.type === "important" ? "destructive" : "secondary"}>
                              {circular.type}
                            </Badge>
                          </div>

                          {isAdmin && (
                            <div className="flex gap-2 justify-end mt-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setEditingCircular(circular);
                                  setShowCircularDialog(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete("circulars", circular.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upcoming Events</h2>
              {canCreateEvents && (
                <Button
                  className="btn-primary-gradient gap-2"
                  onClick={() => {
                    setEditingEvent(undefined);
                    setShowEventDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create Event
                </Button>
              )}
            </div>

            <ScrollArea className="h-[600px] pr-4">
              <div className="grid md:grid-cols-2 gap-4">
                {events.length === 0 ? (
                  <Card className="feature-card md:col-span-2">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No upcoming events. {canCreateEvents && "Click 'Create Event' to add one."}
                    </CardContent>
                  </Card>
                ) : (
                  events.map((event) => {
                    const isRegistered = event.registered_users?.includes(user?.uid) || false;
                    const isFull = event.max_participants ? (event.registered_users?.length || 0) >= event.max_participants : false;
                    const isRegistrationRequired = event.registration_required !== false; // Default to true if undefined

                    return (
                      <Card key={event.id} className="feature-card">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {event.image_url && (
                              <div className="w-full h-40 rounded-md overflow-hidden bg-muted">
                                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-foreground">{event.title}</h3>
                                <p className="text-sm text-muted-foreground">{event.club_name}</p>
                              </div>
                              <div className="flex flex-col gap-1 items-end">
                                <Badge variant={isRegistered ? "default" : (isRegistrationRequired ? "outline" : "secondary")}>
                                  {isRegistered ? "Registered" : (isRegistrationRequired ? "Open" : "Open to All")}
                                </Badge>
                                {isFull && !isRegistered && isRegistrationRequired && (
                                  <Badge variant="destructive" className="text-xs">Full</Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(event.event_date)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(event.event_time)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.venue}
                              </div>
                              {event.max_participants && (
                                <div className="text-xs w-full">
                                  Spots: {(event.registered_users?.length || 0)} / {event.max_participants}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {isAdmin && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                      setEditingEvent(event);
                                      setShowEventDialog(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete("events", event.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {isRegistrationRequired && (
                                <Button
                                  variant={isRegistered ? "destructive" : "outline"}
                                  className="flex-1 btn-outline-hero"
                                  disabled={!isRegistered && isFull}
                                  onClick={() => handleRegisterEvent(event.id, event.title, isRegistered)}
                                >
                                  {isRegistered ? "Unregister" : (isFull ? "Full" : "Register Now")}
                                  {!isRegistered && !isFull && <ChevronRight className="h-4 w-4 ml-2" />}
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAddToCalendar(
                                  event.title,
                                  event.description,
                                  event.event_date,
                                  event.event_time,
                                  event.venue
                                )}
                                title="Add to Google Calendar"
                              >
                                <CalendarPlus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Webinars Tab */}
          <TabsContent value="webinars" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upcoming Webinars</h2>
              {canCreateWebinars && (
                <Button
                  className="btn-primary-gradient gap-2"
                  onClick={() => {
                    setEditingWebinar(undefined);
                    setShowWebinarDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Schedule Webinar
                </Button>
              )}
            </div>

            <ScrollArea className="h-[600px] pr-4">
              <div className="grid md:grid-cols-2 gap-4">
                {webinars.length === 0 ? (
                  <Card className="feature-card md:col-span-2">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No upcoming webinars. {canCreateWebinars && "Click 'Schedule Webinar' to add one."}
                    </CardContent>
                  </Card>
                ) : (
                  webinars.map((webinar) => {
                    const isRegistered = webinar.registered_users?.includes(user?.uid) || false;
                    const isFull = webinar.max_participants ? (webinar.registered_users?.length || 0) >= webinar.max_participants : false;
                    const isRegistrationRequired = webinar.registration_required !== false;

                    return (
                      <Card key={webinar.id} className="feature-card">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {webinar.image_url && (
                              <div className="w-full h-40 rounded-md overflow-hidden bg-muted">
                                <img src={webinar.image_url} alt={webinar.title} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-foreground">{webinar.title}</h3>
                                <p className="text-sm text-muted-foreground">by {webinar.faculty_name || "Faculty"}</p>
                              </div>
                              <div className="flex flex-col gap-1 items-end">
                                <Badge variant={isRegistered ? "default" : (isRegistrationRequired ? "outline" : "secondary")}>
                                  {isRegistered ? "Registered" : (isRegistrationRequired ? "Open" : "Open to All")}
                                </Badge>
                                {isFull && !isRegistered && isRegistrationRequired && (
                                  <Badge variant="destructive" className="text-xs">Full</Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(webinar.webinar_date)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(webinar.webinar_time)}
                              </div>
                              {webinar.max_participants && (
                                <div className="text-xs w-full">
                                  Spots: {(webinar.registered_users?.length || 0)} / {webinar.max_participants}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {isAdmin && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                      setEditingWebinar(webinar);
                                      setShowWebinarDialog(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete("webinars", webinar.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {isRegistrationRequired && (
                                <Button
                                  variant={isRegistered ? "destructive" : "outline"}
                                  className="flex-1 btn-outline-hero"
                                  disabled={!isRegistered && isFull}
                                  onClick={() => {
                                    if (isRegistered) {
                                      handleRegisterWebinar(webinar.id, webinar.title, true);
                                    } else {
                                      handleRegisterWebinar(webinar.id, webinar.title, false);
                                    }
                                  }}
                                >
                                  {isRegistered ? "Unregister" : (isFull ? "Full" : "Register")}
                                  {!isRegistered && !isFull && <ChevronRight className="h-4 w-4 ml-2" />}
                                </Button>
                              )}

                              {(isRegistered || !isRegistrationRequired) && (
                                <Button
                                  variant="outline"
                                  className="flex-1 btn-outline-hero"
                                  onClick={() => window.open(webinar.meeting_link, "_blank")}
                                >
                                  Join
                                  <ExternalLink className="h-4 w-4 ml-2" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAddToCalendar(
                                  webinar.title,
                                  webinar.description,
                                  webinar.webinar_date,
                                  webinar.webinar_time
                                )}
                                title="Add to Google Calendar"
                              >
                                <CalendarPlus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <CreateCircularDialog
        open={showCircularDialog}
        onOpenChange={setShowCircularDialog}
        onSuccess={() => { }} // No need to refetch manually with onSnapshot
      />
      <CreateEventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        onSuccess={() => { }}
      />
      <CreateWebinarDialog
        open={showWebinarDialog}
        onOpenChange={setShowWebinarDialog}
        onSuccess={() => { }}
      />
    </div >
  );
};

export default Dashboard;
