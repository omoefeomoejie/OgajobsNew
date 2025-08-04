import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Send,
  FileText,
  User,
  Calendar,
  TrendingUp,
  Filter
} from 'lucide-react';

interface SupportTicket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  user_id: string;
  assigned_agent_id?: string;
  created_at: string;
  updated_at: string;
  first_response_at?: string;
  resolved_at?: string;
  user_email?: string;
}

interface TicketMessage {
  id: string;
  message: string;
  sender_type: string;
  sender_name: string;
  created_at: string;
}

interface SLATracking {
  first_response_sla_hours: number;
  resolution_sla_hours: number;
  first_response_due_at: string;
  resolution_due_at: string;
  first_response_met: boolean;
  resolution_met: boolean;
}

interface SupportStats {
  totalTickets: number;
  openTickets: number;
  assignedToMe: number;
  overdueSLA: number;
  avgResponseTime: number;
  resolutionRate: number;
}

export const SupportAgentDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [slaInfo, setSlaInfo] = useState<SLATracking | null>(null);
  const [stats, setStats] = useState<SupportStats>({
    totalTickets: 0,
    openTickets: 0,
    assignedToMe: 0,
    overdueSLA: 0,
    avgResponseTime: 0,
    resolutionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketMessages(selectedTicket.id);
      fetchSLAInfo(selectedTicket.id);
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from('support_tickets_v2')
        .select(`
          *,
          profiles!support_tickets_v2_user_id_fkey (email)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Add user email to tickets
      const ticketsWithEmail = data?.map(ticket => ({
        ...ticket,
        user_email: ticket.profiles?.email || 'Unknown'
      })) || [];

      setTickets(ticketsWithEmail);

    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all tickets for stats
      const { data: allTickets, error } = await supabase
        .from('support_tickets_v2')
        .select('*');

      if (error) throw error;

      const totalTickets = allTickets?.length || 0;
      const openTickets = allTickets?.filter(t => ['open', 'in_progress'].includes(t.status)).length || 0;
      const assignedToMe = allTickets?.filter(t => t.assigned_agent_id === user.id).length || 0;
      
      // Calculate overdue SLA (simplified)
      const overdueSLA = allTickets?.filter(t => 
        t.status === 'open' && 
        new Date(t.created_at) < new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length || 0;

      // Mock calculations for avg response time and resolution rate
      const avgResponseTime = 2.5; // hours
      const resolutionRate = 85; // percentage

      setStats({
        totalTickets,
        openTickets,
        assignedToMe,
        overdueSLA,
        avgResponseTime,
        resolutionRate
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTicketMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setTicketMessages(data || []);
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
    }
  };

  const fetchSLAInfo = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_sla_tracking')
        .select('*')
        .eq('ticket_id', ticketId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setSlaInfo(data || null);
    } catch (error) {
      console.error('Error fetching SLA info:', error);
    }
  };

  const assignTicketToMe = async (ticketId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('support_tickets_v2')
        .update({
          assigned_agent_id: user.id,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket assigned to you"
      });

      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, assigned_agent_id: user.id, status: 'in_progress' } : null);
      }

    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: "Error",
        description: "Failed to assign ticket",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('support_ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          message: newMessage.trim(),
          sender_type: 'agent',
          sender_name: user.email || 'Support Agent'
        });

      if (error) throw error;

      setNewMessage('');
      fetchTicketMessages(selectedTicket.id);

      // Update ticket status if it's the first response
      if (!selectedTicket.first_response_at) {
        await supabase
          .from('support_tickets_v2')
          .update({ first_response_at: new Date().toISOString() })
          .eq('id', selectedTicket.id);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const updateTicketStatus = async () => {
    if (!selectedTicket || !newStatus) return;

    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'resolved' && resolutionText) {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolution = resolutionText;
      }

      const { error } = await supabase
        .from('support_tickets_v2')
        .update(updateData)
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket status updated"
      });

      setNewStatus('');
      setResolutionText('');
      fetchTickets();
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);

    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { variant: "default" as const, icon: AlertTriangle, color: "text-red-600" },
      in_progress: { variant: "secondary" as const, icon: Clock, color: "text-orange-600" },
      waiting_customer: { variant: "outline" as const, icon: MessageCircle, color: "text-blue-600" },
      resolved: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      closed: { variant: "outline" as const, icon: CheckCircle, color: "text-gray-600" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { variant: "outline" as const, color: "text-blue-600" },
      normal: { variant: "secondary" as const, color: "text-green-600" },
      high: { variant: "default" as const, color: "text-orange-600" },
      urgent: { variant: "destructive" as const, color: "text-red-600" },
      critical: { variant: "destructive" as const, color: "text-purple-600" }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;

    return (
      <Badge variant={config.variant}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getSLAStatus = () => {
    if (!slaInfo || !selectedTicket) return null;

    const now = new Date();
    const firstResponseDue = new Date(slaInfo.first_response_due_at);
    const resolutionDue = new Date(slaInfo.resolution_due_at);

    const firstResponseOverdue = !selectedTicket.first_response_at && now > firstResponseDue;
    const resolutionOverdue = !selectedTicket.resolved_at && now > resolutionDue;

    return (
      <div className="text-sm space-y-1">
        <div className={`flex items-center gap-2 ${firstResponseOverdue ? 'text-red-600' : 'text-green-600'}`}>
          <Clock className="h-3 w-3" />
          First Response: {firstResponseOverdue ? 'Overdue' : 'On Track'}
        </div>
        <div className={`flex items-center gap-2 ${resolutionOverdue ? 'text-red-600' : 'text-green-600'}`}>
          <Clock className="h-3 w-3" />
          Resolution: {resolutionOverdue ? 'Overdue' : 'On Track'}
        </div>
      </div>
    );
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Support Agent Dashboard</h1>
        <Button onClick={fetchTickets} variant="outline">
          <Search className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.openTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned to Me</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.assignedToMe}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue SLA</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.overdueSLA}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="waiting_customer">Waiting Customer</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Support Tickets ({filteredTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedTicket?.id === ticket.id ? 'bg-muted border-primary' : ''
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{ticket.ticket_number}
                        </span>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <h4 className="font-medium truncate">{ticket.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {ticket.user_email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {!ticket.assigned_agent_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          assignTicketToMe(ticket.id);
                        }}
                      >
                        Assign
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ticket Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {selectedTicket ? `Ticket #${selectedTicket.ticket_number}` : 'Select a Ticket'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTicket ? (
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                    {getSLAStatus()}
                  </div>
                  <h3 className="font-semibold">{selectedTicket.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTicket.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Customer: {selectedTicket.user_email}
                  </p>
                </div>

                {/* Status Update */}
                <div className="flex gap-2">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting_customer">Waiting Customer</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={updateTicketStatus} 
                    disabled={!newStatus}
                    size="sm"
                  >
                    Update
                  </Button>
                </div>

                {newStatus === 'resolved' && (
                  <Textarea
                    placeholder="Enter resolution details..."
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    rows={3}
                  />
                )}

                {/* Messages */}
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {ticketMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.sender_type === 'agent' 
                          ? 'bg-primary/10 ml-4' 
                          : 'bg-muted mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {message.sender_type === 'agent' ? 'You' : message.sender_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  ))}
                </div>

                {/* Send Message */}
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type your response..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Select a ticket to view details and respond
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};