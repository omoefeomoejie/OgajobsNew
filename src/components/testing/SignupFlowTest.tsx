import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Users, Briefcase, TestTube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  duration?: number;
}

interface SignupTest {
  role: 'client' | 'artisan';
  email: string;
  results: TestResult[];
  completed: boolean;
  success: boolean;
}

export function SignupFlowTest() {
  const [tests, setTests] = useState<SignupTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const generateTestData = (role: 'client' | 'artisan') => ({
    email: `test-${role}-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    fullName: `Test ${role.charAt(0).toUpperCase() + role.slice(1)} User`,
    phone: `+234${Math.floor(8000000000 + Math.random() * 1000000000)}`,
    role
  });

  const addTestResult = (testIndex: number, result: TestResult) => {
    setTests(prev => prev.map((test, index) => 
      index === testIndex 
        ? { ...test, results: [...test.results, result] }
        : test
    ));
  };

  const completeTest = (testIndex: number, success: boolean) => {
    setTests(prev => prev.map((test, index) => 
      index === testIndex 
        ? { ...test, completed: true, success }
        : test
    ));
  };

  const testSignupFlow = async (role: 'client' | 'artisan', testIndex: number) => {
    const testData = generateTestData(role);
    const startTime = Date.now();

    try {
      // Step 1: Test auth signup
      addTestResult(testIndex, {
        step: 'Authentication Creation',
        success: false,
        message: 'Creating user authentication...'
      });

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: testData.email,
        password: testData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            full_name: testData.fullName,
            phone: testData.phone,
            role: testData.role
          }
        }
      });

      if (signUpError || !data.user) {
        addTestResult(testIndex, {
          step: 'Authentication Creation',
          success: false,
          message: `Failed: ${signUpError?.message || 'No user created'}`,
          duration: Date.now() - startTime
        });
        completeTest(testIndex, false);
        return;
      }

      addTestResult(testIndex, {
        step: 'Authentication Creation',
        success: true,
        message: 'User authentication created successfully',
        duration: Date.now() - startTime
      });

      // Step 2: Test profile creation
      const profileStart = Date.now();
      addTestResult(testIndex, {
        step: 'Profile Creation',
        success: false,
        message: 'Creating user profile...'
      });

      const { data: profileResult, error: profileError } = await supabase
        .rpc('create_user_profile', {
          p_user_id: data.user.id,
          p_email: data.user.email!,
          p_role: testData.role,
          p_full_name: testData.fullName,
          p_phone: testData.phone
        });

      if (profileError || !(profileResult as any)?.success) {
        addTestResult(testIndex, {
          step: 'Profile Creation',
          success: false,
          message: `Failed: ${profileError?.message || (profileResult as any)?.error || 'Profile creation failed'}`,
          duration: Date.now() - profileStart
        });
        completeTest(testIndex, false);
        return;
      }

      addTestResult(testIndex, {
        step: 'Profile Creation',
        success: true,
        message: 'Profile created successfully',
        duration: Date.now() - profileStart
      });

      // Step 3: Verify profile exists
      const verifyStart = Date.now();
      addTestResult(testIndex, {
        step: 'Profile Verification',
        success: false,
        message: 'Verifying profile exists...'
      });

      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileFetchError || !profile || profile.role !== testData.role) {
        addTestResult(testIndex, {
          step: 'Profile Verification',
          success: false,
          message: `Failed: Profile not found or incorrect role (expected: ${testData.role}, got: ${profile?.role})`,
          duration: Date.now() - verifyStart
        });
        completeTest(testIndex, false);
        return;
      }

      addTestResult(testIndex, {
        step: 'Profile Verification',
        success: true,
        message: `Profile verified with correct role: ${profile.role}`,
        duration: Date.now() - verifyStart
      });

      // Step 4: Check trust metrics queue (for artisans)
      if (role === 'artisan') {
        const trustStart = Date.now();
        addTestResult(testIndex, {
          step: 'Trust Metrics Queue',
          success: false,
          message: 'Checking trust metrics queuing...'
        });

        // Wait a moment for trigger to fire
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: queueItem } = await supabase
          .from('trust_metrics_queue')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        addTestResult(testIndex, {
          step: 'Trust Metrics Queue',
          success: !!queueItem,
          message: queueItem 
            ? `Trust metrics queued for background processing (status: ${queueItem.status})`
            : 'Trust metrics not queued (optional - signup still successful)',
          duration: Date.now() - trustStart
        });
      }

      completeTest(testIndex, true);

      toast({
        title: `${role.toUpperCase()} Signup Test Passed! ✅`,
        description: `All signup steps completed successfully for ${role} role.`,
      });

    } catch (error: any) {
      addTestResult(testIndex, {
        step: 'Unexpected Error',
        success: false,
        message: `Unexpected error: ${error.message}`,
        duration: Date.now() - startTime
      });
      completeTest(testIndex, false);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([
      { role: 'client', email: '', results: [], completed: false, success: false },
      { role: 'artisan', email: '', results: [], completed: false, success: false }
    ]);

    try {
      // Update with actual test emails
      const clientEmail = generateTestData('client').email;
      const artisanEmail = generateTestData('artisan').email;
      
      setTests(prev => [
        { ...prev[0], email: clientEmail },
        { ...prev[1], email: artisanEmail }
      ]);

      // Run tests for both roles
      await Promise.all([
        testSignupFlow('client', 0),
        testSignupFlow('artisan', 1)
      ]);

    } finally {
      setIsRunning(false);
    }
  };

  const clearTests = () => {
    setTests([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Signup Flow Testing
          </CardTitle>
          <CardDescription>
            Test both client and artisan signup flows to ensure they work correctly after optimization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              {isRunning ? 'Running Tests...' : 'Run Signup Tests'}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearTests}
              disabled={isRunning || tests.length === 0}
            >
              Clear Results
            </Button>
          </div>

          {tests.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {tests.map((test, index) => (
                <Card key={test.role} className={`${test.completed ? (test.success ? 'border-green-200' : 'border-red-200') : 'border-blue-200'}`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {test.role === 'client' ? <Users className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                      {test.role.toUpperCase()} Role Test
                      {test.completed && (
                        <Badge variant={test.success ? 'default' : 'destructive'}>
                          {test.success ? 'PASSED' : 'FAILED'}
                        </Badge>
                      )}
                    </CardTitle>
                    {test.email && (
                      <p className="text-sm text-muted-foreground font-mono">{test.email}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {test.results.map((result, resultIndex) => (
                      <div key={resultIndex} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{result.step}</div>
                          <div className="text-xs text-muted-foreground break-words">{result.message}</div>
                          {result.duration && (
                            <div className="text-xs text-muted-foreground">{result.duration}ms</div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {!test.completed && test.results.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        Waiting for test to start...
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {tests.length > 0 && tests.every(t => t.completed) && (
            <Alert className={tests.every(t => t.success) ? 'border-green-200' : 'border-red-200'}>
              <AlertDescription className="font-medium">
                {tests.every(t => t.success) 
                  ? '🎉 All signup flows are working correctly! Both client and artisan registrations completed successfully.'
                  : '⚠️ Some signup flows failed. Check the results above for details.'
                }
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}