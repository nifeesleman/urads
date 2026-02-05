/**
 * Influencer Profile Setup Page
 * 
 * Allows influencers to set up and edit their profile information
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  User,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  Link as LinkIcon,
  MapPin,
  DollarSign,
  Users,
  TrendingUp,
  Save,
  X,
  Plus,
  Loader2,
} from "lucide-react";

// Available niches for selection
const AVAILABLE_NICHES = [
  "Fashion", "Beauty", "Fitness", "Gaming", "Tech", "Food",
  "Travel", "Lifestyle", "Music", "Sports", "Finance", "Education",
  "Entertainment", "Health", "Parenting", "Pets", "Art", "Photography"
];

// Available platforms
const AVAILABLE_PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "twitter", name: "Twitter/X", icon: Twitter },
  { id: "youtube", name: "YouTube", icon: Youtube },
  { id: "tiktok", name: "TikTok", icon: Globe },
  { id: "twitch", name: "Twitch", icon: Globe },
  { id: "linkedin", name: "LinkedIn", icon: Globe },
];

interface InfluencerProfile {
  id: string;
  bio: string | null;
  country: string | null;
  followers: number | null;
  engagement_rate: number | null;
  niche: string[] | null;
  platforms: string[] | null;
  portfolio_url: string | null;
  price_per_post: number | null;
}

export default function InfluencerProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [influencerId, setInfluencerId] = useState<string | null>(null);
  
  // Form state
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [followers, setFollowers] = useState("");
  const [engagementRate, setEngagementRate] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [pricePerPost, setPricePerPost] = useState("");

  useEffect(() => {
    if (user) {
      fetchInfluencerProfile();
    }
  }, [user]);

  const fetchInfluencerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("influencers")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setInfluencerId(data.id);
        setBio(data.bio || "");
        setCountry(data.country || "");
        setFollowers(data.followers?.toString() || "");
        setEngagementRate(data.engagement_rate?.toString() || "");
        setSelectedNiches(data.niche || []);
        setSelectedPlatforms(data.platforms || []);
        setPortfolioUrl(data.portfolio_url || "");
        setPricePerPost(data.price_per_post?.toString() || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNicheToggle = (niche: string) => {
    setSelectedNiches(prev =>
      prev.includes(niche)
        ? prev.filter(n => n !== niche)
        : [...prev, niche]
    );
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!influencerId) {
      toast.error("Profile not found");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("influencers")
        .update({
          bio: bio || null,
          country: country || null,
          followers: followers ? parseInt(followers) : null,
          engagement_rate: engagementRate ? parseFloat(engagementRate) : null,
          niche: selectedNiches.length > 0 ? selectedNiches : null,
          platforms: selectedPlatforms.length > 0 ? selectedPlatforms : null,
          portfolio_url: portfolioUrl || null,
          price_per_post: pricePerPost ? parseFloat(pricePerPost) : null,
        })
        .eq("id", influencerId);

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="influencer">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="influencer">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile Setup</h1>
          <p className="text-muted-foreground mt-1">
            Complete your profile to attract more brand partnerships
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bio Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                About You
              </CardTitle>
              <CardDescription>
                Tell brands about yourself and what makes you unique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Write a compelling bio about yourself, your content style, and what you're passionate about..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length}/500 characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Country/Region
                  </Label>
                  <Input
                    id="country"
                    placeholder="e.g., United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolio">
                    <LinkIcon className="w-4 h-4 inline mr-1" />
                    Portfolio URL
                  </Label>
                  <Input
                    id="portfolio"
                    type="url"
                    placeholder="https://your-portfolio.com"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Niches Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Content Niches
              </CardTitle>
              <CardDescription>
                Select the niches that best describe your content (max 5)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_NICHES.map((niche) => {
                  const isSelected = selectedNiches.includes(niche);
                  const isDisabled = !isSelected && selectedNiches.length >= 5;
                  
                  return (
                    <Badge
                      key={niche}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/80"
                      } ${isSelected ? "" : "hover:bg-muted"}`}
                      onClick={() => !isDisabled && handleNicheToggle(niche)}
                    >
                      {isSelected && <X className="w-3 h-3 mr-1" />}
                      {niche}
                    </Badge>
                  );
                })}
              </div>
              {selectedNiches.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Selected: {selectedNiches.length}/5
                </p>
              )}
            </CardContent>
          </Card>

          {/* Platforms Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Social Platforms
              </CardTitle>
              <CardDescription>
                Select the platforms where you create content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_PLATFORMS.map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform.id);
                  const Icon = platform.icon;
                  
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => handlePlatformToggle(platform.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{platform.name}</span>
                      {isSelected && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stats & Pricing Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Stats & Pricing
              </CardTitle>
              <CardDescription>
                Share your audience stats and pricing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="followers">
                    <Users className="w-4 h-4 inline mr-1" />
                    Total Followers
                  </Label>
                  <Input
                    id="followers"
                    type="number"
                    placeholder="e.g., 50000"
                    value={followers}
                    onChange={(e) => setFollowers(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engagement">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Engagement Rate (%)
                  </Label>
                  <Input
                    id="engagement"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 4.5"
                    value={engagementRate}
                    onChange={(e) => setEngagementRate(e.target.value)}
                    min="0"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Price per Post (USDC)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g., 500"
                    value={pricePerPost}
                    onChange={(e) => setPricePerPost(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/influencer")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
