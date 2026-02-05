/**
 * Hook to calculate influencer profile completion
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileField {
  label: string;
  completed: boolean;
}

export function useProfileCompletion(userId: string | undefined) {
  const [fields, setFields] = useState<ProfileField[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from("influencers")
          .select("bio, country, niche, platforms, followers, engagement_rate, portfolio_url, price_per_post")
          .eq("user_id", userId)
          .maybeSingle();

        const result: ProfileField[] = [
          { label: "Add a bio", completed: !!data?.bio },
          { label: "Set your country", completed: !!data?.country },
          { label: "Select content niches", completed: !!(data?.niche && data.niche.length > 0) },
          { label: "Choose social platforms", completed: !!(data?.platforms && data.platforms.length > 0) },
          { label: "Enter follower count", completed: !!data?.followers && data.followers > 0 },
          { label: "Set engagement rate", completed: !!data?.engagement_rate && data.engagement_rate > 0 },
          { label: "Add portfolio URL", completed: !!data?.portfolio_url },
          { label: "Set price per post", completed: !!data?.price_per_post && data.price_per_post > 0 },
        ];

        setFields(result);
      } catch (error) {
        console.error("Error fetching profile completion:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [userId]);

  return { fields, isLoading };
}
