import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdvertiserMessages() {
  return (
    <DashboardLayout role="advertiser">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Card>
          <CardHeader><CardTitle>Conversations</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">No messages yet. Start a conversation with creators.</p></CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
