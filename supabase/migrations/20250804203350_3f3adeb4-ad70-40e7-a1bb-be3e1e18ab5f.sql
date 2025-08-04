-- Phase 1.1: Performance & Scale - Database Indexing Strategy
-- Create indexes for frequently queried columns across existing tables

-- Bookings table indexes
CREATE INDEX IF NOT EXISTS idx_bookings_client_email ON public.bookings(client_email);
CREATE INDEX IF NOT EXISTS idx_bookings_artisan_id ON public.bookings(artisan_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_preferred_date ON public.bookings(preferred_date);
CREATE INDEX IF NOT EXISTS idx_bookings_work_type ON public.bookings(work_type);
CREATE INDEX IF NOT EXISTS idx_bookings_city ON public.bookings(city);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);

-- Artisans table indexes
CREATE INDEX IF NOT EXISTS idx_artisans_email ON public.artisans(email);
CREATE INDEX IF NOT EXISTS idx_artisans_category ON public.artisans(category);
CREATE INDEX IF NOT EXISTS idx_artisans_city ON public.artisans(city);
CREATE INDEX IF NOT EXISTS idx_artisans_suspended ON public.artisans(suspended);
CREATE INDEX IF NOT EXISTS idx_artisans_slug ON public.artisans(slug);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_level ON public.profiles(verification_level);
CREATE INDEX IF NOT EXISTS idx_profiles_trust_score ON public.profiles(trust_score);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_email ON public.messages(sender_email);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_email ON public.messages(receiver_email);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read);

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_artisan_id ON public.payment_transactions(artisan_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_client_id ON public.payment_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id ON public.payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at);

-- Artisan reviews indexes
CREATE INDEX IF NOT EXISTS idx_artisan_reviews_artisan_id ON public.artisan_reviews(artisan_id);
CREATE INDEX IF NOT EXISTS idx_artisan_reviews_client_email ON public.artisan_reviews(client_email);
CREATE INDEX IF NOT EXISTS idx_artisan_reviews_rating ON public.artisan_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_artisan_reviews_created_at ON public.artisan_reviews(created_at);

-- Disputes indexes
CREATE INDEX IF NOT EXISTS idx_disputes_complainant_id ON public.disputes(complainant_id);
CREATE INDEX IF NOT EXISTS idx_disputes_respondent_id ON public.disputes(respondent_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_booking_id ON public.disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON public.disputes(created_at);

-- Commission transactions indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_commission_transactions_agent_id ON public.commission_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_artisan_id ON public.commission_transactions(artisan_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_status ON public.commission_transactions(status);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_created_at ON public.commission_transactions(created_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_client_status ON public.bookings(client_email, status);
CREATE INDEX IF NOT EXISTS idx_bookings_artisan_status ON public.bookings(artisan_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_city_work_type ON public.bookings(city, work_type);
CREATE INDEX IF NOT EXISTS idx_artisans_category_city ON public.artisans(category, city);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at);

-- Phase 1.1: Performance & Scale - Materialized Views
-- Create materialized views for complex queries

-- Artisan performance analytics view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_artisan_performance AS
SELECT 
    a.id as artisan_id,
    a.email,
    a.full_name,
    a.category,
    a.city,
    COUNT(DISTINCT b.id) as total_jobs,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_jobs,
    COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_jobs,
    COALESCE(AVG(ar.rating), 0) as average_rating,
    COUNT(DISTINCT ar.id) as total_reviews,
    COALESCE(SUM(pt.artisan_earnings), 0) as total_earnings,
    COALESCE(AVG(EXTRACT(EPOCH FROM (b.completion_date - b.created_at))/86400), 0) as avg_completion_days,
    MAX(b.created_at) as last_job_date
FROM public.artisans a
LEFT JOIN public.bookings b ON a.id = b.artisan_id
LEFT JOIN public.artisan_reviews ar ON a.id = ar.artisan_id
LEFT JOIN public.payment_transactions pt ON b.id = pt.booking_id AND pt.payment_status = 'paid'
WHERE a.suspended = false
GROUP BY a.id, a.email, a.full_name, a.category, a.city;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_artisan_performance_artisan_id ON public.mv_artisan_performance(artisan_id);

-- Client booking analytics view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_client_analytics AS
SELECT 
    b.client_email,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings,
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.budget END), 0) as total_spent,
    COALESCE(AVG(b.budget), 0) as average_booking_value,
    COUNT(DISTINCT b.work_type) as service_types_used,
    COUNT(DISTINCT b.artisan_id) as unique_artisans_worked_with,
    MIN(b.created_at) as first_booking_date,
    MAX(b.created_at) as last_booking_date
FROM public.bookings b
GROUP BY b.client_email;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_client_analytics_email ON public.mv_client_analytics(client_email);

-- Service category performance view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_service_category_stats AS
SELECT 
    COALESCE(b.work_type, 'Unknown') as service_category,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT b.client_email) as unique_clients,
    COUNT(DISTINCT b.artisan_id) as unique_artisans,
    COALESCE(AVG(b.budget), 0) as average_budget,
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.budget END), 0) as total_revenue,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as completion_rate,
    COALESCE(AVG(ar.rating), 0) as average_rating
FROM public.bookings b
LEFT JOIN public.artisan_reviews ar ON b.artisan_id = ar.artisan_id
GROUP BY b.work_type;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_service_category_stats_category ON public.mv_service_category_stats(service_category);

-- Monthly platform metrics view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_monthly_metrics AS
SELECT 
    DATE_TRUNC('month', b.created_at) as month,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT b.client_email) as unique_clients,
    COUNT(DISTINCT b.artisan_id) as unique_artisans,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.budget END), 0) as total_revenue,
    COALESCE(SUM(pt.platform_fee), 0) as platform_fees,
    COALESCE(AVG(ar.rating), 0) as average_rating
FROM public.bookings b
LEFT JOIN public.payment_transactions pt ON b.id = pt.booking_id AND pt.payment_status = 'paid'
LEFT JOIN public.artisan_reviews ar ON b.artisan_id = ar.artisan_id
GROUP BY DATE_TRUNC('month', b.created_at);

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_monthly_metrics_month ON public.mv_monthly_metrics(month);

-- Phase 1.2: Security Fortress - Audit Trail System
-- Create comprehensive audit trail table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name text NOT NULL,
    operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id uuid,
    user_email text,
    old_data jsonb,
    new_data jsonb,
    changed_fields text[],
    ip_address inet,
    user_agent text,
    session_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for audit logs (only admins can view)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT USING (is_admin());

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON public.audit_logs(operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_user ON public.audit_logs(table_name, user_id);

-- Create generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_data jsonb;
    new_data jsonb;
    changed_fields text[] := '{}';
    field_name text;
BEGIN
    -- Get user context (simplified for now)
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        -- Identify changed fields
        FOR field_name IN SELECT jsonb_object_keys(new_data) LOOP
            IF old_data->>field_name IS DISTINCT FROM new_data->>field_name THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);
    END IF;

    -- Insert audit record
    INSERT INTO public.audit_logs (
        table_name,
        operation,
        user_id,
        user_email,
        old_data,
        new_data,
        changed_fields,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        auth.email(),
        old_data,
        new_data,
        changed_fields,
        now()
    );

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_bookings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_artisans_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.artisans
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_profiles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_payment_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payment_transactions
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_disputes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.disputes
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_performance_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_artisan_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_client_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_service_category_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_monthly_metrics;
END;
$$;