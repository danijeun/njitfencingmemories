"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";
  const label = `Switch to ${next} theme`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={() => setTheme(next)}
          className="inline-flex size-9 items-center justify-center rounded-full text-[color:var(--color-ink)] transition-colors hover:bg-[color:var(--color-paper)] [@media(pointer:coarse)]:size-11"
        >
          {mounted ? (
            isDark ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )
          ) : (
            <span className="size-4" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
