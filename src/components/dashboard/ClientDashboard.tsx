import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  User, 
  Calendar, 
  MessageSquare, 
  Star, 
  Settings,
  Search,
  Heart,
  FileText,
  MapPin,
  Clock,
  Filter
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
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const menuItems = [
  { title: "Overview", url: "#overview", icon: LayoutDashboard },
  { title: "Find Services", url: "#services", icon: Search },
  { title: "My Bookings", url: "#bookings", icon: Calendar },
  { title: "Messages", url: "#messages", icon: MessageSquare },
  { title: "Favorites", url: "#favorites", icon: Heart },
  { title: "Reviews", url: "#reviews", icon: Star },
  { title: "Profile", url: "#profile", icon: User },
  { title: "Settings", url: "#settings", icon: Settings },
];

function DashboardSidebar() {
  const { state } = useSidebar();
  const [activeSection, setActiveSection] = useState("overview");
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => setActiveSection(item.url.replace('#', ''))}
                    className={activeSection === item.url.replace('#', '') ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"}
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

function ClientOverview() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2</div>
          <p className="text-xs text-muted-foreground">1 scheduled today</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Services Used</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Favorite Artisans</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">8</div>
          <p className="text-xs text-muted-foreground">Quick access</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Response</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1.2h</div>
          <p className="text-xs text-muted-foreground">From artisans</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ServiceSearch() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Find Services</h2>
        <Button size="sm" variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>
      
      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="What service do you need?" />
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <Input placeholder="Location" className="w-48" />
        </div>
        <Button>Search</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Plumbing Services", artisans: 45, price: "₦5,000 - ₦25,000", rating: 4.8 },
          { title: "Electrical Work", artisans: 32, price: "₦3,000 - ₦20,000", rating: 4.7 },
          { title: "Air Conditioning", artisans: 28, price: "₦8,000 - ₦35,000", rating: 4.9 },
          { title: "Carpentry", artisans: 22, price: "₦10,000 - ₦50,000", rating: 4.6 },
          { title: "Painting", artisans: 38, price: "₦15,000 - ₦75,000", rating: 4.8 },
          { title: "Home Cleaning", artisans: 56, price: "₦5,000 - ₦15,000", rating: 4.7 },
        ].map((service, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{service.artisans} artisans available</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{service.price}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{service.rating}</span>
                  </div>
                </div>
                <Button size="sm" className="w-full">View Artisans</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ClientBookings() {
  const bookings = [
    { id: 1, service: "Plumbing Repair", artisan: "Emeka Okafor", status: "Confirmed", date: "Today, 2:00 PM", price: "₦15,000" },
    { id: 2, service: "House Cleaning", artisan: "Fatima Ahmed", status: "In Progress", date: "Tomorrow, 10:00 AM", price: "₦12,000" },
    { id: 3, service: "Electrical Installation", artisan: "John Adebayo", status: "Completed", date: "Yesterday", price: "₦25,000" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Bookings</h2>
        <Button size="sm">Book New Service</Button>
      </div>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="font-semibold">{booking.service}</h3>
                  <p className="text-sm text-muted-foreground">Artisan: {booking.artisan}</p>
                  <p className="text-sm text-muted-foreground">{booking.date}</p>
                  <Badge variant={booking.status === 'Completed' ? 'default' : booking.status === 'In Progress' ? 'secondary' : 'outline'}>
                    {booking.status}
                  </Badge>
                </div>
                <div className="text-right space-y-2">
                  <p className="font-semibold">{booking.price}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Message</Button>
                    {booking.status === 'Completed' && (
                      <Button size="sm">Review</Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ClientDashboard() {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.user_metadata?.full_name || 'Client'}!</h1>
              <p className="text-muted-foreground">Find trusted artisans for all your service needs.</p>
            </div>
            <ClientOverview />
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm">Plumbing service completed successfully</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm">New message from Fatima (House Cleaner)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <p className="text-sm">Reminder: Cleaning service tomorrow</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Popular Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Home Cleaning</p>
                        <p className="text-sm text-muted-foreground">56 artisans available</p>
                      </div>
                      <Button size="sm" variant="outline">Book</Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Plumbing</p>
                        <p className="text-sm text-muted-foreground">45 artisans available</p>
                      </div>
                      <Button size="sm" variant="outline">Book</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'services':
        return <ServiceSearch />;
      case 'bookings':
        return <ClientBookings />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold">Coming Soon</h2>
            <p className="text-muted-foreground">This section is under development.</p>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between border-b px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <Badge variant="secondary">Client Dashboard</Badge>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">8 Favorite Artisans</span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}