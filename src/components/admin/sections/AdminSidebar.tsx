import { 
  Shield, 
  Users, 
  Briefcase, 
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Activity,
  Zap,
  Target,
  BarChart3,
  Brain
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const adminMenuItems = [
  { title: "Mission Control", url: "#control", icon: Activity },
  { title: "User Queue", url: "#users", icon: Users },
  { title: "Booking Control", url: "#bookings", icon: Briefcase },
  { title: "Disputes", url: "#disputes", icon: AlertTriangle },
  { title: "Financial Hub", url: "#finance", icon: DollarSign },
  { title: "System Health", url: "#health", icon: Zap },
  { title: "Analytics", url: "#analytics", icon: TrendingUp },
  { title: "Demand Prediction", url: "#demand", icon: Brain },
  { title: "Dynamic Pricing", url: "#pricing", icon: DollarSign },
  { title: "Fraud Detection", url: "#fraud", icon: AlertTriangle },
  { title: "Quality Prediction", url: "#quality", icon: Target },
  { title: "Recommendations", url: "#recommendations", icon: Users },
  { title: "Predictive Analytics", url: "#predictive", icon: TrendingUp },
  { title: "Performance Metrics", url: "#performance", icon: Target },
  { title: "User Behavior", url: "#behavior", icon: BarChart3 },
  { title: "Trust & Safety", url: "#safety", icon: Shield },
];

interface AdminSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export function AdminSidebar({ activeSection, setActiveSection }: AdminSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Control</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => setActiveSection(item.url.replace('#', ''))}
                    className={activeSection === item.url.replace('#', '') ? "bg-destructive text-destructive-foreground font-medium" : "hover:bg-muted/50"}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}