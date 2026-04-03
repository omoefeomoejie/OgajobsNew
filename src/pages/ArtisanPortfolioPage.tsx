import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ArtisanPortfolioPage() {
  const { artisanId } = useParams<{ artisanId: string }>();
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artisanId) { setLoading(false); return; }
    supabase
      .from('portfolios')
      .select('id')
      .eq('artisan_id', artisanId)
      .eq('is_public', true)
      .maybeSingle()
      .then(({ data }) => {
        setPortfolioId(data?.id ?? null);
        setLoading(false);
      });
  }, [artisanId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="animate-pulse min-h-screen">
          <div className="h-64 bg-muted" />
          <div className="container mx-auto px-4 py-8 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (portfolioId) {
    return <Navigate to={`/portfolio/${portfolioId}`} replace />;
  }

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Portfolio Available</h1>
          <p className="text-muted-foreground">This artisan hasn't published a portfolio yet.</p>
        </div>
      </div>
    </AppLayout>
  );
}
