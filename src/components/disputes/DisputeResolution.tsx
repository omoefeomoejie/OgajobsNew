import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, MessageSquare, FileText, Clock, CheckCircle, XCircle, User, Calendar, Upload, Send, Activity } from 'lucide-react';

interface Dispute {
  id: string;
  booking_id: string;
  complainant_id: string;
  respondent_id: string;
  category: string;
  title: string;
  description: string;
  status: 'open' | 'under_review' | 'awaiting_response' | 'resolved' | 'closed';
  priority: number;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  bookings?: {
    id: string;
    work_type: string;
    client_email: string;
    artisan_email: string;
    budget: number;
  };
}

interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  profiles?: {
    email: string;
  };
}

interface DisputeEvidence {
  id: string;
  dispute_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  description: string;
  created_at: string;
}

const DisputeResolution: React.FC = () => {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [evidence, setEvidence] = useState<DisputeEvidence[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [newDispute, setNewDispute] = useState({
    booking_id: '',
    category: '',
    title: '',
    description: '',
    priority: 1
  });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');

  const disputeCategories = [
    { value: 'quality_of_work', label: 'Quality of Work' },
    { value: 'payment_issues', label: 'Payment Issues' },
    { value: 'communication_problems', label: 'Communication Problems' },
    { value: 'incomplete_work', label: 'Incomplete Work' },
    { value: 'property_damage', label: 'Property Damage' },
    { value: 'schedule_conflicts', label: 'Schedule Conflicts' },
    { value: 'safety_concerns', label: 'Safety Concerns' },
    { value: 'billing_disputes', label: 'Billing Disputes' },
    { value: 'contract_violations', label: 'Contract Violations' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadDisputes();
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (selectedDispute) {
      loadDisputeMessages(selectedDispute.id);
      loadDisputeEvidence(selectedDispute.id);
    }
  }, [selectedDispute]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (!error) {
        setIsAdmin(data);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadDisputes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          bookings (
            id,
            work_type,
            client_email,
            artisan_email,
            budget
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDisputes(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading disputes:', error);
      toast({
        title: "Error",
        description: "Failed to load disputes",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const loadDisputeMessages = async (disputeId: string) => {
    try {
      const { data, error } = await supabase
        .from('dispute_messages')
        .select('*')
        .eq('dispute_id', disputeId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({ ...msg, profiles: { email: 'Unknown' } })));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadDisputeEvidence = async (disputeId: string) => {
    try {
      const { data, error } = await supabase
        .from('dispute_evidence')
        .select('*')
        .eq('dispute_id', disputeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvidence(data || []);
    } catch (error) {
      console.error('Error loading evidence:', error);
    }
  };

  const createDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get booking to find respondent
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('artisan_id, client_email, artisan_email')
        .eq('id', newDispute.booking_id)
        .single();

      if (bookingError) throw bookingError;

      // Determine respondent (if complainant is client, respondent is artisan, and vice versa)
      const isComplainantClient = booking.client_email === user.email;
      const respondentId = isComplainantClient ? booking.artisan_id : user.id;

      const { data, error } = await supabase
        .from('disputes')
        .insert({
          booking_id: newDispute.booking_id,
          complainant_id: user.id,
          respondent_id: respondentId,
          category: newDispute.category as any,
          title: newDispute.title,
          description: newDispute.description,
          priority: newDispute.priority
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_dispute_activity', {
        dispute_id_param: data.id,
        action_param: 'dispute_created',
        performed_by_param: user.id,
        details_param: { category: newDispute.category, title: newDispute.title }
      });

      toast({
        title: "Dispute Created",
        description: "Your dispute has been submitted and will be reviewed within 24 hours.",
      });

      setShowCreateForm(false);
      setNewDispute({
        booking_id: '',
        category: '',
        title: '',
        description: '',
        priority: 1
      });
      
      loadDisputes();
    } catch (error: any) {
      console.error('Error creating dispute:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create dispute",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (disputeId: string) => {
    if (!resolution.trim()) {
      toast({
        title: "Error",
        description: "Please provide a resolution",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('update_dispute_status', {
        dispute_id_param: disputeId,
        new_status_param: 'resolved',
        resolution_param: resolution,
        admin_notes_param: adminNotes
      });

      if (error) throw error;

      toast({
        title: "Dispute Resolved",
        description: "The dispute has been successfully resolved.",
      });

      setSelectedDispute(null);
      setResolution('');
      setAdminNotes('');
      loadDisputes();
    } catch (error: any) {
      console.error('Error resolving dispute:', error);
      toast({
        title: "Error",
        description: "Failed to resolve dispute",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedDispute) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('dispute_messages')
        .insert({
          dispute_id: selectedDispute.id,
          sender_id: user.id,
          message: newMessage,
          is_internal: false
        });

      if (error) throw error;

      setNewMessage('');
      loadDisputeMessages(selectedDispute.id);

      toast({
        title: "Message Sent",
        description: "Your message has been added to the dispute.",
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const uploadEvidence = async () => {
    if (!evidenceFile || !selectedDispute) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileName = `${user.id}/${Date.now()}-${evidenceFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('dispute-evidence')
        .upload(fileName, evidenceFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('dispute-evidence')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('dispute_evidence')
        .insert({
          dispute_id: selectedDispute.id,
          uploaded_by: user.id,
          file_name: evidenceFile.name,
          file_url: urlData.publicUrl,
          file_type: evidenceFile.type,
          file_size: evidenceFile.size,
          description: evidenceDescription
        });

      if (dbError) throw dbError;

      setEvidenceFile(null);
      setEvidenceDescription('');
      loadDisputeEvidence(selectedDispute.id);

      toast({
        title: "Evidence Uploaded",
        description: "Your evidence has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error('Error uploading evidence:', error);
      toast({
        title: "Error",
        description: "Failed to upload evidence",
        variant: "destructive",
      });
    }
  };

  const updateDisputeStatus = async (disputeId: string, status: string) => {
    try {
      const { error } = await supabase.rpc('update_dispute_status', {
        dispute_id_param: disputeId,
        new_status_param: status as any
      });

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Dispute status changed to ${status.replace('_', ' ')}`,
      });

      loadDisputes();
      if (selectedDispute?.id === disputeId) {
        setSelectedDispute(prev => prev ? { ...prev, status: status as any } : null);
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update dispute status",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'under_review':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'awaiting_response':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-orange-100 text-orange-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'awaiting_response':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5:
        return 'bg-red-100 text-red-800';
      case 4:
        return 'bg-orange-100 text-orange-800';
      case 3:
        return 'bg-yellow-100 text-yellow-800';
      case 2:
        return 'bg-blue-100 text-blue-800';
      case 1:
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispute Resolution</h1>
          <p className="text-muted-foreground">Manage and resolve booking disputes</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <AlertTriangle className="w-4 h-4 mr-2" />
          File Dispute
        </Button>
      </div>

      {/* Create Dispute Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>File a New Dispute</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createDispute} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="booking_id">Booking ID</Label>
                <Input
                  id="booking_id"
                  placeholder="Enter booking ID"
                  value={newDispute.booking_id}
                  onChange={(e) => setNewDispute(prev => ({ ...prev, booking_id: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Dispute Title</Label>
                <Input
                  id="title"
                  placeholder="Brief title for your dispute"
                  value={newDispute.title}
                  onChange={(e) => setNewDispute(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Dispute Category</Label>
                <Select onValueChange={(value) => setNewDispute(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {disputeCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select onValueChange={(value) => setNewDispute(prev => ({ ...prev, priority: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low</SelectItem>
                    <SelectItem value="2">Normal</SelectItem>
                    <SelectItem value="3">Medium</SelectItem>
                    <SelectItem value="4">High</SelectItem>
                    <SelectItem value="5">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail..."
                  value={newDispute.description}
                  onChange={(e) => setNewDispute(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  required
                />
              </div>


              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Dispute'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Disputes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {disputes.map((dispute) => (
          <Card key={dispute.id} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedDispute(dispute)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{dispute.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(dispute.priority)}>
                    P{dispute.priority}
                  </Badge>
                  <Badge className={getStatusColor(dispute.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(dispute.status)}
                      {dispute.status.replace('_', ' ')}
                    </div>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>{dispute.bookings?.work_type || 'N/A'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{new Date(dispute.created_at).toLocaleDateString()}</span>
              </div>

              <p className="text-sm text-gray-600 line-clamp-3">
                {dispute.description}
              </p>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span>{dispute.bookings?.client_email}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {disputes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Disputes</h3>
            <p className="text-gray-500 mb-4">
              You don't have any disputes at the moment.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              File Your First Dispute
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dispute Detail Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-6xl w-full max-h-[95vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedDispute.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Dispute #{selectedDispute.id.slice(0, 8)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Select onValueChange={(value) => updateDisputeStatus(selectedDispute.id, value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Change Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="awaiting_response">Awaiting Response</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="ghost" onClick={() => setSelectedDispute(null)}>
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 max-h-[calc(95vh-120px)] overflow-auto">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Dispute Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dispute Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-medium">Category</Label>
                        <p className="text-sm text-muted-foreground">
                          {disputeCategories.find(c => c.value === selectedDispute.category)?.label}
                        </p>
                      </div>
                      <div>
                        <Label className="font-medium">Priority</Label>
                        <Badge className={getPriorityColor(selectedDispute.priority)}>
                          Priority {selectedDispute.priority}
                        </Badge>
                      </div>
                      <div>
                        <Label className="font-medium">Status</Label>
                        <Badge className={getStatusColor(selectedDispute.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(selectedDispute.status)}
                            {selectedDispute.status.replace('_', ' ')}
                          </div>
                        </Badge>
                      </div>
                      <div>
                        <Label className="font-medium">Created</Label>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedDispute.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedDispute.description}
                      </p>
                    </div>

                    {selectedDispute.resolution && (
                      <div>
                        <Label className="font-medium">Resolution</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedDispute.resolution}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Messages */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Messages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="max-h-64 overflow-y-auto space-y-3">
                      {messages.map((message) => (
                        <div key={message.id} className="border-l-2 border-primary pl-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {message.profiles?.email || 'Unknown User'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {message.message}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Admin Resolution */}
                {isAdmin && selectedDispute.status !== 'resolved' && selectedDispute.status !== 'closed' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Admin Resolution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Resolution</Label>
                        <Textarea
                          placeholder="Enter resolution details..."
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Admin Notes</Label>
                        <Textarea
                          placeholder="Internal admin notes..."
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <Button onClick={() => resolveDispute(selectedDispute.id)}>
                        Mark as Resolved
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Evidence */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Evidence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {evidence.map((item) => (
                        <div key={item.id} className="border rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm font-medium">{item.file_name}</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {item.description}
                            </p>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Upload Evidence */}
                    <div className="border-t pt-4 space-y-3">
                      <Label>Upload Evidence</Label>
                      <Input
                        type="file"
                        onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      <Textarea
                        placeholder="Description of evidence..."
                        value={evidenceDescription}
                        onChange={(e) => setEvidenceDescription(e.target.value)}
                        rows={2}
                      />
                      <Button 
                        onClick={uploadEvidence} 
                        disabled={!evidenceFile}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Evidence
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Log */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="w-3 h-3" />
                        <span>Dispute created</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-5">
                        {new Date(selectedDispute.created_at).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DisputeResolution;