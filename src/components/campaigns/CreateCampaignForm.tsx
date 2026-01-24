/**
 * Create Campaign Form Component
 * 
 * Allows brands to create new escrow campaigns with influencers
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWeb3 } from "@/contexts/Web3Context";
import { useEscrow } from "@/hooks/useEscrow";
import { CalendarIcon, DollarSign, User, Loader2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateCampaignFormProps {
  onSuccess?: (escrowAddress: string) => void;
}

export function CreateCampaignForm({ onSuccess }: CreateCampaignFormProps) {
  const { isConnected, address } = useWeb3();
  const { approveUSDC, createCampaign, getUSDCAllowance, txState } = useEscrow();
  
  const [influencerAddress, setInfluencerAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState<Date>();
  const [step, setStep] = useState<"form" | "approve" | "create" | "success">("form");
  const [escrowAddress, setEscrowAddress] = useState("");

  /**
   * Validate Ethereum address format
   */
  const isValidAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  /**
   * Check if form is valid
   */
  const isFormValid = (): boolean => {
    return (
      isValidAddress(influencerAddress) &&
      parseFloat(amount) > 0 &&
      deadline !== undefined &&
      deadline > new Date()
    );
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid() || !isConnected) return;

    try {
      // Check current allowance
      const currentAllowance = await getUSDCAllowance();
      
      if (parseFloat(currentAllowance) < parseFloat(amount)) {
        // Need to approve first
        setStep("approve");
        await approveUSDC(amount);
      }

      // Create campaign
      setStep("create");
      const deadlineTimestamp = Math.floor(deadline!.getTime() / 1000);
      const newEscrow = await createCampaign(influencerAddress, amount, deadlineTimestamp);
      
      setEscrowAddress(newEscrow);
      setStep("success");
      onSuccess?.(newEscrow);
    } catch (error) {
      console.error("Campaign creation failed:", error);
      setStep("form");
    }
  };

  if (!isConnected) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Please connect your wallet to create a campaign</p>
        </CardContent>
      </Card>
    );
  }

  if (step === "success") {
    return (
      <Card className="border-primary">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <CheckCircle className="w-16 h-16 text-primary" />
          <h3 className="text-xl font-bold">Campaign Created!</h3>
          <p className="text-muted-foreground text-center">
            Escrow contract deployed at:
          </p>
          <code className="bg-muted px-3 py-1 rounded text-sm">
            {escrowAddress}
          </code>
          <Button onClick={() => setStep("form")} variant="outline">
            Create Another Campaign
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Campaign</CardTitle>
        <CardDescription>
          Set up a new escrow campaign with an influencer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Influencer Address */}
          <div className="space-y-2">
            <Label htmlFor="influencer">Influencer Wallet Address</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="influencer"
                placeholder="0x..."
                value={influencerAddress}
                onChange={(e) => setInfluencerAddress(e.target.value)}
                className="pl-10"
                disabled={step !== "form"}
              />
            </div>
            {influencerAddress && !isValidAddress(influencerAddress) && (
              <p className="text-sm text-destructive">Invalid Ethereum address</p>
            )}
            {influencerAddress.toLowerCase() === address?.toLowerCase() && (
              <p className="text-sm text-destructive">Cannot create campaign with yourself</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Campaign Amount (USDC)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="100.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                min="0"
                step="0.01"
                disabled={step !== "form"}
              />
            </div>
            {parseFloat(amount) > 0 && (
              <p className="text-sm text-muted-foreground">
                Influencer receives: ${(parseFloat(amount) * 0.9).toFixed(2)} USDC (after 10% fee)
              </p>
            )}
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label>Campaign Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                  disabled={step !== "form"}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP") : "Select deadline"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Progress indicator for multi-step process */}
          {step !== "form" && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <div>
                <p className="font-medium">
                  {step === "approve" && "Step 1/2: Approving USDC..."}
                  {step === "create" && "Step 2/2: Creating Campaign..."}
                </p>
                <p className="text-sm text-muted-foreground">
                  Please confirm the transaction in your wallet
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!isFormValid() || step !== "form" || txState.isLoading}
          >
            {txState.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Create Campaign"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
