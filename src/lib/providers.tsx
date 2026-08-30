
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LiveBroadcastProvider } from "@/lib/live-broadcast-context";
import { TutorServiceProvider } from "@/lib/TutorService";
import { UserMoodProvider } from "@/lib/user-mood-context";
import { CurriculumProvider } from "@/lib/curriculum-context";
import { MediaProvider } from "@/lib/MediaContext";
import { Toaster } from "@/components/ui/sonner";

export const queryClient = new QueryClient();

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <LiveBroadcastProvider>
            <TutorServiceProvider>
              <UserMoodProvider>
                <CurriculumProvider>
                  <MediaProvider>
                    {children}
                    <Toaster />
                  </MediaProvider>
                </CurriculumProvider>
              </UserMoodProvider>
            </TutorServiceProvider>
          </LiveBroadcastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
