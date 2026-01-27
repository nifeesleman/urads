import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, formatDistanceToNow } from "date-fns";
import { Calendar, DollarSign, Building2, Clock, X, MessageSquare } from "lucide-react";
import type { ApplicationWithCampaign } from "@/hooks/useApplications";

interface ApplicationCardProps {
  application: ApplicationWithCampaign;
  onWithdraw?: (id: string) => void;
  isWithdrawing?: boolean;
}

const statusConfig = {
  applied: {
    label: "Pending",
    variant: "secondary" as const,
    description: "Awaiting response from advertiser",
  },
  accepted: {
    label: "Accepted",
    variant: "default" as const,
    description: "Your application was accepted!",
  },
  rejected: {
    label: "Rejected",
    variant: "destructive" as const,
    description: "Application was not selected",
  },
};

export function ApplicationCard({
  application,
  onWithdraw,
  isWithdrawing,
}: ApplicationCardProps) {
  const { campaign } = application;
  const advertiser = campaign.advertiser;
  const profile = advertiser?.profile;
  const status = statusConfig[application.status];

  const initials = (profile?.name || advertiser?.company_name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const deadlineDate = new Date(campaign.deadline);
  const isExpired = deadlineDate < new Date();
  const appliedAgo = formatDistanceToNow(new Date(application.created_at), {
    addSuffix: true,
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.name || "Advertiser"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{campaign.title}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span className="truncate">
                  {advertiser?.company_name || profile?.name || "Unknown Advertiser"}
                </span>
              </div>
            </div>
          </div>

          <Badge variant={status.variant} className="shrink-0">
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {campaign.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {campaign.description}
          </p>
        )}

        {/* Campaign Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium text-foreground">
              ${campaign.budget.toLocaleString()} USDC
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className={isExpired ? "text-destructive" : ""}>
              {format(deadlineDate, "MMM d, yyyy")}
            </span>
          </div>
        </div>

        {/* Niche Tags */}
        {campaign.niche && campaign.niche.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {campaign.niche.slice(0, 3).map((n) => (
              <Badge key={n} variant="outline" className="text-xs">
                {n}
              </Badge>
            ))}
            {campaign.niche.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{campaign.niche.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Application Message */}
        {application.message && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <MessageSquare className="h-3 w-3" />
              Your application message
            </div>
            <p className="text-sm line-clamp-2">{application.message}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Applied {appliedAgo}
          </div>

          {application.status === "applied" && onWithdraw && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive"
                  disabled={isWithdrawing}
                >
                  <X className="h-4 w-4 mr-1" />
                  Withdraw
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Withdraw Application?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to withdraw your application for "{campaign.title}"? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onWithdraw(application.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Withdraw
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {application.status === "accepted" && (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Campaign in progress
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
