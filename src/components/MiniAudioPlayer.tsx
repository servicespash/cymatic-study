import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

export function MiniAudioPlayer({ src, title }: { src: string; title: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div className="my-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
      <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} />
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="h-10 w-10 flex items-center justify-center rounded-full bg-cyan-500 text-black hover:bg-cyan-400 transition-colors"
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">{title}</p>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Podcast Episode</p>
      </div>
      <Volume2 className="h-4 w-4 text-zinc-500" />
    </div>
  );
}
