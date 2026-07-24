import { useEffect, useRef, useState } from "react";
import { Sliders, RefreshCw, CheckCircle2, XCircle, Sparkles, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useGamificationStore } from "@/store/useGamificationStore";
import { toast } from "sonner";

interface WaveQuizQuestion {
  id: string;
  question: string;
  description: string;
  targetFrequency: number;
  targetSeparation: number;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const waveQuestions: WaveQuizQuestion[] = [
  {
    id: "wave-1",
    question: "Constructive Interference & Path Difference",
    description:
      "Adjust the source frequency and separation to create strong central constructive interference (bright fringes).",
    targetFrequency: 5,
    targetSeparation: 40,
    options: [
      "Path difference is an odd multiple of half-wavelengths ((n + 0.5)λ)",
      "Path difference is an integer multiple of the wavelength (nλ)",
      "There is a phase shift of exactly 180 degrees",
      "Amplitude drops to absolute zero at the center",
    ],
    correctIndex: 1,
    explanation:
      "At the center and maxima points, constructive interference occurs when path difference is an integral multiple of wavelength (nλ).",
  },
  {
    id: "wave-2",
    question: "Wavelength & Fringe Spacing Relationship",
    description:
      "Observe how changing wavelength affects interference patterns in NCDC Advanced Physics.",
    targetFrequency: 8,
    targetSeparation: 60,
    options: [
      "Fringe separation is inversely proportional to wavelength",
      "Fringe separation is directly proportional to wavelength (y = λD/d)",
      "Fringe separation is independent of wavelength",
      "Fringe separation depends solely on source amplitude",
    ],
    correctIndex: 1,
    explanation:
      "According to Young's double slit formula, fringe separation y = λD/d, showing direct proportionality with wavelength λ.",
  },
];

export function WaveInterferenceQuiz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frequency, setFrequency] = useState<number>(5); // 1 to 10
  const [separation, setSeparation] = useState<number>(40); // 10 to 100
  const [amplitude, setAmplitude] = useState<number>(50); // 10 to 100
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const { addXp, addCompletedTask } = useGamificationStore();

  const currentQ = waveQuestions[currentQIndex];

  // Canvas Wave Interference Simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.05 * (frequency * 0.4);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const cx1 = width / 2 - separation;
      const cy1 = height / 2;
      const cx2 = width / 2 + separation;
      const cy2 = height / 2;

      // Draw interference grid / heatmap
      const cols = 60;
      const rows = 40;
      const cellW = width / cols;
      const cellH = height / rows;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * cellW + cellW / 2;
          const y = j * cellH + cellH / 2;

          const d1 = Math.sqrt((x - cx1) ** 2 + (y - cy1) ** 2);
          const d2 = Math.sqrt((x - cx2) ** 2 + (y - cy2) ** 2);

          const wave1 = Math.sin(d1 * 0.05 - time) * (amplitude / 100);
          const wave2 = Math.sin(d2 * 0.05 - time) * (amplitude / 100);
          const combined = wave1 + wave2;

          // Intensity color mapping
          const intensity = Math.abs(combined);
          const red = Math.floor(intensity * 120);
          const blue = Math.floor(intensity * 220 + 30);
          const alpha = Math.min(0.8, intensity * 0.6 + 0.1);

          ctx.fillStyle = `rgba(${red}, 100, ${blue}, ${alpha})`;
          ctx.fillRect(i * cellW, j * cellH, cellW + 1, cellH + 1);
        }
      }

      // Draw wave sources (S1 and S2)
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#06b6d4";

      ctx.beginPath();
      ctx.arc(cx1, cy1, 6, 0, Math.PI * 2);
      ctx.arc(cx2, cy2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Labels for sources
      ctx.fillStyle = "#ffffff";
      ctx.font = "10px sans-serif";
      ctx.fillText("S1", cx1 - 15, cy1 - 10);
      ctx.fillText("S2", cx2 + 10, cy2 - 10);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [frequency, separation, amplitude]);

  const handleConfirm = () => {
    if (selectedOption === null) return;
    setIsConfirmed(true);
    if (selectedOption === currentQ.correctIndex) {
      setScore((s) => s + 1);
      toast.success("Correct wave interference analysis!");
    } else {
      toast.error("Incorrect. Review the wave parameters and try again.");
    }
  };

  const handleNext = () => {
    if (currentQIndex + 1 < waveQuestions.length) {
      setCurrentQIndex((i) => i + 1);
      setSelectedOption(null);
      setIsConfirmed(false);
    } else {
      setQuizCompleted(true);
      addXp(60);
      addCompletedTask({
        date: new Date().toISOString(),
        taskId: "physics-wave-interference-lab",
        scorePct: 100,
        title: "Wave Interference Interactive Lab",
        taskType: "physics_lab",
      });
      toast.success("Wave Interference Lab completed! +60 XP earned.");
    }
  };

  const handleResetQuiz = () => {
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsConfirmed(false);
    setScore(0);
    setQuizCompleted(false);
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl text-zinc-100 max-w-4xl mx-auto my-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-extrabold text-zinc-100">
              Interactive Physics Lab: Wave Superposition & Interference
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            NCDC Advanced Physics Practical Simulator — Adjust frequency, source separation, and
            amplitude in real time.
          </p>
        </div>
        {!quizCompleted && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Question {currentQIndex + 1} of {waveQuestions.length}
          </span>
        )}
      </div>

      {quizCompleted ? (
        <div className="text-center py-12 space-y-4">
          <Award className="h-16 w-16 text-yellow-400 mx-auto animate-bounce" />
          <h3 className="text-2xl font-bold">Wave Interference Lab Completed!</h3>
          <p className="text-sm text-zinc-400">
            You successfully analyzed wave interference patterns and scored {score}/
            {waveQuestions.length}.
          </p>
          <div className="pt-4">
            <button
              onClick={handleResetQuiz}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 px-6 py-3 text-sm font-bold shadow-lg transition-all"
            >
              <RefreshCw className="h-4 w-4" /> Restart Lab
            </button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Canvas & Controls */}
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-black aspect-[4/3] flex items-center justify-center shadow-inner">
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 text-[10px] bg-zinc-950/80 px-2 py-1 rounded border border-zinc-800 text-zinc-400 font-mono">
                f: {frequency}Hz | d: {separation}px | A: {amplitude}%
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-3 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <span>Simulation Controls</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Frequency (f)</span>
                  <span className="text-cyan-400 font-mono">{frequency} Hz</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-zinc-800 rounded-lg h-1.5"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Source Separation (d)</span>
                  <span className="text-cyan-400 font-mono">{separation} px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  value={separation}
                  onChange={(e) => setSeparation(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-zinc-800 rounded-lg h-1.5"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Wave Amplitude (A)</span>
                  <span className="text-cyan-400 font-mono">{amplitude}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={amplitude}
                  onChange={(e) => setAmplitude(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-zinc-800 rounded-lg h-1.5"
                />
              </div>
            </div>
          </div>

          {/* Question & Options */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                Physics Analytical Question
              </span>
              <h3 className="text-base font-bold text-zinc-100">{currentQ.question}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{currentQ.description}</p>
            </div>

            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = isConfirmed && idx === currentQ.correctIndex;
                const isIncorrect = isConfirmed && isSelected && idx !== currentQ.correctIndex;

                let borderClass = "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700";
                if (isSelected) borderClass = "border-cyan-500 bg-cyan-500/10 text-cyan-300";
                if (isCorrect)
                  borderClass = "border-emerald-500 bg-emerald-500/10 text-emerald-300";
                if (isIncorrect) borderClass = "border-rose-500 bg-rose-500/10 text-rose-300";

                return (
                  <button
                    key={idx}
                    disabled={isConfirmed}
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${borderClass}`}
                  >
                    <span>{opt}</span>
                    {isCorrect && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    )}
                    {isIncorrect && <XCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {isConfirmed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1"
              >
                <span className="font-bold text-cyan-400">Explanation:</span>
                <p className="leading-snug text-zinc-400">{currentQ.explanation}</p>
              </motion.div>
            )}

            <div className="pt-2">
              {!isConfirmed ? (
                <button
                  disabled={selectedOption === null}
                  onClick={handleConfirm}
                  className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-zinc-950 font-bold py-3 text-sm shadow-lg transition-all"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 text-sm shadow-lg transition-all"
                >
                  {currentQIndex + 1 < waveQuestions.length ? "Next Question" : "Complete Lab"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
