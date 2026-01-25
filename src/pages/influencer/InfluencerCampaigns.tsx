import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InfluencerCampaigns() {
  return (
    <DashboardLayout role="influencer">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Available Campaigns</h1>
        <Card>
          <CardHeader><CardTitle>Browse Campaigns</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Find campaigns that match your niche and apply.</p></CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
