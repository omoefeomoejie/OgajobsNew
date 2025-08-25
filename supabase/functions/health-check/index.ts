import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down' | 'slow';
    storage: 'up' | 'down' | 'slow';
    auth: 'up' | 'down' | 'slow';
    functions: 'up' | 'down' | 'slow';
  };
  metrics: {
    responseTime: number;
    databaseLatency: number;
    memoryUsage?: number;
  };
  version: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const startTime = Date.now();
    const healthCheck: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        storage: 'up',
        auth: 'up',
        functions: 'up',
      },
      metrics: {
        responseTime: 0,
        databaseLatency: 0,
      },
      version: '1.0.0',
    };

    // Test database connection
    const dbStart = Date.now();
    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .single();
      
      const dbLatency = Date.now() - dbStart;
      healthCheck.metrics.databaseLatency = dbLatency;
      
      if (dbError && !dbError.message.includes('PGRST116')) {
        healthCheck.services.database = 'down';
        healthCheck.status = 'unhealthy';
      } else if (dbLatency > 1000) {
        healthCheck.services.database = 'slow';
        healthCheck.status = 'degraded';
      }
    } catch (error) {
      console.error('Database health check failed:', error);
      healthCheck.services.database = 'down';
      healthCheck.status = 'unhealthy';
    }

    // Test storage
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      if (storageError) {
        healthCheck.services.storage = 'down';
        if (healthCheck.status === 'healthy') healthCheck.status = 'degraded';
      }
    } catch (error) {
      console.error('Storage health check failed:', error);
      healthCheck.services.storage = 'down';
      if (healthCheck.status === 'healthy') healthCheck.status = 'degraded';
    }

    // Test auth
    try {
      const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      if (authError) {
        healthCheck.services.auth = 'down';
        if (healthCheck.status === 'healthy') healthCheck.status = 'degraded';
      }
    } catch (error) {
      console.error('Auth health check failed:', error);
      healthCheck.services.auth = 'down';
      if (healthCheck.status === 'healthy') healthCheck.status = 'degraded';
    }

    // Add memory usage if available
    if (typeof Deno !== 'undefined' && Deno.memoryUsage) {
      try {
        const memUsage = Deno.memoryUsage();
        healthCheck.metrics.memoryUsage = memUsage.rss;
      } catch (error) {
        console.log('Memory usage not available');
      }
    }

    healthCheck.metrics.responseTime = Date.now() - startTime;

    // Log health check for monitoring
    console.log('Health check completed:', {
      status: healthCheck.status,
      responseTime: healthCheck.metrics.responseTime,
      databaseLatency: healthCheck.metrics.databaseLatency,
    });

    return new Response(JSON.stringify(healthCheck), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      status: healthCheck.status === 'healthy' ? 200 : 
              healthCheck.status === 'degraded' ? 200 : 503,
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    const errorResponse: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'down',
        storage: 'down',
        auth: 'down',
        functions: 'down',
      },
      metrics: {
        responseTime: Date.now(),
        databaseLatency: 0,
      },
      version: '1.0.0',
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 503,
    });
  }
});