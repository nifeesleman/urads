/**
 * Influencer Selector Component
 * 
 * Allows searching and selecting an influencer by wallet or from list
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInfluencers, InfluencerWithProfile } from "@/hooks/useInfluencers";
import { Search, User, CheckCircle, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfluencerSelectorProps {
  selectedWallet: string;
  onSelect: (walletAddress: string, influencer?: InfluencerWithProfile) => void;
  disabled?: boolean;
}

export function InfluencerSelector({
  selectedWallet,
  onSelect,
  disabled,
}: InfluencerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [manualWallet, setManualWallet] = useState("");
  const { data: influencers, isLoading } = useInfluencers(searchQuery);

  const isValidAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleManualSelect = () => {
    if (isValidAddress(manualWallet)) {
      onSelect(manualWallet.toLowerCase());
    }
  };

  const formatFollowers = (count: number | null): string => {
    if (!count) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="space-y-4">
      <Label>Select Influencer</Label>
      
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse" disabled={disabled}>
            <Users className="w-4 h-4 mr-2" />
            Browse Creators
          </TabsTrigger>
          <TabsTrigger value="manual" disabled={disabled}>
            <Wallet className="w-4 h-4 mr-2" />
            Enter Wallet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or wallet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={disabled}
            />
          </div>

          {/* Influencer List */}
          <ScrollArea className="h-64 rounded-md border">
            <div className="p-2 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-pulse text-muted-foreground">Loading creators...</div>
                </div>
              ) : influencers && influencers.length > 0 ? (
                influencers.map((influencer) => (
                  <Card
                    key={influencer.id}
                    className={cn(
                      "cursor-pointer transition-all hover:bg-accent/50",
                      selectedWallet === influencer.profile?.wallet_address &&
                        "ring-2 ring-primary bg-accent"
                    )}
                    onClick={() =>
                      !disabled &&
                      influencer.profile?.wallet_address &&
                      onSelect(influencer.profile.wallet_address, influencer)
                    }
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={influencer.profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {influencer.profile?.name || "Anonymous"}
                          </span>
                          {influencer.profile?.verified && (
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {influencer.profile?.wallet_address?.slice(0, 6)}...
                          {influencer.profile?.wallet_address?.slice(-4)}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium">
                          {formatFollowers(influencer.followers)} followers
                        </div>
                        {influencer.price_per_post && (
                          <div className="text-xs text-muted-foreground">
                            ${influencer.price_per_post}/post
                          </div>
                        )}
                      </div>

                      {selectedWallet === influencer.profile?.wallet_address && (
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mb-2" />
                  <p>No creators found</p>
                  <p className="text-xs">Try a different search or enter wallet manually</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Niche Tags */}
          {influencers && influencers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Array.from(
                new Set(influencers.flatMap((i) => i.niche || []))
              )
                .slice(0, 10)
                .map((niche) => (
                  <Badge
                    key={niche}
                    variant="outline"
                    className="cursor-pointer text-xs"
                    onClick={() => setSearchQuery(niche)}
                  >
                    {niche}
                  </Badge>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wallet-input">Influencer Wallet Address</Label>
            <div className="flex gap-2">
              <Input
                id="wallet-input"
                placeholder="0x..."
                value={manualWallet}
                onChange={(e) => setManualWallet(e.target.value)}
                disabled={disabled}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleManualSelect}
                disabled={disabled || !isValidAddress(manualWallet)}
              >
                Select
              </Button>
            </div>
            {manualWallet && !isValidAddress(manualWallet) && (
              <p className="text-sm text-destructive">
                Please enter a valid Ethereum address
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Display */}
      {selectedWallet && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Selected Influencer</p>
              <p className="text-xs text-muted-foreground font-mono">
                {selectedWallet}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect("")}
              disabled={disabled}
            >
              Change
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
