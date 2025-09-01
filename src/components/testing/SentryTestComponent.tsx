import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { sentryManager } from '@/lib/monitoring/sentry';
import { errorReporting } from '@/lib/monitoring/errorReporting';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export const SentryTestComponent: React.FC = () => {
  const [testResults, setTestResults] = React.useState<{
    sentryEnabled: boolean;
    testsPassed: number;
    totalTests: number;
    lastTest: string | null;
  }>({
    sentryEnabled: sentryManager.isEnabled(),
    testsPassed: 0,
    totalTests: 4,
    lastTest: null
  });

  const runTest = async (testName: string, testFn: () => Promise<void> | void) => {
    try {
      await testFn();
      setTestResults(prev => ({
        ...prev,
        testsPassed: prev.testsPassed + 1,
        lastTest: `✅ ${testName} - PASSED`
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        lastTest: `❌ ${testName} - FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  const testSentryError = async () => {
    const testError = new Error('Test error for Sentry integration');
    testError.stack = 'Test stack trace\n  at testSentryError\n  at SentryTestComponent';
    
    sentryManager.captureError(testError, {
      component: 'SentryTestComponent',
      action: 'manual_test',
      testType: 'error_capture'
    });
    
    // Sentry error test completed
  };

  const testSentryMessage = async () => {
    sentryManager.captureMessage('Test message for Sentry integration', 'info', {
      component: 'SentryTestComponent',
      action: 'manual_test',
      testType: 'message_capture'
    });
    
    // Sentry message test completed
  };

  const testErrorReporting = async () => {
    errorReporting.captureError('Test error via error reporting system', {
      component: 'SentryTestComponent',
      action: 'manual_test'
    }, 'medium');
    
    // Error reporting test completed
  };

  const testUserContext = async () => {
    sentryManager.setUserContext({
      id: 'test-user-123',
      email: 'test@example.com',
      username: 'testuser'
    });
    
    sentryManager.addBreadcrumb('Test breadcrumb', 'test', {
      testData: 'breadcrumb test'
    });
    
    // User context test completed
  };

  const runAllTests = async () => {
    setTestResults(prev => ({ ...prev, testsPassed: 0, lastTest: null }));
    
    await runTest('Sentry Error Capture', testSentryError);
    await runTest('Sentry Message Capture', testSentryMessage);
    await runTest('Error Reporting Integration', testErrorReporting);
    await runTest('User Context & Breadcrumbs', testUserContext);
  };

  const getStatusIcon = () => {
    if (!testResults.sentryEnabled) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (testResults.testsPassed === testResults.totalTests) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (!testResults.sentryEnabled) {
      return 'Sentry Disabled';
    }
    if (testResults.testsPassed === testResults.totalTests) {
      return 'All Tests Passed';
    }
    if (testResults.testsPassed > 0) {
      return 'Partially Working';
    }
    return 'Not Tested';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Sentry Integration Test
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant={testResults.sentryEnabled ? 'default' : 'destructive'}>
            {testResults.sentryEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
          <Badge variant="outline">
            {testResults.testsPassed}/{testResults.totalTests} Tests
          </Badge>
          <Badge variant="secondary">
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => runTest('Sentry Error', testSentryError)}
            disabled={!testResults.sentryEnabled}
          >
            Test Error Capture
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => runTest('Sentry Message', testSentryMessage)}
            disabled={!testResults.sentryEnabled}
          >
            Test Message
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => runTest('Error Reporting', testErrorReporting)}
          >
            Test Error Reporting
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => runTest('User Context', testUserContext)}
            disabled={!testResults.sentryEnabled}
          >
            Test User Context
          </Button>
        </div>
        
        <Button 
          onClick={runAllTests}
          className="w-full"
          variant={testResults.sentryEnabled ? 'default' : 'secondary'}
        >
          Run All Tests
        </Button>
        
        {testResults.lastTest && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-mono">{testResults.lastTest}</p>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Check browser console for detailed logs</p>
          <p>• Check Sentry dashboard for captured events</p>
          <p>• Errors are also sent to Supabase monitoring</p>
          {!testResults.sentryEnabled && (
            <p className="text-yellow-600">• Configure SENTRY_DSN in Supabase secrets to enable</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};