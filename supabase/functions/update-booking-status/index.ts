import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
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

  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    const { booking_id, status, completion_confirmed } = await req.json();

    if (!booking_id || !status) {
      throw new Error("Booking ID and status are required");
    }

    // Validate status
    const validStatuses = ['pending', 'assigned', 'paid', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status");
    }

    // Get current booking
    const { data: booking, error: fetchError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (fetchError || !booking) {
      throw new Error("Booking not found");
    }

    // Check if user is authorized to update this booking
    const isClient = booking.client_email === user.email;
    const isArtisan = booking.artisan_email === user.email || booking.artisan_id === user.id;
    
    if (!isClient && !isArtisan) {
      throw new Error("Not authorized to update this booking");
    }

    // Update booking status
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString(),
    };

    // If marking as completed, add completion date
    if (status === 'completed') {
      updateData.completion_date = new Date().toISOString();
    }

    // If payment confirmed, update payment status
    if (completion_confirmed && status === 'paid') {
      updateData.payment_status = 'paid';
    }

    const { data: updatedBooking, error: updateError } = await supabaseClient
      .from('bookings')
      .update(updateData)
      .eq('id', booking_id)
      .select()
      .single();

    if (updateError) {
      throw new Error("Failed to update booking status");
    }

    // If booking is completed and there's an escrow payment, we could auto-release it
    // (This would be a business decision - auto-release or require manual release)
    
    return new Response(
      JSON.stringify({
        success: true,
        booking: updatedBooking,
        message: `Booking status updated to ${status}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});