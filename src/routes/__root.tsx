import { injectSpeedInsights } from "@vercel/speed-insights";
import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { Navbar } from "@/components/Navbar";
import { LivePulseIndicator } from "@/components/LivePulseIndicator";
import { MoodOverlay } from "@/components/MoodOverlay";
import { FloatingTutor } from "@/components/FloatingTutor";
import { BRAND } from "@/lib/constants";
import { getOrganizationSchema, getPersonSchema, getAllCoursesSchemas } from "@/lib/seo";
import { buildAllNCDCCourses } from "@/lib/schema";
import { MobileInstallPrompt } from "@/components/MobileInstallPrompt";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { CymaticBackground } from "@/components/CymaticBackground";
import { BadgeToastNotification } from "@/components/BadgeToastNotification";
import { GlobalProviders } from "@/lib/providers";
import { Toaster } from "@/components/ui/sonner";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="bg-gradient-hero bg-clip-text text-7xl font-extrabold text-transparent">
          404
        </h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:scale-105"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => {
    const orgSchema = getOrganizationSchema();
    const personSchema = getPersonSchema();
    const courseSchemas = getAllCoursesSchemas();
    const ncdcCourses = buildAllNCDCCourses();

    // Dynamically compile key terms for all platforms to leverage in indexing
    const brandKeywords = BRAND.aliases.join(", ");

    return {
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        { name: "theme-color", content: "#0a1628" },
        { name: "author", content: "Isabirye Latif" },
        {
          name: "keywords",
          content: `${brandKeywords}, Uganda Secondary Curriculum, S1-S6 Notes, Uganda National Curriculum, NCDC study guide, UNEB revision`,
        },
        {
          name: "robots",
          content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
        {
          name: "googlebot",
          content: "index, follow, max-snippet:-1",
        },
      ],
      links: [{ rel: "stylesheet", href: appCss }],
      scripts: [
        {
          children: `(function(){try{var t=localStorage.getItem('lattys-theme')||'dark';var r=document.documentElement;r.classList.remove('dark','light');r.classList.add(t);r.style.colorScheme=t;}catch(e){document.documentElement.classList.add('dark');}})();`,
        },
        {
          type: "application/ld+json",
          children: JSON.stringify([orgSchema, personSchema, ...courseSchemas, ...ncdcCourses]),
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeadContent />
      {children}
      <Scripts />
    </>
  );
}

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    injectSpeedInsights();
  }, []);

  useEffect(() => {
    let title = "Lattys Cymatic Study — Uganda Secondary Curriculum Study Companion";
    let desc = "Interactive study companion for Uganda Secondary Curriculum (NCDC Aligned)";
    let robots = "index, follow, max-image-preview:large";

    if (pathname === "/" || pathname === "/dashboard") {
      title = "Lattys Cymatic Study — Uganda NCDC Curriculum S1-S6";
      desc =
        "Access Senior 1-6 lessons, worksheets, and Socratic revision tools under Lattys Cymatic Study. Part of the CymaticHub and CymaticStudy digital learning network.";
      robots = "index, follow, max-image-preview:large";
    } else if (
      pathname.startsWith("/lessons") ||
      pathname.startsWith("/curriculum") ||
      pathname.startsWith("/student") ||
      pathname.startsWith("/quizzes") ||
      pathname.startsWith("/projects")
    ) {
      title = "Cymatic Study Uganda — Interactive Secondary School Subjects & Worksheets";
      desc =
        "Curriculum modules and practice worksheets for Physics, Chemistry, Biology, and Math mapped to NCDC guidelines. Organized under the CymaticStudy brand hierarchy.";
      robots = "index, follow";
    } else if (pathname.startsWith("/help-settings")) {
      title = "Cymatic Hub — Help & Settings Quality Support Hub";
      desc =
        "Collapsible zero-click FAQ answers, content E-E-A-T verification desks, and student/author portfolio inputs. Managed by CymaticHub.";
      robots = "index, follow";
    } else if (
      pathname.startsWith("/teacher") ||
      pathname.startsWith("/marking") ||
      pathname.startsWith("/verify") ||
      pathname.startsWith("/support") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/admin")
    ) {
      title = "Cymatic Education Uganda — National Support, Teacher Grading & E-E-A-T Quality Desk";
      desc =
        "Empowering schools and teachers with automatic competency-based grading, support resources, and authorized content verification portfolios under CymaticHub.";
      robots = "noindex, nofollow"; // Differentiate locale-specific workspace settings and administrative tools from search index
    } else if (pathname.startsWith("/tutor") || pathname.startsWith("/chat")) {
      title = "Socratic AI Tutoring Assistant | Lattys Cymatic Study";
      desc =
        "Empathetic guides helping secondary learners understand complex STEM concepts through inquiry. Powered by CymaticStudy.";
      robots = "index, follow";
    }

    // Append primary brand tag to maintain consistent hierarchy
    const finalTitle = title.includes("Cymatic") ? title : `${title} | CymaticStudy`;
    document.title = finalTitle;

    // Inject Description Meta
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", desc);
    }

    // Inject Robots Meta
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute("content", robots);
  }, [pathname]);

  const isIsolated =
    pathname.startsWith("/mark/") || pathname.startsWith("/chat") || pathname.startsWith("/tutor");

  if (isIsolated) {
    return (
      <GlobalErrorBoundary>
        <GlobalProviders>
          <div className="min-h-screen bg-background">
            <Outlet />
          </div>
        </GlobalProviders>
      </GlobalErrorBoundary>
    );
  }

  return (
    <GlobalErrorBoundary>
      <GlobalProviders>
        <CymaticBackground />
        <LivePulseIndicator />
        <MoodOverlay />
        <BadgeToastNotification />
        <MobileInstallPrompt />
        <PWAInstallPrompt />
        <div className="min-h-screen grid grid-rows-[auto_1fr_auto] grid-cols-1 max-w-[1920px] mx-auto w-full bg-background shadow-2xl">
          <Navbar />
          <main className="flex-1 w-full page-container">
            <Outlet />
          </main>
          <footer className="border-t border-border/60 px-4 py-8 text-center text-xs text-muted-foreground pb-24">
            <p className="font-medium">
              {BRAND.name} × {BRAND.partner} — {BRAND.tagline} {BRAND.flag}
            </p>
            <p className="mt-1">Support: {BRAND.support} · © 2026 Pash Media Services</p>
          </footer>
          <FloatingTutor />
        </div>
      </GlobalProviders>
    </GlobalErrorBoundary>
  );
}
