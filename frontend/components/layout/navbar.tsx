"use client";

import { Bell, UserCircle } from "lucide-react";

export default function Navbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
      <div>
        <h1 className="text-xl font-bold text-white">
          Dashboard
        </h1>
        <p className="text-sm text-zinc-400">
          Welcome to ContractFlo
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="rounded-lg p-2 hover:bg-zinc-800">
          <Bell className="h-5 w-5 text-zinc-300" />
        </button>

        <button className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-zinc-800">
          <UserCircle className="h-6 w-6 text-zinc-300" />
          <span className="text-white">Deepakshi</span>
        </button>
      </div>
    </header>
  );
}