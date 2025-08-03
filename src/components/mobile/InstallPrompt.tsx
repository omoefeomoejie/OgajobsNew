import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Download, Smartphone, Zap } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useMobile';

export function InstallPrompt() {
  const { isInstallable, installApp } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm shadow-lg border-primary/20 bg-gradient-to-r from-primary/5 to-blue-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Install OgaJobs</CardTitle>
            <Badge variant="secondary" className="text-xs">
              Free
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-sm">
          Get the full app experience with offline access and faster loading
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-green-500" />
            <span>Lightning fast</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-3 w-3 text-blue-500" />
            <span>Works offline</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={installApp} size="sm" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDismissed(true)}
          >
            Not now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}