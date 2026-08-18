"use client";

import ContractsByTypeChart from "@/components/dashboard/ContractsByTypeChart";
import RiskDistributionChart from "@/components/dashboard/RiskDistributionChart";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import MonthlyTrendChart from "@/components/dashboard/MonthlyTrendChart";

export default function DashboardPage() {
  return (
    <div className="p-8">

      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Welcome to ContractFlo 👋
        </h1>

        <p className="mt-2 text-zinc-400">
          AI-powered Contract Intelligence Platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

        {/* Total Contracts */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg transition hover:border-violet-500">
          <p className="text-sm text-zinc-400">
            Total Contracts
          </p>

          <h2 className="mt-4 text-4xl font-bold text-white">
            142
          </h2>

          <p className="mt-2 text-sm text-green-400">
            +12 this month
          </p>
        </div>

        {/* Active Risks */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg transition hover:border-red-500">
          <p className="text-sm text-zinc-400">
            Active Risks
          </p>

          <h2 className="mt-4 text-4xl font-bold text-white">
            8
          </h2>

          <p className="mt-2 text-sm text-red-400">
            Needs Attention
          </p>
        </div>

        {/* Organizations */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg transition hover:border-blue-500">
          <p className="text-sm text-zinc-400">
            Organizations
          </p>

          <h2 className="mt-4 text-4xl font-bold text-white">
            3
          </h2>

          <p className="mt-2 text-sm text-blue-400">
            Connected
          </p>
        </div>

      </div>
            {/* Bottom Section */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Recent Contracts */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

          <h2 className="mb-4 text-xl font-semibold text-white">
            Recent Contracts
          </h2>

          <div className="space-y-4">

            <div className="flex items-center justify-between rounded-xl bg-zinc-800 p-4">
              <div>
                <p className="font-medium text-white">
                  NDA Agreement.pdf
                </p>

                <p className="text-sm text-zinc-400">
                  Uploaded 2 hours ago
                </p>
              </div>

              <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400">
                Approved
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-zinc-800 p-4">
              <div>
                <p className="font-medium text-white">
                  Vendor Contract.pdf
                </p>

                <p className="text-sm text-zinc-400">
                  Uploaded Yesterday
                </p>
              </div>

              <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-400">
                Review
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-zinc-800 p-4">
              <div>
                <p className="font-medium text-white">
                  Employment Contract.pdf
                </p>

                <p className="text-sm text-zinc-400">
                  Uploaded 3 days ago
                </p>
              </div>

              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-400">
                Signed
              </span>
            </div>

          </div>

        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

          <h2 className="mb-4 text-xl font-semibold text-white">
            Quick Actions
          </h2>

          <div className="space-y-4">

            <button className="w-full rounded-xl bg-violet-600 p-4 text-left font-medium text-white transition hover:bg-violet-700">
              📄 Upload Contract
            </button>

            <button className="w-full rounded-xl bg-zinc-800 p-4 text-left font-medium text-white transition hover:bg-zinc-700">
              🤖 AI Risk Analysis
            </button>

            <button className="w-full rounded-xl bg-zinc-800 p-4 text-left font-medium text-white transition hover:bg-zinc-700">
              👥 Invite Team Member
            </button>

          </div>

        </div>

      </div>
            {/* Analytics Overview */}
      <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

        <h2 className="mb-6 text-2xl font-semibold text-white">
          Analytics Overview
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">

          <div className="rounded-xl bg-zinc-800 p-5">
            <p className="text-sm text-zinc-400">
              Reviewed
            </p>

            <h3 className="mt-2 text-3xl font-bold text-white">
              96
            </h3>
          </div>

          <div className="rounded-xl bg-zinc-800 p-5">
            <p className="text-sm text-zinc-400">
              Pending
            </p>

            <h3 className="mt-2 text-3xl font-bold text-yellow-400">
              18
            </h3>
          </div>

          <div className="rounded-xl bg-zinc-800 p-5">
            <p className="text-sm text-zinc-400">
              AI Flags
            </p>

            <h3 className="mt-2 text-3xl font-bold text-red-400">
              11
            </h3>
          </div>

          <div className="rounded-xl bg-zinc-800 p-5">
            <p className="text-sm text-zinc-400">
              Completed
            </p>

            <h3 className="mt-2 text-3xl font-bold text-green-400">
              124
            </h3>
          </div>

        </div>

      </div>

      {/* Charts Section */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">

        <ContractsByTypeChart />

        <RiskDistributionChart />

      </div>
            {/* Contract Insights */}
      <div className="mt-10">

        <h2 className="mb-6 text-2xl font-semibold text-white">
          Contract Insights
        </h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Upcoming Renewals */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

            <h3 className="mb-4 text-xl font-semibold text-white">
              Upcoming Renewals
            </h3>

            <div className="space-y-4">

              <div className="flex items-center justify-between rounded-xl bg-zinc-800 p-4">
                <span className="text-white">
                  Vendor Agreement
                </span>

                <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-400">
                  5 Days
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-zinc-800 p-4">
                <span className="text-white">
                  Employment Contract
                </span>

                <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-400">
                  Tomorrow
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-zinc-800 p-4">
                <span className="text-white">
                  NDA Agreement
                </span>

                <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400">
                  12 Days
                </span>
              </div>

            </div>

          </div>

          {/* Open Obligations */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

            <h3 className="mb-4 text-xl font-semibold text-white">
              Open Obligations
            </h3>

            <div className="space-y-4">

              <div className="flex items-center justify-between rounded-xl bg-zinc-800 p-4">
                <span className="text-white">
                  Vendor Payment
                </span>

                <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-400">
                  Due
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-zinc-800 p-4">
                <span className="text-white">
                  Compliance Report
                </span>

                <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-400">
                  Pending
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-zinc-800 p-4">
                <span className="text-white">
                  Renewal Review
                </span>

                <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400">
                  Scheduled
                </span>
              </div>

            </div>

          </div>

        </div>

      </div>
            {/* Recent Activity */}
      <div className="mt-10">
        <ActivityFeed />
      </div>

      {/* Monthly Contract Trend */}
      <div className="mt-10">
        <MonthlyTrendChart />
      </div>

    </div>
  );
}