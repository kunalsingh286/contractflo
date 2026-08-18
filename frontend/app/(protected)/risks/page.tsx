'use client'

import { useEffect, useState } from 'react'
import { fetchAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ShieldAlert, ShieldCheck, Shield } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export default function RiskCenterPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [risks, setRisks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRisks() {
      try {
        const data = await fetchAPI('/contracts/all/risks')
        setRisks(data)
      } catch (err) {
        console.error('Failed to load risks', err)
      } finally {
        setLoading(false)
      }
    }
    loadRisks()
  }, [])

  if (loading) {
    return <div className="p-6 text-center text-neutral-400">Loading Risk Center...</div>
  }

  // Calculate metrics
  const totalAnalyzed = risks.length
  const criticalCount = risks.filter(r => r.risk_level === 'Critical').length
  const highCount = risks.filter(r => r.risk_level === 'High').length
  const mediumCount = risks.filter(r => r.risk_level === 'Medium').length
  const lowCount = risks.filter(r => r.risk_level === 'Low').length

  const getRiskIcon = (level: string) => {
    switch(level) {
      case 'Critical': return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'High': return <ShieldAlert className="w-5 h-5 text-orange-500" />
      case 'Medium': return <Shield className="w-5 h-5 text-yellow-500" />
      case 'Low': return <ShieldCheck className="w-5 h-5 text-green-500" />
      default: return <Shield className="w-5 h-5 text-neutral-500" />
    }
  }

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'Critical': return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'High': return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      case 'Medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'Low': return 'bg-green-500/10 text-green-500 border-green-500/20'
      default: return 'bg-neutral-800 text-neutral-400 border-neutral-700'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-neutral-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Risk Center</h1>
        <p className="text-neutral-400 mt-1">AI-powered analysis and risk distribution across your organization&apos;s contracts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Total Analyzed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnalyzed}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Critical Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{criticalCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-500" /> High Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{highCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-yellow-500" /> Medium Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{mediumCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" /> Low Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{lowCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
        <CardHeader>
          <CardTitle>Risk Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {risks.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No risk assessments found.</p>
              <p className="text-sm mt-2">Upload and analyze contracts to see them here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-neutral-950/50 text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="px-4 py-3">Contract</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3">High Risks</th>
                    <th className="px-4 py-3">Missing</th>
                    <th className="px-4 py-3">Analyzed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {risks.sort((a, b) => b.risk_score - a.risk_score).map(risk => (
                    <tr key={risk.id} className="hover:bg-neutral-800/50 transition-colors">
                      <td className="px-4 py-4 font-medium text-blue-400 hover:underline">
                        <Link href={`/contracts/${risk.contract_id}`}>
                          {risk.contracts?.title || 'Unknown Contract'}
                        </Link>
                      </td>
                      <td className="px-4 py-4 font-bold">{risk.risk_score}/100</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {getRiskIcon(risk.risk_level)}
                          <Badge variant="outline" className={getRiskColor(risk.risk_level)}>
                            {risk.risk_level}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-4">{risk.findings?.high?.length || 0}</td>
                      <td className="px-4 py-4">{risk.missing_clauses?.length || 0}</td>
                      <td className="px-4 py-4 text-neutral-400">
                        {format(new Date(risk.analyzed_at), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
