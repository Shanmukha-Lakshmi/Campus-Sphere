import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Users, Calendar, Video, FileText, TrendingUp, BarChart3 } from "lucide-react";

interface AnalyticsDashboardProps {
  isAdmin: boolean;
}

export const AnalyticsDashboard = ({ isAdmin }: AnalyticsDashboardProps) => {
  const { analytics, loading } = useAnalytics(isAdmin);

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics Dashboard
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        Analytics Dashboard
      </h2>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="feature-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalEventRegistrations}</p>
                <p className="text-xs text-muted-foreground">Event Registrations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalWebinarRegistrations}</p>
                <p className="text-xs text-muted-foreground">Webinar Registrations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalCirculars}</p>
                <p className="text-xs text-muted-foreground">Total Circulars</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Calendar className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalEvents}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="feature-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Video className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalWebinars}</p>
                <p className="text-xs text-muted-foreground">Total Webinars</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registration Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Event Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.eventStats.length === 0 ? (
              <p className="text-muted-foreground text-sm">No registrations yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.eventStats.slice(0, 5).map((stat) => (
                  <div key={stat.event_id} className="flex items-center justify-between">
                    <span className="text-sm truncate flex-1 mr-2">{stat.title}</span>
                    <Badge variant="secondary">{stat.count} registered</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Webinar Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="h-5 w-5" />
              Webinar Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.webinarStats.length === 0 ? (
              <p className="text-muted-foreground text-sm">No registrations yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.webinarStats.slice(0, 5).map((stat) => (
                  <div key={stat.webinar_id} className="flex items-center justify-between">
                    <span className="text-sm truncate flex-1 mr-2">{stat.title}</span>
                    <Badge variant="secondary">{stat.count} registered</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
