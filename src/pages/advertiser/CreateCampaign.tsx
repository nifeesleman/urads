import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CreateCampaignForm } from "@/components/campaigns/CreateCampaignForm";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function CreateCampaign() {
  const navigate = useNavigate();

  const handleSuccess = (escrowAddress: string, campaignId: string) => {
    toast.success("Campaign created successfully!", {
      description: `Escrow deployed at ${escrowAddress.slice(0, 10)}...`,
    });
  };

  return (
    <DashboardLayout role="advertiser">
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Create New Campaign</h1>
          <p className="text-muted-foreground">
            Set up an escrow-protected campaign with an influencer
          </p>
        </div>
        <CreateCampaignForm onSuccess={handleSuccess} />
      </div>
    </DashboardLayout>
  );
}
