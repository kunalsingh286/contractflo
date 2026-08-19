'use client'

import { useEffect, useState } from 'react'
import { fetchAPI } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ShieldAlert, ShieldCheck, Shield, Loader2, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export default function RiskCenterPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [risks, setRisks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAPI('/contracts/all/risks').then(setRisks).catch(console.error).finally(() => setLoading(false))
  }, [])

  const metrics = [
    { label: 'Total Analyzed', value: risks.length, color: 'text-white' },
    { label: 'Critical', value: risks.filter(r => r.risk_level === 'Critical').length, color: 'text-red-500', icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
    { label: 'High', value: risks.filter(r => r.risk_level === 'High').length, color: 'text-orange-500', icon: <ShieldAlert className="w-4 h-4 text-orange-500" /> },
    { label: 'Medium', value: risks.filter(r => r.risk_level === 'Medium').length, color: 'text-yellow-500', icon: <Shield className="w-4 h-4 text-yellow-500" /> },
    { label: 'Low', value: risks.filter(r => r.risk_level === 'Low').length, color: 'text-emerald-500', icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> },
  ]

  const levelStyles: Record<string, string> = {
    Critical: 'text-red-500 border-red-500/20 bg-red-500/10',
    High: 'text-orange-500 border-orange-500/20 bg-orange-500/10',
    Medium: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10',
    Low: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10',
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-neutral-950 min-h-screen text-neutral-50">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Risk Radar</h1>
        <p className="text-sm text-neutral-500 mt-1">AI-evaluated risk exposure across your contract portfolio</p>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{m.label}</p>
              {m.icon}
            </div>
            <p className={`text-3xl font-bold tracking-tight ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-200">Risk Assessments</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        ) : risks.length === 0 ? (
          <div className="py-20 text-center">
            <Shield className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No risk assessments yet.</p>
            <p className="text-xs text-neutral-600 mt-1">Upload and analyze a contract to see results here.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {risks.sort((a, b) => b.risk_score - a.risk_score).map(risk => (
              <Link
                href={`/contracts/${risk.contract_id}`}
                key={risk.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-neutral-800/50 transition-colors group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="shrink-0">
                    <Badge variant="outline" className={`text-xs ${levelStyles[risk.risk_level] || 'text-neutral-400 border-neutral-700 bg-neutral-800'}`}>
                      {risk.risk_level || '—'}
                    </Badge>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-200 group-hover:text-white truncate">
                      {risk.contracts?.title || 'Unknown Contract'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {risk.findings?.high?.length || 0} high risks · {risk.missing_clauses?.length || 0} missing clauses
                      {risk.analyzed_at && ` · ${format(new Date(risk.analyzed_at), 'MMM d, yyyy')}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      risk.risk_score >= 70 ? 'text-red-500' :
                      risk.risk_score >= 40 ? 'text-yellow-500' :
                      'text-emerald-500'
                    }`}>{risk.risk_score}</p>
                    <p className="text-[10px] text-neutral-600 uppercase tracking-wider">/ 100</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
