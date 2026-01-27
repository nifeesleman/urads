/**
 * Influencer Dashboard
 * 
 * Main dashboard for influencers to view campaigns, earnings, and analytics
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Megaphone,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle,
  FileText,
  Eye,
  Heart,
  MessageSquare,
  Wallet,
  Star,
} from "lucide-react";

interface AvailableCampaign {
  id: string;
  title: string;
  description: string | null;
  budget: number;
  deadline: string;
  niche: string[] | null;
}

interface DashboardStats {
  totalEarnings: number;
  pendingEarnings: number;
  completedCampaigns: number;
  activeApplications: number;
}

export default function InfluencerDashboard() {
  const { user } = useAuth();
  const [availableCampaigns, setAvailableCampaigns] = useState<AvailableCampaign[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    pendingEarnings: 0,
    completedCampaigns: 0,
    activeApplications: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch open campaigns
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, title, description, budget, deadline, niche")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);

      if (campaigns) {
        setAvailableCampaigns(campaigns);
      }

      // Mock stats for now
      setStats({
        totalEarnings: 12500,
        pendingEarnings: 2500,
        completedCampaigns: 15,
        activeApplications: 3,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout role="influencer">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {user?.name || "Creator"}! 🎨
            </h1>
            <p className="text-muted-foreground mt-1">
              Discover new opportunities and track your earnings.
            </p>
          </div>
          <Link to="/influencer/campaigns">
            <Button className="gap-2">
              <Megaphone className="w-4 h-4" />
              Browse Campaigns
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Earnings
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                ${stats.totalEarnings.toLocaleString()}
              </div>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +$2,500 this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Earnings
              </CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                ${stats.pendingEarnings.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                In escrow
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Campaigns
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedCampaigns}</div>
              <p className="text-xs text-muted-foreground mt-1">
                100% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Applications
              </CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeApplications}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting response
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Analytics Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Your Analytics
            </CardTitle>
            <CardDescription>
              How your content is performing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <Eye className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-2xl font-bold">2.4M</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <Heart className="w-6 h-6 mx-auto text-red-500 mb-2" />
                <p className="text-2xl font-bold">180K</p>
                <p className="text-xs text-muted-foreground">Total Likes</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <MessageSquare className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">12K</p>
                <p className="text-xs text-muted-foreground">Comments</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <Star className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                <p className="text-2xl font-bold">4.8%</p>
                <p className="text-xs text-muted-foreground">Engagement Rate</p>
              </div>
            </div>
            <Link to="/influencer/analytics">
              <Button variant="outline" className="w-full mt-4">
                View Detailed Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Available Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  Recommended for You
                </CardTitle>
                <CardDescription>
                  AI-matched campaigns based on your profile
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading campaigns...
                </div>
              ) : availableCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-foreground mb-2">No campaigns available</h3>
                  <p className="text-sm text-muted-foreground">
                    Check back later for new opportunities.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableCampaigns.slice(0, 3).map((campaign) => (
                    <div
                      key={campaign.id}
                      className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">
                            {campaign.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {campaign.description || "No description provided"}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              ${Number(campaign.budget).toLocaleString()}
                            </Badge>
                            {campaign.niche?.slice(0, 2).map((n) => (
                              <Badge key={n} variant="outline" className="text-xs">
                                {n}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Link to={`/influencer/campaigns/${campaign.id}`}>
                          <Button size="sm">Apply</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/influencer/campaigns">
                <Button variant="link" className="w-full mt-4">
                  View All Campaigns →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Earnings Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Earnings Overview
              </CardTitle>
              <CardDescription>
                Your payment status and history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Earnings breakdown */}
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Available to Withdraw</span>
                    <span className="font-mono font-bold text-green-500">$4,500 USDC</span>
                  </div>
                  <Button className="w-full" size="sm">
                    Withdraw Funds
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">Tech Product Review</p>
                      <p className="text-xs text-muted-foreground">Completed 2 days ago</p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-500">+$900</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">Fitness Brand Collab</p>
                      <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </div>
                    <Badge className="bg-yellow-500/10 text-yellow-500">$1,500</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">App Launch Campaign</p>
                      <p className="text-xs text-muted-foreground">In progress</p>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-500">$1,000</Badge>
                  </div>
                </div>
              </div>
              <Link to="/influencer/earnings">
                <Button variant="outline" className="w-full mt-4">
                  View All Earnings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
