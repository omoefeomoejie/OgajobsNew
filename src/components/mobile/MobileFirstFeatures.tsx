import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Navigation, 
  Camera, 
  Fingerprint, 
  Vibrate, 
  Battery, 
  Wifi, 
  Signal,
  Share2,
  Calendar,
  Contact,
  Bell,
  Flashlight,
  Palette,
  Volume2,
  Download,
  Check,
  X,
  Smartphone,
  Zap,
  Settings,
  Eye,
  Languages
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MobileFeature {
  id: string;
  name: string;
  description: string;
  icon: any;
  implemented: boolean;
  available: boolean;
  permission?: string;
  usage: 'high' | 'medium' | 'low';
}

interface DeviceInfo {
  platform: string;
  model: string;
  version: string;
  battery: number;
  network: string;
  storage: { used: number; total: number };
  capabilities: string[];
}

interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

interface CapturedMedia {
  id: string;
  type: 'photo' | 'video';
  url: string;
  timestamp: Date;
  size: number;
}

export function MobileFirstFeatures() {
  const [features, setFeatures] = useState<MobileFeature[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia[]>([]);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('features');
  const { toast } = useToast();

  // Initialize mobile features
  useEffect(() => {
    initializeMobileFeatures();
    detectDeviceInfo();
    checkPermissions();
  }, []);

  const initializeMobileFeatures = () => {
    const mobileFeatures: MobileFeature[] = [
      {
        id: 'geolocation',
        name: 'GPS & Location',
        description: 'Find nearby artisans and get directions',
        icon: MapPin,
        implemented: true,
        available: 'geolocation' in navigator,
        permission: 'geolocation',
        usage: 'high'
      },
      {
        id: 'camera',
        name: 'Camera Access',
        description: 'Take photos for portfolios and verification',
        icon: Camera,
        implemented: true,
        available: 'mediaDevices' in navigator,
        permission: 'camera',
        usage: 'high'
      },
      {
        id: 'push-notifications',
        name: 'Push Notifications',
        description: 'Real-time booking and message alerts',
        icon: Bell,
        implemented: true,
        available: 'Notification' in window,
        permission: 'notifications',
        usage: 'high'
      },
      {
        id: 'biometric',
        name: 'Biometric Authentication',
        description: 'Fingerprint and face ID login',
        icon: Fingerprint,
        implemented: false,
        available: 'credentials' in navigator,
        permission: 'credentials',
        usage: 'medium'
      },
      {
        id: 'vibration',
        name: 'Haptic Feedback',
        description: 'Tactile feedback for interactions',
        icon: Vibrate,
        implemented: true,
        available: 'vibrate' in navigator,
        usage: 'low'
      },
      {
        id: 'device-motion',
        name: 'Motion Sensors',
        description: 'Shake to refresh and gestures',
        icon: Smartphone,
        implemented: false,
        available: 'DeviceMotionEvent' in window,
        permission: 'accelerometer',
        usage: 'low'
      },
      {
        id: 'share',
        name: 'Native Sharing',
        description: 'Share content with other apps',
        icon: Share2,
        implemented: true,
        available: 'share' in navigator,
        usage: 'medium'
      },
      {
        id: 'contacts',
        name: 'Contact Access',
        description: 'Import contacts for referrals',
        icon: Contact,
        implemented: false,
        available: false, // Not widely supported
        permission: 'contacts',
        usage: 'low'
      }
    ];

    setFeatures(mobileFeatures);
  };

  const detectDeviceInfo = useCallback(async () => {
    try {
      const info: DeviceInfo = {
        platform: navigator.platform,
        model: (navigator as any).userAgentData?.mobile ? 'Mobile' : 'Desktop',
        version: navigator.userAgent,
        battery: 0,
        network: (navigator as any).connection?.effectiveType || 'unknown',
        storage: { used: 0, total: 0 },
        capabilities: []
      };

      // Get battery info if available
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        info.battery = Math.round(battery.level * 100);
      }

      // Get storage info if available
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        info.storage = {
          used: Math.round((estimate.usage || 0) / 1024 / 1024), // MB
          total: Math.round((estimate.quota || 0) / 1024 / 1024) // MB
        };
      }

      // Detect capabilities
      info.capabilities = [
        'serviceWorker' in navigator && 'Service Worker',
        'geolocation' in navigator && 'Geolocation',
        'mediaDevices' in navigator && 'Media Devices',
        'Notification' in window && 'Notifications',
        'share' in navigator && 'Web Share API',
        'vibrate' in navigator && 'Vibration',
        'getBattery' in navigator && 'Battery API'
      ].filter(Boolean) as string[];

      setDeviceInfo(info);
    } catch (error) {
      console.error('Error detecting device info:', error);
    }
  }, []);

  const checkPermissions = useCallback(async () => {
    try {
      // Check various permissions
      const permissions = ['geolocation', 'camera', 'notifications'];
      
      for (const permission of permissions) {
        if ('permissions' in navigator) {
          const result = await navigator.permissions.query({ name: permission as PermissionName });
          // Permission checked
        }
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  }, []);

  // Geolocation functions
  const enableLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your device doesn't support geolocation.",
        variant: "destructive"
      });
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const locationData: GeolocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      // Reverse geocoding to get address
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${locationData.latitude}+${locationData.longitude}&key=YOUR_API_KEY`
        );
        const data = await response.json();
        if (data.results && data.results[0]) {
          locationData.address = data.results[0].formatted;
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
      }

      setLocation(locationData);
      setIsLocationEnabled(true);

      toast({
        title: "Location Enabled",
        description: `Location accuracy: ${Math.round(locationData.accuracy)}m`,
      });

    } catch (error) {
      console.error('Geolocation error:', error);
      toast({
        title: "Location Error",
        description: "Failed to get your location. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Camera functions
  const enableCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Camera Not Supported",
        description: "Your device doesn't support camera access.",
        variant: "destructive"
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Stop the stream immediately (we just wanted to check permission)
      stream.getTracks().forEach(track => track.stop());
      
      setIsCameraEnabled(true);
      toast({
        title: "Camera Enabled",
        description: "Camera access granted successfully.",
      });

    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const capturePhoto = useCallback(async () => {
    if (!isCameraEnabled) {
      await enableCamera();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to load
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Stop the stream
      stream.getTracks().forEach(track => track.stop());

      const newMedia: CapturedMedia = {
        id: crypto.randomUUID(),
        type: 'photo',
        url: imageDataUrl,
        timestamp: new Date(),
        size: Math.round(imageDataUrl.length * 0.75) // Approximate size
      };

      setCapturedMedia(prev => [newMedia, ...prev]);

      toast({
        title: "Photo Captured",
        description: "Photo captured successfully!",
      });

    } catch (error) {
      console.error('Photo capture error:', error);
      toast({
        title: "Capture Error",
        description: "Failed to capture photo.",
        variant: "destructive"
      });
    }
  }, [isCameraEnabled, enableCamera, toast]);

  // Haptic feedback
  const triggerHaptic = useCallback((pattern: number | number[] = 200) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
      toast({
        title: "Haptic Feedback",
        description: "Vibration triggered successfully!",
      });
    } else {
      toast({
        title: "Haptic Not Supported",
        description: "Your device doesn't support vibration.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Native sharing
  const shareContent = useCallback(async () => {
    if ('share' in navigator) {
      try {
        await navigator.share({
          title: 'OgaJobs - Find Skilled Artisans',
          text: 'Check out this amazing platform for finding skilled artisans!',
          url: window.location.href
        });

        toast({
          title: "Content Shared",
          description: "Content shared successfully!",
        });
      } catch (error) {
        console.error('Share error:', error);
        if ((error as Error).name !== 'AbortError') {
          toast({
            title: "Share Error",
            description: "Failed to share content.",
            variant: "destructive"
          });
        }
      }
    } else {
      // Fallback to clipboard
      try {
        if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
          await (navigator as any).clipboard.writeText(window.location.href);
        }
        toast({
          title: "Link Copied",
          description: "Link copied to clipboard!",
        });
      } catch (error) {
        toast({
          title: "Share Not Supported",
          description: "Your device doesn't support native sharing.",
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  const getFeatureStatusColor = (feature: MobileFeature) => {
    if (!feature.available) return 'text-gray-400';
    if (feature.implemented) return 'text-green-500';
    return 'text-yellow-500';
  };

  const getUsageBadgeVariant = (usage: string) => {
    switch (usage) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Smartphone className="w-8 h-8 text-blue-500" />
          Mobile-First Features
        </h1>
        <p className="text-muted-foreground">
          Enhanced mobile capabilities and native device integration
        </p>
      </div>

      {/* Device Info Summary */}
      {deviceInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
            <CardDescription>Current device capabilities and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <Smartphone className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="font-medium">{deviceInfo.model}</div>
                  <div className="text-sm text-muted-foreground">{deviceInfo.platform}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Battery className="w-8 h-8 text-green-500" />
                <div>
                  <div className="font-medium">{deviceInfo.battery}%</div>
                  <div className="text-sm text-muted-foreground">Battery</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Signal className="w-8 h-8 text-purple-500" />
                <div>
                  <div className="font-medium">{deviceInfo.network}</div>
                  <div className="text-sm text-muted-foreground">Network</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Download className="w-8 h-8 text-orange-500" />
                <div>
                  <div className="font-medium">{deviceInfo.storage.used}MB</div>
                  <div className="text-sm text-muted-foreground">Used Storage</div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Available Capabilities:</div>
              <div className="flex flex-wrap gap-2">
                {deviceInfo.capabilities.map((capability, index) => (
                  <Badge key={index} variant="outline">{capability}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="camera">Camera</TabsTrigger>
          <TabsTrigger value="interaction">Interaction</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <Card key={feature.id} className="group hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${getFeatureStatusColor(feature)}`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{feature.name}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge variant={getUsageBadgeVariant(feature.usage)}>
                          {feature.usage}
                        </Badge>
                        {feature.implemented ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : feature.available ? (
                          <Settings className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <X className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={getFeatureStatusColor(feature)}>
                          {!feature.available ? 'Not Available' : 
                           feature.implemented ? 'Implemented' : 'Planned'}
                        </span>
                      </div>
                      {feature.permission && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Permission:</span>
                          <span>{feature.permission}</span>
                        </div>
                      )}
                    </div>

                    {feature.available && (
                      <Button 
                        size="sm" 
                        className="w-full mt-4"
                        variant={feature.implemented ? "default" : "outline"}
                        disabled={!feature.implemented}
                      >
                        {feature.implemented ? 'Test Feature' : 'Coming Soon'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="location" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>GPS & Location Services</CardTitle>
                <CardDescription>
                  Access device location for nearby artisan search and navigation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="location-toggle">Enable Location</Label>
                  <Switch 
                    id="location-toggle"
                    checked={isLocationEnabled}
                    onCheckedChange={enableLocation}
                  />
                </div>

                {location && (
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Latitude:</span>
                      <span>{location.latitude.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Longitude:</span>
                      <span>{location.longitude.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Accuracy:</span>
                      <span>{Math.round(location.accuracy)}m</span>
                    </div>
                    {location.address && (
                      <div className="pt-2 border-t">
                        <div className="text-sm font-medium">Address:</div>
                        <div className="text-sm text-muted-foreground">{location.address}</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Button onClick={enableLocation} className="w-full">
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Current Location
                  </Button>
                  <Button variant="outline" className="w-full" disabled={!location}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Find Nearby Artisans
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location-Based Features</CardTitle>
                <CardDescription>
                  Features that utilize location data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Nearby Search</div>
                      <div className="text-sm text-muted-foreground">Find artisans within radius</div>
                    </div>
                    <Badge variant={location ? "default" : "secondary"}>
                      {location ? "Ready" : "Disabled"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Route Navigation</div>
                      <div className="text-sm text-muted-foreground">Directions to artisan</div>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Location Sharing</div>
                      <div className="text-sm text-muted-foreground">Share location with artisan</div>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="camera" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Camera Integration</CardTitle>
                <CardDescription>
                  Capture photos for portfolios, verification, and documentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="camera-toggle">Enable Camera</Label>
                  <Switch 
                    id="camera-toggle"
                    checked={isCameraEnabled}
                    onCheckedChange={enableCamera}
                  />
                </div>

                <div className="space-y-2">
                  <Button onClick={capturePhoto} className="w-full" disabled={!isCameraEnabled}>
                    <Camera className="w-4 h-4 mr-2" />
                    Capture Photo
                  </Button>
                  <Button variant="outline" className="w-full" disabled>
                    <Eye className="w-4 h-4 mr-2" />
                    Scan QR Code
                  </Button>
                </div>

                {capturedMedia.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Recent Captures:</div>
                    <div className="text-sm text-muted-foreground">
                      {capturedMedia.length} photos captured
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Camera Features</CardTitle>
                <CardDescription>
                  Available camera-based functionality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Portfolio Photos</div>
                      <div className="text-sm text-muted-foreground">Capture work samples</div>
                    </div>
                    <Badge variant={isCameraEnabled ? "default" : "secondary"}>
                      {isCameraEnabled ? "Ready" : "Disabled"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">ID Verification</div>
                      <div className="text-sm text-muted-foreground">Document scanning</div>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Progress Photos</div>
                      <div className="text-sm text-muted-foreground">Job documentation</div>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interaction" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Haptic Feedback</CardTitle>
                <CardDescription>
                  Tactile feedback for better user experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => triggerHaptic(200)} variant="outline">
                    <Vibrate className="w-4 h-4 mr-2" />
                    Short
                  </Button>
                  <Button onClick={() => triggerHaptic([200, 100, 200])} variant="outline">
                    <Vibrate className="w-4 h-4 mr-2" />
                    Pattern
                  </Button>
                  <Button onClick={() => triggerHaptic(500)} variant="outline">
                    <Vibrate className="w-4 h-4 mr-2" />
                    Long
                  </Button>
                  <Button onClick={() => triggerHaptic([100, 50, 100, 50, 300])} variant="outline">
                    <Vibrate className="w-4 h-4 mr-2" />
                    Complex
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  Haptic feedback can be used for form validation, notifications, and user interactions.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Native Sharing</CardTitle>
                <CardDescription>
                  Share content using device's native sharing capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={shareContent} className="w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share App
                </Button>

                <div className="text-sm text-muted-foreground">
                  Native sharing allows users to share content directly to social media, messaging apps, and other installed applications.
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Shareable Content:</div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>• Artisan profiles</div>
                    <div>• Service listings</div>
                    <div>• Portfolio items</div>
                    <div>• App referrals</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}