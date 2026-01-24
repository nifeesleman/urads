/**
 * Web3 Context Provider
 * 
 * Manages wallet connection state and provides Web3 functionality
 * Supports MetaMask and other injected providers
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { DEFAULT_CHAIN } from "@/lib/contracts";

// =============================================================
//                           TYPES
// =============================================================

interface Web3ContextType {
  // Connection state
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  
  // Provider and signer
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// =============================================================
//                         CONTEXT
// =============================================================

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// =============================================================
//                        PROVIDER
// =============================================================

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!address;

  /**
   * Clear any error messages
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle account changes from wallet
   */
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      setAddress(null);
      setSigner(null);
      setProvider(null);
    } else {
      setAddress(accounts[0]);
    }
  }, []);

  /**
   * Handle chain changes from wallet
   */
  const handleChainChanged = useCallback((chainIdHex: string) => {
    const newChainId = parseInt(chainIdHex, 16);
    setChainId(newChainId);
    
    // Refresh the page on chain change (recommended by MetaMask)
    window.location.reload();
  }, []);

  /**
   * Switch to the required chain
   */
  const switchChain = useCallback(async (targetChainId: number) => {
    if (!window.ethereum) {
      throw new Error("No wallet detected");
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Chain not added to wallet, try to add it
      if (switchError.code === 4902) {
        const chain = DEFAULT_CHAIN;
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${chain.chainId.toString(16)}`,
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: [chain.rpcUrl],
              blockExplorerUrls: [chain.blockExplorer],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }, []);

  /**
   * Connect wallet
   */
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask or another Web3 wallet");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request accounts
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Get chain ID
      const chainIdHex = await window.ethereum.request({
        method: "eth_chainId",
      });
      const currentChainId = parseInt(chainIdHex, 16);

      // Switch to correct chain if needed
      if (currentChainId !== DEFAULT_CHAIN.chainId) {
        await switchChain(DEFAULT_CHAIN.chainId);
      }

      // Create provider and signer
      const browserProvider = new BrowserProvider(window.ethereum);
      const walletSigner = await browserProvider.getSigner();

      // Update state
      setAddress(accounts[0]);
      setChainId(currentChainId);
      setProvider(browserProvider);
      setSigner(walletSigner);

      // Store connection preference
      localStorage.setItem("walletConnected", "true");
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, [switchChain]);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    localStorage.removeItem("walletConnected");
  }, []);

  /**
   * Setup event listeners and auto-connect
   */
  useEffect(() => {
    if (!window.ethereum) return;

    // Listen for account changes
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Auto-connect if previously connected
    const wasConnected = localStorage.getItem("walletConnected");
    if (wasConnected === "true") {
      connect();
    }

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [connect, handleAccountsChanged, handleChainChanged]);

  const value: Web3ContextType = {
    address,
    chainId,
    isConnected,
    isConnecting,
    provider,
    signer,
    connect,
    disconnect,
    switchChain,
    error,
    clearError,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

// =============================================================
//                           HOOK
// =============================================================

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}

// =============================================================
//                     TYPE DECLARATIONS
// =============================================================

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
