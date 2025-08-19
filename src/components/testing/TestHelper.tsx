import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock,
  Play,
  AlertTriangle,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'functionality' | 'performance' | 'accessibility' | 'security';
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
}

interface TestSuite {
  name: string;
  tests: TestCase[];
  status: 'idle' | 'running' | 'completed';
  progress: number;
}

export function TestHelper() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      name: 'Core Functionality',
      status: 'idle',
      progress: 0,
      tests: [
        {
          id: 'auth-1',
          name: 'User Authentication',
          description: 'Test user login and logout functionality',
          category: 'functionality',
          status: 'pending'
        },
        {
          id: 'booking-1',
          name: 'Booking Creation',
          description: 'Test booking request creation flow',
          category: 'functionality',
          status: 'pending'
        },
        {
          id: 'search-1',
          name: 'Artisan Search',
          description: 'Test artisan search and filtering',
          category: 'functionality',
          status: 'pending'
        }
      ]
    },
    {
      name: 'Performance',
      status: 'idle',
      progress: 0,
      tests: [
        {
          id: 'perf-1',
          name: 'Page Load Speed',
          description: 'Test page load times under 3 seconds',
          category: 'performance',
          status: 'pending'
        },
        {
          id: 'perf-2',
          name: 'Image Optimization',
          description: 'Verify images are optimized and lazy loaded',
          category: 'performance',
          status: 'pending'
        },
        {
          id: 'perf-3',
          name: 'Bundle Size',
          description: 'Check if bundle size is within limits',
          category: 'performance',
          status: 'pending'
        }
      ]
    },
    {
      name: 'Accessibility',
      status: 'idle',
      progress: 0,
      tests: [
        {
          id: 'a11y-1',
          name: 'Keyboard Navigation',
          description: 'Test navigation using only keyboard',
          category: 'accessibility',
          status: 'pending'
        },
        {
          id: 'a11y-2',
          name: 'Screen Reader Support',
          description: 'Verify proper ARIA labels and semantic markup',
          category: 'accessibility',
          status: 'pending'
        },
        {
          id: 'a11y-3',
          name: 'Color Contrast',
          description: 'Check color contrast meets WCAG standards',
          category: 'accessibility',
          status: 'pending'
        }
      ]
    }
  ]);

  const [deviceTests, setDeviceTests] = useState({
    desktop: 'pending',
    tablet: 'pending',
    mobile: 'pending'
  });

  const runTestSuite = async (suiteIndex: number) => {
    const newSuites = [...testSuites];
    const suite = newSuites[suiteIndex];
    
    suite.status = 'running';
    suite.progress = 0;
    setTestSuites(newSuites);

    for (let i = 0; i < suite.tests.length; i++) {
      const test = suite.tests[i];
      test.status = 'running';
      setTestSuites([...newSuites]);

      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Simulate test results (90% pass rate for demo)
      const passed = Math.random() > 0.1;
      test.status = passed ? 'passed' : 'failed';
      test.duration = Math.random() * 3000 + 500;
      
      if (!passed) {
        test.error = 'Test failed - see console for details';
      }

      suite.progress = ((i + 1) / suite.tests.length) * 100;
      setTestSuites([...newSuites]);
    }

    suite.status = 'completed';
    setTestSuites([...newSuites]);
  };

  const runDeviceTests = async () => {
    const devices = ['desktop', 'tablet', 'mobile'] as const;
    
    for (const device of devices) {
      setDeviceTests(prev => ({ ...prev, [device]: 'running' }));
      
      // Simulate device testing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const passed = Math.random() > 0.2;
      setDeviceTests(prev => ({ ...prev, [device]: passed ? 'passed' : 'failed' }));
    }
  };

  const runAllTests = async () => {
    for (let i = 0; i < testSuites.length; i++) {
      await runTestSuite(i);
    }
    await runDeviceTests();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running': return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      default: return <TestTube className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-400';
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'desktop': return <Monitor className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const totalTests = testSuites.reduce((acc, suite) => acc + suite.tests.length, 0);
  const passedTests = testSuites.reduce((acc, suite) => 
    acc + suite.tests.filter(test => test.status === 'passed').length, 0
  );
  const failedTests = testSuites.reduce((acc, suite) => 
    acc + suite.tests.filter(test => test.status === 'failed').length, 0
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              <CardTitle>Test Suite</CardTitle>
            </div>
            <Button onClick={runAllTests}>
              <Play className="w-4 h-4 mr-2" />
              Run All Tests
            </Button>
          </div>
          <CardDescription>
            Automated testing for functionality, performance, and accessibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{passedTests}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failedTests}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalTests}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Suites */}
      {testSuites.map((suite, suiteIndex) => (
        <Card key={suite.name}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{suite.name}</CardTitle>
              <div className="flex items-center gap-2">
                {suite.status === 'running' && (
                  <Progress value={suite.progress} className="w-20" />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runTestSuite(suiteIndex)}
                  disabled={suite.status === 'running'}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suite.tests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <div className="font-medium">{test.name}</div>
                      <div className="text-sm text-muted-foreground">{test.description}</div>
                      {test.error && (
                        <div className="text-xs text-red-600 mt-1">{test.error}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      test.category === 'functionality' ? 'default' :
                      test.category === 'performance' ? 'secondary' :
                      test.category === 'accessibility' ? 'outline' : 'destructive'
                    }>
                      {test.category}
                    </Badge>
                    {test.duration && (
                      <span className="text-xs text-muted-foreground">
                        {test.duration.toFixed(0)}ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Device Testing */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Device Compatibility</CardTitle>
            <Button variant="outline" size="sm" onClick={runDeviceTests}>
              <Play className="w-4 h-4 mr-2" />
              Test Devices
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(deviceTests).map(([device, status]) => (
              <div key={device} className="flex items-center gap-2 p-3 border rounded-lg">
                {getDeviceIcon(device)}
                <span className="flex-1 capitalize">{device}</span>
                {getStatusIcon(status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Testing Tips:</strong> Run tests regularly during development. 
          Focus on fixing failed functionality tests first, then performance optimizations.
        </AlertDescription>
      </Alert>
    </div>
  );
}