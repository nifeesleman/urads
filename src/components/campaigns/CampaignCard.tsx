/**
 * Campaign Card Component
 * 
 * Displays campaign details and action buttons based on user role and status
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWeb3 } from "@/contexts/Web3Context";
import { useEscrow, CampaignData } from "@/hooks/useEscrow";
import {
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  ExternalLink,
  Loader2,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { DEFAULT_CHAIN } from "@/lib/contracts";

interface CampaignCardProps {
  escrowAddress: string;
  onUpdate?: () => void;
}

export function CampaignCard({ escrowAddress, onUpdate }: CampaignCardProps) {
  const { address } = useWeb3();
  const {
    getCampaignDetails,
    submitWork,
    approveCampaign,
    claimTimeout,
    requestRefund,
    txState,
  } = useEscrow();

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  // Determine user's role in this campaign
  const isBrand = address?.toLowerCase() === campaign?.brand.toLowerCase();
  const isInfluencer = address?.toLowerCase() === campaign?.influencer.toLowerCase();

  /**
   * Load campaign details
   */
  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const data = await getCampaignDetails(escrowAddress);
        setCampaign(data);
      } catch (error) {
        console.error("Failed to load campaign:", error);
      } finally {
        setLoading(false);
      }
    };

    if (escrowAddress) {
      loadCampaign();
    }
  }, [escrowAddress, getCampaignDetails]);

  /**
   * Refresh campaign data
   */
  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getCampaignDetails(escrowAddress);
      setCampaign(data);
      onUpdate?.();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle work submission
   */
  const handleSubmitWork = async () => {
    if (!deliverableUrl) return;
    
    try {
      await submitWork(escrowAddress, deliverableUrl);
      setSubmitDialogOpen(false);
      refresh();
    } catch (error) {
      console.error("Submit work failed:", error);
    }
  };

  /**
   * Handle campaign approval
   */
  const handleApprove = async () => {
    try {
      await approveCampaign(escrowAddress);
      refresh();
    } catch (error) {
      console.error("Approve failed:", error);
    }
  };

  /**
   * Handle timeout claim
   */
  const handleClaimTimeout = async () => {
    try {
      await claimTimeout(escrowAddress);
      refresh();
    } catch (error) {
      console.error("Claim timeout failed:", error);
    }
  };

  /**
   * Handle refund request
   */
  const handleRefund = async () => {
    try {
      await requestRefund(escrowAddress);
      refresh();
    } catch (error) {
      console.error("Refund failed:", error);
    }
  };

  /**
   * Get campaign status badge
   */
  const getStatusBadge = () => {
    if (!campaign) return null;

    if (campaign.approved) {
      return <Badge variant="default" className="bg-primary">Completed</Badge>;
    }
    if (campaign.claimed) {
      return <Badge variant="default" className="bg-primary">Claimed (Timeout)</Badge>;
    }
    if (campaign.refunded) {
      return <Badge variant="secondary">Refunded</Badge>;
    }
    if (campaign.delivered) {
      return <Badge variant="outline">Pending Approval</Badge>;
    }
    if (campaign.deadlinePassed) {
      return <Badge variant="destructive">Deadline Passed</Badge>;
    }
    return <Badge variant="outline">In Progress</Badge>;
  };

  /**
   * Format address for display
   */
  const formatAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!campaign) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Failed to load campaign</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {campaign.amount} USDC
            {getStatusBadge()}
          </CardTitle>
          <CardDescription className="mt-1">
            Escrow: {formatAddr(campaign.address)}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-1"
              onClick={() =>
                window.open(
                  `${DEFAULT_CHAIN.blockExplorer}/address/${campaign.address}`,
                  "_blank"
                )
              }
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Participants */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Brand</p>
            <p className="font-mono">{formatAddr(campaign.brand)}</p>
            {isBrand && <Badge variant="secondary" className="mt-1">You</Badge>}
          </div>
          <div>
            <p className="text-muted-foreground">Influencer</p>
            <p className="font-mono">{formatAddr(campaign.influencer)}</p>
            {isInfluencer && <Badge variant="secondary" className="mt-1">You</Badge>}
          </div>
        </div>

        {/* Deadline */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>
            Deadline: {format(campaign.deadline, "PPP 'at' p")}
            {campaign.deadlinePassed && (
              <span className="text-destructive ml-2">(Passed)</span>
            )}
          </span>
        </div>

        {/* Deliverable URL if submitted */}
        {campaign.delivered && campaign.deliverableUrl && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Deliverable</p>
            <a
              href={campaign.deliverableUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              {campaign.deliverableUrl.slice(0, 50)}...
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {/* Influencer: Submit Work */}
          {isInfluencer && !campaign.delivered && !campaign.deadlinePassed && (
            <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Work
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Your Deliverable</DialogTitle>
                  <DialogDescription>
                    Provide the URL to your completed work (video, post, etc.)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliverable">Deliverable URL</Label>
                    <Input
                      id="deliverable"
                      placeholder="https://..."
                      value={deliverableUrl}
                      onChange={(e) => setDeliverableUrl(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSubmitWork}
                    disabled={!deliverableUrl || txState.isLoading}
                    className="w-full"
                  >
                    {txState.isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Work"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Brand: Approve */}
          {isBrand && campaign.delivered && !campaign.approved && !campaign.claimed && (
            <Button onClick={handleApprove} disabled={txState.isLoading}>
              {txState.isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve & Pay
            </Button>
          )}

          {/* Influencer: Claim Timeout */}
          {isInfluencer &&
            campaign.delivered &&
            !campaign.approved &&
            !campaign.claimed &&
            campaign.deadlinePassed && (
              <Button onClick={handleClaimTimeout} disabled={txState.isLoading}>
                {txState.isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-2" />
                )}
                Claim Timeout
              </Button>
            )}

          {/* Brand: Refund */}
          {isBrand &&
            !campaign.delivered &&
            !campaign.refunded &&
            campaign.deadlinePassed && (
              <Button
                variant="destructive"
                onClick={handleRefund}
                disabled={txState.isLoading}
              >
                {txState.isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Request Refund
              </Button>
            )}

          {/* Refresh button */}
          <Button variant="outline" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
