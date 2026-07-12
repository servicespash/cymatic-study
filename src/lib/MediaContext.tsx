import React, { createContext, useContext, useState, useRef, useEffect } from "react";

type MediaTrack = {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover_url?: string;
};

type MediaContextType = {
  currentTrack: MediaTrack | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  playTrack: (track: MediaTrack) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
};

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<MediaTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("timeupdate", () => {
        setProgress(audioRef.current?.currentTime || 0);
      });
      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current?.duration || 0);
      });
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setProgress(0);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const playTrack = (track: MediaTrack) => {
    if (!audioRef.current) return;

    if (currentTrack?.id !== track.id) {
      setCurrentTrack(track);
      audioRef.current.src = track.url;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    } else {
      togglePlay();
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  return (
    <MediaContext.Provider
      value={{ currentTrack, isPlaying, progress, duration, playTrack, togglePlay, seek }}
    >
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = () => {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error("useMedia must be used within a MediaProvider");
  }
  return context;
};
