'use client'

import { useEffect, useState } from 'react'
import { fetchAPI } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, CalendarDays, FileText, CalendarX2, Loader2, ArrowRight } from 'lucide-react'
import { format, isBefore, addDays, startOfDay } from 'date-fns'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

export default function ObligationCenterPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [obligations, setObligations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchAPI('/contracts/all/obligations').then(setObligations).catch(console.error).finally(() => setLoading(false))
  }, [])

  const today = startOfDay(new Date())
  const nextWeek = addDays(today, 7)

  const classified = obligations.map(ob => {
    let derivedStatus = ob.status
    let isDueSoon = false
    if (ob.status === 'open' && ob.due_date && ob.due_date_type === 'exact') {
      const due = startOfDay(new Date(ob.due_date))
      if (isBefore(due, today)) derivedStatus = 'overdue'
      else if (isBefore(due, nextWeek)) isDueSoon = true
    }
    return { ...ob, derivedStatus, isDueSoon }
  })

  const metrics = [
    { label: 'Total', value: classified.length, color: 'text-white' },
    { label: 'Open', value: classified.filter(o => o.derivedStatus === 'open').length, color: 'text-yellow-500', icon: <CalendarDays className="w-4 h-4 text-yellow-500" /> },
    { label: 'Due Soon', value: classified.filter(o => o.isDueSoon).length, color: 'text-orange-500', icon: <Clock className="w-4 h-4 text-orange-500" /> },
    { label: 'Overdue', value: classified.filter(o => o.derivedStatus === 'overdue').length, color: 'text-red-500', icon: <CalendarX2 className="w-4 h-4 text-red-500" /> },
    { label: 'Completed', value: classified.filter(o => o.derivedStatus === 'completed').length, color: 'text-emerald-500', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StatusBadge = ({ ob }: { ob: any }) => {
    if (ob.derivedStatus === 'completed') return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">Done</Badge>
    if (ob.derivedStatus === 'overdue') return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs flex items-center gap-1"><CalendarX2 className="w-3 h-3" /> Overdue</Badge>
    if (ob.isDueSoon) return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Due Soon</Badge>
    if (ob.due_date_type === 'recurring') return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">Recurring</Badge>
    return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">Open</Badge>
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatDue = (ob: any) => {
    if (ob.due_date_type === 'exact' && ob.due_date) return format(new Date(ob.due_date), 'MMM d, yyyy')
    if (ob.due_date_type === 'recurring') return `Recurring`
    return '—'
  }

  async function markDone(id: string) {
    try {
      await fetchAPI(`/obligations/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) })
      setObligations(prev => prev.map(o => o.id === id ? { ...o, status: 'completed' } : o))
      toast('success', 'Obligation marked complete')
    } catch {
      toast('error', 'Failed to update obligation')
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-neutral-950 min-h-screen text-neutral-50">
      <div className="border-b border-neutral-800 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Obligations</h1>
        <p className="text-sm text-neutral-500 mt-1">Track deliverables, payments, and notices across all contracts</p>
      </div>

      {/* KPIs */}
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
          <h2 className="text-sm font-medium text-neutral-200">All Obligations</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        ) : classified.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No obligations found.</p>
            <p className="text-xs text-neutral-600 mt-1">Analyze a contract to extract obligations automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {classified.map(ob => (
              <div key={ob.id} className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-800/40 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="bg-neutral-800 text-neutral-400 text-xs capitalize shrink-0">{ob.type}</Badge>
                    <p className="text-sm font-medium text-neutral-200 truncate">{ob.title}</p>
                  </div>
                  <Link href={`/contracts/${ob.contract_id}`} className="text-xs text-neutral-500 hover:text-blue-400 transition-colors">
                    {ob.contracts?.title || 'Unknown Contract'} <ArrowRight className="w-3 h-3 inline" />
                  </Link>
                </div>
                <div className="shrink-0 text-right min-w-[90px]">
                  <p className={`text-xs font-medium ${ob.derivedStatus === 'overdue' ? 'text-red-400' : ob.isDueSoon ? 'text-orange-400' : 'text-neutral-400'}`}>
                    {formatDue(ob)}
                  </p>
                </div>
                <div className="shrink-0">
                  <StatusBadge ob={ob} />
                </div>
                {ob.derivedStatus !== 'completed' && ob.derivedStatus !== 'cancelled' && (
                  <button
                    onClick={() => markDone(ob.id)}
                    className="shrink-0 text-xs text-neutral-600 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100 whitespace-nowrap"
                  >
                    Mark done
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
