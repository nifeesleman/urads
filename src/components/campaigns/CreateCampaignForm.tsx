/**
 * Create Campaign Form Component
 * 
 * Multi-step form for brands to create escrow campaigns with influencers
 * Integrates with USDC smart contracts for payment
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWeb3 } from "@/contexts/Web3Context";
import { useEscrow } from "@/hooks/useEscrow";
import { useCampaigns } from "@/hooks/useCampaigns";
import { CampaignSteps, CampaignStep } from "./CampaignSteps";
import { AIDescriptionGenerator } from "./AIDescriptionGenerator";
import { InfluencerSelector } from "./InfluencerSelector";
import { USDCBalance } from "./USDCBalance";
import { InfluencerWithProfile } from "@/hooks/useInfluencers";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { 
  CalendarIcon, 
  DollarSign, 
  Loader2, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  FileText,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { DEFAULT_CHAIN } from "@/lib/contracts";

interface CreateCampaignFormProps {
  onSuccess?: (escrowAddress: string, campaignId: string) => void;
}

interface CampaignFormData {
  title: string;
  description: string;
  niche: string[];
  budget: string;
  deadline: Date | undefined;
  requirements: string;
  influencerWallet: string;
  selectedInfluencer?: InfluencerWithProfile;
}

const NICHES = [
  "Fashion", "Beauty", "Tech", "Gaming", "Fitness", "Food", 
  "Travel", "Lifestyle", "Music", "Art", "Education", "Finance"
];

export function CreateCampaignForm({ onSuccess }: CreateCampaignFormProps) {
  const { isConnected, address } = useWeb3();
  const { approveUSDC, createCampaign, getUSDCAllowance, txState } = useEscrow();
  const { createCampaign: createDbCampaign, createEscrowRecord, updateCampaignEscrow } = useCampaigns();
  
  const [step, setStep] = useState<CampaignStep>("details");
  const [isProcessing, setIsProcessing] = useState(false);
  const [escrowAddress, setEscrowAddress] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [txHash, setTxHash] = useState("");
  
  const [formData, setFormData] = useState<CampaignFormData>({
    title: "",
    description: "",
    niche: [],
    budget: "",
    deadline: addDays(new Date(), 14),
    requirements: "",
    influencerWallet: "",
  });

  const budgetNum = parseFloat(formData.budget) || 0;
  const platformFee = budgetNum * 0.1;
  const influencerReceives = budgetNum - platformFee;

  /**
   * Validate current step
   */
  const isStepValid = (): boolean => {
    switch (step) {
      case "details":
        return (
          formData.title.trim().length >= 3 &&
          budgetNum > 0 &&
          formData.deadline !== undefined &&
          formData.deadline > new Date()
        );
      case "influencer":
        return (
          /^0x[a-fA-F0-9]{40}$/.test(formData.influencerWallet) &&
          formData.influencerWallet.toLowerCase() !== address?.toLowerCase()
        );
      case "review":
        return true;
      default:
        return false;
    }
  };

  /**
   * Handle next step
   */
  const handleNext = () => {
    if (!isStepValid()) return;
    
    if (step === "details") setStep("influencer");
    else if (step === "influencer") setStep("review");
    else if (step === "review") handleSubmit();
  };

  /**
   * Handle previous step
   */
  const handleBack = () => {
    if (step === "influencer") setStep("details");
    else if (step === "review") setStep("influencer");
    else if (step === "confirm") setStep("review");
  };

  /**
   * Handle form submission - create escrow on-chain then save to database
   */
  const handleSubmit = async () => {
    if (!isConnected || !formData.deadline) return;

    setIsProcessing(true);
    setStep("confirm");

    try {
      // Step 1: Check and approve USDC if needed
      const currentAllowance = await getUSDCAllowance();
      
      if (parseFloat(currentAllowance) < budgetNum) {
        await approveUSDC(formData.budget);
      }

      // Step 2: Create campaign on-chain
      const deadlineTimestamp = Math.floor(formData.deadline.getTime() / 1000);
      const newEscrowAddress = await createCampaign(
        formData.influencerWallet,
        formData.budget,
        deadlineTimestamp
      );

      setEscrowAddress(newEscrowAddress);
      setTxHash(txState.hash || "");

      // Step 3: Save to database
      const dbCampaign = await createDbCampaign.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        niche: formData.niche.length > 0 ? formData.niche : undefined,
        budget: budgetNum,
        deadline: formData.deadline.toISOString(),
        requirements: formData.requirements || undefined,
        escrow_address: newEscrowAddress,
        escrow_tx_hash: txState.hash || undefined,
      });

      setCampaignId(dbCampaign.id);

      // Step 4: Create escrow record
      await createEscrowRecord.mutateAsync({
        campaign_id: dbCampaign.id,
        amount: budgetNum,
        contract_address: newEscrowAddress,
        deposit_tx_hash: txState.hash || undefined,
        status: "locked",
      });

      setStep("success");
      onSuccess?.(newEscrowAddress, dbCampaign.id);
    } catch (error) {
      console.error("Campaign creation failed:", error);
      setStep("review");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Toggle niche selection
   */
  const toggleNiche = (niche: string) => {
    setFormData((prev) => ({
      ...prev,
      niche: prev.niche.includes(niche)
        ? prev.niche.filter((n) => n !== niche)
        : [...prev.niche, niche],
    }));
  };

  // Not connected state
  if (!isConnected) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            Connect your wallet to create a campaign
          </p>
          <ConnectWalletButton variant="default" size="lg" />
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (step === "success") {
    return (
      <Card className="border-primary">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">Campaign Created!</h3>
            <p className="text-muted-foreground">
              Your escrow contract has been deployed and funds are locked.
            </p>
          </div>

          <div className="w-full max-w-md space-y-3">
            <div className="flex justify-between p-3 bg-muted rounded-lg">
              <span className="text-muted-foreground">Escrow Contract</span>
              <code className="text-sm">{escrowAddress.slice(0, 10)}...{escrowAddress.slice(-8)}</code>
            </div>
            <div className="flex justify-between p-3 bg-muted rounded-lg">
              <span className="text-muted-foreground">Amount Locked</span>
              <span className="font-bold">${budgetNum.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between p-3 bg-muted rounded-lg">
              <span className="text-muted-foreground">Influencer Receives</span>
              <span className="font-medium text-primary">${influencerReceives.toFixed(2)} USDC</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => window.open(`${DEFAULT_CHAIN.blockExplorer}/address/${escrowAddress}`, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
            <Button onClick={() => {
              setStep("details");
              setFormData({
                title: "",
                description: "",
                niche: [],
                budget: "",
                deadline: addDays(new Date(), 14),
                requirements: "",
                influencerWallet: "",
              });
              setEscrowAddress("");
              setCampaignId("");
            }}>
              Create Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <CampaignSteps currentStep={step} />
        </CardContent>
      </Card>

      {/* USDC Balance */}
      <USDCBalance requiredAmount={budgetNum > 0 ? budgetNum : undefined} />

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {step === "details" && "Campaign Details"}
            {step === "influencer" && "Select Influencer"}
            {step === "review" && "Review & Confirm"}
            {step === "confirm" && "Creating Campaign..."}
          </CardTitle>
          <CardDescription>
            {step === "details" && "Define your campaign objectives and budget"}
            {step === "influencer" && "Choose an influencer to work with"}
            {step === "review" && "Review all details before locking funds"}
            {step === "confirm" && "Please confirm the transactions in your wallet"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Campaign Details */}
          {step === "details" && (
            <>
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Campaign Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Summer Product Launch"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <AIDescriptionGenerator
                    title={formData.title}
                    niches={formData.niche}
                    budget={formData.budget}
                    requirements={formData.requirements}
                    onGenerated={(desc) => setFormData((p) => ({ ...p, description: desc }))}
                  />
                </div>
                <Textarea
                  id="description"
                  placeholder="Describe your brand, campaign goals, content type needed, deliverables, and target audience..."
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Niches */}
              <div className="space-y-2">
                <Label>Target Niches</Label>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map((niche) => (
                    <Badge
                      key={niche}
                      variant={formData.niche.includes(niche) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleNiche(niche)}
                    >
                      {niche}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (USDC) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="budget"
                    type="number"
                    placeholder="100.00"
                    value={formData.budget}
                    onChange={(e) => setFormData((p) => ({ ...p, budget: e.target.value }))}
                    className="pl-10"
                    min="1"
                    step="0.01"
                  />
                </div>
                {budgetNum > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Platform Fee (10%): ${platformFee.toFixed(2)}</span>
                    <span>Influencer Receives: ${influencerReceives.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <Label>Deadline *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.deadline ? format(formData.deadline, "PPP") : "Select deadline"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.deadline}
                      onSelect={(date) => setFormData((p) => ({ ...p, deadline: date }))}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="Specific deliverables, content guidelines, etc."
                  value={formData.requirements}
                  onChange={(e) => setFormData((p) => ({ ...p, requirements: e.target.value }))}
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Step 2: Influencer Selection */}
          {step === "influencer" && (
            <>
              <InfluencerSelector
                selectedWallet={formData.influencerWallet}
                onSelect={(wallet, influencer) =>
                  setFormData((p) => ({
                    ...p,
                    influencerWallet: wallet,
                    selectedInfluencer: influencer,
                  }))
                }
              />

              {formData.influencerWallet.toLowerCase() === address?.toLowerCase() && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You cannot create a campaign with yourself as the influencer.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Step 3: Review */}
          {step === "review" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Campaign Title</p>
                  <p className="font-medium">{formData.title}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">${budgetNum.toFixed(2)} USDC</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="font-medium">
                    {formData.deadline ? format(formData.deadline, "PPP") : "Not set"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Influencer</p>
                  <p className="font-mono text-sm">
                    {formData.selectedInfluencer?.profile?.name || formData.influencerWallet.slice(0, 10) + "..."}
                  </p>
                </div>
              </div>

              {formData.description && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{formData.description}</p>
                </div>
              )}

              {formData.niche.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Niches</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.niche.map((n) => (
                      <Badge key={n} variant="secondary">{n}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Total Amount</span>
                  <span className="font-bold">${budgetNum.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Platform Fee (10%)</span>
                  <span>-${platformFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-primary">
                  <span>Influencer Receives</span>
                  <span className="font-bold">${influencerReceives.toFixed(2)} USDC</span>
                </div>
              </div>

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  By proceeding, you will deploy a smart contract and lock {budgetNum.toFixed(2)} USDC. 
                  Funds will be released to the influencer upon your approval of their work.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 4: Confirming */}
          {step === "confirm" && (
            <div className="flex flex-col items-center py-8 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Processing Transaction</p>
                <p className="text-sm text-muted-foreground">
                  Please confirm the transaction(s) in your wallet
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step !== "confirm" && (
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === "details" || isProcessing}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                onClick={handleNext}
                disabled={!isStepValid() || isProcessing}
              >
                {step === "review" ? (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Create & Lock Funds
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
