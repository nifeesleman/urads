import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";

export default function AdvertiserCampaigns() {
  return (
    <DashboardLayout role="advertiser">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Campaigns</h1>
          <Link to="/advertiser/campaigns/new">
            <Button className="gap-2"><PlusCircle className="w-4 h-4" />Create Campaign</Button>
          </Link>
        </div>
        <Card>
          <CardHeader><CardTitle>All Campaigns</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">No campaigns yet. Create your first campaign to get started.</p></CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
