import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
import ogaJobsLogo from '@/assets/ogajobs-logo.png';
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone,
            role
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
        if (role === 'artisan') {
          const { error: artisanError } = await supabase
            .from('artisans')
            .insert({
              email: data.user.email,
              full_name: fullName,
              phone
            });
          
          if (artisanError) {
            console.error('Artisan creation error:', artisanError);
          }
        } else {
          const { error: clientError } = await supabase
            .from('clients')
            .insert({
              email: data.user.email,
              full_name: fullName,
              phone
            });
          
          if (clientError) {
            console.error('Client creation error:', clientError);
          }
        }

        toast({
          title: "Account created successfully!",
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
          title: "Welcome back!",
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
      <div className="absolute inset-0 pointer-events-none">
        <img 
          src={ogaJobsLogo} 
          alt="" 
          className="absolute w-20 h-20 opacity-5 top-10 left-10 rotate-12 animate-pulse" 
        />
        <img 
          src={ogaJobsLogo} 
          alt="" 
          className="absolute w-16 h-16 opacity-5 top-32 right-20 -rotate-12 animate-pulse delay-1000" 
        />
        <img 
          src={ogaJobsLogo} 
          alt="" 
          className="absolute w-24 h-24 opacity-5 bottom-20 left-20 rotate-45 animate-pulse delay-2000" 
        />
        <img 
          src={ogaJobsLogo} 
          alt="" 
          className="absolute w-18 h-18 opacity-5 bottom-32 right-10 -rotate-6 animate-pulse delay-3000" 
        />
        <img 
          src={ogaJobsLogo} 
          alt="" 
          className="absolute w-14 h-14 opacity-5 top-1/2 left-5 rotate-90 animate-pulse delay-4000" 
        />
        <img 
          src={ogaJobsLogo} 
          alt="" 
          className="absolute w-22 h-22 opacity-5 top-1/3 right-5 -rotate-45 animate-pulse delay-5000" 
        />
      </div>
      
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <img src={ogaJobsLogo} alt="OgaJobs Logo" className="w-24 h-24" />
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to OgaJobs</CardTitle>
          <CardDescription>
            Nigeria's most trusted platform for artisan services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
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
                  label="Email"
                  type="email"
                  placeholder="your@email.com"
                  required
                />
                <ValidatedInput
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="Your password"
                  required
                  minLength={6}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </SecureForm>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 XXX XXX XXXX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label>I want to:</Label>
                  <RadioGroup value={role} onValueChange={(value: 'client' | 'artisan') => setRole(value)}>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted transition-colors">
                      <RadioGroupItem value="client" id="client" />
                      <Label htmlFor="client" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Users className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-medium">Find Services</div>
                          <div className="text-sm text-muted-foreground">I need to hire skilled artisans</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted transition-colors">
                      <RadioGroupItem value="artisan" id="artisan" />
                      <Label htmlFor="artisan" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-medium">Offer Services</div>
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
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>100% secure and verified platform</span>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Want to become a POS Agent?</p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/agent-registration">
                  Join as POS Agent
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