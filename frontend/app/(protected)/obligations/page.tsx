'use client'

import { useEffect, useState } from 'react'
import { fetchAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, CalendarDays, FileText, CalendarX2 } from 'lucide-react'
import { format, isBefore, addDays, startOfDay } from 'date-fns'
import Link from 'next/link'

export default function ObligationCenterPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [obligations, setObligations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadObligations() {
      try {
        const data = await fetchAPI('/contracts/all/obligations')
        setObligations(data)
      } catch (err) {
        console.error('Failed to load obligations', err)
      } finally {
        setLoading(false)
      }
    }
    loadObligations()
  }, [])

  if (loading) {
    return <div className="p-6 text-center text-neutral-400">Loading Obligation Center...</div>
  }

  const today = startOfDay(new Date())
  const nextWeek = addDays(today, 7)

  // Derived classification
  const classifiedObligations = obligations.map(ob => {
    let derivedStatus = ob.status
    let isDueSoon = false

    if (ob.status === 'open' && ob.due_date && ob.due_date_type === 'exact') {
      const due = startOfDay(new Date(ob.due_date))
      if (isBefore(due, today)) {
        derivedStatus = 'overdue'
      } else if (isBefore(due, nextWeek) || due.getTime() === today.getTime()) {
        isDueSoon = true
      }
    }
    return { ...ob, derivedStatus, isDueSoon }
  })

  // Metrics
  const totalCount = classifiedObligations.length
  const openCount = classifiedObligations.filter(o => o.derivedStatus === 'open').length
  const completedCount = classifiedObligations.filter(o => o.derivedStatus === 'completed').length
  const overdueCount = classifiedObligations.filter(o => o.derivedStatus === 'overdue').length
  const dueSoonCount = classifiedObligations.filter(o => o.isDueSoon).length

  const getStatusBadge = (status: string, dueType: string) => {
    if (status === 'completed') return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>
    if (status === 'cancelled') return <Badge className="bg-neutral-800 text-neutral-400 border-neutral-700">Cancelled</Badge>
    if (status === 'overdue') return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 flex items-center gap-1"><CalendarX2 className="w-3 h-3"/> Overdue</Badge>
    
    // open
    if (dueType === 'recurring') return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Recurring</Badge>
    return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Open</Badge>
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatDue = (ob: any) => {
    if (ob.due_date_type === 'exact' && ob.due_date) {
      return format(new Date(ob.due_date), 'MMM d, yyyy')
    }
    if (ob.due_date_type === 'not_specified') {
      return <span className="text-neutral-500">No specific deadline</span>
    }
    if (ob.due_date_type === 'recurring') {
      return `Recurring: ${ob.due_date_expression || ob.recurrence}`
    }
    return ob.due_date_expression || 'See details'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-neutral-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Obligation Center</h1>
        <p className="text-neutral-400 mt-1">Track and manage deliverables, payments, and notices across all contracts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Total Obligations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-yellow-500" /> Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{openCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" /> Due Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{dueSoonCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <CalendarX2 className="w-4 h-4 text-red-500" /> Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overdueCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
        <CardHeader>
          <CardTitle>All Obligations</CardTitle>
        </CardHeader>
        <CardContent>
          {classifiedObligations.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No obligations found.</p>
              <p className="text-sm mt-2">Upload and analyze contracts to extract obligations.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-neutral-950/50 text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="px-4 py-3">Contract</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 min-w-[200px]">Title</th>
                    <th className="px-4 py-3">Responsible</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {classifiedObligations.map(ob => (
                    <tr key={ob.id} className="hover:bg-neutral-800/50 transition-colors">
                      <td className="px-4 py-4 font-medium text-blue-400 hover:underline max-w-[200px] truncate">
                        <Link href={`/contracts/${ob.contract_id}`}>
                          {ob.contracts?.title || 'Unknown Contract'}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className="capitalize bg-neutral-800 text-neutral-300">
                          {ob.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 font-medium">{ob.title}</td>
                      <td className="px-4 py-4 text-neutral-300">{ob.responsible_party || '-'}</td>
                      <td className="px-4 py-4">
                        <span className={ob.derivedStatus === 'overdue' ? 'text-red-400 font-medium' : ob.isDueSoon ? 'text-orange-400 font-medium' : ''}>
                           {formatDue(ob)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(ob.derivedStatus, ob.due_date_type)}
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
