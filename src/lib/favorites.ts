import { supabase } from '@/integrations/supabase/client';

export async function toggleFavorite(clientId: string, artisanId: string): Promise<boolean> {
  const { data: existing } = await (supabase as any)
    .from('artisan_favorites')
    .select('id')
    .eq('client_id', clientId)
    .eq('artisan_id', artisanId)
    .maybeSingle();

  if (existing) {
    await (supabase as any)
      .from('artisan_favorites')
      .delete()
      .eq('id', existing.id);
    return false; // removed
  } else {
    await (supabase as any)
      .from('artisan_favorites')
      .insert({ client_id: clientId, artisan_id: artisanId });
    return true; // added
  }
}

export async function isFavorited(clientId: string, artisanId: string): Promise<boolean> {
  const { data } = await (supabase as any)
    .from('artisan_favorites')
    .select('id')
    .eq('client_id', clientId)
    .eq('artisan_id', artisanId)
    .maybeSingle();
  return !!data;
}
