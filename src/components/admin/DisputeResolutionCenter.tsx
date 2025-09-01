import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Clock, DollarSign, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Dispute {
  id: string;
  booking_id: string;
  client_name: string;
  artisan_name: string;
  dispute_type: 'payment' | 'quality' | 'no_show' | 'other';
  amount: number;
  status: 'pending' | 'investigating' | 'resolved' | 'escalated';
  description: string;
  created_at: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export function DisputeResolutionCenter() {
  const [disputes, setDisputes] = useState<Dispute[]>([
    {
      id: '1',
      booking_id: 'BK-001',
      client_name: 'John Doe',
      artisan_name: 'Ahmad Electrician',
      dispute_type: 'payment',
      amount: 15000,
      status: 'pending',
      description: 'Client claims work was not completed as agreed',
      created_at: new Date().toISOString(),
      priority: 'high'
    },
    {
      id: '2',
      booking_id: 'BK-002',
      client_name: 'Sarah Johnson',
      artisan_name: 'Bello Plumber',
      dispute_type: 'quality',
      amount: 8500,
      status: 'investigating',
      description: 'Quality of plumbing work not satisfactory',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      priority: 'medium'
    }
  ]);

  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const { toast } = useToast();

  const handleDisputeAction = async (disputeId: string, action: 'resolve' | 'escalate' | 'refund' | 'close') => {
    try {
      let newStatus: Dispute['status'] = 'pending';
      let actionDescription = '';

      switch (action) {
        case 'resolve':
          newStatus = 'resolved';
          actionDescription = 'Dispute resolved in favor of agreement';
          break;
        case 'escalate':
          newStatus = 'escalated';
          actionDescription = 'Dispute escalated to senior management';
          break;
        case 'refund':
          newStatus = 'resolved';
          actionDescription = 'Full refund processed to client';
          break;
        case 'close':
          newStatus = 'resolved';
          actionDescription = 'Dispute closed without action';
          break;
      }

      setDisputes(prev => prev.map(dispute => 
        dispute.id === disputeId ? { ...dispute, status: newStatus } : dispute
      ));

      toast({
        title: "Dispute Updated",
        description: `${actionDescription}`,
      });

      setResolutionNotes('');
      setSelectedDispute(null);
    } catch (error) {
      console.error('Error updating dispute:', error);
      toast({
        title: "Error",
        description: "Failed to update dispute. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const urgentDisputes = disputes.filter(d => d.priority === 'urgent' || d.priority === 'high');
  const pendingDisputes = disputes.filter(d => d.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">🛡️ Dispute Resolution Center</h1>
          <p className="text-muted-foreground">Manage payment and service disputes</p>
        </div>
        <div className="flex gap-2">
          {urgentDisputes.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {urgentDisputes.length} Urgent
            </Badge>
          )}
          <Badge variant="secondary">
            {pendingDisputes.length} Pending Review
          </Badge>
        </div>
      </div>

      {/* Priority Alerts */}
      {urgentDisputes.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {urgentDisputes.length} high-priority disputes requiring immediate attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Disputes ({pendingDisputes.length})</TabsTrigger>
          <TabsTrigger value="investigating">Under Investigation</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
            {disputes.filter(d => d.status === 'pending').map((dispute) => (
              <Card key={dispute.id} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Dispute #{dispute.id} - {dispute.dispute_type.replace('_', ' ').toUpperCase()}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(dispute.priority)}>
                        {dispute.priority.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(dispute.status)}>
                        {dispute.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Client:</span>
                      <p>{dispute.client_name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Artisan:</span>
                      <p>{dispute.artisan_name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Amount:</span>
                      <p className="font-semibold">₦{dispute.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Booking:</span>
                      <p>{dispute.booking_id}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-muted-foreground">Description:</span>
                    <p className="mt-1 text-sm">{dispute.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-xs text-muted-foreground">
                      Created: {new Date(dispute.created_at).toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedDispute(dispute)}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Investigate
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Resolve Dispute #{dispute.id}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-muted rounded">
                              <h4 className="font-semibold mb-2">Dispute Details</h4>
                              <p className="text-sm">{dispute.description}</p>
                              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                <div>Client: {dispute.client_name}</div>
                                <div>Artisan: {dispute.artisan_name}</div>
                                <div>Amount: ₦{dispute.amount.toLocaleString()}</div>
                                <div>Type: {dispute.dispute_type}</div>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Resolution Notes</label>
                              <Textarea
                                placeholder="Add your investigation notes and resolution details..."
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                className="mt-1"
                              />
                            </div>

                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => handleDisputeAction(dispute.id, 'escalate')}
                              >
                                Escalate
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDisputeAction(dispute.id, 'refund')}
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Process Refund
                              </Button>
                              <Button
                                onClick={() => handleDisputeAction(dispute.id, 'resolve')}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Resolve
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        size="sm"
                        onClick={() => handleDisputeAction(dispute.id, 'escalate')}
                      >
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Escalate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="investigating">
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Disputes under investigation will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="resolved">
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Resolved disputes will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}