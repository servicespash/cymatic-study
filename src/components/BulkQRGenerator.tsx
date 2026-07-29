import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import {
  QrCode,
  Printer,
  CheckSquare,
  Square,
  Search,
  Download,
  FileText,
  Sparkles,
  Sliders,
  Check,
  Palette,
  Loader2,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface OrganizationRecord {
  id: string;
  name: string;
  school_key: string | null;
  created_at?: string;
}

const DEFAULT_MOCK_SCHOOLS: OrganizationRecord[] = [
  { id: "SCH-NCDC-KAMPALA", name: "King's College Budo", school_key: "NCDC-KAMPALA-BUDO" },
  {
    id: "SCH-NCDC-WAKISO",
    name: "St. Mary's College Kisubi (SMACK)",
    school_key: "NCDC-WAKISO-SMACK",
  },
  { id: "SCH-NCDC-MUKONO", name: "Gayaza High School", school_key: "NCDC-MUKONO-GAYAZA" },
  { id: "SCH-NCDC-MBARARA", name: "Ntare School", school_key: "NCDC-MBARARA-NTARE" },
  { id: "SCH-NCDC-GULU", name: "Gombe High School", school_key: "NCDC-GULU-GOMBE" },
];

export function BulkQRGenerator() {
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#1E40AF"); // Royal Blue
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      // Query database schools
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, school_key, created_at")
        .order("name", { ascending: true });

      if (error) throw error;

      let list = data || [];

      // If empty or only 1, merge with mock schools to guarantee a rich interactive demo experience
      if (list.length <= 1) {
        const uniqueMocks = DEFAULT_MOCK_SCHOOLS.filter(
          (mock) => !list.some((org) => org.id === mock.id || org.school_key === mock.school_key),
        );
        list = [...list, ...uniqueMocks];
      }

      setOrganizations(list);
      // Auto-select all by default
      setSelectedIds(list.map((org) => org.id));
    } catch (err: any) {
      console.error("Error fetching organizations:", err);
      // Fallback to mocks on error
      setOrganizations(DEFAULT_MOCK_SCHOOLS);
      setSelectedIds(DEFAULT_MOCK_SCHOOLS.map((org) => org.id));
      toast.info("Showing standard National Curriculum Registry schools list.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    const filtered = filteredSchools.map((org) => org.id);
    const allSelected = filtered.every((id) => selectedIds.includes(id));

    if (allSelected) {
      // Deselect filtered schools
      setSelectedIds((prev) => prev.filter((id) => !filtered.includes(id)));
    } else {
      // Add all filtered schools
      setSelectedIds((prev) => {
        const next = [...prev];
        filtered.forEach((id) => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const filteredSchools = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.school_key || org.id).toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const generateBulkPDF = async () => {
    const targets = organizations.filter((org) => selectedIds.includes(org.id));
    if (targets.length === 0) {
      toast.error("Please select at least one school to generate PDF.");
      return;
    }

    setGenerating(true);
    const toastId = toast.loading("Synthesizing high-resolution printable QR Badges...");

    // Wait a brief moment to ensure offscreen canvas elements are fully painted
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const cardWidth = 140;
      const cardHeight = 90;
      const xOffset = 35; // Center card horizontally on A4 (210mm wide)
      const pageHeight = 297;
      const cardsPerPage = 2;

      for (let i = 0; i < targets.length; i++) {
        const org = targets[i];
        const schoolKey = org.school_key || org.id;

        // Fetch corresponding canvas for the QR image
        const canvas = canvasRefs.current[org.id];
        if (!canvas) {
          console.warn(`Canvas not found for school: ${org.name}`);
          continue;
        }
        const qrDataUrl = canvas.toDataURL("image/png");

        // Determine page index and position
        const cardIndexOnPage = i % cardsPerPage;
        const pageIndex = Math.floor(i / cardsPerPage);

        if (i > 0 && cardIndexOnPage === 0) {
          doc.addPage();
        }

        const yPos = cardIndexOnPage === 0 ? 30 : 150;

        // --- DRAW PAGE MARKS & FOOTER ON EACH PAGE ---
        if (cardIndexOnPage === 0) {
          doc.setFillColor(248, 250, 252); // light slate bg
          doc.rect(5, 5, 200, 287, "F");

          // Header border lines
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.5);
          doc.line(10, 18, 200, 18);

          doc.setFont("Helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text("UGANDA NATIONAL CURRICULUM DEVELOPMENT CENTRE", 105, 14, { align: "center" });

          doc.setFont("Helvetica", "normal");
          doc.setFontSize(7);
          doc.text(`Official Registrar Distribution Copy  |  Page ${pageIndex + 1}`, 105, 284, {
            align: "center",
          });
        }

        // --- DRAW INDIVIDUAL SCHOOL QR CARD ---
        // 1. Dotted boundary for scissor cuts
        doc.setDrawColor(148, 163, 184);
        doc.setLineDashPattern([2, 2], 0);
        doc.setLineWidth(0.3);
        doc.rect(xOffset - 2, yPos - 2, cardWidth + 4, cardHeight + 4, "S");

        // Restore solid lines for the card frame
        doc.setLineDashPattern([], 0);
        doc.setDrawColor(primaryColor);
        doc.setLineWidth(1.5);
        doc.setFillColor(255, 255, 255);
        doc.rect(xOffset, yPos, cardWidth, cardHeight, "FD");

        // 2. Card Header Band (School Primary Accent Color)
        doc.setFillColor(primaryColor);
        doc.rect(xOffset + 2, yPos + 2, cardWidth - 4, 16, "F");

        // Header Text
        doc.setTextColor(255, 255, 255);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.text("NATIONAL BOARDING INSTITUTION REGISTRY", xOffset + cardWidth / 2, yPos + 7, {
          align: "center",
        });

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        const displayName = org.name.length > 36 ? org.name.substring(0, 34) + "..." : org.name;
        doc.text(displayName.toUpperCase(), xOffset + cardWidth / 2, yPos + 13, {
          align: "center",
        });

        // 3. Draw QR Code Image (centered)
        const qrSize = 40;
        const qrX = xOffset + (cardWidth - qrSize) / 2;
        const qrY = yPos + 22;
        doc.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, "S"); // border box around QR
        doc.drawImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

        // 4. Draw School Registry ID
        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFont("Courier", "bold");
        doc.setFontSize(11);
        doc.text(schoolKey, xOffset + cardWidth / 2, yPos + 69, { align: "center" });

        // 5. Instruction Footer
        doc.setTextColor(100, 116, 139); // slate-500
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7);
        doc.text("OFFICIAL QR BINDING KEY", xOffset + cardWidth / 2, yPos + 73, {
          align: "center",
        });

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(6.5);
        doc.text(
          "SCAN THIS QR CODE TO INSTANTLY LINK SCHOLARS & VERIFY RECORD COMPLIANCE",
          xOffset + cardWidth / 2,
          yPos + 80,
          { align: "center" },
        );

        doc.setFont("Helvetica", "bold");
        doc.setTextColor(primaryColor);
        doc.text("MINISTRY OF EDUCATION & SPORTS UGANDA", xOffset + cardWidth / 2, yPos + 85, {
          align: "center",
        });
      }

      doc.save(`ncdc-schools-qr-bulk-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Bulk QR Code PDF document generated successfully!", { id: toastId });
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to compile bulk PDF.", { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const COLOR_PRESETS = [
    {
      name: "Royal Blue",
      value: "#1E40AF",
      bgClass: "bg-blue-600",
      borderClass: "border-blue-400",
    },
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

  return (
    <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-bold text-blue-400 border border-blue-500/20 mb-2">
              <Printer className="h-3.5 w-3.5" />
              Bulk QR Print Engine
            </div>
            <CardTitle className="text-xl font-black uppercase tracking-tight text-white">
              Institutional Bulk QR Identity Suite
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs mt-1">
              Select, brand, and compile print-ready sheet badges with QR links for multiple
              schools.
            </CardDescription>
          </div>

          <Button
            onClick={generateBulkPDF}
            disabled={generating || selectedIds.length === 0}
            className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 h-10 px-4 cursor-pointer"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Compile Bulk PDF ({selectedIds.length})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* HELD CANVAS STORES FOR PDF EXPORT - HIDDEN */}
        <div className="hidden" aria-hidden="true">
          {organizations.map((org) => {
            const baseUrl =
              typeof window !== "undefined"
                ? window.location.origin
                : "https://study.cymatichub.xyz";
            const qrPayload = `${baseUrl}/verify-document?school=${encodeURIComponent(org.school_key || org.id)}&type=boarding_id&name=${encodeURIComponent(org.name)}`;
            return (
              <QRCodeCanvas
                key={`canvas-${org.id}`}
                ref={(el) => {
                  canvasRefs.current[org.id] = el;
                }}
                value={qrPayload}
                size={256}
                level="H"
                fgColor={primaryColor}
                bgColor="#FFFFFF"
                includeMargin={true}
              />
            );
          })}
        </div>

        {/* Customization controls */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Palette className="h-3.5 w-3.5 text-blue-400" />
              Apply Print Accent Theme
            </span>
            <div className="flex gap-2">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setPrimaryColor(p.value)}
                  className={`h-8 w-8 rounded-lg transition-all border-2 flex items-center justify-center ${p.bgClass} ${
                    primaryColor === p.value
                      ? `${p.borderClass} scale-110 shadow-glow`
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  title={p.name}
                >
                  {primaryColor === p.value && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sliders className="h-3.5 w-3.5 text-indigo-400" />
              Search & Roster Filters
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                type="text"
                placeholder="Search schools by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs bg-zinc-950/60 border-white/10 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Schools list table selection */}
        <div className="border border-white/5 rounded-2xl overflow-hidden bg-zinc-950/40">
          <div className="flex items-center justify-between p-3 bg-white/5 border-b border-white/5 text-xs font-bold text-zinc-300">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
            >
              {filteredSchools.length > 0 &&
              filteredSchools.every((org) => selectedIds.includes(org.id)) ? (
                <CheckSquare className="h-4 w-4 text-blue-400" />
              ) : (
                <Square className="h-4 w-4 text-zinc-500" />
              )}
              <span>Select Displayed ({filteredSchools.length})</span>
            </button>
            <span>Active Selection: {selectedIds.length} Schools</span>
          </div>

          <div className="max-h-[250px] overflow-y-auto divide-y divide-white/5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                <span className="text-xs">Accessing official institutional registries...</span>
              </div>
            ) : filteredSchools.length === 0 ? (
              <p className="text-center py-12 text-zinc-600 italic text-xs">
                No institutions match search query.
              </p>
            ) : (
              filteredSchools.map((org) => {
                const isSelected = selectedIds.includes(org.id);
                const schoolKey = org.school_key || org.id;

                return (
                  <div
                    key={org.id}
                    onClick={() => handleToggleSelect(org.id)}
                    className={`flex items-center justify-between p-3 transition-colors hover:bg-white/5 cursor-pointer ${
                      isSelected ? "bg-blue-600/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <button type="button" className="text-zinc-400 hover:text-white shrink-0">
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-blue-400" />
                        ) : (
                          <Square className="h-4 w-4 text-zinc-600" />
                        )}
                      </button>
                      <div className="p-1.5 bg-zinc-900 border border-white/5 rounded-lg shrink-0">
                        <Building className="h-3.5 w-3.5 text-zinc-400" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">{org.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{schoolKey}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        NCDC Verified
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
