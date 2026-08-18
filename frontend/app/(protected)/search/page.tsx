'use client'

import { useState } from 'react'
import { fetchAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, FileText, ExternalLink, Calendar, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface SearchEvidence {
  section_title: string | null
  page_number: number | null
  excerpt: string
}

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
  evidence: SearchEvidence[]
}

interface SearchResponse {
  results: SearchResult[]
  total_count: number
  page: number
  page_size: number
  applied_filters: Record<string, string>
}

export default function SearchPage() {
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<SearchResponse | null>(null)
  
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchInput.trim() && !hasSearched) return
    
    setLoading(true)
    setHasSearched(true)
    
    try {
      const data = await fetchAPI(`/search?q=${encodeURIComponent(searchInput)}`)
      setResponse(data)
    } catch (err) {
      console.error("Search failed:", err)
      // Provide an empty structure to let UI degrade gracefully
      setResponse({ results: [], total_count: 0, page: 1, page_size: 20, applied_filters: {} })
    } finally {
      setLoading(false)
    }
  }

  // Allow triggering via enter key inside form or button click
  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-6">
      
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Global Contract Search</h1>
        <p className="text-neutral-400 max-w-2xl mx-auto">
          Search across all your contracts using natural language. Try &quot;vendor agreements expiring next quarter&quot; or &quot;contracts with unlimited liability&quot;.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-3xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <Input 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search contracts, clauses, risks and obligations..."
            className="pl-10 h-12 text-lg bg-neutral-900 border-neutral-800"
          />
        </div>
        <Button type="submit" className="h-12 px-8 bg-blue-600 hover:bg-blue-700" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
        </Button>
      </form>

      {/* Results Section */}
      <div className="mt-8">
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {!loading && hasSearched && response && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm text-neutral-400">
              <div>Found {response.total_count} results</div>
              <div className="flex gap-2">
                {Object.entries(response.applied_filters).map(([k, v]) => (
                  <Badge key={k} variant="secondary" className="bg-neutral-800">
                    {k.replace('_', ' ')}: {v}
                  </Badge>
                ))}
              </div>
            </div>

            {response.results.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-neutral-800 rounded-lg">
                <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No results found</h3>
                <p className="text-neutral-500">Try adjusting your search terms.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {response.results.map((res) => (
                  <Card key={res.contract_id} className="bg-neutral-950 border-neutral-800 hover:border-neutral-700 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {res.title}
                            <Badge variant="outline" className={res.status === 'Active' ? 'text-green-400 border-green-400/20 bg-green-400/10' : ''}>
                              {res.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {res.contract_type || 'Unknown Type'} • {res.counterparty || 'No Counterparty'}
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/contracts/${res.contract_id}`}>
                            View Contract <ExternalLink className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Meta stats */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {res.expiration_date && (
                          <div className="flex items-center gap-1.5 text-neutral-400">
                            <Calendar className="w-4 h-4" /> Exp: {res.expiration_date}
                          </div>
                        )}
                        {res.risk_level && (
                          <div className="flex items-center gap-1.5 text-neutral-400">
                            <AlertTriangle className={`w-4 h-4 ${res.risk_level === 'high' ? 'text-red-400' : res.risk_level === 'medium' ? 'text-yellow-400' : 'text-blue-400'}`} /> 
                            {res.risk_level.charAt(0).toUpperCase() + res.risk_level.slice(1)} Risk
                          </div>
                        )}
                      </div>
                      
                      {/* Match Reasons */}
                      <div className="flex flex-wrap gap-2">
                        {res.match_reasons.map((mr, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-blue-900/20 text-blue-300 hover:bg-blue-900/40">
                            {mr}
                          </Badge>
                        ))}
                      </div>

                      {/* Evidence (Semantic Hits) */}
                      {res.evidence.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3">
                          {res.evidence.map((ev, idx) => (
                            <div key={idx} className="bg-neutral-900 rounded p-3 text-sm">
                               <div className="flex items-center gap-2 text-neutral-400 font-medium mb-1.5">
                                 <FileText className="w-3.5 h-3.5" />
                                 {ev.section_title || 'Contract Text'} {ev.page_number ? `(Pg ${ev.page_number})` : ''}
                               </div>
                               <p className="text-neutral-300 italic">&quot;{ev.excerpt}&quot;</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
