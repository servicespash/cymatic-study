import { ChevronDown, Mail, Quote, Sparkles, X, Globe } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
// No import needed for public assets
const founderImg = "/founder-Latif-profile.jpg";

export function FoundersSpotlight() {
  return (
    <section aria-label="Founder's Spotlight" className="mb-8">
      <details className="group overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-[0_24px_70px_-30px_color-mix(in_oklab,var(--primary)_60%,transparent)]">
        <summary className="grid cursor-pointer list-none gap-5 p-5 outline-none transition-smooth hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6 [&::-webkit-details-marker]:hidden">
          <div className="relative mx-auto h-32 w-32 shrink-0 sm:mx-0 sm:h-36 sm:w-36">
            <div className="absolute -inset-1 rounded-[2rem] bg-gradient-hero opacity-90 shadow-glow" />

            <Dialog.Root>
              <Dialog.Trigger asChild>
                <button
                  className="relative h-full w-full overflow-hidden rounded-[1.7rem] border border-primary/50 bg-muted shadow-card cursor-zoom-in transition-transform hover:scale-[1.02] active:scale-95 group/img"
                  title="Expand Founder's Portrait"
                >
                  <img
                    src={founderImg}
                    alt="Isabirye Latif, Founder of Cymatic Hub Evolution"
                    className="h-full w-full object-cover object-center transition-opacity group-hover/img:opacity-90"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/45 via-transparent to-primary/10" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                    <div className="bg-black/20 backdrop-blur-sm p-2 rounded-full">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </button>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-2xl translate-x-[-50%] translate-y-[-50%] space-y-6 rounded-3xl bg-zinc-950/50 p-6 md:p-10 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 border border-primary/10">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-8 h-[50vh] w-full overflow-hidden rounded-2xl border border-primary/20 bg-zinc-900/50 shadow-glow flex items-center justify-center">
                      <img
                        src={founderImg}
                        className="h-full w-full object-cover object-center"
                        alt="Isabirye Latif"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                    </div>

                    <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                      Isabirye Latif
                    </h2>
                    <p className="mt-2 text-base font-bold uppercase tracking-[0.25em] text-primary">
                      Founder & Chief Architect
                    </p>
                    <p className="mt-3 text-sm font-medium text-zinc-400 italic">
                      "Driven by faith, purpose, and the infinite potential of every student."
                    </p>

                    <a
                      href="mailto:cymatichubevolution@gmail.com"
                      className="mt-10 flex w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-5 text-base font-black text-primary-foreground shadow-glow transition-smooth hover:scale-[1.03] active:scale-95"
                    >
                      <Mail className="h-6 w-6" />
                      Contact the Founder
                    </a>
                  </div>

                  <Dialog.Close className="absolute right-6 top-6 rounded-full bg-black/40 p-2.5 text-white hover:bg-black/60 transition-colors backdrop-blur-md border border-white/10">
                    <X className="h-7 w-7" />
                    <span className="sr-only">Close</span>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>

          <div className="min-w-0 text-center sm:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3 w-3" /> Founder's Spotlight
            </span>
            <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-foreground sm:text-3xl">
              The Vision Behind the Evolution
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
              A personal message from Isabirye Latif on purpose, resilience, and academic destiny.
            </p>
          </div>

          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/70 text-primary transition-smooth group-open:rotate-180 sm:mx-0">
            <ChevronDown className="h-5 w-5" />
          </div>
        </summary>

        <div className="border-t border-border/70 bg-background/35 px-5 pb-6 pt-5 sm:px-6 sm:pb-7">
          <div className="relative space-y-4 text-[15px] leading-relaxed text-foreground/85">
            <Quote className="absolute -left-1 -top-2 h-9 w-9 text-primary/25" aria-hidden />

            {/* New Empathetic Narrative */}
            <p className="pl-8">
              I know the weight of an impersonal system—the feeling of being just a number in a
              crowded hall, fighting for a future that feels out of reach. I built Cymatic Hub
              because I refuse to let that be your story. Every student in this country carries a
              spark of genius that the traditional walls of education often fail to protect.
            </p>
            <p className="pl-8">
              This is not just an 'app'; it is an Evolution. We are moving from silent textbooks to
              an empathetic partnership where technology finally understands your struggle, your
              pace, and your potential.
            </p>

            {/* Original "Academic Destiny" Logic */}
            <p className="pl-8">
              Driven by faith, purpose, and a deep love for our community, I envisioned a space
              where education meets innovation. My mission is to walk hand-in-hand with the youth of
              Uganda, providing them with the ultimate interactive companion to navigate and conquer
              the New Lower Secondary Curriculum.
            </p>
            <p className="pl-8">
              I believe deeply in the infinite potential of every young mind inside this chat room.
              By aligning cutting-edge technology with high-yield NCDC curriculum standards, we have
              built a sanctuary for interactive learning—complete with smart tools, real-time
              assessment rewards, and empathetic AI guidance.
            </p>

            <p className="pl-8 font-medium italic text-primary/80">
              Push past the limits, stay resilient, and let this platform be the catalyst that
              unlocks your academic destiny. Believe in your journey, embrace the challenge, and
              remember that we are with you every single step of the way. Your success is our
              highest reward.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-l-2 border-primary/70 pl-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-serif text-2xl font-bold italic text-foreground">Isabirye Latif</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Founder & Chief Architect, Cymatic Hub Evolution
              </p>
            </div>
            <a
              href="https://cymatichubmanifesto.latifisabirye.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/20 active:scale-95 transition-all duration-200 self-start sm:self-auto"
            >
              <Globe className="h-4 w-4 animate-spin-slow" />
              Manifesto Website
            </a>
          </div>
        </div>
      </details>
    </section>
  );
}
