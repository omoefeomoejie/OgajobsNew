import { PageWrapper } from '@/components/layout/PageWrapper';
import { SignupFlowTest } from '@/components/testing/SignupFlowTest';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TestSignup() {
  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Signup Flow Testing</h1>
            <p className="text-muted-foreground">
              Test the optimized signup process for both client and artisan roles to ensure everything works correctly.
            </p>
          </div>
          
          <SignupFlowTest />
        </div>
      </div>
    </PageWrapper>
  );
}