'use client'

import { useState, useEffect } from 'react'
import { fetchAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, AlertTriangle, CalendarClock, ListTodo, Loader2, RefreshCw, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie
} from 'recharts'

interface AnalyticsDashboardSchema {
  total_contracts: number
  contracts_by_type: { contract_type: string, count: number }[]
  risk_distribution: { high: number, medium: number, low: number, critical: number }
  lifecycle_distribution: { status: string, count: number }[]
  upcoming_renewals: { contract_id: string, title: string, contract_type: string, counterparty: string, renewal_date: string, days_remaining: number, risk_level: string }[]
  open_obligations: { total: number, overdue: number, due_soon: number }
  high_risk_contracts: { contract_id: string, title: string, contract_type: string, counterparty: string, risk_score: number, risk_level: string }[]
}

const COLORS = {
  high: '#ef4444',     // red-500
  critical: '#b91c1c', // red-700
  medium: '#f59e0b',   // amber-500
  low: '#3b82f6',      // blue-500
  primary: '#2563eb',  // blue-600
  muted: '#262626'     // neutral-800
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsDashboardSchema | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchAPI('/analytics/overview')
      setData(res)
    } catch (err: unknown) {
      const e = err as Error
      setError(e.message || "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Failed to load analytics</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <Button onClick={loadDashboard} variant="outline" className="border-red-500/20 hover:bg-red-500/20">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!data) return null

  if (data.total_contracts === 0) {
    return (
      <div className="container mx-auto p-8 max-w-4xl text-center min-h-[60vh] flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-xl mt-8">
        <FileText className="w-16 h-16 text-neutral-600 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Welcome to ContractFlo</h2>
        <p className="text-neutral-400 max-w-md mb-8">
          Your dashboard is currently empty. Upload your first contract to automatically extract metadata, risks, and obligations, and populate these analytics.
        </p>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
          <Link href="/contracts/new">
            <Plus className="w-5 h-5 mr-2" /> Upload Contract
          </Link>
        </Button>
      </div>
    )
  }

  // Formatting for Recharts
  const riskData = [
    { name: 'Critical', value: data.risk_distribution.critical, color: COLORS.critical },
    { name: 'High', value: data.risk_distribution.high, color: COLORS.high },
    { name: 'Medium', value: data.risk_distribution.medium, color: COLORS.medium },
    { name: 'Low', value: data.risk_distribution.low, color: COLORS.low },
  ].filter(d => d.value > 0)

  // Provide fallback if no risk data
  if (riskData.length === 0) {
    riskData.push({ name: 'Unassessed', value: 1, color: COLORS.muted })
  }

  const typeData = [...data.contracts_by_type].sort((a, b) => b.count - a.count)

  return (
    <div className="container mx-auto p-8 space-y-8">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-neutral-400 mt-1">Organization-wide portfolio intelligence.</p>
        </div>
        <Button variant="outline" onClick={loadDashboard}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-950 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Total Contracts</CardTitle>
            <FileText className="w-4 h-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_contracts}</div>
            <p className="text-xs text-neutral-500 mt-1">in the active repository</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-950 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">High Risk</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.risk_distribution.high + data.risk_distribution.critical}</div>
            <p className="text-xs text-neutral-500 mt-1">contracts flagged</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-950 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Upcoming Renewals</CardTitle>
            <CalendarClock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.upcoming_renewals.length}</div>
            <p className="text-xs text-neutral-500 mt-1">within 90 days</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-950 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Open Obligations</CardTitle>
            <ListTodo className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.open_obligations.total}</div>
            <p className="text-xs text-neutral-500 mt-1">
              {data.open_obligations.overdue > 0 && <span className="text-red-400">{data.open_obligations.overdue} overdue </span>}
              {data.open_obligations.due_soon > 0 && <span className="text-amber-400">{data.open_obligations.due_soon} due soon</span>}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contracts by Type Chart */}
        <Card className="bg-neutral-950 border-neutral-800">
          <CardHeader>
            <CardTitle>Contracts by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="contract_type" type="category" width={150} tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#262626' }} 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#f5f5f5' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.primary} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution Chart */}
        <Card className="bg-neutral-950 border-neutral-800">
          <CardHeader>
            <CardTitle>Portfolio Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#f5f5f5' }}
                    itemStyle={{ color: '#f5f5f5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Custom Legend */}
              <div className="absolute right-8 flex flex-col gap-2">
                {riskData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-sm text-neutral-400">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* High Risk Contracts */}
        <Card className="bg-neutral-950 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg">Top High-Risk Contracts</CardTitle>
            <CardDescription>Contracts flagged with highest deterministic risk scores.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.high_risk_contracts.length === 0 ? (
              <div className="text-center py-6 text-neutral-500">No high-risk contracts found.</div>
            ) : (
              <div className="space-y-4">
                {data.high_risk_contracts.map(c => (
                  <div key={c.contract_id} className="flex items-center justify-between pb-4 border-b border-neutral-800 last:border-0 last:pb-0">
                    <div>
                      <Link href={`/contracts/${c.contract_id}`} className="font-medium hover:text-blue-400 transition-colors">
                        {c.title}
                      </Link>
                      <div className="text-xs text-neutral-500 mt-1">{c.contract_type} • {c.counterparty || 'No counterparty'}</div>
                    </div>
                    <Badge variant="outline" className={`
                      ${c.risk_level === 'critical' ? 'text-red-500 border-red-500/30' : ''}
                      ${c.risk_level === 'high' ? 'text-red-400 border-red-400/30' : ''}
                    `}>
                      Score: {c.risk_score}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Renewals */}
        <Card className="bg-neutral-950 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Renewals</CardTitle>
            <CardDescription>Contracts renewing or expiring in the next 90 days.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcoming_renewals.length === 0 ? (
              <div className="text-center py-6 text-neutral-500">No renewals in the next 90 days.</div>
            ) : (
              <div className="space-y-4">
                {data.upcoming_renewals.map(c => (
                  <div key={c.contract_id} className="flex items-center justify-between pb-4 border-b border-neutral-800 last:border-0 last:pb-0">
                    <div>
                      <Link href={`/contracts/${c.contract_id}`} className="font-medium hover:text-blue-400 transition-colors">
                        {c.title}
                      </Link>
                      <div className="text-xs text-neutral-500 mt-1">{c.contract_type}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${c.days_remaining <= 30 ? 'text-amber-400' : 'text-neutral-300'}`}>
                        In {c.days_remaining} days
                      </div>
                      <div className="text-xs text-neutral-500">{c.renewal_date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
