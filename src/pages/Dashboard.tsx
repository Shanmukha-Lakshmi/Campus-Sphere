import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GraduationCap, 
  Bell, 
  Calendar, 
  FileText, 
  Video, 
  LogOut, 
  User,
  Clock,
  MapPin,
  ExternalLink,
  Plus,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Mock data for demonstration
const mockCirculars = [
  {
    id: 1,
    title: "Mid-Semester Examination Schedule",
    department: "Academic Office",
    date: "2024-01-15",
    type: "important",
  },
  {
    id: 2,
    title: "Library Timing Changes",
    department: "Library",
    date: "2024-01-14",
    type: "general",
  },
  {
    id: 3,
    title: "Workshop on Research Methodology",
    department: "Computer Science",
    date: "2024-01-13",
    type: "event",
  },
];

const mockEvents = [
  {
    id: 1,
    title: "Tech Hackathon 2024",
    club: "Coding Club",
    date: "2024-01-25",
    time: "9:00 AM",
    venue: "Main Auditorium",
    registered: false,
  },
  {
    id: 2,
    title: "Cultural Night",
    club: "Cultural Committee",
    date: "2024-01-28",
    time: "6:00 PM",
    venue: "Open Air Theatre",
    registered: true,
  },
];

const mockWebinars = [
  {
    id: 1,
    title: "AI in Modern Education",
    faculty: "Dr. Sarah Johnson",
    date: "2024-01-20",
    time: "3:00 PM",
    link: "#",
  },
  {
    id: 2,
    title: "Career Guidance Session",
    faculty: "Prof. Michael Chen",
    date: "2024-01-22",
    time: "2:00 PM",
    link: "#",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const userRole = user?.user_metadata?.role || "student";
  const userName = user?.user_metadata?.full_name || "User";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar/Header */}
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
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
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
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-muted-foreground">New Circulars</p>
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
                  <p className="text-2xl font-bold">5</p>
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
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-sm text-muted-foreground">Live Webinars</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="feature-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <Bell className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-sm text-muted-foreground">Notifications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="circulars" className="space-y-6">
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
              {(userRole === "faculty" || userRole === "admin") && (
                <Button className="btn-primary-gradient gap-2">
                  <Plus className="h-4 w-4" />
                  Post Circular
                </Button>
              )}
            </div>

            <div className="grid gap-4">
              {mockCirculars.map((circular) => (
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
                          <p className="text-xs text-muted-foreground mt-1">{circular.date}</p>
                        </div>
                      </div>
                      <Badge variant={circular.type === "important" ? "destructive" : "secondary"}>
                        {circular.type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upcoming Events</h2>
              {(userRole === "club_member" || userRole === "admin") && (
                <Button className="btn-primary-gradient gap-2">
                  <Plus className="h-4 w-4" />
                  Create Event
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {mockEvents.map((event) => (
                <Card key={event.id} className="feature-card">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">{event.club}</p>
                        </div>
                        <Badge variant={event.registered ? "default" : "outline"}>
                          {event.registered ? "Registered" : "Open"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.venue}
                        </div>
                      </div>

                      {!event.registered && (
                        <Button variant="outline" className="w-full btn-outline-hero">
                          Register Now
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Webinars Tab */}
          <TabsContent value="webinars" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upcoming Webinars</h2>
              {(userRole === "faculty" || userRole === "admin") && (
                <Button className="btn-primary-gradient gap-2">
                  <Plus className="h-4 w-4" />
                  Schedule Webinar
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {mockWebinars.map((webinar) => (
                <Card key={webinar.id} className="feature-card">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{webinar.title}</h3>
                        <p className="text-sm text-muted-foreground">by {webinar.faculty}</p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {webinar.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {webinar.time}
                        </div>
                      </div>

                      <Button variant="outline" className="w-full btn-outline-hero">
                        Join Webinar
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
