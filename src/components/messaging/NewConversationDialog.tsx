import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

interface Participant {
  id: string;
  name: string;
  avatar_url: string | null;
  campaignId?: string;
  campaignTitle?: string;
}

interface NewConversationDialogProps {
  onSelectParticipant: (participantId: string, campaignId?: string) => void;
}

export function NewConversationDialog({ onSelectParticipant }: NewConversationDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { role } = useUserRole();

  // Fetch potential participants based on role
  const { data: participants = [], isLoading } = useQuery({
    queryKey: ["message-participants", user?.id, role],
    queryFn: async (): Promise<Participant[]> => {
      if (!user?.id) return [];

      if (role === "advertiser") {
        // Get influencers who applied to advertiser's campaigns
        const { data: advertiser } = await supabase
          .from("advertisers")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!advertiser) return [];

        const { data: applications } = await supabase
          .from("applications")
          .select(`
            influencer_id,
            campaign:campaigns!inner(
              id,
              title,
              advertiser_id
            ),
            influencer:influencers!inner(
              user_id,
              profile:profiles!inner(
                id,
                name,
                avatar_url
              )
            )
          `)
          .eq("campaign.advertiser_id", advertiser.id);

        if (!applications) return [];

        const participantMap = new Map<string, Participant>();
        applications.forEach((app: any) => {
          const profile = app.influencer?.profile;
          if (profile && !participantMap.has(profile.id)) {
            participantMap.set(profile.id, {
              id: profile.id,
              name: profile.name || "Unknown",
              avatar_url: profile.avatar_url,
              campaignId: app.campaign?.id,
              campaignTitle: app.campaign?.title,
            });
          }
        });

        return Array.from(participantMap.values());
      } else if (role === "influencer") {
        // Get advertisers whose campaigns the influencer applied to
        const { data: influencer } = await supabase
          .from("influencers")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!influencer) return [];

        const { data: applications } = await supabase
          .from("applications")
          .select(`
            campaign:campaigns!inner(
              id,
              title,
              advertiser:advertisers!inner(
                user_id,
                profile:profiles!inner(
                  id,
                  name,
                  avatar_url
                )
              )
            )
          `)
          .eq("influencer_id", influencer.id);

        if (!applications) return [];

        const participantMap = new Map<string, Participant>();
        applications.forEach((app: any) => {
          const profile = app.campaign?.advertiser?.profile;
          if (profile && !participantMap.has(profile.id)) {
            participantMap.set(profile.id, {
              id: profile.id,
              name: profile.name || "Unknown",
              avatar_url: profile.avatar_url,
              campaignId: app.campaign?.id,
              campaignTitle: app.campaign?.title,
            });
          }
        });

        return Array.from(participantMap.values());
      }

      return [];
    },
    enabled: !!user?.id && !!role && open,
  });

  const filteredParticipants = participants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (participant: Participant) => {
    onSelectParticipant(participant.id, participant.campaignId);
    setOpen(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            {role === "advertiser"
              ? "Select an influencer who applied to your campaigns"
              : "Select an advertiser from campaigns you applied to"}
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[300px] mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-sm text-muted-foreground">
                {search
                  ? "No participants found matching your search"
                  : role === "advertiser"
                  ? "No influencers have applied to your campaigns yet"
                  : "You haven't applied to any campaigns yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredParticipants.map((participant) => {
                const initials = participant.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "?";

                return (
                  <button
                    key={participant.id}
                    onClick={() => handleSelect(participant)}
                    className="w-full p-3 rounded-lg text-left transition-colors hover:bg-accent flex items-center gap-3"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={participant.avatar_url || undefined} alt={participant.name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{participant.name}</p>
                      {participant.campaignTitle && (
                        <Badge variant="secondary" className="text-[10px] mt-1">
                          {participant.campaignTitle}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
