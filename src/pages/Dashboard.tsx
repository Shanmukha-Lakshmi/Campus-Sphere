import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useWebinarRegistrations } from "@/hooks/useWebinarRegistrations";
import { CreateCircularDialog } from "@/components/dashboard/CreateCircularDialog";
import { CreateEventDialog } from "@/components/dashboard/CreateEventDialog";
import { CreateWebinarDialog } from "@/components/dashboard/CreateWebinarDialog";
import { NotificationsDropdown } from "@/components/dashboard/NotificationsDropdown";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { generateGoogleCalendarLink } from "@/lib/notifications";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Circular {
  id: string;
  title: string;
  department: string;
  type: string;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  club_name: string;
  event_date: string;
  event_time: string;
  venue: string;
  isRegistered?: boolean;
}

interface Webinar {
  id: string;
  title: string;
  description: string | null;
  faculty_name: string | null;
  webinar_date: string;
  webinar_time: string;
  meeting_link: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());

  const [showCircularDialog, setShowCircularDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showWebinarDialog, setShowWebinarDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("circulars");

  const { role, canCreateCirculars, canCreateEvents, canCreateWebinars } = useUserRole(user?.id);
  const { 
    registeredWebinars, 
    registerForWebinar, 
    isRegistered: isWebinarRegistered 
  } = useWebinarRegistrations(user?.id);

  const isAdmin = role === "admin";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    await Promise.all([
      fetchCirculars(),
      fetchEvents(),
      fetchWebinars(),
      fetchRegistrations(),
    ]);
  };

  const fetchCirculars = async () => {
    const { data, error } = await supabase
      .from("circulars")
      .select("id, title, department, type, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    
    if (!error && data) {
      setCirculars(data);
    }
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, description, club_name, event_date, event_time, venue")
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date", { ascending: true })
      .limit(10);
    
    if (!error && data) {
      setEvents(data);
    }
  };

  const fetchWebinars = async () => {
    const { data, error } = await supabase
      .from("webinars")
      .select("id, title, description, faculty_name, webinar_date, webinar_time, meeting_link")
      .gte("webinar_date", new Date().toISOString().split("T")[0])
      .order("webinar_date", { ascending: true })
      .limit(10);
    
    if (!error && data) {
      setWebinars(data);
    }
  };

  const fetchRegistrations = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("event_registrations")
      .select("event_id")
      .eq("user_id", user.id);
    
    if (!error && data) {
      setRegisteredEvents(new Set(data.map(r => r.event_id)));
    }
  };

  const handleRegisterEvent = async (eventId: string, eventTitle: string) => {
    if (!user) return;

    const { error } = await supabase.from("event_registrations").insert({
      event_id: eventId,
      user_id: user.id,
    });

    if (error) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Log analytics
      await supabase.from("analytics_logs").insert({
        event_type: "event_registration",
        reference_id: eventId,
        reference_type: "event",
        user_id: user.id,
        metadata: { event_title: eventTitle },
      });

      toast({
        title: "Registered!",
        description: "You have successfully registered for this event.",
      });
      setRegisteredEvents(prev => new Set([...prev, eventId]));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const userName = user?.user_metadata?.full_name || "User";

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
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
              <NotificationsDropdown userId={user?.id} />

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
                  <p className="text-2xl font-bold">{registeredEvents.size + registeredWebinars.size}</p>
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
                <Button className="btn-primary-gradient gap-2" onClick={() => setShowCircularDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Post Circular
                </Button>
              )}
            </div>

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
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{circular.title}</h3>
                            <p className="text-sm text-muted-foreground">{circular.department}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(circular.created_at)}</p>
                          </div>
                        </div>
                        <Badge variant={circular.type === "important" ? "destructive" : "secondary"}>
                          {circular.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upcoming Events</h2>
              {canCreateEvents && (
                <Button className="btn-primary-gradient gap-2" onClick={() => setShowEventDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Create Event
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {events.length === 0 ? (
                <Card className="feature-card md:col-span-2">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No upcoming events. {canCreateEvents && "Click 'Create Event' to add one."}
                  </CardContent>
                </Card>
              ) : (
                events.map((event) => {
                  const isRegistered = registeredEvents.has(event.id);
                  return (
                    <Card key={event.id} className="feature-card">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">{event.title}</h3>
                              <p className="text-sm text-muted-foreground">{event.club_name}</p>
                            </div>
                            <Badge variant={isRegistered ? "default" : "outline"}>
                              {isRegistered ? "Registered" : "Open"}
                            </Badge>
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
                          </div>

                          <div className="flex gap-2">
                            {!isRegistered && (
                              <Button 
                                variant="outline" 
                                className="flex-1 btn-outline-hero"
                                onClick={() => handleRegisterEvent(event.id, event.title)}
                              >
                                Register Now
                                <ChevronRight className="h-4 w-4 ml-2" />
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
          </TabsContent>

          {/* Webinars Tab */}
          <TabsContent value="webinars" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upcoming Webinars</h2>
              {canCreateWebinars && (
                <Button className="btn-primary-gradient gap-2" onClick={() => setShowWebinarDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Schedule Webinar
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {webinars.length === 0 ? (
                <Card className="feature-card md:col-span-2">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No upcoming webinars. {canCreateWebinars && "Click 'Schedule Webinar' to add one."}
                  </CardContent>
                </Card>
              ) : (
                webinars.map((webinar) => {
                  const isRegistered = isWebinarRegistered(webinar.id);
                  return (
                    <Card key={webinar.id} className="feature-card">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">{webinar.title}</h3>
                              <p className="text-sm text-muted-foreground">by {webinar.faculty_name || "Faculty"}</p>
                            </div>
                            <Badge variant={isRegistered ? "default" : "outline"}>
                              {isRegistered ? "Registered" : "Open"}
                            </Badge>
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
                          </div>

                          <div className="flex gap-2">
                            {!isRegistered ? (
                              <Button 
                                variant="outline" 
                                className="flex-1 btn-outline-hero"
                                onClick={() => registerForWebinar(webinar.id, webinar.title)}
                              >
                                Register
                                <ChevronRight className="h-4 w-4 ml-2" />
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                className="flex-1 btn-outline-hero"
                                onClick={() => window.open(webinar.meeting_link, "_blank")}
                              >
                                Join Webinar
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
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <CreateCircularDialog 
        open={showCircularDialog} 
        onOpenChange={setShowCircularDialog}
        onSuccess={fetchCirculars}
      />
      <CreateEventDialog 
        open={showEventDialog} 
        onOpenChange={setShowEventDialog}
        onSuccess={fetchEvents}
      />
      <CreateWebinarDialog 
        open={showWebinarDialog} 
        onOpenChange={setShowWebinarDialog}
        onSuccess={fetchWebinars}
      />
    </div>
  );
};

export default Dashboard;
