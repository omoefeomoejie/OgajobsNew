import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Clock, 
  User, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Users,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

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
}

interface TypingIndicator {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  user_type: 'customer' | 'agent';
  created_at: string;
}

const AgentChatDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    waiting: 0,
    active: 0,
    total: 0,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load agent profile and initial data
  useEffect(() => {
    loadAgentProfile();
    loadSessions();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const sessionsChannel = supabase
      .channel('agent-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_chat_sessions',
        },
        (payload) => {
          loadSessions();
          // Notify agent of new chat request
          if (payload.new && (payload.new as any).status === 'waiting') {
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification('New Chat Request — OgaJobs', {
                body: `${(payload.new as any).customer_name || (payload.new as any).customer_email || 'A customer'} needs help`,
                icon: '/favicon.ico'
              });
            }
          }
        }
      )
      .subscribe();

    // Global messages subscription for notifications
    const messagesChannel = supabase
      .channel('agent-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          if (newMessage.sender_type === 'customer') {
            // Show notification for new customer messages
            toast({
              title: "New customer message",
              description: `${newMessage.sender_name}: ${newMessage.message.substring(0, 50)}...`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, []);

  // Set up session-specific subscriptions
  useEffect(() => {
    if (!activeSession?.id) {
      setMessages([]);
      setTypingUsers([]);
      return;
    }

    loadMessages(activeSession.id);

    // Subscribe to messages for active session
    const sessionMessagesChannel = supabase
      .channel(`session-messages:${activeSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `session_id=eq.${activeSession.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel(`session-typing:${activeSession.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_chat_typing',
          filter: `session_id=eq.${activeSession.id}`,
        },
        async () => {
          const { data } = await supabase
            .from('live_chat_typing')
            .select('*')
            .eq('session_id', activeSession.id);
          
          const typedIndicators = (data || []).map((indicator: any) => ({
            ...indicator,
            user_type: indicator.user_type as 'customer' | 'agent',
          }));
          
          setTypingUsers(typedIndicators);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionMessagesChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [activeSession?.id]);

  const loadAgentProfile = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single();

      setAgentProfile(profile);
    } catch (error) {
      console.error('Error loading agent profile:', error);
    }
  };

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Load sessions assigned to this agent or unassigned waiting sessions
      const { data: sessionsData, error } = await supabase
        .from('live_chat_sessions')
        .select('*')
        .or(`agent_id.eq.${user.user.id},and(status.eq.waiting,agent_id.is.null)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedSessions = (sessionsData || []).map((session: any) => ({
        ...session,
        status: session.status as 'waiting' | 'active' | 'closed',
        priority: session.priority as 'low' | 'normal' | 'high' | 'urgent',
      }));

      setSessions(typedSessions);

      // Calculate stats
      const waiting = typedSessions.filter(s => s.status === 'waiting').length;
      const active = typedSessions.filter(s => s.status === 'active' && s.agent_id === user.user.id).length;
      setStats({ waiting, active, total: typedSessions.length });

    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat sessions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

      // Mark messages as read by agent
      await supabase
        .from('live_chat_messages')
        .update({ read_by_agent: true })
        .eq('session_id', sessionId)
        .eq('read_by_agent', false);

    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const assignSession = async (sessionId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('live_chat_sessions')
        .update({
          agent_id: user.user.id,
          status: 'active',
          assigned_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Send system message
      await supabase
        .from('live_chat_messages')
        .insert({
          session_id: sessionId,
          sender_type: 'system',
          sender_name: 'System',
          message: `Agent ${agentProfile?.email || 'Agent'} has joined the chat`,
          message_type: 'system',
        });

      toast({
        title: "Success",
        description: "Chat session assigned successfully",
      });

      loadSessions();
    } catch (error) {
      console.error('Error assigning session:', error);
      toast({
        title: "Error",
        description: "Failed to assign chat session",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !activeSession) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const messageData = {
        session_id: activeSession.id,
        sender_id: user.user.id,
        sender_type: 'agent' as const,
        sender_name: agentProfile?.email || 'Agent',
        message: currentMessage,
        message_type: 'text' as const,
      };

      const { error } = await supabase
        .from('live_chat_messages')
        .insert(messageData);

      if (error) throw error;

      setCurrentMessage('');
      clearTypingIndicator();

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const setTypingIndicator = async () => {
    if (!activeSession?.id) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      await supabase
        .from('live_chat_typing')
        .upsert({
          session_id: activeSession.id,
          user_id: user.user.id,
          user_name: agentProfile?.email || 'Agent',
          user_type: 'agent' as const,
        });

      typingTimeoutRef.current = setTimeout(() => {
        clearTypingIndicator();
      }, 3000);

    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  };

  const clearTypingIndicator = async () => {
    if (!activeSession?.id) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('live_chat_typing')
        .delete()
        .eq('session_id', activeSession.id)
        .eq('user_id', user.user.id);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Error clearing typing indicator:', error);
    }
  };

  const closeSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('live_chat_sessions')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Send system message
      await supabase
        .from('live_chat_messages')
        .insert({
          session_id: sessionId,
          sender_type: 'system',
          sender_name: 'System',
          message: 'Chat session has been closed',
          message_type: 'system',
        });

      if (activeSession?.id === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }

      loadSessions();
      toast({
        title: "Success",
        description: "Chat session closed",
      });

    } catch (error) {
      console.error('Error closing session:', error);
      toast({
        title: "Error",
        description: "Failed to close chat session",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (value: string) => {
    setCurrentMessage(value);
    if (value.trim()) {
      setTypingIndicator();
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-500',
      normal: 'bg-green-500',
      high: 'bg-yellow-500',
      urgent: 'bg-red-500',
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      waiting: 'bg-yellow-500',
      active: 'bg-green-500',
      closed: 'bg-gray-500',
    };
    return colors[status as keyof typeof colors] || colors.waiting;
  };

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const getCustomerTyping = () => {
    return typingUsers.filter(user => user.user_type === 'customer');
  };

  const filteredSessions = {
    waiting: sessions.filter(s => s.status === 'waiting'),
    active: sessions.filter(s => s.status === 'active'),
    closed: sessions.filter(s => s.status === 'closed'),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Loading chat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 p-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent Chat Dashboard</h1>
          <p className="text-muted-foreground">
            Manage customer support conversations
          </p>
        </div>
        
        <div className="flex gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Waiting</p>
                <p className="text-2xl font-bold">{stats.waiting}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sessions List */}
        <Card className="w-1/3 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <Tabs defaultValue="waiting" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mx-6 mb-4">
                <TabsTrigger value="waiting">Waiting ({filteredSessions.waiting.length})</TabsTrigger>
                <TabsTrigger value="active">Active ({filteredSessions.active.length})</TabsTrigger>
                <TabsTrigger value="closed">Closed ({filteredSessions.closed.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="waiting" className="flex-1 px-6 pb-6">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {filteredSessions.waiting.map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer hover:bg-muted/50",
                          activeSession?.id === session.id && "bg-muted border-primary"
                        )}
                        onClick={() => setActiveSession(session)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4" />
                              <span className="font-medium text-sm">
                                {session.customer_name || session.customer_email || 'Anonymous'}
                              </span>
                              <Badge className={cn('text-xs', getPriorityColor(session.priority))}>
                                {session.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {session.initial_message?.substring(0, 60)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              assignSession(session.id);
                            }}
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="active" className="flex-1 px-6 pb-6">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {filteredSessions.active.map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer hover:bg-muted/50",
                          activeSession?.id === session.id && "bg-muted border-primary"
                        )}
                        onClick={() => setActiveSession(session)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4" />
                              <span className="font-medium text-sm">
                                {session.customer_name || session.customer_email || 'Anonymous'}
                              </span>
                              <Badge className={cn('text-xs', getStatusColor(session.status))}>
                                {session.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Active since {format(new Date(session.assigned_at!), 'HH:mm')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              closeSession(session.id);
                            }}
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="closed" className="flex-1 px-6 pb-6">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {filteredSessions.closed.map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer hover:bg-muted/50 opacity-60",
                          activeSession?.id === session.id && "bg-muted border-primary"
                        )}
                        onClick={() => setActiveSession(session)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4" />
                          <span className="font-medium text-sm">
                            {session.customer_name || session.customer_email || 'Anonymous'}
                          </span>
                          <Badge className={cn('text-xs', getStatusColor(session.status))}>
                            {session.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Closed {format(new Date(session.closed_at!), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col">
          {activeSession ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {activeSession.customer_name || activeSession.customer_email || 'Anonymous Customer'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {activeSession.department} • Started {formatDistanceToNow(new Date(activeSession.started_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(getStatusColor(activeSession.status))}>
                      {activeSession.status}
                    </Badge>
                    {activeSession.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => closeSession(activeSession.id)}
                      >
                        End Chat
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-3',
                          message.sender_type === 'agent' 
                            ? 'justify-end' 
                            : 'justify-start'
                        )}
                      >
                        {message.sender_type !== 'agent' && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {message.sender_type === 'customer' ? 'C' : 'S'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={cn(
                            'max-w-xs rounded-lg px-3 py-2 text-sm',
                            message.sender_type === 'agent'
                              ? 'bg-primary text-primary-foreground'
                              : message.sender_type === 'system'
                              ? 'bg-muted text-muted-foreground text-center italic'
                              : 'bg-muted',
                            message.sender_type === 'system' && 'self-center'
                          )}
                        >
                          <p>{message.message}</p>
                          <p className={cn(
                            'text-xs mt-1 opacity-70',
                            message.sender_type === 'agent' ? 'text-right' : 'text-left'
                          )}>
                            {formatMessageTime(message.created_at)}
                            {message.sender_type === 'agent' && (
                              <CheckCircle className="inline h-3 w-3 ml-1" />
                            )}
                          </p>
                        </div>
                        
                        {message.sender_type === 'agent' && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">A</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    
                    {getCustomerTyping().length > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        </div>
                        Customer is typing...
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {activeSession.status !== 'closed' && (
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your response..."
                        value={currentMessage}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!currentMessage.trim()}
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No chat selected</p>
                <p>Select a chat session to start responding to customers</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AgentChatDashboard;