import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEmailQueueProcessor } from '@/hooks/useEmailQueueProcessor';
import { supabase } from '@/integrations/supabase/client';

interface QueueItem {
  id: string;
  user_email: string;
  template: string;
  status: string;
  created_at: string;
  processed_at?: string;
  error_message?: string;
}

export function EmailQueueDebugger() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { processEmailQueue, checkEmailQueue, isProcessing } = useEmailQueueProcessor();

  const loadQueueItems = async () => {
    setLoading(true);
    const result = await checkEmailQueue();
    if (result.success) {
      setQueueItems(result.data || []);
    }
    setLoading(false);
  };

  const handleProcessQueue = async () => {
    await processEmailQueue();
    // Reload queue after processing
    setTimeout(loadQueueItems, 1000);
  };

  const testWelcomeEmail = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Insert a test email into queue
      const { error } = await supabase
        .from('email_notifications_queue')
        .insert({
          user_id: user.id,
          user_email: user.email,
          template: 'welcome_client',
          status: 'pending',
          data: {
            fullName: user.email,
            userEmail: user.email,
            role: 'client',
            appUrl: 'https://vclzkuzexsuhaaliweey.supabase.co'
          }
        });

      if (!error) {
        await loadQueueItems();
      }
    } catch (error) {
      console.error('Test email error:', error);
    }
  };

  useEffect(() => {
    loadQueueItems();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'sent': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'ready_for_processing': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Queue Debugger</CardTitle>
        <div className="flex gap-2">
          <Button onClick={loadQueueItems} disabled={loading} size="sm">
            {loading ? 'Loading...' : 'Refresh Queue'}
          </Button>
          <Button onClick={handleProcessQueue} disabled={isProcessing} size="sm">
            {isProcessing ? 'Processing...' : 'Process Queue'}
          </Button>
          <Button onClick={testWelcomeEmail} variant="outline" size="sm">
            Add Test Email
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Queue contains {queueItems.length} items
          </div>
          
          {queueItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded">
              <div className="space-y-1">
                <div className="font-medium">{item.user_email}</div>
                <div className="text-sm text-muted-foreground">
                  Template: {item.template} • Created: {new Date(item.created_at).toLocaleString()}
                </div>
                {item.error_message && (
                  <div className="text-sm text-red-600">{item.error_message}</div>
                )}
              </div>
              <Badge className={getStatusColor(item.status)}>
                {item.status}
              </Badge>
            </div>
          ))}
          
          {queueItems.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No items in email queue
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}