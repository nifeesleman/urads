/**
 * Advertiser Dashboard
 * 
 * Main dashboard for advertisers to manage campaigns and view analytics
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
  Users,
  DollarSign,
  TrendingUp,
  PlusCircle,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface CampaignSummary {
  id: string;
  title: string;
  status: string;
  budget: number;
  deadline: string;
  applications_count: number;
}

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpent: number;
  totalReach: number;
}

export default function AdvertiserDashboard() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSpent: 0,
    totalReach: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch advertiser profile
      const { data: advertiser } = await supabase
        .from("advertisers")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (advertiser) {
        // Fetch campaigns
        const { data: campaignsData } = await supabase
          .from("campaigns")
          .select("id, title, status, budget, deadline")
          .eq("advertiser_id", advertiser.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (campaignsData) {
          setCampaigns(campaignsData.map(c => ({ ...c, applications_count: 0 })));
          
          setStats({
            totalCampaigns: campaignsData.length,
            activeCampaigns: campaignsData.filter(c => 
              c.status === "open" || c.status === "in_progress"
            ).length,
            totalSpent: campaignsData
              .filter(c => c.status === "approved")
              .reduce((sum, c) => sum + Number(c.budget), 0),
            totalReach: Math.floor(Math.random() * 100000), // Mock data
          });
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500/10 text-blue-500";
      case "in_progress": return "bg-yellow-500/10 text-yellow-500";
      case "delivered": return "bg-purple-500/10 text-purple-500";
      case "approved": return "bg-green-500/10 text-green-500";
      case "disputed": return "bg-red-500/10 text-red-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout role="advertiser">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {user?.name || "Advertiser"}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your campaigns today.
            </p>
          </div>
          <Link to="/advertiser/campaigns/new">
            <Button className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Create Campaign
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Campaigns
              </CardTitle>
              <Megaphone className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeCampaigns} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Creators
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +3 this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Spent
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                USDC via escrow
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Reach
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalReach.toLocaleString()}
              </div>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +12% vs last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>Your latest campaign activities</CardDescription>
            </div>
            <Link to="/advertiser/campaigns">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading campaigns...
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8">
                <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground mb-2">No campaigns yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first campaign to start connecting with creators.
                </p>
                <Link to="/advertiser/campaigns/new">
                  <Button>Create Campaign</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-foreground truncate">
                          {campaign.title}
                        </h4>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${Number(campaign.budget).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(campaign.deadline).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {campaign.applications_count} applications
                        </span>
                      </div>
                    </div>
                    <Link to={`/advertiser/campaigns/${campaign.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & AI Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Suggested Creators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                AI-Suggested Creators
              </CardTitle>
              <CardDescription>
                Matched based on your campaign needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">C{i}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Creator {i}</p>
                      <p className="text-xs text-muted-foreground">
                        150K followers • Tech • 4.5% engagement
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        95% match
                      </Badge>
                      <Button size="sm" variant="outline">
                        Invite
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/advertiser/discover">
                <Button variant="link" className="w-full mt-4">
                  Discover More Creators →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Escrow Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Escrow Status
              </CardTitle>
              <CardDescription>
                Secure on-chain payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-foreground">Funds Released</span>
                  </div>
                  <span className="font-mono text-sm">$2,500 USDC</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium text-foreground">In Escrow</span>
                  </div>
                  <span className="font-mono text-sm">$1,000 USDC</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">Pending Approval</span>
                  </div>
                  <span className="font-mono text-sm">$500 USDC</span>
                </div>
              </div>
              <Link to="/advertiser/wallet">
                <Button variant="outline" className="w-full mt-4">
                  View Wallet Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
