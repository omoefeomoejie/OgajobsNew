import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  CheckCircle,
  XCircle,
  Eye,
  User,
  FileText,
  Camera,
  AlertCircle,
} from 'lucide-react';

interface PendingVerification {
  id: string;
  artisan_id: string;
  document_type: string;
  document_number: string;
  full_name: string;
  date_of_birth: string | null;
  address: string | null;
  verification_status: string;
  document_image_url: string | null;
  selfie_url: string | null;
  verification_notes: string | null;
  created_at: string;
  expires_at: string | null;
  profile?: { email: string; full_name: string | null };
}

const documentTypeLabels: Record<string, string> = {
  nin: 'NIN',
  voters_card: "Voter's Card",
  drivers_license: "Driver's License",
  international_passport: 'International Passport',
  business_registration: 'Business Registration',
};

const TAB_FILTERS = ['pending', 'verified', 'rejected', 'all'] as const;
type TabFilter = typeof TAB_FILTERS[number];

export function VerificationReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<PendingVerification | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  // Image preview dialog
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchVerifications();
  }, [tab]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('identity_verifications')
        .select('*, profile:profiles!identity_verifications_artisan_id_fkey(email, full_name)')
        .order('created_at', { ascending: false });

      if (tab !== 'all') {
        query = query.eq('verification_status', tab);
      }

      const { data, error } = await query;
      if (error) throw error;
      setVerifications((data as any[]) || []);

      // Audit log: record that an admin viewed verification records
      if (data && data.length > 0) {
        supabase.from('audit_logs').insert({
          user_id: user?.id,
          user_email: user?.email,
          operation: 'SELECT',
          table_name: 'identity_verifications',
          new_data: { filter: tab, record_count: data.length },
        }).then(() => {}); // fire-and-forget, don't block UI
      }
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast({ title: 'Failed to load verifications', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (v: PendingVerification) => {
    setProcessingId(v.id);
    try {
      const { error } = await supabase
        .from('identity_verifications')
        .update({
          verification_status: 'verified',
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          verification_notes: null,
        })
        .eq('id', v.id);

      if (error) throw error;

      // Sync identity_verified on the profile
      await supabase
        .from('profiles')
        .update({ identity_verified: true })
        .eq('id', v.artisan_id);

      toast({ title: 'Approved', description: `${v.full_name}'s identity has been verified.` });
      fetchVerifications();
    } catch (error: any) {
      toast({ title: 'Approval Failed', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (v: PendingVerification) => {
    setRejectTarget(v);
    setRejectNotes('');
    setRejectDialog(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectNotes.trim()) {
      toast({ title: 'Please enter rejection reason', variant: 'destructive' });
      return;
    }
    setProcessingId(rejectTarget.id);
    try {
      const { error } = await supabase
        .from('identity_verifications')
        .update({
          verification_status: 'rejected',
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          verification_notes: rejectNotes.trim(),
        })
        .eq('id', rejectTarget.id);

      if (error) throw error;

      toast({ title: 'Rejected', description: `${rejectTarget.full_name}'s submission has been rejected.` });
      setRejectDialog(false);
      fetchVerifications();
    } catch (error: any) {
      toast({ title: 'Rejection Failed', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const counts = {
    pending: verifications.filter(v => v.verification_status === 'pending').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return <Badge className="bg-green-100 text-green-800 border-green-200">Verified</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'expired': return <Badge variant="secondary">Expired</Badge>;
      default: return <Badge variant="outline" className="border-yellow-400 text-yellow-700">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">KYC Verification Review</h2>
          <p className="text-muted-foreground">Review and approve artisan identity submissions</p>
        </div>
        {tab === 'all' ? null : (
          <div className="text-sm text-muted-foreground">
            {verifications.length} {tab} submission{verifications.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TAB_FILTERS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
            {t === 'pending' && counts.pending > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-destructive text-destructive-foreground">
                {counts.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : verifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No {tab === 'all' ? '' : tab} submissions found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {verifications.map((v) => (
            <Card key={v.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{v.full_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {v.profile?.email || v.artisan_id}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(v.verification_status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Document Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block">Document Type</span>
                    <span className="font-medium">{documentTypeLabels[v.document_type] || v.document_type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Document Number</span>
                    <span className="font-medium font-mono">{v.document_number}</span>
                  </div>
                  {v.date_of_birth && (
                    <div>
                      <span className="text-muted-foreground block">Date of Birth</span>
                      <span className="font-medium">{new Date(v.date_of_birth).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground block">Submitted</span>
                    <span className="font-medium">{new Date(v.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {v.address && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Address:</span> {v.address}
                  </p>
                )}

                {/* Document Images */}
                <div className="flex gap-3 flex-wrap">
                  {v.document_image_url ? (
                    <button
                      className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-muted transition-colors"
                      onClick={() => setPreviewUrl(v.document_image_url)}
                    >
                      <FileText className="w-4 h-4" />
                      View Document
                      <Eye className="w-3 h-3 text-muted-foreground" />
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertCircle className="w-3 h-3" /> No document photo
                    </span>
                  )}
                  {v.selfie_url ? (
                    <button
                      className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-muted transition-colors"
                      onClick={() => setPreviewUrl(v.selfie_url)}
                    >
                      <Camera className="w-4 h-4" />
                      View Selfie
                      <Eye className="w-3 h-3 text-muted-foreground" />
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertCircle className="w-3 h-3" /> No selfie
                    </span>
                  )}
                </div>

                {v.verification_notes && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <span className="font-medium">Notes: </span>{v.verification_notes}
                  </div>
                )}

                {/* Actions */}
                {v.verification_status === 'pending' && (
                  <div className="flex gap-3 pt-1">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={processingId === v.id}
                      onClick={() => handleApprove(v)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {processingId === v.id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={processingId === v.id}
                      onClick={() => openRejectDialog(v)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}

                {v.verification_status === 'rejected' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={processingId === v.id}
                    onClick={() => handleApprove(v)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Override — Approve
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Rejecting submission from <span className="font-medium text-foreground">{rejectTarget?.full_name}</span>.
              The artisan will see this reason.
            </p>
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="e.g. Document image is blurry, please resubmit with a clearer photo."
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setRejectDialog(false)}>Cancel</Button>
              <Button variant="destructive" disabled={processingId === rejectTarget?.id} onClick={handleReject}>
                {processingId === rejectTarget?.id ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Document"
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
