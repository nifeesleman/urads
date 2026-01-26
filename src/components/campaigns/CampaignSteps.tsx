/**
 * Campaign Creation Steps Component
 * 
 * Visual stepper for multi-step campaign creation flow
 */

import { Check, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

export type CampaignStep = "details" | "influencer" | "review" | "confirm" | "success";

interface CampaignStepsProps {
  currentStep: CampaignStep;
}

const steps: { key: CampaignStep; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "influencer", label: "Influencer" },
  { key: "review", label: "Review" },
  { key: "confirm", label: "Confirm" },
  { key: "success", label: "Complete" },
];

export function CampaignSteps({ currentStep }: CampaignStepsProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <CircleDot className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2",
                  index < currentIndex ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
