import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminCampaigns() {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Campaign Management</h1>
        <Card>
          <CardHeader><CardTitle>All Campaigns</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">View and manage all platform campaigns.</p></CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
