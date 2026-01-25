import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InfluencerApplications() {
  return (
    <DashboardLayout role="influencer">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Applications</h1>
        <Card>
          <CardHeader><CardTitle>Application Status</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Track your campaign applications here.</p></CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
