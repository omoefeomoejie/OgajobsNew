import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, Paperclip, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLiveChat } from '@/hooks/useLiveChat';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface LiveChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  className?: string;
}

const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({ 
  position = 'bottom-right',
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '' });
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const {
    session,
    messages,
    typingUsers,
    isConnected,
    isLoading,
    uploadingFile,
    startChat,
    sendMessage,
    sendFile,
    setTypingIndicator,
    clearTypingIndicator,
    closeChat,
  } = useLiveChat();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleToggleChat = () => {
    if (isOpen) {
      setIsOpen(false);
      if (session && session.status !== 'closed') {
        closeChat();
      }
    } else {
      setIsOpen(true);
      if (!isConnected) {
        setShowCustomerForm(true);
      }
    }
  };

  const handleStartChat = async () => {
    const initialMessage = currentMessage || "Hello, I need assistance.";
    const result = await startChat(initialMessage, customerInfo);
    
    if (result) {
      setShowCustomerForm(false);
      setCurrentMessage('');
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !session) return;

    await sendMessage(currentMessage);
    setCurrentMessage('');
    clearTypingIndicator();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showCustomerForm) {
        handleStartChat();
      } else {
        handleSendMessage();
      }
    }
  };

  const handleInputChange = (value: string) => {
    setCurrentMessage(value);
    
    // Set typing indicator
    if (value.trim() && session) {
      setTypingIndicator();
      
      // Clear timeout if it exists
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to clear typing
      typingTimeoutRef.current = setTimeout(() => {
        clearTypingIndicator();
      }, 1000);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendFile(file);
    } catch (error) {
      console.error('Error sending file:', error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderFileMessage = (message: any) => {
    const isImage = message.message_type === 'image';
    
    return (
      <div className="max-w-xs">
        {isImage ? (
          <div className="space-y-2">
            <img 
              src={message.file_url} 
              alt={message.file_name}
              className="rounded-lg max-w-full h-auto cursor-pointer"
              onClick={() => window.open(message.file_url, '_blank')}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="h-3 w-3" />
              <span>{message.file_name}</span>
              <span>({(message.file_size / 1024 / 1024).toFixed(1)}MB)</span>
            </div>
          </div>
        ) : (
          <div className="bg-background/10 rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="h-4 w-4" />
              <span className="font-medium text-sm">{message.file_name}</span>
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              {(message.file_size / 1024 / 1024).toFixed(1)}MB
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(message.file_url, '_blank')}
              className="h-8"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        )}
      </div>
    );
  };

  const getStatusBadge = () => {
    if (!session) return null;
    
    const statusConfig = {
      waiting: { label: 'Waiting for agent...', className: 'bg-yellow-500' },
      active: { label: 'Agent online', className: 'bg-green-500' },
      closed: { label: 'Chat ended', className: 'bg-gray-500' },
    };
    
    const config = statusConfig[session.status];
    return (
      <Badge className={cn('text-xs', config.className)}>
        {config.label}
      </Badge>
    );
  };

  const getTypingIndicator = () => {
    const agentTyping = typingUsers.filter(user => user.user_type === 'agent');
    if (agentTyping.length === 0) return null;
    
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
        </div>
        Agent is typing...
      </div>
    );
  };

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
  };

  if (!isOpen) {
    return (
      <div className={cn('fixed z-50', positionClasses[position], className)}>
        <Button
          onClick={handleToggleChat}
          size="lg"
          className="rounded-full shadow-lg h-14 w-14 bg-primary hover:bg-primary/90"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('fixed z-50', positionClasses[position], className)}>
      <Card className={cn(
        'w-80 shadow-xl transition-all duration-300',
        isMinimized ? 'h-14' : 'h-96'
      )}>
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Live Support</h3>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleChat}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-80">
            {showCustomerForm ? (
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <h4 className="font-medium mb-2">Start a conversation</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Let us know how we can help you today.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Input
                    placeholder="Your name (optional)"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Your email (optional)"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <Input
                    placeholder="How can we help you?"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button 
                    onClick={handleStartChat}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Starting...' : 'Start Chat'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-2',
                          message.sender_type === 'customer' 
                            ? 'justify-end' 
                            : 'justify-start'
                        )}
                      >
                        {message.sender_type !== 'customer' && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {message.sender_type === 'agent' ? 'A' : 'S'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                         <div
                          className={cn(
                            'max-w-xs rounded-lg px-3 py-2 text-sm',
                            message.sender_type === 'customer'
                              ? 'bg-primary text-primary-foreground'
                              : message.sender_type === 'system'
                              ? 'bg-muted text-muted-foreground text-center italic'
                              : 'bg-muted',
                            message.sender_type === 'system' && 'self-center'
                          )}
                         >
                           {message.message_type === 'file' || message.message_type === 'image' ? (
                             renderFileMessage(message)
                           ) : (
                             <p>{message.message}</p>
                           )}
                           {message.metadata?.ai_generated && (
                             <div className="flex items-center gap-1 mt-1">
                               <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                               <span className="text-xs opacity-60">AI Assistant</span>
                             </div>
                           )}
                           <p className={cn(
                             'text-xs mt-1 opacity-70',
                             message.sender_type === 'customer' ? 'text-right' : 'text-left'
                           )}>
                             {formatMessageTime(message.created_at)}
                           </p>
                         </div>
                        
                        {message.sender_type === 'customer' && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {customerInfo.name ? customerInfo.name.charAt(0).toUpperCase() : 'C'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    
                    {getTypingIndicator()}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder={session?.status === 'closed' ? 'Chat ended' : 'Type a message...'}
                      value={currentMessage}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={session?.status === 'closed' || uploadingFile}
                      className="flex-1"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={session?.status === 'closed' || uploadingFile}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim() || session?.status === 'closed' || uploadingFile}
                      size="sm"
                    >
                      {uploadingFile ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default LiveChatWidget;