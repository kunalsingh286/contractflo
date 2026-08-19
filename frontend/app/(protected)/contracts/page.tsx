'use client'

import { useEffect, useState } from 'react'
import { fetchAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { Plus, Search, FileText, Loader2, ArrowRight } from 'lucide-react'

type Contract = {
  id: string
  title: string
  contract_type: string
  status: string
  counterparty: string | null
  created_at: string
}

const statusColors: Record<string, string> = {
  Draft: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  Review: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Executed: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Expired: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    fetchAPI('/contracts').then(setContracts).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = contracts.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.counterparty?.toLowerCase() || '').includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-neutral-950 min-h-screen text-neutral-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Repository</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {loading ? 'Loading...' : `${contracts.length} contract${contracts.length !== 1 ? 's' : ''} in your organization`}
          </p>
        </div>
        <Button asChild className="bg-white text-black hover:bg-neutral-200 font-medium h-9">
          <Link href="/contracts/upload">
            <Plus className="w-4 h-4 mr-2" /> Upload Contract
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input
            placeholder="Search by title or counterparty..."
            className="pl-9 bg-neutral-900 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 h-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-neutral-900 border-neutral-800 text-neutral-300 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['All', 'Draft', 'Review', 'Approved', 'Executed', 'Expired'].map(s => (
              <SelectItem key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
            {contracts.length === 0 ? (
              <>
                <p className="text-sm text-neutral-400 font-medium">No contracts yet</p>
                <p className="text-xs text-neutral-600 mt-1 mb-4">Upload your first contract to get started</p>
                <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
                  <Link href="/contracts/upload"><Plus className="w-3.5 h-3.5 mr-1.5" /> Upload Contract</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-neutral-500">No contracts match your filters</p>
                <p className="text-xs text-neutral-600 mt-1">Try adjusting your search or status filter</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3">
              <p className="col-span-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Title</p>
              <p className="col-span-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Type</p>
              <p className="col-span-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Counterparty</p>
              <p className="col-span-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</p>
              <p className="col-span-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Uploaded</p>
            </div>
            {filtered.map(contract => (
              <Link
                href={`/contracts/${contract.id}`}
                key={contract.id}
                className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-neutral-800/50 transition-colors group items-center"
              >
                <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 bg-neutral-800 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  </div>
                  <p className="text-sm font-medium text-neutral-200 group-hover:text-white truncate">
                    {contract.title}
                  </p>
                </div>
                <p className="col-span-2 text-sm text-neutral-400 truncate">{contract.contract_type}</p>
                <p className="col-span-2 text-sm text-neutral-400 truncate">{contract.counterparty || '—'}</p>
                <div className="col-span-2">
                  <Badge variant="outline" className={`text-xs ${statusColors[contract.status] || 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
                    {contract.status}
                  </Badge>
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <p className="text-sm text-neutral-500">{format(new Date(contract.created_at), 'MMM d, yyyy')}</p>
                  <ArrowRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
