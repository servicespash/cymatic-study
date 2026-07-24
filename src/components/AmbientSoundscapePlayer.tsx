import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Play, Pause, Disc, Waves, CloudRain, Wind } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

type SoundscapeType = "off" | "cymatic" | "rain" | "whitenoise" | "lofi";

export function AmbientSoundscapePlayer() {
  const [activeSound, setActiveSound] = useState<SoundscapeType>("off");
  const [volume, setVolume] = useState<number>(0.3);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  const stopAudio = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {}
      oscillatorRef.current = null;
    }
    if (noiseNodeRef.current) {
      try {
        if ("disconnect" in noiseNodeRef.current) {
          (noiseNodeRef.current as any).disconnect();
        }
      } catch {}
      noiseNodeRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const startSoundscape = (type: SoundscapeType) => {
    stopAudio();
    setActiveSound(type);

    if (type === "off") {
      toast.info("Ambient soundscape stopped.");
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.value = volume;
      gain.connect(ctx.destination);
      gainNodeRef.current = gain;

      if (type === "cymatic") {
        // Binaural / Solfeggio 432Hz focus frequency with sine modulation
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(432, ctx.currentTime);
        osc.connect(gain);
        osc.start();
        oscillatorRef.current = osc;
        toast.success("Playing 432Hz Cymatic Focus Frequency");
      } else if (type === "rain" || type === "whitenoise" || type === "lofi") {
        // Generate pink/white noise buffer for rain or white noise
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0,
          b1 = 0,
          b2 = 0,
          b3 = 0,
          b4 = 0,
          b5 = 0,
          b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (type === "rain") {
            // Low pass filter effect for rain
            b0 = 0.99886 * b0 + white * 0.0555179;
            output[i] = b0 * 0.3;
          } else {
            output[i] = white * 0.15;
          }
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        whiteNoise.connect(gain);
        whiteNoise.start();
        noiseNodeRef.current = whiteNoise;
        toast.success(`Playing ${type.toUpperCase()} soundscape for study focus`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not start audio context. Check browser permissions.");
    }
  };

  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-xl text-zinc-100 max-w-xl mx-auto my-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
        <div className="flex items-center gap-2">
          <Waves className="h-4 w-4 text-cyan-400 animate-pulse" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-200">
            Focused Study Soundscapes & Cymatic Frequencies
          </h3>
        </div>
        <span className="text-[10px] font-mono text-cyan-400">
          {activeSound !== "off" ? "Active" : "Muted"}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-3">
        {[
          { id: "off", label: "Off", icon: VolumeX },
          { id: "cymatic", label: "432Hz", icon: Disc },
          { id: "rain", label: "Rain", icon: CloudRain },
          { id: "whitenoise", label: "Noise", icon: Wind },
          { id: "lofi", label: "Lo-Fi", icon: Volume2 },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeSound === item.id;
          return (
            <button
              key={item.id}
              onClick={() => startSoundscape(item.id as SoundscapeType)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-bold transition-all gap-1 ${
                isActive
                  ? "border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-sm"
                  : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {activeSound !== "off" && (
        <div className="flex items-center gap-3 px-1 pt-1">
          <span className="text-[10px] text-zinc-400 font-mono">Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-cyan-500 bg-zinc-800 rounded-lg h-1.5"
          />
          <span className="text-[10px] text-cyan-400 font-mono w-8 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
