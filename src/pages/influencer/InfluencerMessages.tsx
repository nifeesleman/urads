import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InfluencerMessages() {
  return (
    <DashboardLayout role="influencer">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Card>
          <CardHeader><CardTitle>Conversations</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">No messages yet.</p></CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
