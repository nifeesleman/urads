/**
 * USDC Balance Component
 * 
 * Displays connected wallet's USDC balance
 */

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeb3 } from "@/contexts/Web3Context";
import { useEscrow } from "@/hooks/useEscrow";
import { DollarSign, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface USDCBalanceProps {
  requiredAmount?: number;
  className?: string;
}

export function USDCBalance({ requiredAmount, className }: USDCBalanceProps) {
  const { isConnected } = useWeb3();
  const { getUSDCBalance } = useEscrow();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const bal = await getUSDCBalance();
      setBalance(bal);
    } catch (err: any) {
      setError(err.message || "Failed to fetch balance");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [isConnected]);

  if (!isConnected) {
    return null;
  }

  const balanceNum = balance ? parseFloat(balance) : 0;
  const hasEnough = requiredAmount ? balanceNum >= requiredAmount : true;

  return (
    <Card className={cn("bg-card/50", className)}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">USDC Balance</p>
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <p className="text-lg font-bold">
                ${parseFloat(balance || "0").toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {requiredAmount && !isLoading && (
            <Badge variant={hasEnough ? "default" : "destructive"}>
              {hasEnough ? "Sufficient" : "Insufficient"}
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchBalance}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardContent>

      {requiredAmount && !hasEnough && !isLoading && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="text-sm text-destructive">
              You need ${requiredAmount.toFixed(2)} USDC. Current: ${balanceNum.toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
