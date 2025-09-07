import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Play, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  duration?: number;
}

interface SignupTest {
  role: 'client' | 'artisan';
  results: TestResult[];
  success: boolean;
  completed: boolean;
}

export function SignupFlowTest() {
  const [tests, setTests] = useState<SignupTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const generateTestData = (role: 'client' | 'artisan') => {
    const timestamp = Date.now();
    return {
      email: `test-${role}-${timestamp}@example.com`,
      password: 'TestPassword123!',
      full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      role
    };
  };

  const addTestResult = (role: 'client' | 'artisan', result: TestResult) => {
    setTests(prev => prev.map(test => 
      test.role === role 
        ? { ...test, results: [...test.results, result] }
        : test
    ));
  };

  const completeTest = (role: 'client' | 'artisan', success: boolean) => {
    setTests(prev => prev.map(test => 
      test.role === role 
        ? { ...test, success, completed: true }
        : test
    ));
  };

  const testSignupFlow = async (role: 'client' | 'artisan') => {
    const testData = generateTestData(role);
    
    try {
      // Step 1: Test signup
      const startTime = Date.now();
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: testData.email,
        password: testData.password,
        options: {
          data: {
            full_name: testData.full_name,
            role: testData.role
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      const signupDuration = Date.now() - startTime;

      if (signupError) {
        addTestResult(role, {
          step: 'Authentication Signup',
          success: false,
          message: `Signup failed: ${signupError.message}`,
          duration: signupDuration
        });
        completeTest(role, false);
        return;
      }

      addTestResult(role, {
        step: 'Authentication Signup',
        success: true,
        message: 'User successfully created in auth.users',
        duration: signupDuration
      });

      // Wait a moment for triggers to process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Test profile creation
      const profileStartTime = Date.now();
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signupData.user?.id)
        .single();

      const profileDuration = Date.now() - profileStartTime;

      if (profileError || !profileData) {
        addTestResult(role, {
          step: 'Profile Creation',
          success: false,
          message: `Profile not found: ${profileError?.message || 'Unknown error'}`,
          duration: profileDuration
        });
        completeTest(role, false);
        return;
      }

      addTestResult(role, {
        step: 'Profile Creation',
        success: true,
        message: `Profile created with role: ${profileData.role}`,
        duration: profileDuration
      });

      // Step 3: Test role assignment
      const roleCorrect = profileData.role === role;
      addTestResult(role, {
        step: 'Role Assignment',
        success: roleCorrect,
        message: roleCorrect 
          ? `Role correctly assigned as ${role}` 
          : `Role mismatch: expected ${role}, got ${profileData.role}`,
        duration: 0
      });

      // Step 4: Cleanup - sign out
      await supabase.auth.signOut();
      
      addTestResult(role, {
        step: 'Cleanup',
        success: true,
        message: 'Test user signed out successfully',
        duration: 0
      });

      completeTest(role, roleCorrect);

    } catch (error) {
      logger.error('Signup test error', { role, error });
      addTestResult(role, {
        step: 'Error Handling',
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 0
      });
      completeTest(role, false);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([
      { role: 'client', results: [], success: false, completed: false },
      { role: 'artisan', results: [], success: false, completed: false }
    ]);

    try {
      // Run both tests concurrently
      await Promise.all([
        testSignupFlow('client'),
        testSignupFlow('artisan')
      ]);
    } catch (error) {
      logger.error('Test execution error', { error });
    } finally {
      setIsRunning(false);
    }
  };

  const clearTests = () => {
    setTests([]);
  };

  const getStepIcon = (result: TestResult) => {
    if (result.success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const allTestsPassed = tests.length > 0 && tests.every(test => test.completed && test.success);
  const anyTestsFailed = tests.some(test => test.completed && !test.success);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Signup Flow Testing
        </CardTitle>
        <CardDescription>
          Test the complete user signup process for both client and artisan roles to ensure all components work correctly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>
          
          {tests.length > 0 && (
            <Button 
              variant="outline" 
              onClick={clearTests}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Clear Results
            </Button>
          )}
        </div>

        {tests.length > 0 && (
          <div className="space-y-4">
            {tests.map((test) => (
              <Card key={test.role} className="border-l-4 border-l-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">
                      {test.role} Signup Test
                    </CardTitle>
                    <Badge variant={
                      !test.completed ? "secondary" : 
                      test.success ? "default" : "destructive"
                    }>
                      {!test.completed ? "Running..." : 
                       test.success ? "Passed" : "Failed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {test.results.map((result, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded border">
                        {getStepIcon(result)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{result.step}</span>
                            {result.duration !== undefined && (
                              <span className="text-sm text-muted-foreground">
                                {result.duration}ms
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {result.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {tests.every(test => test.completed) && (
              <Alert className={allTestsPassed ? "border-green-200 bg-green-50" : anyTestsFailed ? "border-red-200 bg-red-50" : ""}>
                <AlertDescription className="flex items-center gap-2">
                  {allTestsPassed ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      All signup flows passed successfully! The authentication system is working correctly.
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      Some tests failed. Please review the results above and check your authentication configuration.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}