import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IdentityVerification } from '@/components/verification/IdentityVerification';
import { SkillCertification } from '@/components/verification/SkillCertification';
import { PricingTransparency } from '@/components/verification/PricingTransparency';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Award, 
  DollarSign,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';

export default function Verification() {
  const { user, profile } = useAuth();

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
              <p className="text-muted-foreground mb-6">
                You need to be logged in to access the verification system.
              </p>
              <Button asChild>
                <Link to="/auth">
                  Sign In to Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Trust & Verification Center</h1>
          <p className="text-muted-foreground text-lg">
            Build client trust through identity verification, skill certification, and transparent pricing
          </p>
        </div>

        {/* Current Status Overview */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {profile?.trust_score || 0}/100
                </div>
                <div className="text-sm text-muted-foreground">Trust Score</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {profile?.identity_verified ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Shield className="w-5 h-5 text-orange-600" />
                  )}
                  <span className="text-sm font-medium">
                    {profile?.identity_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">Identity Status</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {profile?.skills_verified ? (
                    <Star className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Award className="w-5 h-5 text-gray-600" />
                  )}
                  <span className="text-sm font-medium">
                    {profile?.skills_verified ? 'Certified' : 'None'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">Skills Status</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-700 mb-1">
                  {profile?.verification_level?.toUpperCase() || 'UNVERIFIED'}
                </div>
                <div className="text-sm text-muted-foreground">Verification Level</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Tabs */}
        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="identity" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Identity Verification
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Skill Certification
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pricing Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="space-y-6">
            <IdentityVerification />
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <SkillCertification />
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <PricingTransparency />
          </TabsContent>
        </Tabs>

        {/* Benefits Section */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Why Get Verified?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Build Trust</h4>
                <p className="text-sm text-muted-foreground">
                  Verified artisans get 3x more bookings and higher client confidence
                </p>
              </div>
              <div className="text-center">
                <Star className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Premium Features</h4>
                <p className="text-sm text-muted-foreground">
                  Access priority support, featured listings, and higher earning potential
                </p>
              </div>
              <div className="text-center">
                <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Transparent Pricing</h4>
                <p className="text-sm text-muted-foreground">
                  Fair pricing guidelines protect both you and your clients
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}