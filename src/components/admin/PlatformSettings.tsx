import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function PlatformSettings() {
  const { toast } = useToast();
  const [commissionRate, setCommissionRate] = useState('');
  const [minWithdrawal, setMinWithdrawal] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [artisanEmail, setArtisanEmail] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [statArtisanCount, setStatArtisanCount] = useState('');
  const [statEarnings, setStatEarnings] = useState('');
  const [statRating, setStatRating] = useState('');
  const [statApprovalTime, setStatApprovalTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('key, value');

      if (data) {
        const rate = data.find(s => s.key === 'commission_rate');
        const min = data.find(s => s.key === 'min_withdrawal');
        const phone = data.find(s => s.key === 'support_phone');
        const sEmail = data.find(s => s.key === 'support_email');
        const aEmail = data.find(s => s.key === 'artisan_email');
        const twitter = data.find(s => s.key === 'twitter_url');
        const instagram = data.find(s => s.key === 'instagram_url');
        const facebook = data.find(s => s.key === 'facebook_url');
        if (rate) setCommissionRate(rate.value);
        if (min) setMinWithdrawal(min.value);
        if (phone) setSupportPhone(phone.value);
        if (sEmail) setSupportEmail(sEmail.value);
        if (aEmail) setArtisanEmail(aEmail.value);
        if (twitter) setTwitterUrl(twitter.value);
        if (instagram) setInstagramUrl(instagram.value);
        if (facebook) setFacebookUrl(facebook.value);
        const artisanCount = data.find(s => s.key === 'stat_artisan_count');
        const earnings = data.find(s => s.key === 'stat_avg_monthly_earnings');
        const rating = data.find(s => s.key === 'stat_satisfaction_rating');
        const approvalTime = data.find(s => s.key === 'stat_approval_time');
        if (artisanCount) setStatArtisanCount(artisanCount.value);
        if (earnings) setStatEarnings(earnings.value);
        if (rating) setStatRating(rating.value);
        if (approvalTime) setStatApprovalTime(approvalTime.value);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        supabase.from('platform_settings').update({ value: commissionRate, updated_at: new Date().toISOString() }).eq('key', 'commission_rate'),
        supabase.from('platform_settings').update({ value: minWithdrawal, updated_at: new Date().toISOString() }).eq('key', 'min_withdrawal'),
        supabase.from('platform_settings').update({ value: supportPhone, updated_at: new Date().toISOString() }).eq('key', 'support_phone'),
        supabase.from('platform_settings').update({ value: supportEmail, updated_at: new Date().toISOString() }).eq('key', 'support_email'),
        supabase.from('platform_settings').update({ value: artisanEmail, updated_at: new Date().toISOString() }).eq('key', 'artisan_email'),
        supabase.from('platform_settings').update({ value: twitterUrl, updated_at: new Date().toISOString() }).eq('key', 'twitter_url'),
        supabase.from('platform_settings').update({ value: instagramUrl, updated_at: new Date().toISOString() }).eq('key', 'instagram_url'),
        supabase.from('platform_settings').update({ value: facebookUrl, updated_at: new Date().toISOString() }).eq('key', 'facebook_url'),
        supabase.from('platform_settings').update({ value: statArtisanCount, updated_at: new Date().toISOString() }).eq('key', 'stat_artisan_count'),
        supabase.from('platform_settings').update({ value: statEarnings, updated_at: new Date().toISOString() }).eq('key', 'stat_avg_monthly_earnings'),
        supabase.from('platform_settings').update({ value: statRating, updated_at: new Date().toISOString() }).eq('key', 'stat_satisfaction_rating'),
        supabase.from('platform_settings').update({ value: statApprovalTime, updated_at: new Date().toISOString() }).eq('key', 'stat_approval_time'),
      ];

      await Promise.all(updates);

      toast({
        title: 'Settings Saved',
        description: 'Platform settings updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground">Loading settings...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Platform Settings</h2>
        <p className="text-muted-foreground">Manage global platform configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission & Fees</CardTitle>
          <CardDescription>
            Set the platform commission rate charged on every completed booking.
            Changes take effect immediately on new payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="commission">Commission Rate (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="commission"
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-32"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Artisan receives {(100 - parseFloat(commissionRate || '0')).toFixed(1)}% of each payment
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minWithdrawal">Minimum Withdrawal Amount (₦)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="minWithdrawal"
                type="number"
                min="0"
                step="100"
                value={minWithdrawal}
                onChange={(e) => setMinWithdrawal(e.target.value)}
                className="w-40"
              />
              <span className="text-muted-foreground">₦</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">Contact Information</h3>
            <div className="space-y-2">
              <Label htmlFor="supportPhone">Support Phone</Label>
              <Input id="supportPhone" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} placeholder="+234 700 642 5627" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input id="supportEmail" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="support@ogajobs.com.ng" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artisanEmail">Artisan Contact Email</Label>
              <Input id="artisanEmail" value={artisanEmail} onChange={(e) => setArtisanEmail(e.target.value)} placeholder="artisans@ogajobs.com.ng" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitterUrl">Twitter URL</Label>
              <Input id="twitterUrl" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://twitter.com/ogajobs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input id="instagramUrl" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/ogajobs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook URL</Label>
              <Input id="facebookUrl" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/ogajobs" />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marketing Statistics</CardTitle>
          <CardDescription>
            Stats displayed on the Become an Artisan page. Update as the platform grows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="statArtisanCount">Artisan Count</Label>
            <Input id="statArtisanCount" value={statArtisanCount} onChange={(e) => setStatArtisanCount(e.target.value)} placeholder="5,000+" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="statEarnings">Average Monthly Earnings</Label>
            <Input id="statEarnings" value={statEarnings} onChange={(e) => setStatEarnings(e.target.value)} placeholder="₦150,000+" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="statRating">Artisan Satisfaction Rating</Label>
            <Input id="statRating" value={statRating} onChange={(e) => setStatRating(e.target.value)} placeholder="4.9/5" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="statApprovalTime">Average Approval Time</Label>
            <Input id="statApprovalTime" value={statApprovalTime} onChange={(e) => setStatApprovalTime(e.target.value)} placeholder="48hrs" />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Statistics'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
