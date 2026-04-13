import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ChatMessage {
  id: string;
  session_id: string;
  sender_id?: string;
  sender_type: 'customer' | 'agent' | 'system';
  sender_name?: string;
  message: string;
  message_type: 'text' | 'file' | 'image' | 'system';
  metadata?: any;
  read_by_customer: boolean;
  read_by_agent: boolean;
  created_at: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
}

interface ChatSession {
  id: string;
  customer_id?: string;
  customer_email?: string;
  customer_name?: string;
  agent_id?: string;
  status: 'waiting' | 'active' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  department: string;
  initial_message?: string;
  metadata?: any;
  started_at: string;
  assigned_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

interface TypingIndicator {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  user_type: 'customer' | 'agent';
  created_at: string;
}

export const useLiveChat = () => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    const savedId = localStorage.getItem('livechat_session_id');
    if (savedId) {
      supabase.from('live_chat_sessions').select('*')
        .eq('id', savedId).neq('status', 'closed').maybeSingle()
        .then(({ data }) => { if (data) setSession(data as any); });
    }
  }, []);

  useEffect(() => {
    if (session?.id) localStorage.setItem('livechat_session_id', session.id);
    else localStorage.removeItem('livechat_session_id');
  }, [session?.id]);

  // Create a new chat session
  const startChat = async (initialMessage?: string, customerInfo?: { name?: string; email?: string }) => {
    try {
      setIsLoading(true);
      
      const { data: user } = await supabase.auth.getUser();
      
      const sessionData = {
        customer_id: user.user?.id,
        customer_email: customerInfo?.email || user.user?.email,
        customer_name: customerInfo?.name,
        status: 'waiting' as const,
        priority: 'normal' as const,
        department: 'general',
        initial_message: initialMessage,
      };

      const { data: newSession, error: sessionError } = await supabase
        .from('live_chat_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (sessionError) throw sessionError;

      const typedSession = newSession as any;
      setSession({
        ...typedSession,
        status: typedSession.status as 'waiting' | 'active' | 'closed',
        priority: typedSession.priority as 'low' | 'normal' | 'high' | 'urgent',
      });

      // Send initial message if provided
      if (initialMessage) {
        await sendMessage(initialMessage, newSession.id);
      }

      // Try to auto-assign an agent
      await supabase.rpc('auto_assign_chat_session', { 
        session_id_param: newSession.id 
      });

      setIsConnected(true);
      return newSession;
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat session. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (message: string, sessionId?: string) => {
    try {
      const currentSessionId = sessionId || session?.id;
      if (!currentSessionId) {
        throw new Error('No active session');
      }

      const { data: user } = await supabase.auth.getUser();
      
      const messageData = {
        session_id: currentSessionId,
        sender_id: user.user?.id,
        sender_type: 'customer' as const,
        sender_name: session?.customer_name || 'Customer',
        message,
        message_type: 'text' as const,
      };

      const { error } = await supabase
        .from('live_chat_messages')
        .insert(messageData);

      if (error) throw error;

      // Clear typing indicator
      clearTypingIndicator();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Set typing indicator
  const setTypingIndicator = async () => {
    if (!session?.id || isTyping) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      setIsTyping(true);

      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Insert/update typing indicator
      await supabase
        .from('live_chat_typing')
        .upsert({
          session_id: session.id,
          user_id: user.user.id,
          user_name: session.customer_name || 'Customer',
          user_type: 'customer' as const,
        });

      // Auto-clear after 5 seconds
      typingTimeoutRef.current = setTimeout(() => {
        clearTypingIndicator();
      }, 5000);

    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  };

  // Clear typing indicator
  const clearTypingIndicator = async () => {
    if (!session?.id || !isTyping) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('live_chat_typing')
        .delete()
        .eq('session_id', session.id)
        .eq('user_id', user.user.id);

      setIsTyping(false);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Error clearing typing indicator:', error);
    }
  };

  // Close chat session
  const closeChat = async () => {
    if (!session?.id) return;

    try {
      await supabase
        .from('live_chat_sessions')
        .update({ 
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', session.id);

      setSession(null);
      setMessages([]);
      setTypingUsers([]);
      setIsConnected(false);
      clearTypingIndicator();
    } catch (error) {
      console.error('Error closing chat:', error);
    }
  };

  // Send a file message
  const sendFile = async (file: File) => {
    if (!session?.id) {
      throw new Error('No active session');
    }

    try {
      setUploadingFile(true);
      const { data: user } = await supabase.auth.getUser();
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `chat-files/${session.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('support-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('support-attachments')
        .getPublicUrl(filePath);

      // Send file message
      const messageData = {
        session_id: session.id,
        sender_id: user.user?.id,
        sender_type: 'customer' as const,
        sender_name: session.customer_name || 'Customer',
        message: `Shared a file: ${file.name}`,
        message_type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      };

      const { error } = await supabase
        .from('live_chat_messages')
        .insert(messageData);

      if (error) throw error;

      toast({
        title: "File sent",
        description: `${file.name} has been shared successfully.`,
      });

    } catch (error) {
      console.error('Error sending file:', error);
      toast({
        title: "Error",
        description: "Failed to send file. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploadingFile(false);
    }
  };

  // Load messages for current session
  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const typedMessages = (data || []).map((msg: any) => ({
        ...msg,
        sender_type: msg.sender_type as 'customer' | 'agent' | 'system',
        message_type: msg.message_type as 'text' | 'file' | 'image' | 'system',
      }));
      
      setMessages(typedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!session?.id) return;

    // Subscribe to messages
    const messagesChannel = supabase
      .channel(`messages:${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel(`typing:${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_chat_typing',
          filter: `session_id=eq.${session.id}`,
        },
        async () => {
          // Reload typing indicators
          const { data } = await supabase
            .from('live_chat_typing')
            .select('*')
            .eq('session_id', session.id);
          
          const typedIndicators = (data || []).map((indicator: any) => ({
            ...indicator,
            user_type: indicator.user_type as 'customer' | 'agent',
          }));
          setTypingUsers(typedIndicators);
        }
      )
      .subscribe();

    // Subscribe to session updates
    const sessionChannel = supabase
      .channel(`session:${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_chat_sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const updatedSession = payload.new as any;
          setSession({
            ...updatedSession,
            status: updatedSession.status as 'waiting' | 'active' | 'closed',
          });
        }
      )
      .subscribe();

    // Load initial messages
    loadMessages(session.id);

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [session?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    session,
    messages,
    typingUsers,
    isConnected,
    isLoading,
    isTyping,
    uploadingFile,
    startChat,
    sendMessage,
    sendFile,
    setTypingIndicator,
    clearTypingIndicator,
    closeChat,
  };
};