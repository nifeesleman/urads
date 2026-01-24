/**
 * Escrow Hook
 * 
 * Provides functions to interact with EscrowFactory and CampaignEscrow contracts
 * Handles USDC approval, campaign creation, work submission, and approval
 */

import { useState, useCallback } from "react";
import { Contract, parseUnits, formatUnits } from "ethers";
import { useWeb3 } from "@/contexts/Web3Context";
import {
  CONTRACT_ADDRESSES,
  USDC_ABI,
  ESCROW_FACTORY_ABI,
  CAMPAIGN_ESCROW_ABI,
  USDC_DECIMALS,
} from "@/lib/contracts";
import { toast } from "sonner";

// =============================================================
//                           TYPES
// =============================================================

export interface CampaignData {
  address: string;
  brand: string;
  influencer: string;
  amount: string;
  deadline: Date;
  deliverableUrl: string;
  delivered: boolean;
  approved: boolean;
  claimed: boolean;
  refunded: boolean;
  deadlinePassed: boolean;
}

interface TransactionState {
  isLoading: boolean;
  hash: string | null;
  error: string | null;
}

// =============================================================
//                           HOOK
// =============================================================

export function useEscrow() {
  const { signer, address } = useWeb3();
  const [txState, setTxState] = useState<TransactionState>({
    isLoading: false,
    hash: null,
    error: null,
  });

  /**
   * Reset transaction state
   */
  const resetTxState = useCallback(() => {
    setTxState({ isLoading: false, hash: null, error: null });
  }, []);

  /**
   * Get USDC balance for connected wallet
   */
  const getUSDCBalance = useCallback(async (): Promise<string> => {
    if (!signer || !address) throw new Error("Wallet not connected");

    const usdc = new Contract(CONTRACT_ADDRESSES.USDC, USDC_ABI, signer);
    const balance = await usdc.balanceOf(address);
    return formatUnits(balance, USDC_DECIMALS);
  }, [signer, address]);

  /**
   * Get USDC allowance for the factory contract
   */
  const getUSDCAllowance = useCallback(async (): Promise<string> => {
    if (!signer || !address) throw new Error("Wallet not connected");

    const usdc = new Contract(CONTRACT_ADDRESSES.USDC, USDC_ABI, signer);
    const allowance = await usdc.allowance(address, CONTRACT_ADDRESSES.ESCROW_FACTORY);
    return formatUnits(allowance, USDC_DECIMALS);
  }, [signer, address]);

  /**
   * Approve USDC spending for the factory contract
   */
  const approveUSDC = useCallback(async (amount: string): Promise<string> => {
    if (!signer) throw new Error("Wallet not connected");

    setTxState({ isLoading: true, hash: null, error: null });

    try {
      const usdc = new Contract(CONTRACT_ADDRESSES.USDC, USDC_ABI, signer);
      const amountWei = parseUnits(amount, USDC_DECIMALS);

      toast.info("Please confirm USDC approval in your wallet...");

      const tx = await usdc.approve(CONTRACT_ADDRESSES.ESCROW_FACTORY, amountWei);
      
      toast.info("Waiting for confirmation...", {
        description: `Transaction: ${tx.hash.slice(0, 10)}...`,
      });

      const receipt = await tx.wait();

      setTxState({ isLoading: false, hash: receipt.hash, error: null });
      toast.success("USDC approved successfully!");

      return receipt.hash;
    } catch (error: any) {
      const message = error.reason || error.message || "Approval failed";
      setTxState({ isLoading: false, hash: null, error: message });
      toast.error("Approval failed", { description: message });
      throw error;
    }
  }, [signer]);

  /**
   * Create a new campaign
   */
  const createCampaign = useCallback(async (
    influencerAddress: string,
    amount: string,
    deadlineTimestamp: number
  ): Promise<string> => {
    if (!signer) throw new Error("Wallet not connected");

    setTxState({ isLoading: true, hash: null, error: null });

    try {
      const factory = new Contract(
        CONTRACT_ADDRESSES.ESCROW_FACTORY,
        ESCROW_FACTORY_ABI,
        signer
      );
      const amountWei = parseUnits(amount, USDC_DECIMALS);

      toast.info("Please confirm campaign creation in your wallet...");

      const tx = await factory.createCampaign(
        influencerAddress,
        amountWei,
        deadlineTimestamp
      );

      toast.info("Creating campaign...", {
        description: `Transaction: ${tx.hash.slice(0, 10)}...`,
      });

      const receipt = await tx.wait();

      // Parse the CampaignCreated event to get escrow address
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "CampaignCreated";
        } catch {
          return false;
        }
      });

      let escrowAddress = "";
      if (event) {
        const parsed = factory.interface.parseLog(event);
        escrowAddress = parsed?.args[0] || "";
      }

      setTxState({ isLoading: false, hash: receipt.hash, error: null });
      toast.success("Campaign created successfully!", {
        description: `Escrow: ${escrowAddress.slice(0, 10)}...`,
      });

      return escrowAddress;
    } catch (error: any) {
      const message = error.reason || error.message || "Campaign creation failed";
      setTxState({ isLoading: false, hash: null, error: message });
      toast.error("Campaign creation failed", { description: message });
      throw error;
    }
  }, [signer]);

  /**
   * Submit work deliverable (influencer only)
   */
  const submitWork = useCallback(async (
    escrowAddress: string,
    deliverableUrl: string
  ): Promise<string> => {
    if (!signer) throw new Error("Wallet not connected");

    setTxState({ isLoading: true, hash: null, error: null });

    try {
      const escrow = new Contract(escrowAddress, CAMPAIGN_ESCROW_ABI, signer);

      toast.info("Please confirm work submission in your wallet...");

      const tx = await escrow.submitWork(deliverableUrl);

      toast.info("Submitting work...", {
        description: `Transaction: ${tx.hash.slice(0, 10)}...`,
      });

      const receipt = await tx.wait();

      setTxState({ isLoading: false, hash: receipt.hash, error: null });
      toast.success("Work submitted successfully!");

      return receipt.hash;
    } catch (error: any) {
      const message = error.reason || error.message || "Submission failed";
      setTxState({ isLoading: false, hash: null, error: message });
      toast.error("Work submission failed", { description: message });
      throw error;
    }
  }, [signer]);

  /**
   * Approve campaign and release payment (brand only)
   */
  const approveCampaign = useCallback(async (escrowAddress: string): Promise<string> => {
    if (!signer) throw new Error("Wallet not connected");

    setTxState({ isLoading: true, hash: null, error: null });

    try {
      const escrow = new Contract(escrowAddress, CAMPAIGN_ESCROW_ABI, signer);

      toast.info("Please confirm approval in your wallet...");

      const tx = await escrow.approve();

      toast.info("Approving campaign...", {
        description: `Transaction: ${tx.hash.slice(0, 10)}...`,
      });

      const receipt = await tx.wait();

      setTxState({ isLoading: false, hash: receipt.hash, error: null });
      toast.success("Campaign approved! Payment released.");

      return receipt.hash;
    } catch (error: any) {
      const message = error.reason || error.message || "Approval failed";
      setTxState({ isLoading: false, hash: null, error: message });
      toast.error("Campaign approval failed", { description: message });
      throw error;
    }
  }, [signer]);

  /**
   * Claim timeout payment (influencer only, after deadline)
   */
  const claimTimeout = useCallback(async (escrowAddress: string): Promise<string> => {
    if (!signer) throw new Error("Wallet not connected");

    setTxState({ isLoading: true, hash: null, error: null });

    try {
      const escrow = new Contract(escrowAddress, CAMPAIGN_ESCROW_ABI, signer);

      toast.info("Please confirm claim in your wallet...");

      const tx = await escrow.claimTimeout();

      toast.info("Claiming timeout...", {
        description: `Transaction: ${tx.hash.slice(0, 10)}...`,
      });

      const receipt = await tx.wait();

      setTxState({ isLoading: false, hash: receipt.hash, error: null });
      toast.success("Timeout claimed! Payment received.");

      return receipt.hash;
    } catch (error: any) {
      const message = error.reason || error.message || "Claim failed";
      setTxState({ isLoading: false, hash: null, error: message });
      toast.error("Timeout claim failed", { description: message });
      throw error;
    }
  }, [signer]);

  /**
   * Request refund (brand only, if influencer never delivered)
   */
  const requestRefund = useCallback(async (escrowAddress: string): Promise<string> => {
    if (!signer) throw new Error("Wallet not connected");

    setTxState({ isLoading: true, hash: null, error: null });

    try {
      const escrow = new Contract(escrowAddress, CAMPAIGN_ESCROW_ABI, signer);

      toast.info("Please confirm refund in your wallet...");

      const tx = await escrow.refund();

      toast.info("Processing refund...", {
        description: `Transaction: ${tx.hash.slice(0, 10)}...`,
      });

      const receipt = await tx.wait();

      setTxState({ isLoading: false, hash: receipt.hash, error: null });
      toast.success("Refund processed successfully!");

      return receipt.hash;
    } catch (error: any) {
      const message = error.reason || error.message || "Refund failed";
      setTxState({ isLoading: false, hash: null, error: message });
      toast.error("Refund failed", { description: message });
      throw error;
    }
  }, [signer]);

  /**
   * Get campaign details from escrow contract
   */
  const getCampaignDetails = useCallback(async (
    escrowAddress: string
  ): Promise<CampaignData> => {
    if (!signer) throw new Error("Wallet not connected");

    const escrow = new Contract(escrowAddress, CAMPAIGN_ESCROW_ABI, signer);

    const [
      brand,
      influencer,
      amount,
      deadline,
      deliverableUrl,
      status,
    ] = await Promise.all([
      escrow.brand(),
      escrow.influencer(),
      escrow.amount(),
      escrow.deadline(),
      escrow.deliverableUrl(),
      escrow.getStatus(),
    ]);

    return {
      address: escrowAddress,
      brand,
      influencer,
      amount: formatUnits(amount, USDC_DECIMALS),
      deadline: new Date(Number(deadline) * 1000),
      deliverableUrl,
      delivered: status[0],
      approved: status[1],
      claimed: status[2],
      refunded: status[3],
      deadlinePassed: status[4],
    };
  }, [signer]);

  /**
   * Get all campaigns for the connected wallet
   */
  const getMyCampaigns = useCallback(async (): Promise<string[]> => {
    if (!signer || !address) throw new Error("Wallet not connected");

    const factory = new Contract(
      CONTRACT_ADDRESSES.ESCROW_FACTORY,
      ESCROW_FACTORY_ABI,
      signer
    );

    const [brandCampaigns, influencerCampaigns] = await Promise.all([
      factory.getCampaignsByBrand(address),
      factory.getCampaignsByInfluencer(address),
    ]);

    // Combine and dedupe
    const all = [...brandCampaigns, ...influencerCampaigns];
    return [...new Set(all)];
  }, [signer, address]);

  return {
    // State
    txState,
    resetTxState,
    
    // USDC functions
    getUSDCBalance,
    getUSDCAllowance,
    approveUSDC,
    
    // Campaign functions
    createCampaign,
    submitWork,
    approveCampaign,
    claimTimeout,
    requestRefund,
    getCampaignDetails,
    getMyCampaigns,
  };
}
