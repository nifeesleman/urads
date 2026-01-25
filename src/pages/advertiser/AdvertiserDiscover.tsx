import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdvertiserDiscover() {
  return (
    <DashboardLayout role="advertiser">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Discover Creators</h1>
        <Card>
          <CardHeader><CardTitle>Find Influencers</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Browse and filter creators by niche, platform, and engagement.</p></CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
