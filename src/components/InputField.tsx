import { useRef, useEffect, useState } from "react";
import { Paperclip, Mic, Send, MicOff } from "lucide-react";

export function InputField({
  input,
  setInput,
  onSubmit,
  isLoading,
  onFileSelect,
  attachedFileName,
  onRemoveAttachment,
}: {
  input: string;
  setInput: (s: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onFileSelect?: (file: { name: string; content: string }) => void;
  attachedFileName?: string | null;
  onRemoveAttachment?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + " " + transcript : transcript));
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
    return () => {
      recognitionRef.current?.stop();
    };
  }, [setInput]);

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

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Please select a file smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (onFileSelect) {
        onFileSelect({ name: file.name, content });
      }
    };
    reader.readAsText(file);
    if (e.target) {
      e.target.value = ""; // Reset file input so same file can be uploaded again
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 flex flex-col gap-2">
      {/* File Attachment Preview */}
      {attachedFileName && (
        <div className="flex items-center gap-2 self-start bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-full ml-4 shadow-sm">
          <Paperclip className="h-3.5 w-3.5 text-purple-400" />
          <span className="font-mono truncate max-w-[200px]">{attachedFileName}</span>
          <button
            onClick={onRemoveAttachment}
            className="text-zinc-500 hover:text-white font-bold ml-1 h-4 w-4 rounded-full flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
            title="Remove file"
          >
            &times;
          </button>
        </div>
      )}

      <div className="relative bg-zinc-900 border border-zinc-800 rounded-full flex items-end p-2 shadow-lg focus-within:border-zinc-700 transition-colors">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.js,.ts,.tsx,.json,.md,.html,.css,.xml"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-zinc-500 hover:text-white cursor-pointer"
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
          className={`p-3 hover:text-white transition-colors cursor-pointer ${isListening ? "text-red-500 animate-pulse" : "text-zinc-500"}`}
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <button
          onClick={onSubmit}
          disabled={isLoading || (!input.trim() && !attachedFileName)}
          className="p-3 bg-white text-black rounded-full disabled:opacity-50 cursor-pointer hover:bg-zinc-200 transition-colors"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
