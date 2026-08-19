'use client'

import { useState, useEffect } from 'react'
import { fetchAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, AlertTriangle, CalendarClock, ListTodo, Loader2, RefreshCw, Plus, ArrowRight } from 'lucide-react'
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
  critical: '#dc2626', // red-600
  high: '#ea580c',     // orange-600
  medium: '#ca8a04',   // yellow-600
  low: '#16a34a',      // green-600
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
      const res = await fetchAPI('/api/v1/analytics/overview')
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Failed to load analytics</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <Button onClick={loadDashboard} variant="outline" className="border-red-500/20 hover:bg-red-500/20 bg-transparent">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!data) return null

  // Empty State
  if (data.total_contracts === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <FileText className="w-8 h-8 text-neutral-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Welcome to ContractFlo</h2>
            <p className="text-neutral-400 leading-relaxed">
              Your repository is empty. Upload your first contract to instantly extract metadata, analyze risks, and track obligations.
            </p>
          </div>
          <Button size="lg" className="w-full bg-white text-black hover:bg-neutral-200 h-12 rounded-lg font-medium" asChild>
            <Link href="/contracts/upload">
              <Plus className="w-5 h-5 mr-2" /> Upload Contract
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const riskData = [
    { name: 'Critical', value: data.risk_distribution.critical, color: COLORS.critical },
    { name: 'High', value: data.risk_distribution.high, color: COLORS.high },
    { name: 'Medium', value: data.risk_distribution.medium, color: COLORS.medium },
    { name: 'Low', value: data.risk_distribution.low, color: COLORS.low },
  ].filter(d => d.value > 0)

  if (riskData.length === 0) {
    riskData.push({ name: 'Unassessed', value: 1, color: COLORS.muted })
  }

  const typeData = [...data.contracts_by_type].sort((a, b) => b.count - a.count)

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-neutral-50 bg-neutral-950 min-h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-neutral-400 mt-1">Portfolio intelligence and risk overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={loadDashboard}
            className="text-neutral-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button asChild className="bg-white text-black hover:bg-neutral-200 font-medium">
            <Link href="/contracts/upload">
              <Plus className="w-4 h-4 mr-2" /> Upload Contract
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Contracts", value: data.total_contracts, icon: FileText, color: "text-neutral-400" },
          { title: "High Risk", value: data.risk_distribution.high + data.risk_distribution.critical, icon: AlertTriangle, color: "text-red-500" },
          { title: "Upcoming Renewals", value: data.upcoming_renewals.length, icon: CalendarClock, color: "text-orange-500" },
          { title: "Open Obligations", value: data.open_obligations.total, icon: ListTodo, color: "text-blue-500" }
        ].map((kpi, idx) => (
          <Card key={idx} className="bg-neutral-900 border-neutral-800 rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{kpi.title}</CardTitle>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-white">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-neutral-900 border-neutral-800 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-200">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-between">
              <div className="w-[50%] h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#f5f5f5', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#f5f5f5' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-[45%] flex flex-col gap-3 justify-center">
                {riskData.map(d => (
                  <div key={d.name} className="flex items-center gap-3 text-sm text-neutral-300">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="flex-1">{d.name}</span>
                    <span className="font-semibold text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-200">Contracts by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="contract_type" type="category" width={100} tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#262626' }} 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#f5f5f5', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#3b82f6" barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-neutral-900 border-neutral-800 rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <CardTitle className="text-sm font-medium text-neutral-200">Action Required: High Risk</CardTitle>
              <CardDescription className="text-xs text-neutral-500 mt-1">Contracts flagged for critical review.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.high_risk_contracts.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-500">No high-risk contracts found.</div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {data.high_risk_contracts.slice(0, 5).map(c => (
                  <Link href={`/contracts/${c.contract_id}`} key={c.contract_id} className="flex items-center justify-between p-4 hover:bg-neutral-800/50 transition-colors group">
                    <div>
                      <p className="font-medium text-sm text-neutral-200 group-hover:text-white">{c.title}</p>
                      <p className="text-xs text-neutral-500 mt-1">{c.contract_type} • {c.counterparty || 'No counterparty'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={`text-xs ${c.risk_level === 'Critical' ? 'text-red-500 border-red-500/20 bg-red-500/10' : 'text-orange-500 border-orange-500/20 bg-orange-500/10'}`}>
                        {c.risk_score}/100
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <CardTitle className="text-sm font-medium text-neutral-200">Upcoming Renewals</CardTitle>
              <CardDescription className="text-xs text-neutral-500 mt-1">Expiring within the next 90 days.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.upcoming_renewals.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-500">No upcoming renewals found.</div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {data.upcoming_renewals.slice(0, 5).map(c => (
                  <Link href={`/contracts/${c.contract_id}`} key={c.contract_id} className="flex items-center justify-between p-4 hover:bg-neutral-800/50 transition-colors group">
                    <div>
                      <p className="font-medium text-sm text-neutral-200 group-hover:text-white">{c.title}</p>
                      <p className="text-xs text-neutral-500 mt-1">{c.contract_type}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-sm font-medium ${c.days_remaining <= 30 ? 'text-orange-500' : 'text-neutral-300'}`}>
                          {c.days_remaining} days
                        </p>
                        <p className="text-xs text-neutral-500">{c.renewal_date}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
    </div>
  )
}
