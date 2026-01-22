import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary-foreground" />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-primary-foreground" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary-foreground" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/20 mb-8">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Grow Your Brand?
          </h2>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Join thousands of successful brands and creators on UrAds. Start collaborating today—it's free.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="xl"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              asChild
            >
              <Link to="/register" className="gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="border-2 border-primary-foreground text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/login">
                Already have an account?
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
