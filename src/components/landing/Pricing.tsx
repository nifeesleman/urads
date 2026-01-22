import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "For Creators",
    description: "Start earning from your influence",
    price: "Free to join",
    fee: "10% fee on earnings",
    features: [
      "Unlimited campaign applications",
      "Complete profile & portfolio",
      "Real-time messaging",
      "Secure payment protection",
      "Analytics dashboard",
      "Priority support",
    ],
    cta: "Join as Creator",
    variant: "outline" as const,
    href: "/register?role=creator",
  },
  {
    name: "For Advertisers",
    description: "Launch powerful campaigns",
    price: "Free to start",
    fee: "10% fee on campaigns",
    features: [
      "Unlimited campaign creation",
      "Access to all creators",
      "Advanced search & filters",
      "Secure escrow payments",
      "Campaign analytics",
      "Dedicated account manager",
    ],
    cta: "Start as Advertiser",
    variant: "default" as const,
    href: "/register?role=advertiser",
    popular: true,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 bg-card">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            No subscriptions. No hidden fees. Only pay when deals are completed.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 bg-background border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular
                  ? "border-primary shadow-lg"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                <div className="text-4xl font-bold text-foreground mb-1">
                  {plan.price}
                </div>
                <p className="text-sm text-primary font-medium">{plan.fee}</p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.variant}
                size="lg"
                className="w-full"
                asChild
              >
                <Link to={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Fee Explanation */}
        <div className="mt-16 max-w-2xl mx-auto text-center">
          <h4 className="text-lg font-semibold text-foreground mb-4">
            How Fees Work
          </h4>
          <p className="text-muted-foreground">
            When an advertiser pays $100 for a campaign, the creator receives $90 (after 10% creator fee), 
            and UrAds earns $20 total from both sides. This ensures quality service and platform sustainability.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
