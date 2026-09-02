import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HelpCircle, ChevronDown, Sparkles, BookOpen, Search, Info } from "lucide-react";
import { SEOChecklist } from "@/components/SEO/SEOChecklist";

export const Route = createFileRoute("/help-settings")({
  head: () => ({
    meta: [
      { title: "Help & Settings Hub — Lattys Cymatic Study" },
      {
        name: "description",
        content:
          "Interactive FAQ support guide, author portfolio verification workspace, and content quality checklists.",
      },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: HelpSettingsHubPage,
});

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

function HelpSettingsHubPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      category: "Curriculum Alignment",
      question:
        "How does Lattys Cymatic Study align with Uganda's New Lower Secondary Curriculum (NLSC)?",
      answer:
        "Lattys Cymatic Study is developed in full pedagogical synchronicity with Uganda's National Curriculum Development Centre (NCDC) and UNEB guidelines. It delivers student-centered interactive lessons, project guides, and competency-based evaluation questions for Senior 1 to Senior 4 (NLSC) and Senior 5-6 (Advanced Level) classes.",
    },
    {
      category: "Supported Subjects",
      question: "What NCDC secondary subjects and classes are fully covered?",
      answer:
        "We support major science, humanity, and vocational course structures spanning S1 to S6 classes. This includes Information & Communications Technology (ICT), Mathematics, Physics, Chemistry, Biology, Geography, History, Kiswahili, and Luganda, containing detailed Socratic revision worksheets and marking guides.",
    },
    {
      category: "Offline Capability",
      question: "Can I access lessons, practice worksheets, and Socratic feedback offline?",
      answer:
        "Yes, our system implements progressive web local caching schemas. Using background service workers and IndexedDB storage engines, students can read interactive notes, solve revision questions, and view instant Socratic feedback offline. Student progress data synchronizes automatically with cloud servers once connectivity is restored.",
    },
    {
      category: "Trustworthiness & E-E-A-T",
      question: "How is content accuracy and expertise verified on Cymatic Study Uganda?",
      answer:
        "Our content undergoes strict vetting through a dedicated teacher marking desk in partnership with educational technologist Isabirye Latif and Pash Media Services. Lessons adhere to certified pedagogical frameworks, ensuring highly authoritative information backed by verified portfolios searchable at cymatichub.xyz.",
    },
    {
      category: "Search Visibility",
      question: "How does the E-E-A-T Verifier improve content indexation and discoverability?",
      answer:
        "Search engines (Google, Bing) and AI search tools (ChatGPT, Gemini, Perplexity) prioritize verified, high-trust content. The verifier checks portfolio references and review sentiment. Passing this verification automatically structures and injects search-engine-readable JSON-LD schemas into our platform header, raising search index rank.",
    },
  ];

  const filteredFaqs = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12 animate-fade-in">
      {/* Dynamic Hub Header */}
      <div className="flex flex-col gap-3 text-left">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary w-fit">
          <Sparkles className="h-4 w-4 animate-pulse" />
          Centralized Knowledge &amp; Quality Hub
        </span>
        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
          Help &amp; Settings Hub
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Access our zero-click collapsible FAQ answers, utilize the professional Content E-E-A-T
          Quality Verifier, and configure author verification workspaces to optimize locale-specific
          search engine rankings.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Side: Dynamic Accordion FAQs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Collapsible FAQ &amp; Zero-Click Answers
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tap to expand and instantly read concise, search-optimized answers.
                </p>
              </div>
            </div>

            {/* Simple Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search help topics or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-2xl border border-border bg-background/50 pl-10 pr-4 py-3.5 outline-none focus:border-primary placeholder:text-muted-foreground/30 transition-colors"
              />
            </div>

            {/* Collapsible FAQ List */}
            <div className="space-y-3 pt-2">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((item, index) => {
                  const isOpen = openIndex === index;
                  return (
                    <div
                      key={index}
                      className="rounded-2xl border border-border/60 bg-background/30 overflow-hidden transition-all duration-300"
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : index)}
                        className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors focus:outline-none"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                            {item.category}
                          </span>
                          <span className="leading-snug">{item.question}</span>
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      <div
                        className={`transition-all duration-300 ease-in-out ${
                          isOpen
                            ? "max-h-[500px] border-t border-border/40 p-4 bg-muted/20"
                            : "max-h-0 pointer-events-none"
                        }`}
                        style={{ overflow: "hidden" }}
                      >
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {item.answer}
                        </p>
                        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-primary/80 font-bold uppercase tracking-wider bg-primary/5 px-2.5 py-1 rounded-lg w-fit">
                          <BookOpen className="h-3.5 w-3.5" /> Featured Zero-Click Direct Answer
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-muted-foreground">No matching FAQ topics found.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: E-E-A-T Verifier (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-black tracking-tight text-foreground">
              Pedagogical Credential Audit
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Authenticate author workspaces to generate schema metadata signals and maintain strict
              NCDC syllabus quality compliance.
            </p>
          </div>
          <SEOChecklist />
        </div>
      </div>
    </div>
  );
}

export default HelpSettingsHubPage;
