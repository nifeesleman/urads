/**
 * Dashboard Layout Component
 * 
 * Shared layout for advertiser, influencer, and admin dashboards
 */

import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  MessageSquare,
  Wallet,
  Settings,
  Bell,
  LogOut,
  Search,
  BarChart3,
  Shield,
  FileText,
  DollarSign,
  CheckCircle,
  PlusCircle,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
}

// Navigation items per role
const navigationConfig: Record<UserRole, Array<{ title: string; url: string; icon: any }>> = {
  advertiser: [
    { title: "Dashboard", url: "/advertiser", icon: LayoutDashboard },
    { title: "Campaigns", url: "/advertiser/campaigns", icon: Megaphone },
    { title: "Discover Creators", url: "/advertiser/discover", icon: Search },
    { title: "Messages", url: "/advertiser/messages", icon: MessageSquare },
    { title: "Analytics", url: "/advertiser/analytics", icon: BarChart3 },
    { title: "Wallet", url: "/advertiser/wallet", icon: Wallet },
    { title: "Settings", url: "/advertiser/settings", icon: Settings },
  ],
  influencer: [
    { title: "Dashboard", url: "/influencer", icon: LayoutDashboard },
    { title: "My Profile", url: "/influencer/profile", icon: Users },
    { title: "Campaigns", url: "/influencer/campaigns", icon: Megaphone },
    { title: "My Applications", url: "/influencer/applications", icon: FileText },
    { title: "Messages", url: "/influencer/messages", icon: MessageSquare },
    { title: "Earnings", url: "/influencer/earnings", icon: DollarSign },
    { title: "Analytics", url: "/influencer/analytics", icon: BarChart3 },
    { title: "Settings", url: "/influencer/settings", icon: Settings },
  ],
  admin: [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Campaigns", url: "/admin/campaigns", icon: Megaphone },
    { title: "Escrow", url: "/admin/escrow", icon: Wallet },
    { title: "Disputes", url: "/admin/disputes", icon: Shield },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ],
};

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { address } = useWeb3();
  const [notifications] = useState(3); // Mock notification count

  const navItems = navigationConfig[role];

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar */}
        <Sidebar className="border-r border-border">
          <div className="p-4 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">U</span>
              </div>
              <span className="text-lg font-bold text-foreground">UrAds</span>
            </Link>
          </div>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === `/${role}`}
                          className="flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          activeClassName="bg-primary/10 text-primary font-medium"
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Quick Actions */}
            {role === "advertiser" && (
              <SidebarGroup className="mt-4">
                <SidebarGroupContent>
                  <div className="px-4">
                    <Link to="/advertiser/campaigns/new">
                      <Button className="w-full gap-2">
                        <PlusCircle className="w-4 h-4" />
                        Create Campaign
                      </Button>
                    </Link>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          {/* User info at bottom */}
          <div className="mt-auto p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.name || "Anonymous"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {address ? truncateAddress(address) : "Not connected"}
                </p>
              </div>
            </div>
          </div>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <div>
                <h1 className="text-lg font-semibold text-foreground capitalize">
                  {role} Dashboard
                </h1>
                {user?.verified && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.name || "Anonymous"}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {user?.email || (address ? truncateAddress(address) : "")}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/${role}/settings`} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
