"use client";

import Sidebar from "./sidebar";
import Navbar from "./navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="flex min-h-screen">

      <Sidebar />

      <div className="flex flex-1 flex-col">

        <Navbar />
<main className="flex-1 bg-zinc-950 p-6">
  {children}
</main>
         

      </div>

    </div>
  );
}