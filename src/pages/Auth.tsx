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
import { Logo } from '@/components/ui/logo';
import { SecureForm } from '@/components/security/SecureForm';
import { ValidatedInput } from '@/components/security/InputValidator';
import { logger } from '@/lib/logger';

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

      logger.debug('Enhanced signup process initiated', {
        role: signupRole,
        hasEmail: !!signupEmail,
        hasFullName: !!signupFullName,
        hasPhone: !!signupPhone
      });

      // Validate role selection
      if (!signupRole || !['client', 'artisan'].includes(signupRole)) {
        throw new Error('Please select a valid role (Client or Artisan)');
      }

      // Validate required fields
      if (!signupEmail || !signupPassword || !signupFullName || !signupPhone) {
        throw new Error('All fields are required');
      }

      const redirectUrl = `${window.location.origin}/`;
      
      logger.debug('Creating user authentication record');
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

      if (signUpError) {
        console.error('Auth signup error:', signUpError);
        throw signUpError;
      }

      if (!data.user) {
        throw new Error('User creation failed - no user data returned');
      }

      logger.info('User authentication record created successfully');

      // Create profile immediately with enhanced error handling
      logger.debug('Creating user profile');
      try {
        const profileData = {
          id: data.user.id,
          email: data.user.email,
          role: signupRole,
          created_at: new Date().toISOString()
        };

        const { data: profileResult, error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

        if (profileError) {
          logger.error('Profile creation failed, attempting fallback', {
            errorCode: profileError.code,
            errorMessage: profileError.message
          });
          
          // Try to create profile with upsert as fallback
          logger.debug('Attempting profile upsert as fallback');
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' });

          if (upsertError) {
            logger.error('Profile upsert fallback failed', { errorCode: upsertError.code });
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }
          
          logger.info('Profile created via upsert fallback');
        } else {
          logger.info('Profile created successfully');
        }

      } catch (profileCreationError) {
        logger.error('Profile creation process failed', { error: profileCreationError });
        // Don't fail the entire signup process, but log the error
        toast({
          title: "Profile Setup Warning",
          description: "Account created but profile setup had issues. Please contact support if you experience problems.",
          variant: "destructive",
        });
      }

      // Insert into role-specific table with enhanced error handling
      logger.debug('Creating role-specific record', { role: signupRole });
      try {
        const roleData = {
          email: data.user.email,
          full_name: signupFullName,
          phone: signupPhone
        };

        if (signupRole === 'artisan') {
          logger.debug('Creating artisan record');
          const { error: artisanError } = await supabase
            .from('artisans')
            .insert(roleData);
          
          if (artisanError) {
            logger.error('Artisan creation error', { errorCode: artisanError.code });
            // Don't fail signup for this, just log it
          } else {
            logger.info('Artisan record created successfully');
          }
        } else {
          logger.debug('Creating client record');
          const { error: clientError } = await supabase
            .from('clients')
            .insert(roleData);
          
          if (clientError) {
            logger.error('Client creation error', { errorCode: clientError.code });
            // Don't fail signup for this, just log it
          } else {
            logger.info('Client record created successfully');
          }
        }
      } catch (roleRecordError) {
        logger.error('Role-specific record creation failed', { error: roleRecordError });
        // Don't fail the signup process for this
      }

      logger.info('Signup process completed successfully');

      toast({
        title: t('messages.signUpSuccess'),
        description: `Account created successfully! Please check your email to verify your account.`,
      });

      // Clear form after successful signup
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      setRole('client');

    } catch (error: any) {
      logger.error('Signup process failed', { error: error.message });
      const errorMessage = error.message || 'An error occurred during sign up';
      setError(errorMessage);
      
      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
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

        // Redirect based on role - use window.location for reliable redirect
        setTimeout(async () => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', authData.user.id)
              .single();

            if (profileData?.role) {
              switch (profileData.role) {
                case 'pos_agent':
                case 'agent':
                  window.location.href = '/agent-dashboard';
                  break;
                case 'admin':
                  window.location.href = '/admin-dashboard';
                  break;
                case 'artisan':
                  window.location.href = '/dashboard';
                  break;
                case 'client':
                default:
                  window.location.href = '/dashboard';
              }
            } else {
              window.location.href = '/dashboard';
            }
          } catch (error) {
            logger.error('Profile fetch error during redirect', { error });
            window.location.href = '/dashboard';
          }
        }, 500);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during sign in');
      toast({
        title: "Sign In Failed",
        description: error.message || 'An error occurred during sign in',
        variant: "destructive",
      });
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
          <Logo variant="icon" className="w-full h-full" />
        </div>
        <div className="absolute w-24 h-24 opacity-3 top-32 right-20 -rotate-12 animate-pulse delay-1000">
          <Logo variant="icon" className="w-full h-full" />
        </div>
        <div className="absolute w-28 h-28 opacity-3 bottom-20 left-20 rotate-45 animate-pulse delay-2000">
          <Logo variant="icon" className="w-full h-full" />
        </div>
      </div>
      
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <Logo variant="icon" size="xl" />
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
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('signIn.emailPlaceholder')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('signIn.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('signIn.passwordPlaceholder')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('signIn.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('signIn.signInButton')}
                </Button>
              </form>
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
                  
                  // Enhanced validation with specific error messages
                  if (!data.fullName || data.fullName.trim().length < 2) {
                    errors.push('Full name is required and must be at least 2 characters');
                  }
                  
                  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                    errors.push('Please enter a valid email address');
                  }
                  
                  if (!data.phone) {
                    errors.push('Phone number is required');
                  } else {
                    // Enhanced phone validation for Nigerian numbers
                    const cleanPhone = data.phone.replace(/\s|-|\(|\)/g, '');
                    if (!/^(\+234|234|0)[789][01]\d{8}$/.test(cleanPhone)) {
                      errors.push('Please enter a valid Nigerian phone number (e.g., +2348012345678, 08012345678)');
                    }
                  }
                  
                  if (!data.password) {
                    errors.push('Password is required');
                  } else if (data.password.length < 6) {
                    errors.push('Password must be at least 6 characters long');
                  } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(data.password)) {
                    errors.push('Password should contain at least one uppercase and one lowercase letter');
                  }
                  
                  if (!data.role || !['client', 'artisan'].includes(data.role)) {
                    errors.push('Please select your role: either Client or Artisan');
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
                  <Label className="text-base font-medium">{t('signUp.roleLabel')} <span className="text-destructive">*</span></Label>
                  <p className="text-sm text-muted-foreground">Choose how you'll use OgaJobs platform:</p>
                  <input type="hidden" name="role" value={role} />
                  <RadioGroup 
                    value={role} 
                    onValueChange={(value: 'client' | 'artisan') => setRole(value)}
                    className="space-y-3"
                  >
                    <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group data-[state=checked]:border-primary data-[state=checked]:bg-primary/5">
                      <RadioGroupItem value="client" id="client" className="mt-1" />
                      <Label htmlFor="client" className="flex items-start gap-3 cursor-pointer flex-1 group-hover:text-foreground">
                        <Users className="w-5 h-5 text-primary mt-0.5" />
                        <div className="space-y-1">
                          <div className="font-medium text-base">{t('signUp.roleClient')}</div>
                          <div className="text-sm text-muted-foreground">
                            I need to hire skilled artisans for various services and projects
                          </div>
                          <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md inline-block">
                            Perfect for homeowners, businesses, and project managers
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group data-[state=checked]:border-primary data-[state=checked]:bg-primary/5">
                      <RadioGroupItem value="artisan" id="artisan" className="mt-1" />
                      <Label htmlFor="artisan" className="flex items-start gap-3 cursor-pointer flex-1 group-hover:text-foreground">
                        <Briefcase className="w-5 h-5 text-primary mt-0.5" />
                        <div className="space-y-1">
                          <div className="font-medium text-base">{t('signUp.roleArtisan')}</div>
                          <div className="text-sm text-muted-foreground">
                            I'm a skilled professional offering services to clients
                          </div>
                          <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md inline-block">
                            For contractors, craftsmen, and service professionals
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                  {/* Role Selection Validation Warning */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800">
                      <strong>Important:</strong> Your role determines your dashboard and available features. 
                      Choose carefully as this affects your entire experience on the platform.
                    </p>
                  </div>
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