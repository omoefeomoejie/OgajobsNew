import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformSettings {
  support_phone: string;
  support_email: string;
  artisan_email: string;
  legal_email: string;
  privacy_email: string;
  twitter_url: string;
  instagram_url: string;
  facebook_url: string;
  commission_rate: string;
  min_withdrawal: string;
  stat_artisan_count: string;
  stat_avg_monthly_earnings: string;
  stat_satisfaction_rating: string;
  stat_approval_time: string;
}

const defaults: PlatformSettings = {
  support_phone: '+234 700 642 5627',
  support_email: 'support@ogajobs.com.ng',
  artisan_email: 'artisans@ogajobs.com.ng',
  legal_email: 'legal@ogajobs.com.ng',
  privacy_email: 'privacy@ogajobs.com.ng',
  twitter_url: 'https://twitter.com/ogajobs',
  instagram_url: 'https://instagram.com/ogajobs',
  facebook_url: 'https://facebook.com/ogajobs',
  commission_rate: '10.0',
  min_withdrawal: '1000',
  stat_artisan_count: '5,000+',
  stat_avg_monthly_earnings: '₦150,000+',
  stat_satisfaction_rating: '4.9/5',
  stat_approval_time: '48hrs',
};

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('platform_settings')
      .select('key, value')
      .then(({ data }) => {
        if (data) {
          const mapped = data.reduce((acc, row) => {
            acc[row.key as keyof PlatformSettings] = row.value;
            return acc;
          }, {} as Partial<PlatformSettings>);
          setSettings(prev => ({ ...prev, ...mapped }));
        }
        setLoading(false);
      });
  }, []);

  return { settings, loading };
}
