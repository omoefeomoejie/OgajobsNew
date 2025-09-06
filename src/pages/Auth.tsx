import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';
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
import { WelcomeEmailService } from '@/components/auth/WelcomeEmailService';
import { EmailConfirmationScreen } from '@/components/auth/EmailConfirmationScreen';
import { useNavigation } from '@/contexts/NavigationContext';

// Helper function to create user profile after email confirmation
const createUserProfile = async (user: any, signupData: any) => {
  const { data: profileResult, error: profileError } = await supabase
    .rpc('create_user_profile', {
      p_user_id: user.id,
      p_email: user.email!,
      p_role: signupData.role,
      p_full_name: signupData.fullName,
      p_phone: signupData.phone
    });

  if (profileError) {
    console.error('Profile creation failed:', profileError);
    throw new Error('Failed to set up your profile. Please contact support.');
  }

  if (!(profileResult as any)?.success) {
    const errorMsg = (profileResult as any)?.error || 'Profile setup failed';
    throw new Error(errorMsg);
  }

  // Send welcome email after profile is created
  try {
    await WelcomeEmailService.sendWelcomeEmail({
      userId: user.id,
      email: user.email!,
      fullName: signupData.fullName,
      role: signupData.role
    });
  } catch (emailError) {
    logger.warn('Welcome email failed but profile created successfully', { 
      userId: user.id, 
      error: emailError 
    });
  }
};

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'client' | 'artisan'>('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [signupData, setSignupData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { t } = useTranslation('auth');
  const navigation = useNavigation();

  // Enhanced redirect handling with navigation context
  const redirectTo = searchParams.get('redirect') || navigation.getSmartRedirectPath();

  // Load stored signup data on component mount
  useEffect(() => {
    const stored = localStorage.getItem('ogajobs_signup_data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setSignupData(data);
        setShowConfirmation(true);
      } catch (error) {
        localStorage.removeItem('ogajobs_signup_data');
      }
    }
  }, []);

  // Track intended destination before requiring auth
  useEffect(() => {
    const redirectParam = searchParams.get('redirect');
    if (redirectParam && redirectParam !== '/') {
      navigation.setIntendedDestination(redirectParam);
    }
  }, [searchParams, navigation]);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Use smart redirect instead of simple redirectTo
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        navigation.redirectAfterAuth(profile?.role);
      }
    };
    checkUser();

    // Handle email confirmation callback
    const handleAuthStateChange = async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if this is a new signup that just got confirmed
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('confirmed') === 'true') {
          // User just confirmed their email - create their profile
          try {
            const userData = session.user.user_metadata || {};
            await createUserProfile(session.user, {
              role: userData.role || 'client',
              fullName: userData.full_name || 'User',
              phone: userData.phone || '',
              email: session.user.email
            });
            
            toast({
              title: "Email Confirmed! 🎉",
              description: "Your account is now active. Welcome to OgaJobs!",
            });
            
            // Clear the confirmed parameter and use smart redirect
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
            
            // Smart redirect based on role
            navigation.redirectAfterAuth(userData.role || 'client');
            
          } catch (error: any) {
            logger.error('Profile creation failed after email confirmation:', error);
            toast({
              title: "Setup Error",
              description: "Account confirmed but profile setup failed. Please contact support.",
              variant: "destructive",
            });
          }
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    return () => subscription.unsubscribe();
  }, [navigate, redirectTo, toast]);

  const handleResendEmail = async (email: string, password: string, userData: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?confirmed=true`,
          data: {
            full_name: userData.fullName,
            phone: userData.phone,
            role: userData.role
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('Email already confirmed. Please try signing in.');
        }
        throw error;
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleBackToSignup = () => {
    setShowConfirmation(false);
    setSignupData(null);
    localStorage.removeItem('ogajobs_signup_data');
    // Clear form
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setRole('client');
  };

  const handleSignUp = async (e: React.FormEvent, formData?: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use form data if provided (from SecureForm), otherwise use state
      const signupData = {
        email: formData?.email || email,
        password: formData?.password || password,
        fullName: formData?.fullName || fullName,
        phone: formData?.phone || phone,
        role: formData?.role || role
      };

      logger.debug('Signup process initiated', {
        role: signupData.role,
        hasEmail: !!signupData.email
      });

      // Validate required fields
      if (!signupData.email || !signupData.password || !signupData.fullName || !signupData.phone) {
        throw new Error('All fields are required');
      }

      if (!signupData.role || !['client', 'artisan'].includes(signupData.role)) {
        throw new Error('Please select a valid role (Client or Artisan)');
      }

      // Create user with email confirmation enabled
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?confirmed=true`,
          data: {
            full_name: signupData.fullName,
            phone: signupData.phone,
            role: signupData.role
          }
        }
      });

      if (signUpError) {
        // Provide user-friendly error messages
        if (signUpError.message.includes('already registered')) {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        if (signUpError.message.includes('password')) {
          throw new Error('Password must be at least 6 characters long.');
        }
        throw new Error(signUpError.message || 'Failed to create account');
      }

      if (!data.user) {
        throw new Error('Account creation failed. Please try again.');
      }

      // Check if user needs email confirmation
      if (!data.session) {
        // Store signup data for resend functionality
        const confirmationData = {
          email: signupData.email,
          password: signupData.password,
          fullName: signupData.fullName,
          phone: signupData.phone,
          role: signupData.role
        };
        
        localStorage.setItem('ogajobs_signup_data', JSON.stringify(confirmationData));
        setSignupData(confirmationData);
        setShowConfirmation(true);

        logger.info('Signup initiated - confirmation email sent', { 
          email: signupData.email,
          role: signupData.role 
        });
        
        return; // Exit early - user needs to confirm email
      }

      // If we have a session, user is confirmed, proceed with profile creation
      await createUserProfile(data.user, signupData);
      
      // Success message for immediate login
      toast({
        title: "Account Created Successfully! 🎉",
        description: "Welcome to OgaJobs! You can start using your account immediately.",
      });

      logger.info('Signup completed successfully', { role: signupData.role });

    } catch (error: any) {
      logger.error('Signup failed:', { error: error.message });
      
      const errorMessage = error.message || 'An unexpected error occurred during sign up';
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

        // Enhanced redirect with navigation context
        setTimeout(async () => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', authData.user.id)
              .single();

            // Use smart redirect from navigation context
            navigation.redirectAfterAuth(profileData?.role);
          } catch (error) {
            logger.error('Profile fetch error during redirect', { error });
            // Fallback to basic redirect
            navigation.redirectAfterAuth();
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
      
      {showConfirmation && signupData ? (
        <EmailConfirmationScreen
          email={signupData.email}
          fullName={signupData.fullName}
          role={signupData.role}
          onBackToSignup={handleBackToSignup}
          onResendEmail={handleResendEmail}
          signupData={signupData}
        />
      ) : (
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
      )}
    </div>
    <LiveChatWidget />
    </>
  );
}