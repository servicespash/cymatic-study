export function MainContainer({ displayName }: { displayName: string }) {
  const prompts = [
    "Explain photosynthesis",
    "Solve quadratics",
    "Draft a physics report",
    "Analyze biology trends",
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12 animate-in fade-in duration-700">
      <h1 className="text-4xl md:text-5xl font-semibold text-zinc-100">Hello, {displayName}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        {prompts.map((p) => (
          <button
            key={p}
            className="p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-left text-sm text-zinc-300 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
