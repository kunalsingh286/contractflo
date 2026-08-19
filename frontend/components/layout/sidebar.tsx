"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  ClipboardList,
  Bot,
  BarChart3,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Contracts",
    href: "/contracts",
    icon: FileText,
  },
  {
    label: "Risk Center",
    href: "/risk-center",
    icon: ShieldAlert,
  },
  {
    label: "Obligations",
    href: "/obligations",
    icon: ClipboardList,
  },
  {
    label: "AI Copilot",
    href: "/copilot",
    icon: Bot,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      
      {/* Logo Section */}
      <div className="border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          ContractFlo
        </h1>

        <p className="text-xs text-zinc-500">
          Contract Intelligence Platform
        </p>
      </div>


      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>


      {/* Footer */}
      <div className="border-t border-zinc-200 px-6 py-4 text-xs text-zinc-500 dark:border-zinc-800">
        AI Contract Intelligence
      </div>

    </aside>
  );
}