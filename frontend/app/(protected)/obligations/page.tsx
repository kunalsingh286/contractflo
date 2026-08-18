export default function ObligationsPage() {
  return (
    <div className="p-8">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Obligations
        </h1>

        <p className="mt-2 text-zinc-400">
          Track all contractual obligations
        </p>
      </div>

      <div className="space-y-5">

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Submit Monthly Report
              </h2>

              <p className="mt-2 text-zinc-400">
                Due: 30 July 2026
              </p>
            </div>

            <span className="rounded-full bg-yellow-500/20 px-4 py-2 text-yellow-400">
              Pending
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Vendor Payment
              </h2>

              <p className="mt-2 text-zinc-400">
                Due: 5 August 2026
              </p>
            </div>

            <span className="rounded-full bg-green-500/20 px-4 py-2 text-green-400">
              Completed
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                NDA Renewal
              </h2>

              <p className="mt-2 text-zinc-400">
                Due: 20 August 2026
              </p>
            </div>

            <span className="rounded-full bg-red-500/20 px-4 py-2 text-red-400">
              Overdue
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}