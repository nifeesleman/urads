/**
 * Profile Completion Card
 * 
 * Shows a progress indicator for influencer profile completeness
 */

import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, UserCog } from "lucide-react";

interface ProfileField {
  label: string;
  completed: boolean;
}

interface ProfileCompletionCardProps {
  fields: ProfileField[];
  isLoading?: boolean;
}

export function ProfileCompletionCard({ fields, isLoading }: ProfileCompletionCardProps) {
  const completedCount = fields.filter((f) => f.completed).length;
  const percentage = Math.round((completedCount / fields.length) * 100);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Profile Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
            Loading profile…
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <UserCog className="w-5 h-5" />
          Profile Completion
        </CardTitle>
        <CardDescription>
          {percentage === 100
            ? "Your profile is complete! 🎉"
            : "Complete your profile to attract more brand deals"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedCount} of {fields.length} completed
            </span>
            <span className="font-semibold text-foreground">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        {/* Field checklist */}
        <ul className="space-y-2">
          {fields.map((field) => (
            <li key={field.label} className="flex items-center gap-2 text-sm">
              {field.completed ? (
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              )}
              <span className={field.completed ? "text-muted-foreground line-through" : "text-foreground"}>
                {field.label}
              </span>
            </li>
          ))}
        </ul>

        {percentage < 100 && (
          <Link to="/influencer/profile">
            <Button variant="outline" className="w-full mt-2">
              Complete Your Profile
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
