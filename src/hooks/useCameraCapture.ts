import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  quality?: number;
}

interface CapturedImage {
  blob: Blob;
  url: string;
  metadata: {
    timestamp: string;
    location?: GeolocationPosition;
    deviceInfo: string;
    resolution: { width: number; height: number };
  };
}

export function useCameraCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Check camera support
  const checkCameraSupport = useCallback(() => {
    const supported = !!(
      navigator.mediaDevices && 
      navigator.mediaDevices.getUserMedia &&
      navigator.mediaDevices.enumerateDevices
    );
    setIsSupported(supported);
    return supported;
  }, []);

  // Get available cameras
  const getAvailableCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error getting camera devices:', error);
      return [];
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (options: CameraOptions = {}) => {
    if (!checkCameraSupport()) {
      const errorMsg = 'Camera not supported on this device';
      setError(errorMsg);
      toast({
        title: "Camera Error",
        description: errorMsg,
        variant: "destructive",
      });
      return false;
    }

    try {
      setError(null);
      setIsCapturing(true);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: options.facingMode || 'environment',
          width: { ideal: options.width || 1920 },
          height: { ideal: options.height || 1080 },
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      return true;
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      setError(errorMsg);
      setIsCapturing(false);
      
      toast({
        title: "Camera Access Failed",
        description: errorMsg,
        variant: "destructive",
      });
      
      return false;
    }
  }, [checkCameraSupport, toast]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCapturing(false);
    setError(null);
  }, [stream]);

  // Capture photo
  const capturePhoto = useCallback(async (
    options: { 
      includeLocation?: boolean;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<CapturedImage | null> => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      toast({
        title: "Capture Error",
        description: "Camera not ready. Please start camera first.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas context not available');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get location if requested
      let location: GeolocationPosition | undefined;
      if (options.includeLocation) {
        location = await getCurrentLocation();
      }

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create image blob'));
            }
          },
          `image/${options.format || 'jpeg'}`,
          options.quality || 0.9
        );
      });

      // Create object URL for preview
      const url = URL.createObjectURL(blob);

      // Create metadata
      const metadata = {
        timestamp: new Date().toISOString(),
        location,
        deviceInfo: navigator.userAgent,
        resolution: {
          width: canvas.width,
          height: canvas.height
        }
      };

      const capturedImage: CapturedImage = {
        blob,
        url,
        metadata
      };

      toast({
        title: "Photo Captured",
        description: "Photo captured successfully",
      });

      return capturedImage;
    } catch (error: any) {
      console.error('Error capturing photo:', error);
      toast({
        title: "Capture Failed",
        description: error.message || "Failed to capture photo",
        variant: "destructive",
      });
      return null;
    }
  }, [stream, toast]);

  // Switch camera (front/back)
  const switchCamera = useCallback(async () => {
    if (!stream) return false;

    const currentFacingMode = stream.getVideoTracks()[0]?.getSettings()?.facingMode;
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    stopCamera();
    return await startCamera({ facingMode: newFacingMode });
  }, [stream, stopCamera, startCamera]);

  // Get current location
  const getCurrentLocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(new Error(`Location error: ${error.message}`)),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, []);

  // Helper function to get user-friendly error messages
  const getErrorMessage = (error: any): string => {
    if (error.name === 'NotAllowedError') {
      return 'Camera permission denied. Please allow camera access and try again.';
    } else if (error.name === 'NotFoundError') {
      return 'No camera found on this device.';
    } else if (error.name === 'NotSupportedError') {
      return 'Camera not supported on this device.';
    } else if (error.name === 'NotReadableError') {
      return 'Camera is already in use by another application.';
    } else if (error.name === 'OverconstrainedError') {
      return 'Camera settings not supported. Try different settings.';
    }
    return error.message || 'An unknown camera error occurred.';
  };

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    stopCamera();
  }, [stopCamera]);

  return {
    // State
    isCapturing,
    stream,
    error,
    isSupported,
    
    // Refs for components
    videoRef,
    canvasRef,
    
    // Functions
    checkCameraSupport,
    getAvailableCameras,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    getCurrentLocation,
    cleanup
  };
}