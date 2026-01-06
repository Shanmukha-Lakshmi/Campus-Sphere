import { UserPlus, LayoutDashboard, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Sign Up & Choose Role",
    description: "Register with your college email or roll number. Select your role - Student, Faculty, or Club Member.",
  },
  {
    icon: LayoutDashboard,
    step: "02",
    title: "Access Your Dashboard",
    description: "Get a personalized dashboard based on your role with relevant features and content tailored for you.",
  },
  {
    icon: CheckCircle,
    step: "03",
    title: "Stay Connected",
    description: "View circulars, register for events, join webinars, and receive real-time notifications.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="section-padding">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-2 mb-4">
            Get Started in Three Simple Steps
          </h2>
          <p className="text-lg text-muted-foreground">
            Join Campusphere and experience seamless campus communication from day one.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />

          {steps.map((step, index) => (
            <div
              key={step.step}
              className="relative text-center group"
            >
              {/* Step Number */}
              <div className="relative mx-auto mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <step.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center text-sm font-bold text-primary">
                  {step.step}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
