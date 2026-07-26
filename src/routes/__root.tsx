import { injectSpeedInsights } from "@vercel/speed-insights";
import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { TutorServiceProvider } from "@/lib/TutorService";
import { UserMoodProvider } from "@/lib/user-mood-context";
import { CurriculumProvider } from "@/lib/curriculum-context";
import { MediaProvider } from "@/lib/MediaContext";
import { Navbar } from "@/components/Navbar";
import { LivePulseIndicator } from "@/components/LivePulseIndicator";
import { MoodOverlay } from "@/components/MoodOverlay";
import { FloatingTutor } from "@/components/FloatingTutor";
import { LiveBroadcastProvider } from "@/lib/live-broadcast-context";
import { BRAND } from "@/lib/constants";
import { syncQueue, pushNotification } from "@/lib/offline-db";
import { buildGreeting, fetchWeatherSummary } from "@/lib/greetings";
import { scheduleDailyNudges } from "@/lib/notifications";
import { requestAllPermissions } from "@/lib/permissions";
import { Preferences } from "@capacitor/preferences";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import useNotifications from "@/hooks/use-notifications";
import { AssertQueryClient } from "@/lib/assert-query-client";
import { shouldGreet, markGreeted } from "@/lib/tutor-context";
import { getOrganizationSchema, getPersonSchema } from "@/lib/seo";
import { MobileInstallPrompt } from "@/components/MobileInstallPrompt";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { CymaticBackground } from "@/components/CymaticBackground";
import { BadgeToastNotification } from "@/components/BadgeToastNotification";
import { Toaster } from "@/components/ui/sonner";

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
    return {
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        { name: "theme-color", content: "#0a1628" },
        { name: "author", content: "Isabirye Latif" },
      ],
      links: [{ rel: "stylesheet", href: appCss }],
      scripts: [
        {
          children: `(function(){try{var t=localStorage.getItem('lattys-theme')||'dark';var r=document.documentElement;r.classList.remove('dark','light');r.classList.add(t);r.style.colorScheme=t;}catch(e){document.documentElement.classList.add('dark');}})();`,
        },
        {
          type: "application/ld+json",
          children: JSON.stringify([orgSchema, personSchema]),
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

const queryClient = new QueryClient();

function RootComponent() {
  useEffect(() => {
    injectSpeedInsights();
  }, []);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Isolated layout for public marking station — no Navbar/FAB/Sync/etc.
  const isIsolated = pathname.startsWith("/mark/");

  if (isIsolated) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div className="min-h-screen bg-background">
            <Outlet />
            <Toaster />
          </div>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <ThemeProvider>
      <CymaticBackground />
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <LiveBroadcastProvider>
            <TutorServiceProvider>
              <LivePulseIndicator />
              <UserMoodProvider>
                <CurriculumProvider>
                  <MediaProvider>
                    <MoodOverlay />
                    <BadgeToastNotification />
                    <MobileInstallPrompt />
                    <PWAInstallPrompt />
                    <div className="flex min-h-screen flex-col">
                      <Navbar />
                      <main className="flex-1">
                        <Outlet />
                      </main>
                      <footer className="border-t border-border/60 px-4 py-8 text-center text-xs text-muted-foreground pb-24">
                        <p className="font-medium">
                          {BRAND.name} × {BRAND.partner} — {BRAND.tagline} {BRAND.flag}
                        </p>
                        <p className="mt-1">
                          Support: {BRAND.support} · © 2026 Pash Media Services
                        </p>
                      </footer>
                      <FloatingTutor />
                    </div>
                  </MediaProvider>
                </CurriculumProvider>
              </UserMoodProvider>
            </TutorServiceProvider>
          </LiveBroadcastProvider>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
