"use client";

import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";
import { LifeBuoy } from "lucide-react";
import Link from "next/link";
import { SettingsDropdown } from "./SettingsDropdown";

export function Header() {
  return (
    <header className="flex w-full items-center justify-between p-4 bg-primary h-20">
      <Link className="flex gap-2 items-center" href={"/"}>
        <LifeBuoy />
        <h1 className="font- text-2xl">Magic Roulette</h1>
      </Link>
      <div className="flex items-center gap-4">
        <SettingsDropdown />
        <UnifiedWalletButton />
      </div>
    </header>
  );
}
