import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  User, 
  Calendar, 
  MessageSquare, 
  Star, 
  Settings,
  Briefcase,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import BookingAssignment from '@/components/booking/BookingAssignment';

const menuItems = [
  { title: "Overview", url: "#overview", icon: LayoutDashboard },
  { title: "Available Jobs", url: "#available", icon: AlertCircle },
  { title: "My Jobs", url: "#jobs", icon: Briefcase },
  { title: "Schedule", url: "#schedule", icon: Calendar },
  { title: "Messages", url: "#messages", icon: MessageSquare },
  { title: "Reviews", url: "#reviews", icon: Star },
  { title: "Earnings", url: "#earnings", icon: DollarSign },
  { title: "Profile", url: "#profile", icon: User },
  { title: "Settings", url: "#settings", icon: Settings },
];

function ArtisanOverview() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">3</div>
          <p className="text-xs text-muted-foreground">+2 from last week</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦85,400</div>
          <p className="text-xs text-muted-foreground">+12% from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">4.8</div>
          <p className="text-xs text-muted-foreground">Based on 24 reviews</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Response Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2.3h</div>
          <p className="text-xs text-muted-foreground">Average response</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ArtisanJobs() {
  const jobs = [
    { id: 1, title: "Plumbing Repair - Ikoyi", client: "John Doe", status: "In Progress", payment: "₦15,000", date: "Today" },
    { id: 2, title: "Electrical Installation - VI", client: "Jane Smith", status: "Pending", payment: "₦25,000", date: "Tomorrow" },
    { id: 3, title: "AC Maintenance - Lekki", client: "Mike Johnson", status: "Completed", payment: "₦18,000", date: "Yesterday" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Jobs</h2>
        <Button size="sm">View All</Button>
      </div>
      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-sm text-muted-foreground">Client: {job.client}</p>
                  <Badge variant={job.status === 'Completed' ? 'default' : job.status === 'In Progress' ? 'secondary' : 'outline'}>
                    {job.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{job.payment}</p>
                  <p className="text-sm text-muted-foreground">{job.date}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ArtisanDashboard() {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.user_metadata?.full_name || 'Artisan'}!</h1>
              <p className="text-muted-foreground">Here's what's happening with your business today.</p>
            </div>
            <ArtisanOverview />
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm">New job request from Sarah in Ikeja</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm">Payment received for completed job</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <p className="text-sm">New review received (5 stars)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Plumbing Repair</p>
                        <p className="text-sm text-muted-foreground">10:00 AM - Ikoyi</p>
                      </div>
                      <Badge variant="outline">Today</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Electrical Work</p>
                        <p className="text-sm text-muted-foreground">2:00 PM - Victoria Island</p>
                      </div>
                      <Badge variant="outline">Tomorrow</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'available':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Available Jobs</h1>
              <p className="text-muted-foreground">Apply for jobs that match your skills and location</p>
            </div>
            <BookingAssignment 
              artisanId={user?.id || ''} 
              artisanEmail={user?.email || ''} 
            />
          </div>
        );
      case 'jobs':
        return <ArtisanJobs />;
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
    <div className="space-y-6 p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Badge variant="secondary">Artisan Dashboard</Badge>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Profile: 85% Complete</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {menuItems.map((item) => (
            <Button
              key={item.title}
              variant={activeSection === item.url.replace('#', '') ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSection(item.url.replace('#', ''))}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.title}
            </Button>
          ))}
        </div>
      </div>
      {renderContent()}
    </div>
  );
}