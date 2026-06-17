import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <FileText className="size-5" />
            <span className="text-lg font-semibold tracking-tight">
              {APP_NAME}
            </span>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            Phase 0
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-24">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Contract intelligence, built for operations teams
          </h1>
          <p className="text-lg text-muted-foreground">{APP_DESCRIPTION}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button>Get started</Button>
            <Button variant="outline">View documentation</Button>
          </div>
        </div>

        <section className="mt-20 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Ingest",
              description: "Upload and organize contracts at scale.",
            },
            {
              title: "Understand",
              description: "Extract clauses, risks, and obligations with AI.",
            },
            {
              title: "Operate",
              description: "Track renewals, tasks, and contract lifecycle.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-lg border bg-card p-6 text-card-foreground"
            >
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t py-6">
        <p className="text-center text-sm text-muted-foreground">
          {APP_NAME} · Foundation release
        </p>
      </footer>
    </div>
  );
}
