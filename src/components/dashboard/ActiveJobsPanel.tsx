import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  CheckCircle,
  Clock,
  AlertCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface Job {
  id: string;
  work_type: string;
  city: string;
  budget: number;
  preferred_date: string;
  status: string;
  client_email: string;
  description: string;
  created_at: string;
}

export function ActiveJobsPanel() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchActiveJobs();
    }
  }, [user]);

  const fetchActiveJobs = async () => {
    try {
      const { data: jobsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('artisan_id', user?.id)
        .in('status', ['pending', 'in_progress', 'awaiting_approval'])
        .order('created_at', { ascending: false })
        .limit(10);

      setJobs(jobsData || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Awaiting Client', variant: 'secondary' as const, icon: Clock },
      in_progress: { label: 'In Progress', variant: 'default' as const, icon: Briefcase },
      awaiting_approval: { label: 'Needs Review', variant: 'outline' as const, icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleQuickAction = (action: string, jobId: string) => {
    // Handle quick actions
    logger.debug('Quick action triggered', { action, hasJobId: !!jobId });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Active Jobs ({jobs.length})
        </CardTitle>
        <CardDescription>Manage your current projects</CardDescription>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No active jobs</p>
            <p className="text-sm text-muted-foreground">New job requests will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{job.work_type}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.city}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(job.preferred_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ₦{job.budget?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>

                  {job.description && (
                    <>
                      <Separator />
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {job.description}
                      </p>
                    </>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    {job.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => handleQuickAction('accept', job.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleQuickAction('message', job.id)}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Message
                        </Button>
                      </>
                    )}
                    
                    {job.status === 'in_progress' && (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => handleQuickAction('update', job.id)}
                        >
                          Update Progress
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleQuickAction('message', job.id)}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Message
                        </Button>
                      </>
                    )}
                    
                    {job.status === 'awaiting_approval' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleQuickAction('message', job.id)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Message Client
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}