import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDisputes() {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dispute Resolution</h1>
        <Card>
          <CardHeader><CardTitle>Pending Disputes</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">No disputes to review.</p></CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
