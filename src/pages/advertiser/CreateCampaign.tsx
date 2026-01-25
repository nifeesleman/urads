import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CreateCampaignForm } from "@/components/campaigns/CreateCampaignForm";

export default function CreateCampaign() {
  return (
    <DashboardLayout role="advertiser">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Create New Campaign</h1>
        <CreateCampaignForm />
      </div>
    </DashboardLayout>
  );
}
