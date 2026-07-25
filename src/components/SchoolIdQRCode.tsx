import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Download, Copy, Check, ShieldCheck, Building, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface SchoolIdQRCodeProps {
  schoolId: string;
  schoolName?: string;
  studentName?: string;
  role?: string;
  size?: number;
  className?: string;
}

export function SchoolIdQRCode({
  schoolId,
  schoolName = "Uganda Boarding Institution",
  studentName = "NCDC Scholar",
  role = "Boarding Scholar",
  size = 140,
  className = "",
}: SchoolIdQRCodeProps) {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://study.cymatichub.xyz";
  const qrPayload = `${baseUrl}/verify-document?user=${encodeURIComponent(studentName)}&school=${encodeURIComponent(schoolId)}&type=boarding_id&role=${encodeURIComponent(role)}`;

  const handleCopyId = () => {
    navigator.clipboard.writeText(schoolId);
    setCopied(true);
    toast.success("School ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    try {
      const svg = document.getElementById(`qr-code-svg-${schoolId}`);
      if (!svg) {
        toast.error("Could not locate QR code graphic.");
        return;
      }
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width + 40;
        canvas.height = img.height + 40;
        if (ctx) {
          ctx.fillStyle = "#09090b";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 20, 20);
          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.download = `NCDC-SchoolID-${schoolId}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
          toast.success("School ID QR badge downloaded!");
        }
      };

      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error("QR download error:", err);
      toast.error("Failed to download QR image.");
    }
  };

  if (!schoolId) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Inline QR Badge Trigger */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-white border border-border shadow-sm">
            <QRCodeSVG
              id={`qr-code-svg-${schoolId}`}
              value={qrPayload}
              size={52}
              level="H"
              includeMargin={true}
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>Digital Boarding QR Identity</span>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground">{schoolId}</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowModal(true)}
          className="h-8 rounded-xl text-xs font-bold border-primary/30 hover:bg-primary/20 text-primary"
        >
          <QrCode className="h-3.5 w-3.5 mr-1" />
          View Badge
        </Button>
      </div>

      {/* Expanded Modal Card */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-primary/30 bg-zinc-950 p-6 shadow-2xl space-y-5 text-center">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-bold text-cyan-400 border border-cyan-500/20">
                <Sparkles className="h-3 w-3" />
                NCDC Boarding Pass &amp; School ID
              </span>
              <h3 className="text-xl font-extrabold text-white pt-1">{studentName}</h3>
              <p className="text-xs text-zinc-400">{schoolName}</p>
            </div>

            {/* Large QR Code Container */}
            <div className="mx-auto flex flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-xl">
              <QRCodeSVG
                value={qrPayload}
                size={size}
                level="H"
                includeMargin={true}
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
              <span className="mt-2 text-[10px] font-mono font-black text-zinc-800 tracking-widest">
                {schoolId}
              </span>
            </div>

            {/* ID Details & Actions */}
            <div className="space-y-3 pt-1">
              <div className="rounded-xl bg-zinc-900/80 p-3 text-left border border-zinc-800 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Role:</span>
                  <span className="text-zinc-200 font-bold">{role}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Registry Code:</span>
                  <span className="text-cyan-400 font-mono font-bold">{schoolId}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyId}
                  className="rounded-xl text-xs font-bold border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                >
                  {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copied ? "Copied" : "Copy ID"}
                </Button>
                <Button
                  onClick={handleDownloadQR}
                  className="rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Save Image
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
