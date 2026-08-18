'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { ArrowLeft, Download, Trash2, FileText, Info, History, Brain, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ContractDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [intelStatus, setIntelStatus] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [intelligence, setIntelligence] = useState<any>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    async function loadIntelligence() {
      try {
        const statusData = await fetchAPI(`/contracts/${contractId}/intelligence/status`)
        setIntelStatus(statusData)
        if (statusData?.extraction_status === 'completed') {
           const intelData = await fetchAPI(`/contracts/${contractId}/intelligence`)
           setIntelligence(intelData)
        } else if (statusData?.extraction_status === 'processing' || statusData?.extraction_status === 'pending') {
           interval = setTimeout(loadIntelligence, 3000)
        }
      } catch (err) {
        console.error('Intelligence fetch error', err)
      }
    }
    loadIntelligence()
    return () => clearTimeout(interval)
  }, [contractId])

  useEffect(() => {
    async function loadContract() {
      try {
        const data = await fetchAPI(`/contracts/${contractId}`)
        setContract(data)
      } catch (err) {
        console.error('Failed to load contract:', err)
      } finally {
        setLoading(false)
      }
    }
    loadContract()
  }, [contractId])

  async function handleDownload() {
    try {
      const { url } = await fetchAPI(`/contracts/download/${contractId}`)
      window.open(url, '_blank')
    } catch {
      alert('Failed to get download link')
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this contract? This action cannot be undone.')) return
    try {
      await fetchAPI(`/contracts/${contractId}`, { method: 'DELETE' })
      router.push('/contracts')
    } catch {
      alert('Failed to delete contract')
    }
  }

  async function handleStatusChange(newStatus: string) {
    setStatusUpdating(true)
    try {
      const formData = new FormData()
      formData.append('status', newStatus)
      const updated = await fetchAPI(`/contracts/${contractId}`, {
        method: 'PATCH',
        body: formData,
      })
      setContract({ ...contract, status: updated.status })
    } catch {
      alert('Failed to update status')
    } finally {
      setStatusUpdating(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-neutral-400">Loading contract details...</div>
  }

  if (!contract) {
    return <div className="p-6 text-center text-neutral-400">Contract not found</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-neutral-50 min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/contracts">
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              {contract.title}
              <Badge variant="outline" className="bg-neutral-900 border-neutral-700">{contract.contract_type}</Badge>
            </h1>
            <p className="text-neutral-400 text-sm mt-1">Uploaded {format(new Date(contract.created_at), 'MMM d, yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
          <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left Column: PDF Preview */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col overflow-hidden min-h-[600px]">
          <div className="bg-neutral-950 border-b border-neutral-800 p-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-300">Document Preview</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 text-neutral-500 text-center">
             {/* Note: Full PDF rendering usually requires a library like react-pdf. 
                 For simplicity in this phase, we provide a placeholder when we don't have a secure public URL.
                 The actual file can be downloaded. */}
             <div>
               <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
               <p className="font-medium text-neutral-300">Preview not available in browser</p>
               <p className="text-sm mt-2 max-w-md mx-auto">This document is securely stored. Please download the file to view its contents.</p>
               <Button variant="outline" className="mt-6 bg-neutral-950 border-neutral-700 text-neutral-300" onClick={handleDownload}>
                 Download {contract.file_name}
               </Button>
             </div>
          </div>
        </div>

        {/* Right Column: Metadata & Lifecycle */}
        <div className="space-y-6">
          
          {/* Lifecycle Status */}
          <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-4 h-4" /> Lifecycle Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={contract.status} onValueChange={handleStatusChange} disabled={statusUpdating}>
                <SelectTrigger className="bg-neutral-950 border-neutral-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Executed">Executed</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Metadata Tabs */}
          <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 flex-1">
            <CardContent className="p-0">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b border-neutral-800 bg-transparent p-0">
                  <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-6 py-3">Details</TabsTrigger>
                  <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-6 py-3">History</TabsTrigger>
                  <TabsTrigger value="intelligence" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-6 py-3 flex items-center gap-2"><Brain className="w-4 h-4"/> Intelligence</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-neutral-400">Counterparty</p>
                    <p className="font-medium">{contract.counterparty || 'None specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">Description</p>
                    <p className="text-sm mt-1">{contract.description || 'No description provided.'}</p>
                  </div>
                  <div className="pt-4 border-t border-neutral-800">
                    <p className="text-sm text-neutral-400 mb-2">File Information</p>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-neutral-500">Name</span> <span>{contract.file_name}</span></div>
                      <div className="flex justify-between"><span className="text-neutral-500">Size</span> <span>{(contract.file_size / 1024 / 1024).toFixed(2)} MB</span></div>
                      <div className="flex justify-between"><span className="text-neutral-500">Type</span> <span className="truncate max-w-[150px]">{contract.mime_type}</span></div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="history" className="p-6">
                  <div className="space-y-4">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {contract.contract_versions?.map((v: any) => (
                      <div key={v.id} className="flex items-start gap-3">
                        <div className="mt-0.5 p-1.5 bg-neutral-800 rounded-full">
                          <History className="w-3 h-3 text-neutral-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Version {v.version_number}</p>
                          <p className="text-xs text-neutral-500">{format(new Date(v.created_at), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="intelligence" className="p-6">
                  {(!intelStatus || intelStatus.status === 'none') && (
                    <div className="text-center py-8 text-neutral-500">
                      <Brain className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p>No intelligence analysis found.</p>
                      <Button variant="outline" className="mt-4 bg-neutral-950 border-neutral-800" onClick={async () => {
                        try {
                           await fetchAPI(`/contracts/${contractId}/analyze`, { method: 'POST' })
                           window.location.reload()
                        } catch { alert('Failed to start analysis') }
                      }}>Run Analysis</Button>
                    </div>
                  )}
                  {(intelStatus?.extraction_status === 'processing' || intelStatus?.extraction_status === 'pending') && (
                    <div className="text-center py-8 text-blue-400 flex flex-col items-center">
                      <Loader2 className="w-8 h-8 animate-spin mb-3" />
                      <p className="font-medium">AI is analyzing this contract...</p>
                      <p className="text-xs text-neutral-500 mt-1">Extracting text and identifying key clauses</p>
                    </div>
                  )}
                  {(intelStatus?.extraction_status === 'failed' || intelStatus?.extraction_status === 'requires_ocr') && (
                    <div className="text-center py-8 text-red-400">
                      <Info className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p>Analysis failed or requires OCR.</p>
                      <p className="text-xs mt-1 text-red-500/70">{intelStatus.extraction_error}</p>
                    </div>
                  )}
                  {intelStatus?.extraction_status === 'completed' && intelligence && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border-blue-500/30">
                          {intelligence.model_name || 'AI Extracted'}
                        </Badge>
                        <span className="text-xs text-neutral-500">Analyzed {format(new Date(intelligence.analyzed_at), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                          <p className="text-xs text-neutral-500 mb-1">Contract Type</p>
                          <p className="font-medium">{intelligence.contract_type || 'Unknown'}</p>
                        </div>
                        <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                          <p className="text-xs text-neutral-500 mb-1">Effective Date</p>
                          <p className="font-medium">{intelligence.effective_date || 'Not found'}</p>
                        </div>
                        <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                          <p className="text-xs text-neutral-500 mb-1">Expiration Date</p>
                          <p className="font-medium">{intelligence.expiration_date || 'Not found'}</p>
                        </div>
                        <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                          <p className="text-xs text-neutral-500 mb-1">Renewal Date</p>
                          <p className="font-medium">{intelligence.renewal_date || 'Not found'}</p>
                        </div>
                      </div>
                      
                      {intelligence.payment_terms && (
                        <div className="bg-neutral-950 p-4 rounded border border-neutral-800">
                          <p className="text-xs text-neutral-500 mb-2">Payment Terms</p>
                          <p className="text-sm">{intelligence.payment_terms}</p>
                        </div>
                      )}
                      
                      {intelligence.parties && intelligence.parties.length > 0 && (
                        <div className="border-t border-neutral-800 pt-4">
                          <p className="text-sm font-medium mb-3">Parties Identified</p>
                          <div className="space-y-2">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {intelligence.parties.map((p: any, i: number) => (
                              <div key={i} className="flex justify-between items-center bg-neutral-950 p-2 px-3 rounded border border-neutral-800">
                                <span className="font-medium text-sm">{p.name}</span>
                                {p.role && <Badge variant="secondary" className="bg-neutral-800 text-xs">{p.role}</Badge>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
