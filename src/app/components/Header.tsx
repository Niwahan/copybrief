"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={[
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-zinc-900 text-white"
          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl px-4 py-3 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-white text-xs font-bold">
            CB
          </span>
          <span className="font-semibold tracking-tight text-zinc-900">CopyBrief</span>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink href="/brief" label="Brand Brief" />
          <NavLink href="/subject" label="Subject Lines" />
          <NavLink href="/ab" label="A/B Tester" />
        </nav>
      </div>
    </header>
  );
}
