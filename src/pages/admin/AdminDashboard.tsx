/**
 * Admin Dashboard
 * 
 * Central dashboard for platform administrators
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Megaphone,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Activity,
  Building2,
  UserCheck,
} from "lucide-react";

interface PlatformStats {
  totalUsers: number;
  totalAdvertisers: number;
  totalInfluencers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalRevenue: number;
  pendingDisputes: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalAdvertisers: 0,
    totalInfluencers: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalRevenue: 0,
    pendingDisputes: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch counts
      const [profilesRes, advertisersRes, influencersRes, campaignsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("advertisers").select("id", { count: "exact", head: true }),
        supabase.from("influencers").select("id", { count: "exact", head: true }),
        supabase.from("campaigns").select("id, status", { count: "exact" }),
      ]);

      const activeCampaigns = campaignsRes.data?.filter(
        (c) => c.status === "open" || c.status === "in_progress"
      ).length || 0;

      const disputedCampaigns = campaignsRes.data?.filter(
        (c) => c.status === "disputed"
      ).length || 0;

      setStats({
        totalUsers: profilesRes.count || 0,
        totalAdvertisers: advertisersRes.count || 0,
        totalInfluencers: influencersRes.count || 0,
        totalCampaigns: campaignsRes.count || 0,
        activeCampaigns,
        totalRevenue: 125000, // Mock - would calculate from escrow
        pendingDisputes: disputedCampaigns,
      });

      // Mock recent activity
      setRecentActivity([
        { type: "user_joined", message: "New advertiser registered", time: "2 min ago" },
        { type: "campaign_created", message: "New campaign: 'Tech Review'", time: "15 min ago" },
        { type: "payment_released", message: "Payment released: $2,500", time: "1 hour ago" },
        { type: "dispute_opened", message: "Dispute opened on Campaign #123", time: "2 hours ago" },
        { type: "user_verified", message: "Creator verified: @techcreator", time: "3 hours ago" },
      ]);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_joined": return <Users className="w-4 h-4 text-blue-500" />;
      case "campaign_created": return <Megaphone className="w-4 h-4 text-green-500" />;
      case "payment_released": return <DollarSign className="w-4 h-4 text-green-500" />;
      case "dispute_opened": return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "user_verified": return <CheckCircle className="w-4 h-4 text-primary" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Admin Dashboard 🛡️
            </h1>
            <p className="text-muted-foreground mt-1">
              Platform overview and management
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/disputes">
              <Button variant="outline" className="gap-2">
                <Shield className="w-4 h-4" />
                Disputes ({stats.pendingDisputes})
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +12 this week
              </p>
            </CardContent>
          </Card>

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
                Platform Revenue
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                ${stats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +18% this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Disputes
              </CardTitle>
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.pendingDisputes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Breakdown & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>User Breakdown</CardTitle>
              <CardDescription>Platform user distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Advertisers</p>
                      <p className="text-xs text-muted-foreground">Brands & Companies</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{stats.totalAdvertisers}</p>
                    <p className="text-xs text-green-500">+5 new</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Influencers</p>
                      <p className="text-xs text-muted-foreground">Content Creators</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{stats.totalInfluencers}</p>
                    <p className="text-xs text-green-500">+7 new</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link to="/admin/users" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Manage Users
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest platform events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Escrow Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Escrow Overview
            </CardTitle>
            <CardDescription>On-chain payment status across all campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-green-500/10 text-center">
                <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">$85,000</p>
                <p className="text-sm text-muted-foreground">Released</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/10 text-center">
                <Clock className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-2xl font-bold">$25,000</p>
                <p className="text-sm text-muted-foreground">In Escrow</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10 text-center">
                <TrendingUp className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">$12,500</p>
                <p className="text-sm text-muted-foreground">Platform Fees</p>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 text-center">
                <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
                <p className="text-2xl font-bold">$3,000</p>
                <p className="text-sm text-muted-foreground">Disputed</p>
              </div>
            </div>
            <Link to="/admin/escrow">
              <Button variant="outline" className="w-full mt-4">
                View All Transactions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
