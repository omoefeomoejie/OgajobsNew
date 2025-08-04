import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Camera, 
  RotateCcw, 
  Download, 
  MapPin, 
  X, 
  Check,
  AlertCircle 
} from 'lucide-react';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  onCapture?: (image: { blob: Blob; url: string; metadata: any }) => void;
  onClose?: () => void;
  includeLocation?: boolean;
  showPreview?: boolean;
  className?: string;
}

export function CameraCapture({ 
  onCapture, 
  onClose, 
  includeLocation = true,
  showPreview = true,
  className = ""
}: CameraCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<any>(null);
  const [includeGPS, setIncludeGPS] = useState(includeLocation);
  const [isUploading, setIsUploading] = useState(false);
  
  const {
    isCapturing,
    error,
    isSupported,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    cleanup
  } = useCameraCapture();
  
  const { toast } = useToast();

  useEffect(() => {
    // Start camera when component mounts
    if (isSupported) {
      startCamera({ facingMode: 'environment' });
    }

    // Cleanup on unmount
    return cleanup;
  }, [isSupported, startCamera, cleanup]);

  const handleCapture = async () => {
    try {
      const image = await capturePhoto({ 
        includeLocation: includeGPS,
        quality: 0.9,
        format: 'jpeg'
      });
      
      if (image) {
        setCapturedImage(image);
        if (onCapture) {
          onCapture(image);
        }
      }
    } catch (error) {
      console.error('Capture failed:', error);
    }
  };

  const handleRetake = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url);
      setCapturedImage(null);
    }
  };

  const handleDownload = () => {
    if (!capturedImage) return;
    
    const link = document.createElement('a');
    link.href = capturedImage.url;
    link.download = `craftconnect-photo-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Complete",
      description: "Photo downloaded successfully",
    });
  };

  const handleClose = () => {
    cleanup();
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url);
    }
    if (onClose) {
      onClose();
    }
  };

  if (!isSupported) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Camera Not Supported</h3>
          <p className="text-muted-foreground mb-4">
            Your device doesn't support camera functionality or camera access is not available.
          </p>
          <Button onClick={handleClose} variant="outline">
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className="p-0">
        {/* Camera Controls Header */}
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              <span className="font-semibold">Camera</span>
              {isCapturing && (
                <Badge variant="default" className="animate-pulse">
                  Live
                </Badge>
              )}
            </div>
            <Button onClick={handleClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Settings */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="include-gps"
                checked={includeGPS}
                onCheckedChange={setIncludeGPS}
              />
              <Label htmlFor="include-gps" className="text-sm">
                <MapPin className="h-3 w-3 inline mr-1" />
                Include Location
              </Label>
            </div>
            
            {isCapturing && (
              <Button onClick={switchCamera} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Camera View */}
        <div className="relative bg-black">
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-center text-white p-4">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
                <Button 
                  onClick={() => startCamera()} 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
          
          {/* Live Camera Feed */}
          {!capturedImage && (
            <video
              ref={videoRef}
              className="w-full aspect-[4/3] object-cover"
              playsInline
              muted
              autoPlay
            />
          )}
          
          {/* Captured Image Preview */}
          {capturedImage && showPreview && (
            <div className="relative">
              <img
                src={capturedImage.url}
                alt="Captured"
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge variant="secondary">
                  <Check className="h-3 w-3 mr-1" />
                  Captured
                </Badge>
              </div>
            </div>
          )}
          
          {/* Overlay Grid (for composition help) */}
          {!capturedImage && isCapturing && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/50" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Camera Controls */}
        <div className="p-4 bg-muted/50">
          {!capturedImage ? (
            <div className="flex justify-center">
              <Button
                onClick={handleCapture}
                disabled={!isCapturing || !!error}
                size="lg"
                className="rounded-full w-16 h-16"
              >
                <Camera className="h-6 w-6" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 justify-center">
              <Button onClick={handleRetake} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleClose}>
                <Check className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          )}
        </div>

        {/* Image Metadata (for debugging) */}
        {capturedImage && capturedImage.metadata && (
          <div className="p-4 border-t bg-muted/30">
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium">
                Photo Details
              </summary>
              <div className="mt-2 space-y-1">
                <div>Resolution: {capturedImage.metadata.resolution.width} × {capturedImage.metadata.resolution.height}</div>
                <div>Timestamp: {new Date(capturedImage.metadata.timestamp).toLocaleString()}</div>
                {capturedImage.metadata.location && (
                  <div>
                    Location: {capturedImage.metadata.location.coords.latitude.toFixed(6)}, {capturedImage.metadata.location.coords.longitude.toFixed(6)}
                  </div>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}