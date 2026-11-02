"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, UserRound } from "lucide-react";
import { cn } from "./ui";

const ITEMS = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/me", label: "Me", Icon: UserRound },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-card/85 backdrop-blur-xl pb-safe">
      <ul className="mx-auto flex max-w-md justify-around px-2">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition",
                  active ? "text-brand" : "text-muted",
                )}
              >
                <Icon className="size-6" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
