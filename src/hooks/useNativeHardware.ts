import { useEffect, useState, useCallback } from "react";

export const useNativeHardware = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);

  const requestAccess = useCallback(async () => {
    try {
      // Request and lock high-priority access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          channelCount: 1,
        },
        video: {
          facingMode: "environment",
          frameRate: { ideal: 30, max: 60 },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      return mediaStream;
    } catch (error) {
      console.error("Error accessing native hardware:", error);
      throw error;
    }
  }, []);

  const stopAccess = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return { stream, requestAccess, stopAccess };
};
