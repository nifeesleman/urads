/**
 * Campaign Discovery Card
 * 
 * Displays campaign details for influencers with apply functionality
 */

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DollarSign,
  Calendar,
  Clock,
  Building2,
  CheckCircle,
  Loader2,
  Send,
  FileText,
} from "lucide-react";
import { CampaignWithAdvertiser } from "@/hooks/useCampaignDiscovery";

interface CampaignDiscoveryCardProps {
  campaign: CampaignWithAdvertiser;
  hasApplied: boolean;
  applicationStatus: string | null;
  onApply: (campaignId: string, message?: string) => Promise<void>;
  isApplying: boolean;
}

export function CampaignDiscoveryCard({
  campaign,
  hasApplied,
  applicationStatus,
  onApply,
  isApplying,
}: CampaignDiscoveryCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const deadlineDate = new Date(campaign.deadline);
  const isDeadlinePassed = deadlineDate < new Date();
  const timeUntilDeadline = formatDistanceToNow(deadlineDate, { addSuffix: true });

  const handleApply = async () => {
    await onApply(campaign.id, applicationMessage);
    setIsDialogOpen(false);
    setApplicationMessage("");
  };

  const getStatusBadge = () => {
    if (!hasApplied) return null;

    switch (applicationStatus) {
      case "applied":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Applied
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="default" className="bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {campaign.advertiser && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={campaign.advertiser.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {campaign.advertiser.company_name?.[0] || 
                       campaign.advertiser.profile?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-foreground">
                      {campaign.advertiser.company_name || campaign.advertiser.profile?.name || "Anonymous"}
                    </span>
                    {campaign.advertiser.profile?.verified && (
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                </div>
              )}
            </div>
            <CardTitle className="text-lg leading-tight">{campaign.title}</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {campaign.description && (
          <div>
            <p className={`text-sm text-muted-foreground ${!isExpanded && "line-clamp-2"}`}>
              {campaign.description}
            </p>
            {campaign.description.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-primary hover:underline mt-1"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* Niches */}
        {campaign.niche && campaign.niche.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {campaign.niche.map((n) => (
              <Badge key={n} variant="secondary" className="text-xs">
                {n}
              </Badge>
            ))}
          </div>
        )}

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="font-medium text-green-500">
              ${Number(campaign.budget).toLocaleString()} USDC
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className={isDeadlinePassed ? "text-destructive" : "text-muted-foreground"}>
              {format(deadlineDate, "MMM d, yyyy")}
            </span>
          </div>
        </div>

        {/* Deadline indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className={isDeadlinePassed ? "text-destructive" : ""}>
            {isDeadlinePassed ? "Deadline passed" : `Due ${timeUntilDeadline}`}
          </span>
        </div>

        {/* Requirements preview */}
        {campaign.requirements && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <FileText className="w-3.5 h-3.5" />
              Requirements
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {campaign.requirements}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {hasApplied ? (
            <Button variant="outline" className="w-full" disabled>
              {applicationStatus === "accepted" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Application Accepted
                </>
              ) : applicationStatus === "rejected" ? (
                "Application Rejected"
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Application Pending
                </>
              )}
            </Button>
          ) : isDeadlinePassed ? (
            <Button variant="outline" className="w-full" disabled>
              Deadline Passed
            </Button>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Apply Now
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Apply to Campaign</DialogTitle>
                  <DialogDescription>
                    Send your application for "{campaign.title}"
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Campaign summary */}
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{campaign.title}</span>
                      <Badge variant="secondary">
                        ${Number(campaign.budget).toLocaleString()}
                      </Badge>
                    </div>
                    {campaign.advertiser && (
                      <p className="text-xs text-muted-foreground mt-1">
                        by {campaign.advertiser.company_name || campaign.advertiser.profile?.name}
                      </p>
                    )}
                  </div>

                  {/* Application message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Message (optional)
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Introduce yourself and explain why you're a great fit for this campaign..."
                      value={applicationMessage}
                      onChange={(e) => setApplicationMessage(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      A personalized message can increase your chances of being selected.
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleApply} disabled={isApplying}>
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
