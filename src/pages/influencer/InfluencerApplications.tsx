import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApplicationCard } from "@/components/applications/ApplicationCard";
import { useInfluencerApplications, useWithdrawApplication } from "@/hooks/useApplications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function InfluencerApplications() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: applications = [], isLoading } = useInfluencerApplications();
  const withdrawMutation = useWithdrawApplication();

  const handleWithdraw = (applicationId: string) => {
    withdrawMutation.mutate(applicationId, {
      onSuccess: () => {
        toast.success("Application withdrawn successfully");
      },
      onError: () => {
        toast.error("Failed to withdraw application");
      },
    });
  };

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    const matchesSearch = 
      app.campaign.title.toLowerCase().includes(search.toLowerCase()) ||
      app.campaign.advertiser?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      app.campaign.advertiser?.profile?.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesTab = 
      activeTab === "all" || app.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  // Count by status
  const counts = {
    all: applications.length,
    applied: applications.filter((a) => a.status === "applied").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <DashboardLayout role="influencer">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Applications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage your campaign applications
            </p>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applications..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all" className="gap-2">
              <FileText className="h-4 w-4 hidden sm:inline" />
              All
              <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {counts.all}
              </span>
            </TabsTrigger>
            <TabsTrigger value="applied" className="gap-2">
              <Clock className="h-4 w-4 hidden sm:inline" />
              Pending
              <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {counts.applied}
              </span>
            </TabsTrigger>
            <TabsTrigger value="accepted" className="gap-2">
              <CheckCircle className="h-4 w-4 hidden sm:inline" />
              Accepted
              <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {counts.accepted}
              </span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4 hidden sm:inline" />
              Rejected
              <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {counts.rejected}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Content */}
          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-foreground">
                  {search
                    ? "No applications found"
                    : activeTab === "all"
                    ? "No applications yet"
                    : `No ${activeTab} applications`}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  {search
                    ? "Try adjusting your search query"
                    : activeTab === "all"
                    ? "Start applying to campaigns to see them here"
                    : `You don't have any ${activeTab} applications`}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onWithdraw={handleWithdraw}
                    isWithdrawing={withdrawMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
