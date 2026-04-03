import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Camera,
  FileText,
  X
} from 'lucide-react';

interface VerificationData {
  id: string;
  document_type: string;
  document_number: string;
  full_name: string;
  verification_status: string;
  created_at: string;
  verification_notes?: string;
  document_image_url?: string;
  selfie_url?: string;
}

export const IdentityVerification = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<VerificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const HISTORY_LIMIT = 3;

  // Form state
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');

  // File upload state
  const [documentImageFile, setDocumentImageFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [documentImagePreview, setDocumentImagePreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const documentImageRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) fetchVerifications();
  }, [user]);

  const fetchVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('artisan_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateDocumentNumber = (type: string, number: string): string | null => {
    const clean = number.trim().replace(/[\s-]/g, '');
    switch (type) {
      case 'nin':
        if (!/^\d{11}$/.test(clean)) return 'NIN must be exactly 11 digits';
        break;
      case 'voters_card':
        if (clean.length < 10 || clean.length > 25) return 'Invalid PVC number — check and re-enter';
        break;
      case 'drivers_license':
        if (clean.length < 8 || clean.length > 20) return 'Invalid driver\'s license number';
        break;
      case 'international_passport':
        if (!/^[A-Za-z][A-Za-z0-9]{7,8}$/.test(clean))
          return 'Passport: one letter followed by 7–8 alphanumeric characters';
        break;
      case 'business_registration':
        if (clean.length < 5) return 'Invalid business registration number';
        break;
    }
    return null;
  };

  const getExpiresAt = (docType: string): string => {
    const years = (docType === 'international_passport' || docType === 'drivers_license') ? 5 : 10;
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString();
  };

  const uploadFile = async (file: File, suffix: string): Promise<string> => {
    if (file.size > 5 * 1024 * 1024) throw new Error(`File too large — max 5 MB`);
    const ext = file.name.split('.').pop();
    const fileName = `${user!.id}-kyc-${suffix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Client-side validation
    if (!documentType || !documentNumber.trim() || !fullName.trim()) {
      setFormError('Document type, number and full name are required.');
      return;
    }
    const docError = validateDocumentNumber(documentType, documentNumber);
    if (docError) { setFormError(docError); return; }
    if (!documentImageFile) { setFormError('Please upload a photo of your document.'); return; }
    if (!selfieFile) { setFormError('Please upload a selfie holding your document.'); return; }
    setFormError('');

    setSubmitting(true);
    try {
      const [docImageUrl, selfieUrl] = await Promise.all([
        uploadFile(documentImageFile, 'doc'),
        uploadFile(selfieFile, 'selfie'),
      ]);

      const { error } = await supabase
        .from('identity_verifications')
        .insert({
          artisan_id: user.id,
          document_type: documentType as any,
          document_number: documentNumber.trim().replace(/[\s-]/g, ''),
          full_name: fullName.trim(),
          date_of_birth: dateOfBirth || null,
          address: address.trim() || null,
          verification_status: 'pending',
          document_image_url: docImageUrl,
          selfie_url: selfieUrl,
          expires_at: getExpiresAt(documentType),
        });

      if (error) throw error;

      toast({ title: 'Verification Submitted', description: 'Your identity verification request has been submitted for review.' });

      // Reset form
      setDocumentType(''); setDocumentNumber(''); setFullName('');
      setDateOfBirth(''); setAddress('');
      setDocumentImageFile(null); setSelfieFile(null);
      setDocumentImagePreview(null); setSelfiePreview(null);
      if (documentImageRef.current) documentImageRef.current.value = '';
      if (selfieRef.current) selfieRef.current.value = '';

      fetchVerifications();
    } catch (error: any) {
      toast({ title: 'Submission Failed', description: error.message || 'Failed to submit verification request.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'expired': return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default: return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'verified': return 'success' as const;
      case 'rejected': return 'destructive' as const;
      case 'expired': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  const documentTypes = [
    { value: 'nin', label: 'National Identification Number (NIN)' },
    { value: 'voters_card', label: "Permanent Voter's Card (PVC)" },
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'international_passport', label: 'International Passport' },
    { value: 'business_registration', label: 'Business Registration Certificate' },
  ];

  const hasVerifiedDocument = verifications.some(v => v.verification_status === 'verified');
  const hasPendingVerification = verifications.some(v => v.verification_status === 'pending');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading verification status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trust Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Trust & Verification Status
          </CardTitle>
          <CardDescription>
            Build trust with clients through identity and skill verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{profile?.trust_score || 0}/100</div>
              <div className="text-sm text-muted-foreground">Trust Score</div>
              <Progress value={profile?.trust_score || 0} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                {profile?.identity_verified
                  ? <CheckCircle className="w-5 h-5 text-green-600" />
                  : <AlertCircle className="w-5 h-5 text-orange-600" />}
                <span className="font-semibold">
                  {profile?.identity_verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Identity Status</div>
            </div>
            <div className="text-center">
              <Badge variant={
                profile?.verification_level === 'premium' ? 'default' :
                profile?.verification_level === 'standard' ? 'secondary' :
                profile?.verification_level === 'basic' ? 'outline' : 'destructive'
              }>
                {profile?.verification_level?.toUpperCase() || 'UNVERIFIED'}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Verification Level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identity Verification Form */}
      {!hasVerifiedDocument && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Identity Verification
            </CardTitle>
            <CardDescription>
              Verify your identity with Nigerian-issued documents to build trust with clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasPendingVerification ? (
              <form onSubmit={handleSubmitVerification} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="documentType">Document Type *</Label>
                    <Select value={documentType} onValueChange={(v) => { setDocumentType(v); setFormError(''); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="documentNumber">Document Number *</Label>
                    <Input
                      id="documentNumber"
                      value={documentNumber}
                      onChange={(e) => { setDocumentNumber(e.target.value); setFormError(''); }}
                      placeholder={
                        documentType === 'nin' ? '11-digit NIN number' :
                        documentType === 'international_passport' ? 'e.g. A12345678' :
                        'Enter document number'
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="fullName">Full Name (as on document) *</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your address"
                    rows={3}
                  />
                </div>

                {/* Document Photo Upload */}
                <div className="space-y-2">
                  <Label>Document Photo *</Label>
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => documentImageRef.current?.click()}
                  >
                    {documentImagePreview ? (
                      <div className="relative inline-block">
                        <img src={documentImagePreview} alt="Document" className="mx-auto max-h-40 object-contain rounded" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                          onClick={(e) => { e.stopPropagation(); setDocumentImageFile(null); setDocumentImagePreview(null); if (documentImageRef.current) documentImageRef.current.value = ''; }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload photo of your document</p>
                        <p className="text-xs text-muted-foreground">JPG or PNG, max 5 MB</p>
                      </div>
                    )}
                    <input
                      ref={documentImageRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) { setDocumentImageFile(f); setDocumentImagePreview(URL.createObjectURL(f)); setFormError(''); }
                      }}
                    />
                  </div>
                </div>

                {/* Selfie Upload */}
                <div className="space-y-2">
                  <Label>Selfie Holding Document *</Label>
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => selfieRef.current?.click()}
                  >
                    {selfiePreview ? (
                      <div className="relative inline-block">
                        <img src={selfiePreview} alt="Selfie" className="mx-auto max-h-40 object-contain rounded" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                          onClick={(e) => { e.stopPropagation(); setSelfieFile(null); setSelfiePreview(null); if (selfieRef.current) selfieRef.current.value = ''; }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload selfie holding your document</p>
                        <p className="text-xs text-muted-foreground">JPG or PNG, max 5 MB</p>
                      </div>
                    )}
                    <input
                      ref={selfieRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) { setSelfieFile(f); setSelfiePreview(URL.createObjectURL(f)); setFormError(''); }
                      }}
                    />
                  </div>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Uploading & Submitting...' : 'Submit for Verification'}
                </Button>
              </form>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Verification In Progress</h3>
                <p className="text-muted-foreground">
                  Your verification request is being reviewed. This typically takes 24–48 hours.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verification History */}
      {verifications.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Verification History</CardTitle>
              {verifications.length > HISTORY_LIMIT && (
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => setShowAllHistory(v => !v)}
                >
                  {showAllHistory ? 'Show less' : `Show all ${verifications.length}`}
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(showAllHistory ? verifications : verifications.slice(0, HISTORY_LIMIT)).map((verification) => (
                <div key={verification.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(verification.verification_status)}
                    <div>
                      <div className="font-medium">
                        {documentTypes.find(t => t.value === verification.document_type)?.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {verification.document_number} • {new Date(verification.created_at).toLocaleDateString()}
                      </div>
                      {verification.verification_notes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Note: {verification.verification_notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(verification.verification_status) as any}>
                    {verification.verification_status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
