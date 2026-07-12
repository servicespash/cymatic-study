import { useState, useEffect } from "react";

export function CymaticBackground() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lattys-particles");
      if (saved !== null) {
        setEnabled(saved === "true");
      }
    } catch {
      // ignore
    }

    // Listen to custom events to change particle state dynamically
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      setEnabled(customEvent.detail.enabled);
    };

    window.addEventListener("toggle-particles", handleToggle);
    return () => {
      window.removeEventListener("toggle-particles", handleToggle);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      id="cymatic-particle-bg"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-30 select-none"
    >
      {/* Sine Wave / Resonance Rings */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full border border-indigo-500/10 animate-ping [animation-duration:8s]" />
      <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full border border-cyan-500/5 animate-ping [animation-duration:12s]" />

      {/* Scattered particles with staggered sinusoidal movement */}
      {[...Array(24)].map((_, i) => {
        const size = Math.random() * 5 + 2; // 2px to 7px
        const left = Math.random() * 100; // %
        const top = Math.random() * 100; // %
        const duration = Math.random() * 15 + 10; // 10s to 25s
        const delay = Math.random() * -10; // offset
        const color = i % 3 === 0 ? "bg-cyan-400" : i % 3 === 1 ? "bg-indigo-400" : "bg-purple-400";

        return (
          <div
            key={i}
            className={`absolute rounded-full opacity-60 blur-[1px] animate-pulse ${color}`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              top: `${top}%`,
              animation: `float-sinusoidal ${duration}s ease-in-out infinite alternate`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}

      <style>{`
        @keyframes float-sinusoidal {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translate(25px, -40px) scale(1.2);
            opacity: 0.6;
          }
          100% {
            transform: translate(-25px, -80px) scale(0.8);
            opacity: 0.1;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Utility function to toggle particles globally
 */
export function toggleParticles(enabled: boolean) {
  try {
    localStorage.setItem("lattys-particles", String(enabled));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("toggle-particles", { detail: { enabled } }));
}
