import asyncio
import edge_tts
import sys
import os
import hashlib

# Configuration for Adams and Haawa
VOICES = {
    "Adams": "en-NG-AbeoNeural",
    "Haawa": "en-NG-EzinneNeural"
}

CACHE_DIR = "/data/data/com.termux/files/home/.gemini/tmp/lattyscymatichub/audio_cache"

async def generate_tts(text, persona):
    if persona not in VOICES:
        print(f"Error: Unknown persona {persona}")
        sys.exit(1)
    
    voice = VOICES[persona]
    
    # Create cache directory if it doesn't exist
    os.makedirs(CACHE_DIR, exist_ok=True)
    
    # Generate a unique filename based on text and voice
    text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
    output_file = os.path.join(CACHE_DIR, f"{persona}_{text_hash}.mp3")
    
    if os.path.exists(output_file):
        # Return existing file path if already cached
        print(output_file)
        return

    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_file)
    print(output_file)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python tts.py <text> <persona>")
        sys.exit(1)
    
    text = sys.argv[1]
    persona = sys.argv[2]
    
    asyncio.run(generate_tts(text, persona))
