/**
 * Connect Wallet Button Component
 * 
 * Displays wallet connection status and handles connect/disconnect
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWeb3 } from "@/contexts/Web3Context";
import { Wallet, LogOut, Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_CHAIN } from "@/lib/contracts";

interface ConnectWalletButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "hero" | "heroOutline";
  size?: "default" | "sm" | "lg" | "xl" | "icon";
}

export function ConnectWalletButton({
  className,
  variant = "default",
  size = "default",
}: ConnectWalletButtonProps) {
  const { address, isConnected, isConnecting, connect, disconnect, chainId } = useWeb3();

  /**
   * Format address for display
   */
  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  /**
   * Copy address to clipboard
   */
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard");
    }
  };

  /**
   * Open address in block explorer
   */
  const openExplorer = () => {
    if (address) {
      window.open(`${DEFAULT_CHAIN.blockExplorer}/address/${address}`, "_blank");
    }
  };

  // Not connected - show connect button
  if (!isConnected) {
    return (
      <Button
        onClick={connect}
        disabled={isConnecting}
        variant={variant}
        size={size}
        className={className}
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </>
        )}
      </Button>
    );
  }

  // Connected - show dropdown with address
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Wallet className="w-4 h-4 mr-2" />
          {formatAddress(address!)}
          {chainId !== DEFAULT_CHAIN.chainId && (
            <span className="ml-2 text-xs text-destructive">(Wrong Network)</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="w-4 h-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openExplorer}>
          <ExternalLink className="w-4 h-4 mr-2" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect} className="text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
