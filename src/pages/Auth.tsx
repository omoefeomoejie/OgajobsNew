import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Users, Briefcase, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import LiveChatWidget from '@/components/chat/LiveChatWidget';
import ogaJobsLogo from '/lovable-uploads/74a2fa1b-09a7-4b4d-a017-2e43655ecc11.png';
import { SecureForm } from '@/components/security/SecureForm';
import { ValidatedInput } from '@/components/security/InputValidator';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'client' | 'artisan'>('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { t } = useTranslation('auth');

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate(redirectTo);
      }
    };
    checkUser();
  }, [navigate, redirectTo]);

  const handleSignUp = async (e: React.FormEvent, formData?: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use form data if provided (from SecureForm), otherwise use state
      const signupEmail = formData?.email || email;
      const signupPassword = formData?.password || password;
      const signupFullName = formData?.fullName || fullName;
      const signupPhone = formData?.phone || phone;
      const signupRole = formData?.role || role;

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signupFullName,
            phone: signupPhone,
            role: signupRole
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Insert profile data
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            role,
            created_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // Insert into appropriate table based on role
        const finalRole = formData?.role || role;
        const finalFullName = formData?.fullName || fullName;
        const finalPhone = formData?.phone || phone;
        
        if (finalRole === 'artisan') {
          const { error: artisanError } = await supabase
            .from('artisans')
            .insert({
              email: data.user.email,
              full_name: finalFullName,
              phone: finalPhone
            });
          
          if (artisanError) {
            console.error('Artisan creation error:', artisanError);
          }
        } else {
          const { error: clientError } = await supabase
            .from('clients')
            .insert({
              email: data.user.email,
              full_name: finalFullName,
              phone: finalPhone
            });
          
          if (clientError) {
            console.error('Client creation error:', clientError);
          }
        }

        toast({
          title: t('messages.signUpSuccess'),
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (data: any) => {
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) throw signInError;

      if (authData.user) {
        // Check user role and redirect accordingly
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        toast({
          title: t('messages.signInSuccess'),
          description: "You have been signed in successfully.",
        });

        // Redirect based on role
        if (profile?.role === 'pos_agent') {
          navigate('/agent-dashboard');
        } else if (profile?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate(redirectTo);
        }
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back to Home Button */}
      <Button 
        variant="ghost" 
        className="absolute top-4 left-4 z-20"
        asChild
      >
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </Button>

      {/* Floating watermark logos */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-32 h-32 opacity-3 top-10 left-10 rotate-12 animate-pulse">
          <img 
            src={ogaJobsLogo}
            alt="" 
            className="w-full h-full object-contain aspect-square bg-transparent"
            style={{ background: 'transparent' }}
          />
        </div>
        <div className="absolute w-24 h-24 opacity-3 top-32 right-20 -rotate-12 animate-pulse delay-1000">
          <img 
            src={ogaJobsLogo}
            alt="" 
            className="w-full h-full object-contain aspect-square bg-transparent"
            style={{ background: 'transparent' }}
          />
        </div>
        <div className="absolute w-28 h-28 opacity-3 bottom-20 left-20 rotate-45 animate-pulse delay-2000">
          <img 
            src={ogaJobsLogo}
            alt="" 
            className="w-full h-full object-contain aspect-square bg-transparent"
            style={{ background: 'transparent' }}
          />
        </div>
      </div>
      
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <img 
                src={ogaJobsLogo}
                alt="OgaJobs Logo" 
                className="w-24 h-24 md:w-32 md:h-32 object-contain aspect-square bg-transparent"
                style={{ background: 'transparent' }}
              />
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold">{t('signIn.subtitle')}</CardTitle>
          <CardDescription>
            {t('signIn.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('signIn.title')}</TabsTrigger>
              <TabsTrigger value="signup">{t('signUp.title')}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <SecureForm
                onSubmit={async (data) => await handleSignIn(data)}
                rateLimitKey="auth-signin"
                validationSchema={(data) => {
                  const errors: string[] = [];
                  if (!data.email) errors.push('Email is required');
                  if (!data.password) errors.push('Password is required');
                  return { valid: errors.length === 0, errors };
                }}
                className="space-y-4"
              >
                <ValidatedInput
                  name="email"
                  label={t('signIn.emailPlaceholder')}
                  type="email"
                  placeholder={t('signIn.emailPlaceholder')}
                  required
                />
                <ValidatedInput
                  name="password"
                  label={t('signIn.passwordPlaceholder')}
                  type="password"
                  placeholder={t('signIn.passwordPlaceholder')}
                  required
                  minLength={6}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('signIn.signInButton')}
                </Button>
              </SecureForm>
            </TabsContent>

            <TabsContent value="signup">
              <SecureForm
                onSubmit={async (data) => {
                  // Transform the form data to include role and other fields
                  const signupData = {
                    ...data,
                    role: data.role || role
                  };
                  await handleSignUp({ preventDefault: () => {} } as React.FormEvent, signupData);
                }}
                rateLimitKey="auth-signup"
                validationSchema={(data) => {
                  const errors: string[] = [];
                  if (!data.fullName || data.fullName.length < 2) {
                    errors.push('Full name is required (minimum 2 characters)');
                  }
                  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                    errors.push('Valid email is required');
                  }
                  if (!data.phone || !/^(\+234|0)[789][01]\d{8}$/.test(data.phone.replace(/\s/g, ''))) {
                    errors.push('Valid Nigerian phone number is required');
                  }
                  if (!data.password || data.password.length < 6) {
                    errors.push('Password must be at least 6 characters');
                  }
                  if (!data.role) {
                    errors.push('Please select your role');
                  }
                  return { valid: errors.length === 0, errors };
                }}
                className="space-y-4"
              >
                <ValidatedInput
                  name="fullName"
                  label={t('signUp.fullNamePlaceholder')}
                  type="text"
                  placeholder={t('signUp.fullNamePlaceholder')}
                  required
                  minLength={2}
                />
                <ValidatedInput
                  name="email"
                  label={t('signUp.emailPlaceholder')}
                  type="email"
                  placeholder={t('signUp.emailPlaceholder')}
                  required
                />
                <ValidatedInput
                  name="phone"
                  label={t('signUp.phonePlaceholder')}
                  type="tel"
                  placeholder={t('signUp.phonePlaceholder')}
                  required
                  pattern="^(\+234|0)[789][01]\d{8}$"
                />
                <ValidatedInput
                  name="password"
                  label={t('signUp.passwordPlaceholder')}
                  type="password"
                  placeholder={t('signUp.passwordPlaceholder')}
                  required
                  minLength={6}
                />
                <div className="space-y-3">
                  <Label>{t('signUp.roleLabel')}</Label>
                  <input type="hidden" name="role" value={role} />
                  <RadioGroup value={role} onValueChange={(value: 'client' | 'artisan') => setRole(value)}>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted transition-colors">
                      <RadioGroupItem value="client" id="client" />
                      <Label htmlFor="client" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Users className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-medium">{t('signUp.roleClient')}</div>
                          <div className="text-sm text-muted-foreground">I need to hire skilled artisans</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted transition-colors">
                      <RadioGroupItem value="artisan" id="artisan" />
                      <Label htmlFor="artisan" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-medium">{t('signUp.roleArtisan')}</div>
                          <div className="text-sm text-muted-foreground">I'm a skilled artisan looking for work</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('signUp.signUpButton')}
                </Button>
              </SecureForm>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>{t('security.description')}</span>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">{t('security.posAgent')}</p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/agent-registration">
                  {t('security.posRegister')}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    <LiveChatWidget />
    </>
  );
}