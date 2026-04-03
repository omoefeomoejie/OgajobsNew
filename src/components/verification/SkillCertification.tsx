import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { serviceCategories } from '@/data/serviceCategories';
import {
  Award,
  Plus,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Upload,
  X
} from 'lucide-react';

interface SkillCertification {
  id: string;
  skill_name: string;
  certification_type: string;
  certification_level: string;
  verification_score: number;
  verified_at: string | null;
  expires_at: string | null;
  created_at: string;
  certificate_url?: string | null;
}

export const SkillCertification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certifications, setCertifications] = useState<SkillCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [skillName, setSkillName] = useState('');
  const [certificationLevel, setCertificationLevel] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const certFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) fetchCertifications();
  }, [user]);

  const fetchCertifications = async () => {
    try {
      const { data, error } = await supabase
        .from('skill_certifications')
        .select('*')
        .eq('artisan_id', user?.id)
        .order('verification_score', { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
    } catch (error) {
      console.error('Error fetching certifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!skillName || !certificationLevel) {
      setFormError('Skill name and level are required.');
      return;
    }

    // Duplicate guard
    const alreadyExists = certifications.some(
      c => c.skill_name.toLowerCase() === skillName.toLowerCase()
    );
    if (alreadyExists) {
      setFormError(`You already have "${skillName}" in your skills list.`);
      return;
    }
    setFormError('');

    setSubmitting(true);
    try {
      let certificateUrl: string | null = null;

      if (certificateFile) {
        if (certificateFile.size > 5 * 1024 * 1024) throw new Error('Certificate file too large — max 5 MB');
        const ext = certificateFile.name.split('.').pop();
        const fileName = `${user.id}-cert-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, certificateFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        certificateUrl = publicUrl;
      }

      const { error } = await supabase
        .from('skill_certifications')
        .insert({
          artisan_id: user.id,
          skill_name: skillName,
          certification_type: certificateFile ? 'third_party' : 'self_assessed',
          certification_level: certificationLevel,
          verification_score: 0,
          certificate_url: certificateUrl,
        });

      if (error) throw error;

      toast({ title: 'Skill Added', description: 'Your skill has been added and is pending verification.' });

      setSkillName(''); setCertificationLevel('');
      setCertificateFile(null); setCertificatePreview(null);
      if (certFileRef.current) certFileRef.current.value = '';
      setShowAddForm(false);

      fetchCertifications();
    } catch (error: any) {
      toast({ title: 'Failed to Add Skill', description: error.message || 'Failed to add skill certification.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSkill = async (id: string, skillName: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('skill_certifications')
        .delete()
        .eq('id', id)
        .eq('artisan_id', user?.id);

      if (error) throw error;

      setCertifications(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Skill Removed', description: `${skillName} has been removed from your profile.` });
    } catch (error: any) {
      toast({ title: 'Failed to Remove', description: error.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const getSkillIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <Award className="w-5 h-5 text-yellow-600" />;
    if (score >= 30) return <Target className="w-5 h-5 text-blue-600" />;
    return <Clock className="w-5 h-5 text-gray-600" />;
  };

  const getSkillBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    if (score >= 30) return 'outline';
    return 'destructive';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'master': return 'text-purple-700';
      case 'expert': return 'text-blue-700';
      case 'intermediate': return 'text-green-700';
      default: return 'text-gray-700';
    }
  };

  const allSkills = serviceCategories.flatMap(category =>
    category.subcategories.map(sub => sub.name)
  );

  const certificationLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'expert', label: 'Expert' },
    { value: 'master', label: 'Master' },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading skill certifications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Skills Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Skill Certifications
          </CardTitle>
          <CardDescription>
            Showcase your skills and get verified by clients and the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{certifications.length}</div>
              <div className="text-sm text-muted-foreground">Total Skills</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {certifications.filter(c => c.verification_score >= 60).length}
              </div>
              <div className="text-sm text-muted-foreground">Verified Skills</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {Math.round(
                  certifications.length > 0
                    ? certifications.reduce((sum, c) => sum + c.verification_score, 0) / certifications.length
                    : 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Avg. Score</div>
            </div>
          </div>

          <Button
            onClick={() => { setShowAddForm(!showAddForm); setFormError(''); }}
            className="w-full"
            variant={showAddForm ? 'outline' : 'default'}
          >
            <Plus className="w-4 h-4 mr-2" />
            {showAddForm ? 'Cancel' : 'Add New Skill'}
          </Button>
        </CardContent>
      </Card>

      {/* Add Skill Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Skill</CardTitle>
            <CardDescription>
              Add a skill to your profile. It will be verified through client reviews and platform assessments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <Label htmlFor="skillName">Skill Name *</Label>
                <Select value={skillName} onValueChange={(v) => { setSkillName(v); setFormError(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {allSkills.map((skill) => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="certificationLevel">Your Skill Level *</Label>
                <Select value={certificationLevel} onValueChange={(v) => { setCertificationLevel(v); setFormError(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    {certificationLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Certificate Upload */}
              <div className="space-y-2">
                <Label>Certificate / Supporting Document (Optional)</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => certFileRef.current?.click()}
                >
                  {certificatePreview ? (
                    <div className="relative inline-block">
                      <img src={certificatePreview} alt="Certificate" className="mx-auto max-h-36 object-contain rounded" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                        onClick={(e) => { e.stopPropagation(); setCertificateFile(null); setCertificatePreview(null); if (certFileRef.current) certFileRef.current.value = ''; }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-7 h-7 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Upload a certificate to boost your verification score</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG or PDF, max 5 MB</p>
                    </div>
                  )}
                  <input
                    ref={certFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setCertificateFile(f);
                        if (f.type.startsWith('image/')) {
                          setCertificatePreview(URL.createObjectURL(f));
                        } else {
                          setCertificatePreview(null);
                        }
                        setFormError('');
                      }
                    }}
                  />
                </div>
                {certificateFile && !certificatePreview && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    {certificateFile.name} selected
                  </p>
                )}
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Adding...' : 'Add Skill'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Skills List */}
      {certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map((cert) => (
                <div key={cert.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getSkillIcon(cert.verification_score)}
                      <h3 className="font-semibold">{cert.skill_name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSkillBadgeVariant(cert.verification_score) as any}>
                        {cert.verification_score}/100
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        disabled={deletingId === cert.id}
                        onClick={() => handleDeleteSkill(cert.id, cert.skill_name)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Level:</span>
                      <span className={`text-sm font-medium ${getLevelColor(cert.certification_level)}`}>
                        {cert.certification_level.charAt(0).toUpperCase() + cert.certification_level.slice(1)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <span className="text-sm">
                        {cert.certification_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-muted-foreground">Verification Score</span>
                        <span className="text-sm font-medium">{cert.verification_score}%</span>
                      </div>
                      <Progress value={cert.verification_score} className="h-2" />
                    </div>

                    {cert.certificate_url && (
                      <a
                        href={cert.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View Certificate
                      </a>
                    )}

                    {cert.verified_at && (
                      <div className="text-xs text-muted-foreground">
                        Verified: {new Date(cert.verified_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {certifications.length === 0 && !showAddForm && (
        <Card>
          <CardContent className="text-center py-12">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Skills Added Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your skills to showcase your expertise to potential clients.
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Skill
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
