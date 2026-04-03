-- ============================================================
-- KYC RLS & Trigger Fixes
-- ============================================================

-- 1. Fix trust_metrics: remove blanket public read policy.
--    Sensitive columns (dispute_rate, repeat_client_rate, etc.)
--    must not be readable by anonymous users.
--    Trust score is already duplicated on profiles (public-readable).
DROP POLICY IF EXISTS "Public can view trust metrics" ON public.trust_metrics;
DROP POLICY IF EXISTS "Artisans can view their own trust metrics" ON public.trust_metrics;

CREATE POLICY "trust_metrics_own_access" ON public.trust_metrics
  FOR SELECT USING (artisan_id = auth.uid());

CREATE POLICY "trust_metrics_admin_access" ON public.trust_metrics
  FOR ALL USING (public.is_admin());

-- Allow the trigger function (SECURITY DEFINER) to write trust_metrics
CREATE POLICY "trust_metrics_insert_own" ON public.trust_metrics
  FOR INSERT WITH CHECK (artisan_id = auth.uid() OR public.is_admin());

CREATE POLICY "trust_metrics_update_own" ON public.trust_metrics
  FOR UPDATE USING (artisan_id = auth.uid() OR public.is_admin());

-- 2. Fix skill_certifications public policy:
--    Restrict to authenticated users only (not anonymous).
DROP POLICY IF EXISTS "Public can view verified certifications" ON public.skill_certifications;

CREATE POLICY "Authenticated can view verified certifications" ON public.skill_certifications
  FOR SELECT TO authenticated USING (verification_score > 0 OR artisan_id = auth.uid());

-- 3. Add admin manage policy for skill_certifications
--    (needed for admin to set verification_score, verified_by, verified_at)
DROP POLICY IF EXISTS "Admins can manage skill certifications" ON public.skill_certifications;

CREATE POLICY "Admins can manage skill certifications" ON public.skill_certifications
  FOR ALL USING (public.is_admin());

-- 4. Add admin manage policy for trust_metrics write
DROP POLICY IF EXISTS "Admins can manage trust metrics" ON public.trust_metrics;

CREATE POLICY "Admins can manage trust metrics" ON public.trust_metrics
  FOR ALL USING (public.is_admin());

-- 5. Trigger: keep trust_metrics.skills_verified in sync
--    whenever a skill_certification is inserted, updated or deleted.
CREATE OR REPLACE FUNCTION sync_skills_verified_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_artisan UUID;
  skill_count INTEGER;
BEGIN
  target_artisan := COALESCE(NEW.artisan_id, OLD.artisan_id);

  SELECT COUNT(*) INTO skill_count
  FROM public.skill_certifications
  WHERE artisan_id = target_artisan
    AND verification_score > 0;

  -- Update trust_metrics (upsert in case row doesn't exist yet)
  INSERT INTO public.trust_metrics (artisan_id, skills_verified)
  VALUES (target_artisan, skill_count)
  ON CONFLICT (artisan_id)
  DO UPDATE SET skills_verified = skill_count, last_updated = now();

  -- Also flip the boolean on profiles
  UPDATE public.profiles
  SET skills_verified = (skill_count > 0)
  WHERE id = target_artisan;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_skills_verified_on_cert_change ON public.skill_certifications;

CREATE TRIGGER sync_skills_verified_on_cert_change
  AFTER INSERT OR UPDATE OR DELETE ON public.skill_certifications
  FOR EACH ROW
  EXECUTE FUNCTION sync_skills_verified_count();

-- 6. Fix synchronous profile trigger — prevent infinite recursion and
--    stop firing on every unrelated profile UPDATE (e.g. changing full_name).
--    Only fire when identity_verified actually changes.
--    pg_trigger_depth() < 1 blocks the recursive call that happens when
--    calculate_trust_score() updates profiles.trust_score.
DROP TRIGGER IF EXISTS update_trust_metrics_on_profile_change ON public.profiles;

CREATE TRIGGER update_trust_metrics_on_profile_change
  AFTER INSERT OR UPDATE OF identity_verified ON public.profiles
  FOR EACH ROW
  WHEN (pg_trigger_depth() < 1)
  EXECUTE FUNCTION update_trust_metrics_trigger();

-- 7. Performance: add missing indexes
CREATE INDEX IF NOT EXISTS idx_identity_verifications_status
  ON public.identity_verifications(verification_status);

CREATE INDEX IF NOT EXISTS idx_identity_verifications_document_number
  ON public.identity_verifications(document_number);

CREATE INDEX IF NOT EXISTS idx_skill_certifications_score
  ON public.skill_certifications(verification_score);
