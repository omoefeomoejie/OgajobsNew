import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    }
  );

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("User not authenticated");

    const { booking_id, status, completion_confirmed } = await req.json();

    if (!booking_id || !status) throw new Error("Booking ID and status are required");

    const validStatuses = ['pending', 'assigned', 'paid', 'in_progress', 'completed', 'cancelled', 'awaiting_approval'];
    if (!validStatuses.includes(status)) throw new Error("Invalid status");

    const { data: booking, error: fetchError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (fetchError || !booking) throw new Error("Booking not found");

    const isClient = booking.client_email === user.email;
    const isArtisan = booking.artisan_email === user.email || booking.artisan_id === user.id;

    if (!isClient && !isArtisan) throw new Error("Not authorized to update this booking");

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed' || status === 'awaiting_approval') {
      updateData.completion_date = new Date().toISOString();
    }

    if (completion_confirmed && status === 'paid') {
      updateData.payment_status = 'paid';
    }

    const { data: updatedBooking, error: updateError } = await supabaseClient
      .from('bookings')
      .update(updateData)
      .eq('id', booking_id)
      .select()
      .single();

    if (updateError) throw new Error("Failed to update booking status");

    // Send notifications based on status change
    const notifyEmail = isArtisan ? booking.client_email : booking.artisan_email;
    const notifyRole = isArtisan ? 'client' : 'artisan';

    const notificationMap: Record<string, { title: string; message: string }> = {
      in_progress: {
        title: 'Job Started',
        message: `Your ${booking.work_type} job has been started by the artisan`,
      },
      awaiting_approval: {
        title: 'Job Completed — Review Required',
        message: `Your artisan has completed the ${booking.work_type} job. Please review and release payment.`,
      },
      completed: {
        title: 'Job Completed',
        message: `Your ${booking.work_type} job has been marked as completed`,
      },
      cancelled: {
        title: 'Booking Cancelled',
        message: `Your ${booking.work_type} booking has been cancelled`,
      },
    };

    const notification = notificationMap[status];
    if (notification && notifyEmail) {
      await serviceClient.functions.invoke('send-notification', {
        body: {
          userEmail: notifyEmail,
          type: 'in_app',
          template: status,
          data: {
            title: notification.title,
            message: notification.message,
            type: 'booking_update',
          },
        },
      });

      await serviceClient.functions.invoke('send-notification', {
        body: {
          userEmail: notifyEmail,
          type: 'email',
          template: 'booking_confirmed',
          data: {
            clientName: notifyRole === 'client' ? 'Client' : 'Artisan',
            artisanName: notifyRole === 'client' ? 'Your Artisan' : 'Client',
            serviceType: booking.work_type,
            preferredDate: booking.preferred_date || 'Flexible',
          },
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: updatedBooking,
        message: `Booking status updated to ${status}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
