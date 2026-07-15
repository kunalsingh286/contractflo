'use client'

import { useEffect, useState } from 'react'
import { fetchAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import Link from 'next/link'
import { Plus, Search, FileText } from 'lucide-react'

type Contract = {
  id: string
  title: string
  contract_type: string
  status: string
  counterparty: string | null
  created_at: string
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    async function loadContracts() {
      try {
        const data = await fetchAPI('/contracts')
        setContracts(data)
      } catch (err) {
        console.error('Failed to load contracts:', err)
      } finally {
        setLoading(false)
      }
    }
    loadContracts()
  }, [])

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          (c.counterparty?.toLowerCase() || '').includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-neutral-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <p className="text-neutral-400 mt-1">Manage your organization&apos;s repository</p>
        </div>
        <Link href="/contracts/upload">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Upload Contract
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-neutral-900 p-4 rounded-lg border border-neutral-800">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <Input 
            placeholder="Search title or counterparty..." 
            className="pl-9 bg-neutral-950 border-neutral-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-neutral-950 border-neutral-800">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Review">Review</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Executed">Executed</SelectItem>
            <SelectItem value="Expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900/50">
        <Table>
          <TableHeader className="bg-neutral-900">
            <TableRow className="border-neutral-800 hover:bg-transparent">
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-neutral-400">Loading contracts...</TableCell>
              </TableRow>
            ) : filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-neutral-400">
                  <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No contracts found.
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map(contract => (
                <TableRow key={contract.id} className="border-neutral-800 hover:bg-neutral-800/50">
                  <TableCell className="font-medium text-blue-400">
                    <Link href={`/contracts/${contract.id}`} className="hover:underline">
                      {contract.title}
                    </Link>
                  </TableCell>
                  <TableCell>{contract.contract_type}</TableCell>
                  <TableCell>{contract.counterparty || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-neutral-950 border-neutral-700">
                      {contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(contract.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/contracts/${contract.id}`}>
                      <Button variant="ghost" size="sm" className="hover:bg-neutral-800">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
