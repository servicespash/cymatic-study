// Download notes / exercises as text files. Uses Capacitor Filesystem on device,
// and a normal browser download on web.
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export async function downloadText(filename: string, content: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      try {
        await Share.share({
          title: filename,
          text: "Saved from Latty's Cymatic Study",
          url: res.uri,
        });
      } catch (err) {
        console.warn("sharing failed", err);
      }
      return res.uri;
    } catch (e) {
      console.warn("native save failed", e);
      return null;
    }
  }
  // Web fallback
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return null;
}
