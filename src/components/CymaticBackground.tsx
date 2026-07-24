import { useState, useEffect } from "react";
import { BooksAtmosphere } from "./BooksAtmosphere";

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

    // Listen to custom events to change atmosphere state dynamically
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
      id="study-atmosphere-bg"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      <BooksAtmosphere />

      {/* Retain the soft resonance rings for depth */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full border border-indigo-500/5 animate-ping [animation-duration:12s]" />
      <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full border border-cyan-500/5 animate-ping [animation-duration:15s]" />
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
