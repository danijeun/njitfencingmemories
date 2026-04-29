"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

type NavLink = { href: string; label: string };

export function MobileNav({
  links,
  signOutAction,
}: {
  links: NavLink[];
  signOutAction?: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className="md:hidden">
          <Menu />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Menu</DrawerTitle>
        </DrawerHeader>
        <nav className="flex flex-col gap-1 px-3 pb-6">
          {links.map((l) => (
            <DrawerClose asChild key={l.href}>
              <Link
                href={l.href}
                className="rounded-md px-3 py-3 font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper)]"
              >
                {l.label}
              </Link>
            </DrawerClose>
          ))}
          {signOutAction ? (
            <form action={signOutAction} className="mt-2 px-3">
              <Button type="submit" variant="outline" className="w-full">
                Sign out
              </Button>
            </form>
          ) : null}
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
