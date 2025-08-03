import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Star, 
  CheckCircle, 
  Award,
  AlertTriangle
} from 'lucide-react';

interface TrustBadgeProps {
  score: number;
  verificationLevel: string;
  identityVerified: boolean;
  skillsVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const TrustBadge = ({ 
  score, 
  verificationLevel, 
  identityVerified, 
  skillsVerified,
  size = 'md',
  showDetails = false 
}: TrustBadgeProps) => {
  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-green-600 border-green-200 bg-green-50';
    if (score >= 60) return 'text-blue-600 border-blue-200 bg-blue-50';
    if (score >= 30) return 'text-yellow-600 border-yellow-200 bg-yellow-50';
    return 'text-red-600 border-red-200 bg-red-50';
  };

  const getTrustIcon = (score: number) => {
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
    
    if (score >= 80) return <Shield className={`${iconSize} text-green-600`} />;
    if (score >= 60) return <Star className={`${iconSize} text-blue-600`} />;
    if (score >= 30) return <CheckCircle className={`${iconSize} text-yellow-600`} />;
    return <AlertTriangle className={`${iconSize} text-red-600`} />;
  };

  const getTrustLabel = (score: number) => {
    if (score >= 80) return 'Highly Trusted';
    if (score >= 60) return 'Trusted';
    if (score >= 30) return 'Verified';
    return 'New Artisan';
  };

  const getVerificationBadgeVariant = (level: string) => {
    switch (level) {
      case 'premium': return 'default' as const;
      case 'standard': return 'secondary' as const;
      case 'basic': return 'outline' as const;
      default: return 'destructive' as const;
    }
  };

  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const spacing = size === 'sm' ? 'gap-1' : size === 'lg' ? 'gap-3' : 'gap-2';

  return (
    <div className={`flex items-center ${spacing}`}>
      {/* Main Trust Badge */}
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${getTrustColor(score)}`}>
        {getTrustIcon(score)}
        <span className={`font-medium ${textSize}`}>
          {score}/100
        </span>
      </div>

      {/* Verification Level Badge */}
      <Badge variant={getVerificationBadgeVariant(verificationLevel)} className={textSize}>
        {verificationLevel.toUpperCase()}
      </Badge>

      {/* Detailed Verification Status */}
      {showDetails && (
        <div className={`flex items-center ${spacing}`}>
          {identityVerified && (
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-600">ID</span>
            </div>
          )}
          {skillsVerified && (
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3 text-blue-600" />
              <span className="text-xs text-blue-600">Skills</span>
            </div>
          )}
        </div>
      )}

      {/* Trust Label for larger sizes */}
      {size === 'lg' && (
        <span className="text-sm text-muted-foreground">
          {getTrustLabel(score)}
        </span>
      )}
    </div>
  );
};