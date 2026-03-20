import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIConfig {
  enabled: boolean;
  welcome_message: string;
  auto_response_delay_seconds: number;
  escalation_keywords: string[];
  max_auto_responses: number;
}

interface ChatSession {
  id: string;
  customer_name?: string;
  status: string;
}

interface ConversationTracking {
  session_id: string;
  ai_responses_count: number;
  escalated_to_human: boolean;
  escalation_reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      console.log('OpenAI API key not found - AI responses disabled');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { session_id, message, customer_name } = await req.json();

    console.log(`Processing AI response for session: ${session_id}`);

    // Get AI configuration
    const { data: configData, error: configError } = await supabase
      .from('ai_chat_config')
      .select('*')
      .single();

    if (configError || !configData?.enabled) {
      console.log('AI responses disabled or config error:', configError);
      return new Response(JSON.stringify({ success: false, reason: 'AI disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const config: AIConfig = configData;

    // Get conversation tracking
    const { data: conversationData, error: convError } = await supabase
      .from('ai_chat_conversations')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (convError && convError.code !== 'PGRST116') {
      console.error('Error fetching conversation data:', convError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const conversation: ConversationTracking = conversationData || {
      session_id,
      ai_responses_count: 0,
      escalated_to_human: false,
    };

    // Check if we should respond
    if (conversation.escalated_to_human || conversation.ai_responses_count >= config.max_auto_responses) {
      console.log('AI response limit reached or escalated to human');
      return new Response(JSON.stringify({ success: false, reason: 'Escalated or limit reached' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for escalation keywords
    const messageText = message.toLowerCase();
    for (const keyword of config.escalation_keywords) {
      if (messageText.includes(keyword.toLowerCase())) {
        console.log(`Escalation keyword detected: ${keyword}`);
        
        // Update conversation as escalated
        await supabase
          .from('ai_chat_conversations')
          .upsert({
            session_id,
            escalated_to_human: true,
            escalation_reason: `Keyword detected: ${keyword}`,
            ai_responses_count: conversation.ai_responses_count,
          });

        // Send escalation message
        await supabase
          .from('live_chat_messages')
          .insert({
            session_id,
            sender_type: 'system',
            sender_name: 'System',
            message: 'Connecting you with a human agent...',
            message_type: 'system',
          });

        return new Response(JSON.stringify({ success: true, escalated: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Generate AI response using OpenAI
    console.log('Generating AI response...');
    
    const systemPrompt = `You are a helpful customer service assistant for OgaJobs, a platform connecting clients with skilled artisans in Nigeria. 

Key information about OgaJobs:
- We help clients find reliable artisans for various services
- We verify artisans and ensure quality work
- We handle payments securely through escrow
- Available services include plumbing, electrical work, cleaning, repairs, and more

Guidelines:
- Be friendly and helpful
- Keep responses concise (under 150 words)
- If you can't help with something specific, politely suggest they'll be connected to a human agent
- Focus on understanding their needs and providing relevant information
- Ask clarifying questions if needed

Current customer message: "${message}"
Customer name: ${customer_name || 'Customer'}`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', await openAIResponse.text());
      throw new Error('Failed to generate AI response');
    }

    const aiData = await openAIResponse.json();
    const aiMessage = aiData.choices[0].message.content;

    console.log('AI response generated:', aiMessage);

    // Add small delay to make it feel more natural
    await new Promise(resolve => setTimeout(resolve, config.auto_response_delay_seconds * 1000));

    // Send AI message
    await supabase
      .from('live_chat_messages')
      .insert({
        session_id,
        sender_type: 'agent',
        sender_name: 'AI Assistant',
        message: aiMessage,
        message_type: 'text',
        metadata: { ai_generated: true },
      });

    // Update conversation tracking
    await supabase
      .from('ai_chat_conversations')
      .upsert({
        session_id,
        ai_responses_count: conversation.ai_responses_count + 1,
        escalated_to_human: false,
        escalation_reason: conversation.escalation_reason,
      });

    console.log('AI response sent successfully');

    return new Response(JSON.stringify({ success: true, message: aiMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI chat response:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});