import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InfluencerEarnings() {
  return (
    <DashboardLayout role="influencer">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Earnings</h1>
        <Card>
          <CardHeader><CardTitle>Earnings Overview</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Track your earnings and withdraw funds.</p></CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
