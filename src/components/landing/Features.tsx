import { 
  Shield, 
  Users, 
  MessageSquare, 
  DollarSign, 
  Search, 
  BarChart3,
  Zap,
  Lock
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Secure Escrow Payments",
    description: "Funds are held safely until work is approved. Fair for creators, safe for brands.",
  },
  {
    icon: Users,
    title: "Verified Creators",
    description: "Access thousands of vetted influencers across TikTok, YouTube, Instagram & more.",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Chat",
    description: "Communicate directly with creators and brands through our built-in messaging system.",
  },
  {
    icon: DollarSign,
    title: "Transparent Pricing",
    description: "Clear fee structure with no hidden costs. Know exactly what you'll pay or earn.",
  },
  {
    icon: Search,
    title: "Smart Discovery",
    description: "Find the perfect match using filters for platform, followers, niche, and engagement.",
  },
  {
    icon: BarChart3,
    title: "Campaign Analytics",
    description: "Track performance, measure ROI, and optimize your influencer marketing strategy.",
  },
  {
    icon: Zap,
    title: "Fast Onboarding",
    description: "Get started in minutes. Create your profile and start collaborating today.",
  },
  {
    icon: Lock,
    title: "Dispute Resolution",
    description: "Our dedicated team helps resolve any issues fairly and quickly.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-card">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful tools for brands and creators to collaborate, create, and earn.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl bg-background border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
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
