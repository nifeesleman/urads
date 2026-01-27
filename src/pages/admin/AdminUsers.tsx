import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsers() {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Card>
          <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Manage advertisers and influencers.</p></CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
