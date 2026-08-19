'use client'

import { useState, useRef } from 'react'
import { fetchAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search, Loader2, FileText, ExternalLink, Calendar, AlertTriangle, Sparkles
} from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
  contract_id: string
  title: string
  contract_type: string | null
  counterparty: string | null
  status: string
  risk_level: string | null
  risk_score: number | null
  expiration_date: string | null
  relevance_score: number
  match_reasons: string[]
  evidence: { section_title: string | null; page_number: number | null; excerpt: string }[]
}

const EXAMPLE_QUERIES = [
  'contracts with unlimited liability clauses',
  'NDAs expiring next quarter',
  'vendor agreements with auto-renewal',
  'high-risk contracts missing indemnification',
]

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = async (q?: string) => {
    const searchQ = q ?? query
    if (!searchQ.trim()) return
    if (q) setQuery(q)
    setLoading(true)
    setSearched(true)
    try {
      const data = await fetchAPI(`/search?q=${encodeURIComponent(searchQ)}`)
      setResults(data.results || [])
      setTotalCount(data.total_count || 0)
    } catch {
      setResults([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const riskColor = (level: string | null) => {
    if (level === 'Critical' || level === 'High') return 'text-red-400'
    if (level === 'Medium') return 'text-yellow-400'
    return 'text-emerald-400'
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 text-xs text-blue-400 font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Semantic Search
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Search Your Contracts</h1>
          <p className="text-neutral-400 text-sm max-w-lg mx-auto">
            Ask anything in plain English. We&apos;ll find relevant clauses, risks, and obligations across your entire portfolio.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={e => { e.preventDefault(); handleSearch() }} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. contracts with auto-renewal clauses"
              className="pl-10 h-11 bg-neutral-900 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 text-sm"
            />
          </div>
          <Button type="submit" className="h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white shrink-0" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>
        </form>

        {/* Example Queries */}
        {!searched && (
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {EXAMPLE_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => handleSearch(q)}
                className="text-xs px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {loading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <p className="text-sm text-neutral-500">Searching across all contracts...</p>
          </div>
        )}

        {!loading && searched && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-500">
              {totalCount === 0 ? 'No results found.' : `${totalCount} result${totalCount !== 1 ? 's' : ''} found`}
            </p>

            {results.length === 0 ? (
              <div className="text-center py-16 bg-neutral-900 border border-neutral-800 rounded-xl">
                <FileText className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                <p className="text-sm text-neutral-400 font-medium">No matches found</p>
                <p className="text-xs text-neutral-600 mt-1">Try rephrasing your query or upload more contracts.</p>
              </div>
            ) : (
              results.map(res => (
                <div key={res.contract_id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-colors">
                  <div className="flex items-start justify-between p-5 pb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-100 text-sm">{res.title}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {res.contract_type || 'Unknown Type'} {res.counterparty ? `· ${res.counterparty}` : ''}
                      </p>
                    </div>
                    <Link href={`/contracts/${res.contract_id}`} className="shrink-0 ml-4">
                      <Button variant="ghost" size="sm" className="text-xs text-neutral-400 hover:text-white h-7">
                        View <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>

                  <div className="px-5 pb-3 flex flex-wrap gap-3 text-xs text-neutral-500">
                    {res.expiration_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Exp: {res.expiration_date}
                      </span>
                    )}
                    {res.risk_level && (
                      <span className={`flex items-center gap-1 ${riskColor(res.risk_level)}`}>
                        <AlertTriangle className="w-3 h-3" /> {res.risk_level} Risk
                        {res.risk_score && ` (${res.risk_score}/100)`}
                      </span>
                    )}
                  </div>

                  {res.match_reasons.length > 0 && (
                    <div className="px-5 pb-3 flex flex-wrap gap-1.5">
                      {res.match_reasons.map((mr, i) => (
                        <Badge key={i} variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs border">
                          {mr}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {res.evidence.length > 0 && (
                    <div className="border-t border-neutral-800 px-5 py-3 space-y-2">
                      {res.evidence.slice(0, 2).map((ev, i) => (
                        <div key={i} className="text-xs">
                          <span className="text-neutral-500 font-medium">
                            {ev.section_title || 'Clause'}{ev.page_number ? ` · p.${ev.page_number}` : ''}
                          </span>
                          <p className="text-neutral-400 italic mt-0.5 line-clamp-2">&quot;{ev.excerpt}&quot;</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {!searched && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-neutral-800 mx-auto mb-3" />
            <p className="text-sm text-neutral-600">Type a query above to search your contract portfolio</p>
          </div>
        )}
      </div>
    </div>
  )
}
