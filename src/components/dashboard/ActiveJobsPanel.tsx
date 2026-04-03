import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  MessageCircle,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  work_type: string | null;
  city: string | null;
  budget: number | null;
  preferred_date: string | null;
  status: string | null;
  client_email: string | null;
  description: string | null;
  created_at: string | null;
  artisan_id: string | null;
}

export function ActiveJobsPanel() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [openRequests, setOpenRequests] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      console.log('Fetching my jobs for artisan:', user?.id, user?.email);
      // Open requests: pending, no artisan assigned yet
      const { data: openData, error: openError } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'pending')
        .is('artisan_id', null)
        .order('created_at', { ascending: false })
        .limit(20);

      // My assigned jobs
      const { data: myData, error: myError } = await supabase
        .from('bookings')
        .select('*')
        .eq('artisan_id', user?.id)
        .in('status', ['accepted', 'paid', 'in_progress', 'awaiting_approval'])
        .order('created_at', { ascending: false })
        .limit(10);

      setOpenRequests(openData || []);
      setMyJobs(myData || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (jobId: string) => {
    if (!user?.id || !user?.email) return;
    setAccepting(jobId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          artisan_id: user.id,
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .is('artisan_id', null); // Optimistic lock: only accept if still unassigned

      if (error) throw error;

      // Create a conversation thread so client and artisan can communicate
      const job = openRequests.find((j) => j.id === jobId);
      console.log('Creating conversation for booking:', jobId, 'client:', job?.client_email, 'artisan email:', user?.email);
      if (job?.client_email) {
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('artisan_id', user.id)
          .eq('client_email', job.client_email)
          .limit(1)
          .maybeSingle();

        let conversationId = existingConv?.id;

        if (!conversationId) {
          // Get client's display name via SECURITY DEFINER function (bypasses profiles RLS)
          const { data: clientDisplayName } = await supabase
            .rpc('get_display_name_by_email', { user_email: job.client_email });

          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
              artisan_id: user.id,
              artisan_email: user.email,
              artisan_name: profile?.full_name || user.email,
              client_email: job.client_email,
              client_name: clientDisplayName || job.client_email.split('@')[0],
              created_at: new Date().toISOString(),
            })
            .select('id')
            .single();
          if (convError) {
            console.error('Failed to create conversation:', convError);
          }
          conversationId = newConv?.id;
        }

        if (conversationId) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_email: user.email,
            receiver_email: job.client_email,
            message: `Hi! I have accepted your ${job.work_type} request in ${job.city}. I will contact you shortly to discuss the details.`,
            read: false,
            created_at: new Date().toISOString(),
          });
        }
      }

      toast({
        title: 'Job accepted',
        description: 'The client will be notified. Check My Jobs for updates.',
      });
      fetchJobs();
    } catch (error: any) {
      toast({
        title: 'Could not accept job',
        description: error.message || 'It may have been taken by another artisan.',
        variant: 'destructive',
      });
    } finally {
      setAccepting(null);
    }
  };

  const handleDeclineJob = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          artisan_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({ title: 'Job declined', description: 'The booking request has been declined.' });
      fetchJobs();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to decline job', variant: 'destructive' });
    }
  };

  const handleMarkComplete = async (jobId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'awaiting_approval',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('artisan_id', user?.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Marked as complete', description: 'Waiting for client confirmation.' });
      fetchJobs();
    }
  };

  const getStatusBadge = (status: string | null) => {
    const cfg: Record<string, { label: string; variant: 'secondary' | 'default' | 'outline' | 'destructive'; icon: any }> = {
      accepted: { label: 'Accepted', variant: 'default', icon: CheckCircle },
      paid: { label: 'Paid — Start Work', variant: 'default', icon: DollarSign },
      in_progress: { label: 'In Progress', variant: 'default', icon: Briefcase },
      awaiting_approval: { label: 'Awaiting Client', variant: 'outline', icon: AlertCircle },
      completed: { label: 'Completed', variant: 'secondary', icon: CheckCircle },
    };
    const c = cfg[status || ''] || { label: status || 'Unknown', variant: 'secondary' as const, icon: Clock };
    const Icon = c.icon;
    return (
      <Badge variant={c.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {c.label}
      </Badge>
    );
  };

  const JobCard = ({ job, isOpen }: { job: Job; isOpen: boolean }) => (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="font-medium">{job.work_type}</h4>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            {job.city && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.city}
              </div>
            )}
            {job.preferred_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(job.preferred_date).toLocaleDateString()}
              </div>
            )}
            {job.budget && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ₦{job.budget.toLocaleString()}
              </div>
            )}
          </div>
        </div>
        {!isOpen && getStatusBadge(job.status)}
      </div>

      {job.description && (
        <>
          <Separator />
          <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
        </>
      )}

      <div className="flex items-center gap-2 pt-1">
        {isOpen && (
          <>
            <Button
              size="sm"
              onClick={() => handleAccept(job.id)}
              disabled={accepting === job.id}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {accepting === job.id ? 'Accepting…' : 'Accept Job'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeclineJob(job.id)}
              disabled={accepting === job.id}
            >
              <X className="h-3 w-3 mr-1" />
              Decline
            </Button>
          </>
        )}

        {!isOpen && job.status === 'paid' && (
          <Button size="sm" onClick={() => handleMarkComplete(job.id)}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Mark as Complete
          </Button>
        )}

        {!isOpen && job.status === 'in_progress' && (
          <Button size="sm" onClick={() => handleMarkComplete(job.id)}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Mark as Complete
          </Button>
        )}

        {!isOpen && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/messages')}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Message Client
          </Button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Jobs</CardTitle></CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
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
          Jobs
        </CardTitle>
        <CardDescription>Browse open requests and manage your work</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="open">
          <TabsList className="mb-4">
            <TabsTrigger value="open">
              Open Requests {openRequests.length > 0 && `(${openRequests.length})`}
            </TabsTrigger>
            <TabsTrigger value="mine">
              My Jobs {myJobs.length > 0 && `(${myJobs.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open">
            {openRequests.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium text-muted-foreground">No open requests right now</p>
                <p className="text-sm text-muted-foreground mt-1">
                  New client requests matching your skills will appear here automatically.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {openRequests.map((job) => (
                    <JobCard key={job.id} job={job} isOpen={true} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="mine">
            {myJobs.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium text-muted-foreground">No active jobs yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Browse open requests and accept one to start earning.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {myJobs.map((job) => (
                    <JobCard key={job.id} job={job} isOpen={false} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
