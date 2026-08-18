export default function AnalyticsPage() {
  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold text-white">
        Analytics
      </h1>

      <p className="mt-2 text-zinc-400">
        Contract performance insights
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-2xl bg-zinc-900 p-6">
          <p className="text-zinc-400">Contracts</p>
          <h2 className="mt-3 text-4xl font-bold text-white">142</h2>
        </div>

        <div className="rounded-2xl bg-zinc-900 p-6">
          <p className="text-zinc-400">Reviewed</p>
          <h2 className="mt-3 text-4xl font-bold text-green-400">96</h2>
        </div>

        <div className="rounded-2xl bg-zinc-900 p-6">
          <p className="text-zinc-400">Pending</p>
          <h2 className="mt-3 text-4xl font-bold text-yellow-400">18</h2>
        </div>

        <div className="rounded-2xl bg-zinc-900 p-6">
          <p className="text-zinc-400">AI Flags</p>
          <h2 className="mt-3 text-4xl font-bold text-red-400">11</h2>
        </div>

      </div>

      <div className="mt-10 rounded-2xl bg-zinc-900 p-8">

        <h2 className="text-2xl font-semibold text-white">
          Monthly Contract Activity
        </h2>

        <div className="mt-8 flex h-64 items-end justify-between gap-4">

          <div className="h-24 w-full rounded bg-violet-600"></div>
          <div className="h-40 w-full rounded bg-violet-600"></div>
          <div className="h-32 w-full rounded bg-violet-600"></div>
          <div className="h-52 w-full rounded bg-violet-600"></div>
          <div className="h-44 w-full rounded bg-violet-600"></div>
          <div className="h-60 w-full rounded bg-violet-600"></div>

        </div>

      </div>

    </div>
  );
}