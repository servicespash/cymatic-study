import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  X,
  Palette,
  Image as ImageIcon,
  Sliders,
} from "lucide-react";
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

interface ColorPreset {
  name: string;
  value: string;
  bgClass: string;
  borderClass: string;
}

const COLOR_PRESETS: ColorPreset[] = [
  { name: "Royal Blue", value: "#1E40AF", bgClass: "bg-blue-600", borderClass: "border-blue-400" },
  {
    name: "Kampala Teal",
    value: "#0D9488",
    bgClass: "bg-teal-600",
    borderClass: "border-teal-400",
  },
  {
    name: "Nile Green",
    value: "#15803D",
    bgClass: "bg-emerald-700",
    borderClass: "border-emerald-400",
  },
  {
    name: "Equator Gold",
    value: "#D97706",
    bgClass: "bg-amber-600",
    borderClass: "border-amber-400",
  },
  {
    name: "Volcanic Ruby",
    value: "#BE123C",
    bgClass: "bg-rose-700",
    borderClass: "border-rose-400",
  },
];

export function SchoolIdQRCode({
  schoolId,
  schoolName = "Uganda Boarding Institution",
  studentName = "NCDC Scholar",
  role = "Boarding Scholar",
  size = 180,
  className = "",
}: SchoolIdQRCodeProps) {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Customizations States
  const [primaryColor, setPrimaryColor] = useState("#1E40AF");
  const [logoOption, setLogoOption] = useState<"crest" | "cap" | "none">("crest");

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://study.cymatichub.xyz";

  // Payload used for secure validation scanning
  const qrPayload = `${baseUrl}/verify-document?user=${encodeURIComponent(studentName)}&school=${encodeURIComponent(schoolId)}&type=boarding_id&role=${encodeURIComponent(role)}`;

  // Logo generator helper using secure base64 SVGs
  const getLogoSrc = () => {
    if (logoOption === "none") return undefined;
    if (logoOption === "crest") {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="40" fill="white" stroke="${encodeURIComponent(primaryColor)}" stroke-width="8"/><path d="M50 22 L73 35 L73 60 L50 78 L27 60 L27 35 Z" fill="${encodeURIComponent(primaryColor)}"/><path d="M42 45 L50 35 L58 45 L50 55 Z" fill="white"/></svg>`;
    }
    // Graduation Cap
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="40" fill="white" stroke="${encodeURIComponent(primaryColor)}" stroke-width="8"/><path d="M50 28 L72 38 L50 48 L28 38 Z" fill="${encodeURIComponent(primaryColor)}"/><path d="M36 43 L36 56 C36 61 64 61 64 56 L64 43" fill="none" stroke="${encodeURIComponent(primaryColor)}" stroke-width="5"/><path d="M68 40 L68 59" fill="none" stroke="${encodeURIComponent(primaryColor)}" stroke-width="3"/></svg>`;
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(schoolId);
    setCopied(true);
    toast.success("School ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Dual Downloader A: High-res print-ready QR Identity badge (600x850)
  const handleDownloadQRBadge = () => {
    try {
      const svg = document.getElementById(`qr-code-svg-highres-${schoolId}`);
      if (!svg) {
        toast.error("Could not locate QR code graphic.");
        return;
      }
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = 600;
        canvas.height = 850;
        if (ctx) {
          // Background Box
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Primary themed border
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 16;
          ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

          // Inner Border line
          ctx.strokeStyle = "#E2E8F0";
          ctx.lineWidth = 2;
          ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

          // Header Band (Theme color)
          ctx.fillStyle = primaryColor;
          ctx.fillRect(25, 25, canvas.width - 50, 110);

          // Header text
          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "center";
          ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
          ctx.fillText("UGANDA NATIONAL CURRICULUM DEVELOPMENT CENTRE", 300, 62);

          // School/Institution Name
          ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
          const name = schoolName;
          if (name.length > 30) {
            ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
          }
          if (name.length > 40) {
            ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
          }
          ctx.fillText(name.toUpperCase(), 300, 98);

          // QR Box container
          ctx.fillStyle = "#F8FAFC";
          ctx.fillRect(80, 165, 440, 440);
          ctx.strokeStyle = "#E2E8F0";
          ctx.lineWidth = 2;
          ctx.strokeRect(80, 165, 440, 440);

          // Render High-resolution QR Code
          ctx.drawImage(img, 100, 185, 400, 400);

          // Draw center logo over the QR
          const logoUrl = getLogoSrc();
          if (logoUrl) {
            const logoImg = new Image();
            logoImg.onload = () => {
              ctx.drawImage(logoImg, 260, 345, 80, 80);
              drawCredentialsAndSave();
            };
            logoImg.src = logoUrl;
          } else {
            drawCredentialsAndSave();
          }

          function drawCredentialsAndSave() {
            ctx.textAlign = "center";

            // Student/Teacher Name
            ctx.fillStyle = "#0F172A";
            ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
            ctx.fillText(studentName, 300, 658);

            // Role Badge text
            ctx.fillStyle = primaryColor;
            ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
            ctx.fillText(role.toUpperCase(), 300, 690);

            // Footer Section
            ctx.fillStyle = "#64748B";
            ctx.font = "bold 12px monospace";
            ctx.fillText("OFFICIAL SCHOOL ID CODE", 300, 735);

            ctx.fillStyle = primaryColor;
            ctx.font = "bold 24px monospace";
            ctx.fillText(schoolId, 300, 765);

            ctx.fillStyle = "#94A3B8";
            ctx.font = "normal 11px system-ui, -apple-system, sans-serif";
            ctx.fillText("SCAN COMPATIBLE MOBILE CAMERA TO SECURELY VERIFY CREDENTIALS", 300, 810);

            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            const safeName = schoolName
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-")
              .replace(/-+/g, "-");
            downloadLink.download = `${safeName}-identity-badge-${schoolId}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
            toast.success("High-resolution physical identity badge downloaded!");
          }
        }
      };

      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error("QR Badge download error:", err);
      toast.error("Failed to generate and download identity badge.");
    }
  };

  // Dual Downloader B: High-res QR ONLY (1000x1000) with custom colors & logo
  const handleDownloadQROnly = () => {
    try {
      const svg = document.getElementById(`qr-code-svg-highres-${schoolId}`);
      if (!svg) {
        toast.error("Could not locate QR code graphic.");
        return;
      }
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const qrImg = new Image();

      qrImg.onload = () => {
        canvas.width = 1000;
        canvas.height = 1000;
        if (ctx) {
          // Clean solid white background (highest scan success rate)
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw the QR Code centered
          ctx.drawImage(qrImg, 50, 50, 900, 900);

          // Draw logo in the center if requested
          const logoUrl = getLogoSrc();
          if (logoUrl) {
            const logoImg = new Image();
            logoImg.onload = () => {
              // 180x180 center logo on 1000x1000 canvas
              ctx.drawImage(logoImg, 410, 410, 180, 180);
              triggerDownload();
            };
            logoImg.src = logoUrl;
          } else {
            triggerDownload();
          }

          function triggerDownload() {
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            const safeName = schoolName
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-")
              .replace(/-+/g, "-");
            downloadLink.download = `${safeName}-qr-only-${schoolId}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
            toast.success("High-resolution print-ready QR Code downloaded!");
          }
        }
      };

      qrImg.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error("QR Code only download error:", err);
      toast.error("Failed to generate and download pure QR Code.");
    }
  };

  if (!schoolId) {
    return null;
  }

  const activeLogoSrc = getLogoSrc();

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Hidden high-res QR for perfect export generation */}
      <div style={{ display: "none" }}>
        <QRCodeSVG
          id={`qr-code-svg-highres-${schoolId}`}
          value={qrPayload}
          size={500}
          level="H"
          includeMargin={true}
          fgColor={primaryColor}
          bgColor="#FFFFFF"
          imageSettings={
            activeLogoSrc
              ? {
                  src: activeLogoSrc,
                  height: 95,
                  width: 95,
                  excavate: true,
                }
              : undefined
          }
        />
      </div>

      {/* Inline QR Badge Trigger */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-white border border-border shadow-sm">
            <QRCodeSVG
              id={`qr-code-svg-${schoolId}`}
              value={qrPayload}
              size={52}
              level="H"
              includeMargin={false}
              fgColor={primaryColor}
              bgColor="#FFFFFF"
              imageSettings={
                activeLogoSrc
                  ? {
                      src: activeLogoSrc,
                      height: 12,
                      width: 12,
                      excavate: true,
                    }
                  : undefined
              }
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>Branded School QR Badge</span>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground">{schoolId}</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowModal(true)}
          className="h-8 rounded-xl text-xs font-bold border-primary/30 hover:bg-primary/20 text-primary cursor-pointer"
        >
          <QrCode className="h-3.5 w-3.5 mr-1" />
          View Badge
        </Button>
      </div>

      {/* Expanded Modal Card */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl flex flex-col lg:flex-row gap-6 text-left my-8">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Side: Realtime Interactive Preview */}
            <div className="flex-1 flex flex-col items-center justify-center border border-white/5 bg-zinc-900/40 rounded-2xl p-6 min-h-[420px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">
                Interactive Badge Card Preview
              </span>

              {/* Mock Badge layout matching downloaded image perfectly */}
              <div
                className="w-full max-w-[280px] bg-white rounded-2xl p-4 shadow-2xl border-t-8 border-b-8 flex flex-col items-center text-center select-none"
                style={{ borderColor: primaryColor }}
              >
                {/* Header Band inside Card */}
                <div
                  className="w-full p-2.5 rounded-lg mb-4 text-white text-[9px] font-bold flex flex-col justify-center items-center min-h-[50px]"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-[6px] tracking-wider opacity-90 font-mono">
                    UGANDA NCDC
                  </span>
                  <span className="leading-tight uppercase tracking-tight line-clamp-2 max-w-[240px] text-center">
                    {schoolName}
                  </span>
                </div>

                {/* QR Code Container with branding */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 inline-block relative shadow-inner">
                  <QRCodeSVG
                    value={qrPayload}
                    size={size}
                    level="H"
                    includeMargin={false}
                    fgColor={primaryColor}
                    bgColor="#FFFFFF"
                    imageSettings={
                      activeLogoSrc
                        ? {
                            src: activeLogoSrc,
                            height: 36,
                            width: 36,
                            excavate: true,
                          }
                        : undefined
                    }
                  />
                </div>

                {/* School ID Text code */}
                <span className="mt-2 text-[10px] font-mono font-black text-zinc-800 tracking-wider">
                  {schoolId}
                </span>

                {/* Bottom credentials */}
                <div className="mt-4 space-y-0.5">
                  <h4 className="text-sm font-extrabold text-slate-950 leading-tight">
                    {studentName}
                  </h4>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider block"
                    style={{ color: primaryColor }}
                  >
                    {role}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Configuration & Control Presets Panel */}
            <div className="w-full lg:w-[360px] flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-bold text-cyan-400 border border-cyan-500/20">
                    <Sparkles className="h-3 w-3" />
                    Branded QR Identity Suite
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-2">
                    Customize School Branding
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Apply institutional colors and embed logos to align with your school's brand
                    guidelines.
                  </p>
                </div>

                {/* Color Swatch Selection */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Palette className="h-3.5 w-3.5 text-cyan-400" />
                    School Theme Color
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        title={p.name}
                        onClick={() => setPrimaryColor(p.value)}
                        className={`h-9 w-full rounded-xl transition-all border-2 flex items-center justify-center ${p.bgClass} ${
                          primaryColor === p.value
                            ? `${p.borderClass} scale-110 shadow-glow`
                            : "border-transparent opacity-85 hover:opacity-100"
                        }`}
                      >
                        {primaryColor === p.value && <Check className="h-4 w-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Central Logo Selector */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
                    Center Brand Logo
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setLogoOption("crest")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                        logoOption === "crest"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      NCDC Shield
                    </button>
                    <button
                      onClick={() => setLogoOption("cap")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                        logoOption === "cap"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      <QrCode className="h-4 w-4" />
                      Grad Cap
                    </button>
                    <button
                      onClick={() => setLogoOption("none")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                        logoOption === "none"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      <Sliders className="h-4 w-4" />
                      Classic QR
                    </button>
                  </div>
                </div>

                {/* Badge Details Info */}
                <div className="rounded-xl bg-zinc-900/60 p-3.5 text-xs border border-white/5 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Cardholder:</span>
                    <span className="text-zinc-300 font-bold">{studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Assigned Stream / Role:</span>
                    <span className="text-zinc-300 font-bold">{role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">NCDC Registry ID:</span>
                    <span className="text-cyan-400 font-mono font-bold">{schoolId}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Download Action Controls */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <Button
                  onClick={handleDownloadQRBadge}
                  className="w-full rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-2 h-10 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Download Full ID Badge Image
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadQROnly}
                  className="w-full rounded-xl text-xs font-bold border-white/10 bg-white/5 text-zinc-300 hover:text-white flex items-center justify-center gap-2 h-10 cursor-pointer"
                >
                  <QrCode className="h-4 w-4" />
                  Download Pure QR Code Only
                </Button>
                <p className="text-[10px] text-zinc-500 text-center leading-normal max-w-xs mx-auto mt-1">
                  Exports high-resolution 1000px pure QR vector or 600x850 badge for professional
                  print.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
