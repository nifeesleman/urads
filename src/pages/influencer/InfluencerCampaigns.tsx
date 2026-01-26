/**
 * Influencer Campaigns Page
 * 
 * Campaign discovery with filters and apply functionality
 */

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignDiscoveryCard } from "@/components/campaigns/CampaignDiscoveryCard";
import { CampaignFilters } from "@/components/campaigns/CampaignFilters";
import { 
  useCampaignDiscovery, 
  useFilteredCampaigns, 
  CampaignFilters as FiltersType 
} from "@/hooks/useCampaignDiscovery";
import { Megaphone, RefreshCw, AlertCircle } from "lucide-react";

export default function InfluencerCampaigns() {
  const [filters, setFilters] = useState<FiltersType>({
    niches: [],
    budgetRange: null,
    deadlineRange: null,
    searchQuery: "",
  });

  const { 
    campaigns, 
    isLoading, 
    error, 
    refetch, 
    applyToCampaign,
    hasApplied,
    getApplicationStatus,
    influencer,
  } = useCampaignDiscovery();

  const filteredCampaigns = useFilteredCampaigns(campaigns, filters);

  const handleApply = async (campaignId: string, message?: string) => {
    await applyToCampaign.mutateAsync({ campaignId, message });
  };

  return (
    <DashboardLayout role="influencer">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Discover Campaigns</h1>
            <p className="text-muted-foreground mt-1">
              Find and apply to campaigns that match your niche
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* No influencer profile warning */}
        {!influencer && !isLoading && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Complete your influencer profile to apply to campaigns
                </p>
                <p className="text-xs text-muted-foreground">
                  You need an influencer profile before you can submit applications.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <CampaignFilters
              filters={filters}
              onFiltersChange={setFilters}
              totalCount={campaigns.length}
              filteredCount={filteredCampaigns.length}
            />
          </CardContent>
        </Card>

        {/* Campaign List */}
        {error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <h3 className="font-medium text-foreground mb-2">Failed to load campaigns</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error ? error.message : "Something went wrong"}
              </p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">
                {campaigns.length === 0 
                  ? "No campaigns available" 
                  : "No campaigns match your filters"}
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {campaigns.length === 0 
                  ? "Check back later for new opportunities from brands."
                  : "Try adjusting your filters to see more results."}
              </p>
              {campaigns.length > 0 && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setFilters({
                    niches: [],
                    budgetRange: null,
                    deadlineRange: null,
                    searchQuery: "",
                  })}
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map((campaign) => (
              <CampaignDiscoveryCard
                key={campaign.id}
                campaign={campaign}
                hasApplied={hasApplied(campaign.id)}
                applicationStatus={getApplicationStatus(campaign.id)}
                onApply={handleApply}
                isApplying={applyToCampaign.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
