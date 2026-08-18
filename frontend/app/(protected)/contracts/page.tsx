export default function ContractsPage() {
  return (
    <div className="p-8">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold text-white">
            Contracts
          </h1>

          <p className="mt-2 text-zinc-400">
            Manage all your contracts
          </p>
        </div>

        <button className="rounded-xl bg-violet-600 px-5 py-3 font-medium text-white hover:bg-violet-700">
          + Upload Contract
        </button>

      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800">

        <table className="w-full">

          <thead className="bg-zinc-900">

            <tr className="text-left text-zinc-400">

              <th className="p-4">Name</th>
              <th>Status</th>
              <th>Organization</th>
              <th>Created</th>

            </tr>

          </thead>

          <tbody className="bg-zinc-950">

            <tr className="border-t border-zinc-800">

              <td className="p-4 text-white">
                NDA Agreement.pdf
              </td>

              <td className="text-green-400">
                Approved
              </td>

              <td className="text-zinc-300">
                Microsoft
              </td>

              <td className="text-zinc-400">
                Today
              </td>

            </tr>

            <tr className="border-t border-zinc-800">

              <td className="p-4 text-white">
                Vendor Contract.pdf
              </td>

              <td className="text-yellow-400">
                Review
              </td>

              <td className="text-zinc-300">
                Amazon
              </td>

              <td className="text-zinc-400">
                Yesterday
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>
  );
}