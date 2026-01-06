import { 
  FileText, 
  Calendar, 
  Video, 
  Bell, 
  Users, 
  Shield,
  Search,
  BarChart3
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Digital Circulars",
    description: "Access department-wise circulars instantly. Filter by date, department, and category.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Calendar,
    title: "Event Management",
    description: "Discover and register for club events, workshops, and seminars with ease.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Video,
    title: "Webinar Hub",
    description: "Join faculty-hosted webinars with automated reminders and easy registration.",
    color: "bg-gold/20 text-gold",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Never miss important updates with personalized push and email notifications.",
    color: "bg-destructive/10 text-destructive",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description: "Separate dashboards for students, faculty, and club members with tailored features.",
    color: "bg-secondary text-secondary-foreground",
  },
  {
    icon: Shield,
    title: "Secure Platform",
    description: "Enterprise-grade security with verified faculty and admin approval systems.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Search,
    title: "Advanced Search",
    description: "Find any circular, event, or webinar instantly with powerful search and filters.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track engagement, participation stats, and content performance in real-time.",
    color: "bg-gold/20 text-gold",
  },
];

const Features = () => {
  return (
    <section id="features" className="section-padding bg-gradient-to-b from-background to-muted/30">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-slide-up">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-2 mb-4">
            Everything You Need to Stay Connected
          </h2>
          <p className="text-lg text-muted-foreground">
            A comprehensive suite of tools designed to streamline campus communication 
            and enhance engagement between students, faculty, and clubs.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="feature-card group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`p-3 rounded-lg w-fit mb-4 ${feature.color} group-hover:scale-110 transition-transform`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
