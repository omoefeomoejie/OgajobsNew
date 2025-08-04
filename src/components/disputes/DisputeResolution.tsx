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
import { AlertTriangle, MessageSquare, FileText, Clock, CheckCircle, XCircle, User, Calendar } from 'lucide-react';

interface Dispute {
  id: string;
  booking_id: string;
  complainant_id: string;
  respondent_id: string;
  category: string;
  description: string;
  evidence_urls: string[];
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  resolution: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  booking?: {
    work_type: string;
    client_email: string;
    artisan_email: string;
  };
}

const DisputeResolution: React.FC = () => {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [resolution, setResolution] = useState('');
  const [newDispute, setNewDispute] = useState({
    booking_id: '',
    category: '',
    description: '',
    evidence_description: ''
  });

  const disputeCategories = [
    'Quality of Work',
    'Payment Issues',
    'Communication Problems', 
    'Incomplete Work',
    'Property Damage',
    'Schedule Conflicts',
    'Safety Concerns',
    'Other'
  ];

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // For now, we'll create a mock disputes table structure
      // In a real implementation, you'd query the disputes table
      const mockDisputes: Dispute[] = [
        {
          id: '1',
          booking_id: 'booking_123',
          complainant_id: user.id,
          respondent_id: 'artisan_456',
          category: 'Quality of Work',
          description: 'The plumbing work was not completed to standard. Several leaks appeared after the job.',
          evidence_urls: [],
          status: 'under_review',
          resolution: null,
          resolved_by: null,
          created_at: '2024-12-01T10:00:00Z',
          updated_at: '2024-12-01T10:00:00Z',
          booking: {
            work_type: 'Plumbing',
            client_email: user.email || '',
            artisan_email: 'john.plumber@email.com'
          }
        },
        {
          id: '2',
          booking_id: 'booking_789',
          complainant_id: 'artisan_789',
          respondent_id: user.id,
          category: 'Payment Issues',
          description: 'Payment was not released after successful completion of electrical work.',
          evidence_urls: [],
          status: 'open',
          resolution: null,
          resolved_by: null,
          created_at: '2024-11-28T14:30:00Z',
          updated_at: '2024-11-28T14:30:00Z',
          booking: {
            work_type: 'Electrical',
            client_email: user.email || '',
            artisan_email: 'mary.electrician@email.com'
          }
        }
      ];

      setDisputes(mockDisputes);
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

  const createDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // In a real implementation, you'd insert into the disputes table
      toast({
        title: "Dispute Created",
        description: "Your dispute has been submitted and will be reviewed within 24 hours.",
      });

      setShowCreateForm(false);
      setNewDispute({
        booking_id: '',
        category: '',
        description: '',
        evidence_description: ''
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
      // In a real implementation, you'd update the dispute in the database
      setDisputes(prev => prev.map(dispute => 
        dispute.id === disputeId 
          ? { ...dispute, status: 'resolved', resolution, resolved_by: 'admin', updated_at: new Date().toISOString() }
          : dispute
      ));

      toast({
        title: "Dispute Resolved",
        description: "The dispute has been successfully resolved.",
      });

      setSelectedDispute(null);
      setResolution('');
    } catch (error: any) {
      console.error('Error resolving dispute:', error);
      toast({
        title: "Error",
        description: "Failed to resolve dispute",
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
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
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
                <Label htmlFor="category">Dispute Category</Label>
                <Select onValueChange={(value) => setNewDispute(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {disputeCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
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

              <div className="space-y-2">
                <Label htmlFor="evidence">Evidence (Optional)</Label>
                <Textarea
                  id="evidence"
                  placeholder="Describe any evidence you have (photos, messages, etc.)"
                  value={newDispute.evidence_description}
                  onChange={(e) => setNewDispute(prev => ({ ...prev, evidence_description: e.target.value }))}
                  rows={2}
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
                <CardTitle className="text-lg">{dispute.category}</CardTitle>
                <Badge className={getStatusColor(dispute.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(dispute.status)}
                    {dispute.status.replace('_', ' ')}
                  </div>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>{dispute.booking?.work_type || 'N/A'}</span>
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
                <span>{dispute.booking?.client_email}</span>
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
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Dispute Details</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedDispute(null)}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Category</Label>
                  <p className="text-sm text-muted-foreground">{selectedDispute.category}</p>
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
                  <Label className="font-medium">Booking</Label>
                  <p className="text-sm text-muted-foreground">{selectedDispute.booking?.work_type}</p>
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

              {selectedDispute.status !== 'resolved' && selectedDispute.status !== 'closed' && (
                <div className="space-y-4 border-t pt-4">
                  <Label className="font-medium">Resolve Dispute</Label>
                  <Textarea
                    placeholder="Enter resolution details..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={() => resolveDispute(selectedDispute.id)}>
                    Mark as Resolved
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DisputeResolution;