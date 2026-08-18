'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format, isBefore, startOfDay } from 'date-fns'
import { ArrowLeft, Download, Trash2, FileText, Info, History, Brain, Loader2, ShieldAlert, ClipboardList, CheckCircle2, CalendarX2, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { ChatInterface } from '@/components/copilot/chat-interface'

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [riskStatus, setRiskStatus] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [riskData, setRiskData] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [obStatus, setObStatus] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [obligations, setObligations] = useState<any[]>([])

  useEffect(() => {
    let intelInterval: NodeJS.Timeout
    let riskInterval: NodeJS.Timeout
    let obInterval: NodeJS.Timeout

    async function loadObligations(autoStart = false) {
       try {
         const oStatus = await fetchAPI(`/contracts/${contractId}/obligations/status`)
         setObStatus(oStatus)
         if (oStatus?.status === 'completed') {
            const oData = await fetchAPI(`/contracts/${contractId}/obligations`)
            setObligations(oData)
         } else if (oStatus?.status === 'processing' || oStatus?.status === 'pending') {
            obInterval = setTimeout(() => loadObligations(), 3000)
         } else if (autoStart && (!oStatus || oStatus.status === 'none')) {
            await fetchAPI(`/contracts/${contractId}/obligation-analysis`, { method: 'POST' })
            obInterval = setTimeout(() => loadObligations(), 3000)
         }
       } catch (err) {
         console.error('Obligation fetch error', err)
       }
    }
    
    async function loadRisk(autoStart = false) {
       try {
         const rStatus = await fetchAPI(`/contracts/${contractId}/risks/status`)
         setRiskStatus(rStatus)
         if (rStatus?.status === 'completed') {
            const rData = await fetchAPI(`/contracts/${contractId}/risks`)
            setRiskData(rData)
         } else if (rStatus?.status === 'processing' || rStatus?.status === 'pending') {
            riskInterval = setTimeout(() => loadRisk(), 3000)
         } else if (autoStart && (!rStatus || rStatus.status === 'none')) {
            await fetchAPI(`/contracts/${contractId}/risk-analysis`, { method: 'POST' })
            riskInterval = setTimeout(() => loadRisk(), 3000)
         }
       } catch (err) {
         console.error('Risk fetch error', err)
       }
    }

    async function loadIntelligence() {
      try {
        const statusData = await fetchAPI(`/contracts/${contractId}/intelligence/status`)
        setIntelStatus(statusData)
        if (statusData?.extraction_status === 'completed') {
           const intelData = await fetchAPI(`/contracts/${contractId}/intelligence`)
           setIntelligence(intelData)
           loadRisk(true)
           loadObligations(true)
        } else if (statusData?.extraction_status === 'processing' || statusData?.extraction_status === 'pending') {
           intelInterval = setTimeout(loadIntelligence, 3000)
        }
      } catch (err) {
        console.error('Intelligence fetch error', err)
      }
    }
    loadIntelligence()
    return () => {
      clearTimeout(intelInterval)
      clearTimeout(riskInterval)
      clearTimeout(obInterval)
    }
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
                  <TabsTrigger value="risk" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-6 py-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Risk Analysis</TabsTrigger>
                  <TabsTrigger value="obligations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-6 py-3 flex items-center gap-2"><ClipboardList className="w-4 h-4"/> Obligations</TabsTrigger>
                  <TabsTrigger value="copilot" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-6 py-3 flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Copilot</TabsTrigger>
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

                <TabsContent value="risk" className="p-6">
                  {(!riskStatus || riskStatus.status === 'none') && (
                    <div className="text-center py-8 text-neutral-500">
                      <ShieldAlert className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p>No risk analysis found.</p>
                      <Button variant="outline" className="mt-4 bg-neutral-950 border-neutral-800" onClick={async () => {
                        try {
                           await fetchAPI(`/contracts/${contractId}/risk-analysis`, { method: 'POST' })
                           window.location.reload()
                        } catch { alert('Failed to start risk analysis') }
                      }}>Run Risk Analysis</Button>
                    </div>
                  )}
                  {(riskStatus?.status === 'processing' || riskStatus?.status === 'pending') && (
                    <div className="text-center py-8 text-blue-400 flex flex-col items-center">
                      <Loader2 className="w-8 h-8 animate-spin mb-3" />
                      <p className="font-medium">AI is analyzing risks...</p>
                      <p className="text-xs text-neutral-500 mt-1">Evaluating legal and business implications</p>
                    </div>
                  )}
                  {(riskStatus?.status === 'failed') && (
                    <div className="text-center py-8 text-red-400">
                      <Info className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p>Risk Analysis failed.</p>
                      <p className="text-xs mt-1 text-red-500/70">{riskStatus.error}</p>
                    </div>
                  )}
                  {riskStatus?.status === 'completed' && riskData && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                          {riskData.model_name || 'AI Evaluated'}
                        </Badge>
                        <span className="text-xs text-neutral-500">Analyzed {format(new Date(riskData.analyzed_at), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      
                      <div className="bg-neutral-950 p-4 rounded border border-neutral-800 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-neutral-400">Overall Risk Score</p>
                          <div className="text-3xl font-bold mt-1">
                             <span className={
                               riskData.risk_level === 'Critical' ? 'text-red-500' :
                               riskData.risk_level === 'High' ? 'text-orange-500' :
                               riskData.risk_level === 'Medium' ? 'text-yellow-500' :
                               'text-green-500'
                             }>{riskData.risk_score}</span>
                             <span className="text-neutral-600 text-lg">/100</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-neutral-400 mb-1">Risk Level</p>
                          <Badge variant="outline" className={
                               riskData.risk_level === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                               riskData.risk_level === 'High' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                               riskData.risk_level === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                               'bg-green-500/10 text-green-500 border-green-500/20'
                          }>
                            {riskData.risk_level}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Render Findings */}
                      {['high', 'medium', 'low'].map(severity => {
                        const findings = riskData.findings?.[severity]
                        if (!findings || findings.length === 0) return null
                        
                        return (
                          <div key={severity} className="space-y-3">
                            <h3 className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                              {severity === 'high' ? <ShieldAlert className="w-4 h-4 text-orange-500"/> : null}
                              {severity === 'medium' ? <ShieldAlert className="w-4 h-4 text-yellow-500"/> : null}
                              {severity === 'low' ? <Info className="w-4 h-4 text-green-500"/> : null}
                              {severity} Risks ({findings.length})
                            </h3>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {findings.map((finding: any, i: number) => (
                              <div key={i} className="bg-neutral-950 p-4 rounded border border-neutral-800 space-y-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="bg-neutral-800 text-xs">{finding.category}</Badge>
                                    <span className="font-semibold">{finding.title}</span>
                                  </div>
                                  <p className="text-sm text-neutral-300">{finding.explanation}</p>
                                </div>
                                <div className="bg-neutral-900 p-3 rounded text-sm text-neutral-400 border border-neutral-800 border-l-2 border-l-blue-500 italic">
                                  &quot;{finding.evidence}&quot;
                                </div>
                                <div>
                                  <p className="text-xs text-neutral-500 font-medium">Recommendation</p>
                                  <p className="text-sm text-blue-400">{finding.recommendation}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                      
                      {riskData.missing_clauses && riskData.missing_clauses.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-neutral-800">
                           <h3 className="text-sm font-medium uppercase tracking-wider">Missing Protections</h3>
                           {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                           {riskData.missing_clauses.map((mc: any, i: number) => (
                              <div key={i} className="bg-neutral-950 p-3 rounded border border-neutral-800 flex justify-between items-start gap-4">
                                <div>
                                  <p className="font-medium text-sm">{mc.category}</p>
                                  <p className="text-sm text-neutral-400 mt-1">{mc.explanation}</p>
                                </div>
                                <Badge variant="outline" className={
                                  mc.importance === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-neutral-800 text-neutral-400'
                                }>
                                  {mc.importance} impact
                                </Badge>
                              </div>
                           ))}
                        </div>
                      )}
                      
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="obligations" className="p-6">
                  {(!obStatus || obStatus.status === 'none') && (
                    <div className="text-center py-8 text-neutral-500">
                      <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p>No obligation analysis found.</p>
                      <Button variant="outline" className="mt-4 bg-neutral-950 border-neutral-800" onClick={async () => {
                        try {
                           await fetchAPI(`/contracts/${contractId}/obligation-analysis`, { method: 'POST' })
                           window.location.reload()
                        } catch { alert('Failed to start obligation analysis') }
                      }}>Run Obligation Analysis</Button>
                    </div>
                  )}
                  {(obStatus?.status === 'processing' || obStatus?.status === 'pending') && (
                    <div className="text-center py-8 text-blue-400 flex flex-col items-center">
                      <Loader2 className="w-8 h-8 animate-spin mb-3" />
                      <p className="font-medium">AI is extracting obligations...</p>
                      <p className="text-xs text-neutral-500 mt-1">Identifying deliverables, payments, and notices</p>
                    </div>
                  )}
                  {(obStatus?.status === 'failed') && (
                    <div className="text-center py-8 text-red-400">
                      <Info className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p>Obligation Extraction failed.</p>
                      <p className="text-xs mt-1 text-red-500/70">{obStatus.error}</p>
                    </div>
                  )}
                  {obStatus?.status === 'completed' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                          {obligations.length} Obligations Extracted
                        </Badge>
                      </div>
                      
                      {obligations.length === 0 ? (
                        <div className="bg-neutral-950 p-6 rounded border border-neutral-800 text-center text-neutral-400">
                           No explicit obligations were found in this contract.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {obligations.map((ob: any) => {
                             let isOverdue = false
                             if (ob.status === 'open' && ob.due_date_type === 'exact' && ob.due_date) {
                                isOverdue = isBefore(startOfDay(new Date(ob.due_date)), startOfDay(new Date()))
                             }
                             
                             return (
                               <div key={ob.id} className="bg-neutral-950 p-4 rounded border border-neutral-800 space-y-4">
                                 <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="secondary" className="bg-neutral-800 text-xs capitalize">{ob.type}</Badge>
                                        <span className="font-semibold text-lg">{ob.title}</span>
                                      </div>
                                      <p className="text-sm text-neutral-300 mt-2">{ob.description}</p>
                                    </div>
                                    <div className="text-right">
                                       {ob.status === 'completed' ? (
                                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Completed</Badge>
                                       ) : isOverdue ? (
                                          <Badge className="bg-red-500/10 text-red-500 border-red-500/20 flex items-center gap-1"><CalendarX2 className="w-3 h-3"/> Overdue</Badge>
                                       ) : (
                                          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Open</Badge>
                                       )}
                                    </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-4 text-sm bg-neutral-900/50 p-3 rounded">
                                    <div>
                                       <span className="text-neutral-500 block mb-1">Responsible Party</span>
                                       <span className="font-medium">{ob.responsible_party || '-'}</span>
                                    </div>
                                    <div>
                                       <span className="text-neutral-500 block mb-1">Due Date</span>
                                       <span className={`font-medium ${isOverdue ? 'text-red-400' : ''}`}>
                                          {ob.due_date_type === 'exact' && ob.due_date ? format(new Date(ob.due_date), 'MMM d, yyyy') : 
                                           ob.due_date_type === 'not_specified' ? 'No specific deadline' : 
                                           ob.due_date_type === 'recurring' ? `Recurring: ${ob.due_date_expression || ob.recurrence}` :
                                           ob.due_date_expression || 'See details'}
                                       </span>
                                    </div>
                                 </div>
                                 
                                 <div className="bg-neutral-900 p-3 rounded text-sm text-neutral-400 border border-neutral-800 border-l-2 border-l-blue-500 italic">
                                   &quot;{ob.evidence}&quot;
                                   {ob.source_clause && <span className="block mt-2 text-xs text-neutral-500 not-italic font-medium">Source: {ob.source_clause}</span>}
                                 </div>
                                 
                                 {ob.status === 'open' && (
                                   <div className="pt-2 flex justify-end">
                                      <Button variant="outline" size="sm" className="bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-green-400 hover:border-green-400/50" onClick={async () => {
                                         try {
                                            await fetchAPI(`/obligations/${ob.id}`, {
                                               method: 'PATCH',
                                               body: JSON.stringify({ status: 'completed' })
                                            })
                                            window.location.reload()
                                         } catch (err) {
                                            console.error(err)
                                            alert('Failed to update status')
                                         }
                                      }}>
                                         Mark Completed
                                      </Button>
                                   </div>
                                 )}
                               </div>
                             )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="copilot" className="p-0 border-t border-neutral-800">
                   <ChatInterface contractId={contractId} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
