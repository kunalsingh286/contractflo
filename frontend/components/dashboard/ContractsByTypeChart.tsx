"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const data = [
  {
    type: "NDA",
    contracts: 45,
  },
  {
    type: "Vendor",
    contracts: 28,
  },
  {
    type: "MSA",
    contracts: 12,
  },
  {
    type: "Employment",
    contracts: 17,
  },
];

export default function ContractsByTypeChart() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

      <h2 className="mb-6 text-xl font-semibold text-white">
        Contracts by Type
      </h2>

      <div className="h-72">

        <ResponsiveContainer width="100%" height="100%">

          <BarChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#3f3f46"
            />

            <XAxis
              dataKey="type"
              stroke="#a1a1aa"
            />

            <YAxis
              stroke="#a1a1aa"
            />

            <Tooltip />

            <Bar
              dataKey="contracts"
              fill="#8b5cf6"
              radius={[8, 8, 0, 0]}
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}