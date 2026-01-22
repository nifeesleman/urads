import { FileText, UserCheck, CreditCard, CheckCircle, ArrowDown } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Post a Campaign",
    description: "Advertisers create campaigns with budget, requirements, and deadlines.",
    forRole: "Advertisers",
  },
  {
    icon: UserCheck,
    title: "Match & Connect",
    description: "Creators apply or get invited. Both sides chat and agree on terms.",
    forRole: "Both",
  },
  {
    icon: CreditCard,
    title: "Secure Deposit",
    description: "Advertiser deposits funds. UrAds holds them safely in escrow.",
    forRole: "Advertisers",
  },
  {
    icon: CheckCircle,
    title: "Deliver & Get Paid",
    description: "Creator delivers content, advertiser approves, payment is released.",
    forRole: "Creators",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How UrAds Works
          </h2>
          <p className="text-lg text-muted-foreground">
            A simple, secure process that protects both brands and creators.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-border hidden md:block" />

            {steps.map((step, index) => (
              <div key={step.title} className="relative flex gap-6 mb-8 last:mb-0">
                {/* Step Number */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <step.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-card rounded-xl p-6 border border-border">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      Step {index + 1}: {step.title}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                      {step.forRole}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>

                {/* Arrow */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 -bottom-4 transform -translate-x-1/2 hidden md:block">
                    <ArrowDown className="w-5 h-5 text-muted" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badge */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent border border-accent-foreground/20">
            <CheckCircle className="w-5 h-5 text-accent-foreground" />
            <span className="text-sm font-medium text-accent-foreground">
              100% Money-Back Guarantee if work isn't delivered
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
