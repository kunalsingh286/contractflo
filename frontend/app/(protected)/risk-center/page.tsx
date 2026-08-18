export default function RiskCenterPage() {
  return (
    <div className="p-8">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Risk Center
        </h1>

        <p className="mt-2 text-zinc-400">
          AI detected contract risks
        </p>
      </div>

      <div className="space-y-6">

        <div className="rounded-2xl border border-red-500 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Payment Clause
              </h2>

              <p className="mt-2 text-zinc-400">
                Payment term exceeds company policy.
              </p>
            </div>

            <span className="rounded-full bg-red-500/20 px-4 py-2 text-red-400">
              High Risk
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-500 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Termination Clause
              </h2>

              <p className="mt-2 text-zinc-400">
                Notice period should be reviewed.
              </p>
            </div>

            <span className="rounded-full bg-yellow-500/20 px-4 py-2 text-yellow-400">
              Medium Risk
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-green-500 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Confidentiality Clause
              </h2>

              <p className="mt-2 text-zinc-400">
                No issues detected.
              </p>
            </div>

            <span className="rounded-full bg-green-500/20 px-4 py-2 text-green-400">
              Safe
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}