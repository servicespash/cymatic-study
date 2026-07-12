import { useRef, useEffect, useState } from "react";
import { Paperclip, Mic, Send, MicOff } from "lucide-react";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

export function InputField({
  input,
  setInput,
  onSubmit,
  isLoading,
  onFileClick,
  onMicClick: _onMicClick,
}: {
  input: string;
  setInput: (s: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onFileClick: () => void;
  onMicClick: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      await SpeechRecognition.stop();
      setIsListening(false);
    } else {
      const { available } = await SpeechRecognition.available();
      if (available) {
        setIsListening(true);
        await SpeechRecognition.start({
          popup: false,
          partialResults: true,
          language: "en-US",
        });

        SpeechRecognition.addListener("partialResults", (data: any) => {
          if (data.matches && data.matches.length > 0) {
            setInput(data.matches[0]);
          }
        });
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-full flex items-end p-2 shadow-lg focus-within:border-zinc-700 transition-colors">
        <button
          onClick={onFileClick}
          className="p-3 text-zinc-500 hover:text-white"
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          aria-label="Message input"
          className="flex-1 bg-transparent py-3 px-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none resize-none max-h-32 overflow-y-auto"
        />
        <button
          onClick={toggleListening}
          className={`p-3 hover:text-white ${isListening ? "text-red-500" : "text-zinc-500"}`}
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <button
          onClick={onSubmit}
          disabled={isLoading || !input.trim()}
          className="p-3 bg-white text-black rounded-full disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
