"use client";

import { ThemeProvider } from "next-themes";
import { LazyMotion, domAnimation } from "motion/react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandPalette } from "@/components/CommandPalette";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <LazyMotion features={domAnimation} strict>
        <TooltipProvider delayDuration={200} skipDelayDuration={300}>
          {children}
          <CommandPalette />
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast:
                  "font-mono text-xs uppercase tracking-widest bg-[color:var(--color-paper)] text-[color:var(--color-ink)] border border-[color:var(--color-rule)]",
              },
            }}
          />
        </TooltipProvider>
      </LazyMotion>
    </ThemeProvider>
  );
}
