'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format, isBefore, startOfDay } from 'date-fns'
import {
  ArrowLeft, Download, Trash2, FileText, Info, History,
  Brain, Loader2, ShieldAlert, ClipboardList, CheckCircle2,
  CalendarX2, MessageSquare, CheckCircle, Circle, AlertCircle,
  Clock, RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { ChatInterface } from '@/components/copilot/chat-interface'

// ─── Types ───────────────────────────────────────────────────────────────────

type PipelineStatus = 'none' | 'pending' | 'processing' | 'completed' | 'failed' | 'requires_ocr'

interface PipelineState {
  extraction: PipelineStatus
  extractionError?: string
  intelligence: 'none' | 'ready' | 'done'
  risk: PipelineStatus
  riskError?: string
  obligation: PipelineStatus
  obligationError?: string
}

// ─── Pipeline Stepper Component ───────────────────────────────────────────────

function StepIcon({ status }: { status: string }) {
  if (status === 'completed' || status === 'done' || status === 'ready') return <CheckCircle className="w-5 h-5 text-emerald-500" />
  if (status === 'processing' || status === 'pending') return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
  if (status === 'failed' || status === 'requires_ocr') return <AlertCircle className="w-5 h-5 text-red-500" />
  return <Circle className="w-5 h-5 text-neutral-600" />
}

function PipelineStepper({ pipeline, onRerun }: { pipeline: PipelineState, onRerun: () => void }) {
  const steps = [
    {
      key: 'extraction',
      label: 'Text Extraction',
      desc: 'Reading and parsing document content',
      status: pipeline.extraction,
      error: pipeline.extractionError,
    },
    {
      key: 'intelligence',
      label: 'Contract Intelligence',
      desc: 'Identifying parties, dates, and key terms',
      status: pipeline.intelligence === 'done' ? 'completed' : pipeline.intelligence === 'ready' ? 'completed' : pipeline.extraction === 'completed' ? 'processing' : 'none',
    },
    {
      key: 'risk',
      label: 'Risk Analysis',
      desc: 'Evaluating legal and business risk exposure',
      status: pipeline.risk,
      error: pipeline.riskError,
    },
    {
      key: 'obligation',
      label: 'Obligation Extraction',
      desc: 'Identifying deadlines, deliverables, and notices',
      status: pipeline.obligation,
      error: pipeline.obligationError,
    },
  ]

  const allDone = steps.every(s => s.status === 'completed')
  const anyFailed = steps.some(s => s.status === 'failed' || s.status === 'requires_ocr')

  return (
    <Card className="bg-neutral-900 border-neutral-800 rounded-xl shadow-sm">
      <CardHeader className="pb-3 border-b border-neutral-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-neutral-200 flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-400" />
            AI Analysis Pipeline
          </CardTitle>
          {allDone && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" /> All Complete
            </Badge>
          )}
          {anyFailed && (
            <Button variant="ghost" size="sm" onClick={onRerun} className="text-xs text-neutral-400 hover:text-white h-7">
              <RefreshCw className="w-3 h-3 mr-1" /> Retry Analysis
            </Button>
          )}
          {!allDone && !anyFailed && (
            <span className="text-xs text-neutral-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Auto-updating...
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-start gap-3">
              <div className="mt-0.5 flex flex-col items-center">
                <StepIcon status={step.status} />
                {i < steps.length - 1 && (
                  <div className={`w-px h-6 mt-1 ${step.status === 'completed' || step.status === 'done' ? 'bg-emerald-500/40' : 'bg-neutral-800'}`} />
                )}
              </div>
              <div className="flex-1 pb-1">
                <p className={`text-sm font-medium ${step.status === 'completed' || step.status === 'done' ? 'text-neutral-200' : step.status === 'processing' || step.status === 'pending' ? 'text-blue-300' : step.status === 'failed' || step.status === 'requires_ocr' ? 'text-red-400' : 'text-neutral-600'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">{step.desc}</p>
                {step.error && (
                  <p className="text-xs text-red-400 mt-1 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">{step.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContractDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const [pipeline, setPipeline] = useState<PipelineState>({
    extraction: 'none',
    intelligence: 'none',
    risk: 'none',
    obligation: 'none',
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [intelligence, setIntelligence] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [riskData, setRiskData] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [obligations, setObligations] = useState<any[]>([])
  const [extractedText, setExtractedText] = useState<string | null>(null)

  const isAnalysisComplete = pipeline.extraction === 'completed' &&
    pipeline.risk === 'completed' &&
    pipeline.obligation === 'completed'

  const pollPipeline = useCallback(async () => {
    try {
      // 1. Check extraction status
      const docStatus = await fetchAPI(`/contracts/${contractId}/intelligence/status`)
      const extractionStatus: PipelineStatus = docStatus?.extraction_status || 'none'

      const newPipeline: PipelineState = {
        extraction: extractionStatus,
        extractionError: docStatus?.extraction_error,
        intelligence: 'none',
        risk: 'none',
        obligation: 'none',
      }

      if (extractionStatus === 'completed') {
        newPipeline.intelligence = 'done'

        // Fetch intelligence data if not loaded
        if (!intelligence) {
          try {
            const intel = await fetchAPI(`/contracts/${contractId}/intelligence`)
            setIntelligence(intel)
          } catch { /* not yet available */ }
        }

        // Fetch extracted text if not loaded
        if (!extractedText) {
          try {
            const doc = await fetchAPI(`/contracts/${contractId}/document-text`)
            setExtractedText(doc?.extracted_text || null)
          } catch { /* not available */ }
        }

        // 2. Check risk status
        const riskStatus = await fetchAPI(`/contracts/${contractId}/risks/status`)
        const riskStat: PipelineStatus = riskStatus?.status || 'none'
        newPipeline.risk = riskStat

        if (riskStat === 'completed' && !riskData) {
          try {
            const rd = await fetchAPI(`/contracts/${contractId}/risks`)
            setRiskData(rd)
          } catch { /* not yet available */ }
        }

        // 3. Check obligation status
        const obStatus = await fetchAPI(`/contracts/${contractId}/obligations/status`)
        const obStat: PipelineStatus = obStatus?.status || 'none'
        newPipeline.obligation = obStat
        newPipeline.obligationError = obStatus?.error

        if (obStat === 'completed' && obligations.length === 0) {
          try {
            const obs = await fetchAPI(`/contracts/${contractId}/obligations`)
            setObligations(obs)
          } catch { /* not yet available */ }
        }
      }

      setPipeline(newPipeline)
      return newPipeline
    } catch (err) {
      console.error('Poll error:', err)
      return null
    }
  }, [contractId, intelligence, riskData, obligations, extractedText])

  // Polling loop — every 3s until complete
  useEffect(() => {
    let timeout: NodeJS.Timeout
    let active = true

    const poll = async () => {
      const state = await pollPipeline()
      if (!active) return

      const done = state?.extraction === 'completed' &&
        (state?.risk === 'completed' || state?.risk === 'failed') &&
        (state?.obligation === 'completed' || state?.obligation === 'failed')

      if (!done) {
        timeout = setTimeout(poll, 3000)
      }
    }

    poll()
    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [pollPipeline])

  // Load contract metadata once
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

  async function handleRerun() {
    try {
      await fetchAPI(`/contracts/${contractId}/analyze`, { method: 'POST' })
      setIntelligence(null)
      setRiskData(null)
      setObligations([])
      setExtractedText(null)
      setPipeline({ extraction: 'pending', intelligence: 'none', risk: 'none', obligation: 'none' })
    } catch {
      alert('Failed to restart analysis')
    }
  }

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
      const updated = await fetchAPI(`/contracts/${contractId}`, { method: 'PATCH', body: formData })
      setContract({ ...contract, status: updated.status })
    } catch {
      alert('Failed to update status')
    } finally {
      setStatusUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    )
  }

  if (!contract) {
    return <div className="p-8 text-center text-neutral-400">Contract not found</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-neutral-950 min-h-screen text-neutral-50">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/contracts">
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white w-8 h-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-3">
              {contract.title}
              <Badge variant="outline" className="text-xs bg-neutral-900 border-neutral-700 text-neutral-400 font-normal">
                {contract.contract_type}
              </Badge>
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Uploaded {format(new Date(contract.created_at), 'MMM d, yyyy')}
              {contract.counterparty && ` · ${contract.counterparty}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="text-neutral-400 hover:text-white" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
          <Button variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Pipeline + Lifecycle */}
        <div className="space-y-4">
          {/* Pipeline Stepper */}
          <PipelineStepper pipeline={pipeline} onRerun={handleRerun} />

          {/* Lifecycle Status */}
          <Card className="bg-neutral-900 border-neutral-800 rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-200">Lifecycle Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={contract.status} onValueChange={handleStatusChange} disabled={statusUpdating}>
                <SelectTrigger className="bg-neutral-950 border-neutral-800 text-neutral-200">
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

          {/* Contract Metadata */}
          <Card className="bg-neutral-900 border-neutral-800 rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-200">File Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'File Name', value: contract.file_name },
                { label: 'Size', value: `${(contract.file_size / 1024 / 1024).toFixed(2)} MB` },
                { label: 'Type', value: contract.mime_type },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">{label}</span>
                  <span className="text-neutral-300 truncate max-w-[160px] text-right">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Intelligence Tabs */}
        <div className="lg:col-span-2">
          <Card className="bg-neutral-900 border-neutral-800 rounded-xl shadow-sm h-full">
            <CardContent className="p-0">
              <Tabs defaultValue="intelligence" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b border-neutral-800 bg-transparent p-0 overflow-x-auto">
                  {[
                    { value: 'intelligence', icon: Brain, label: 'Intelligence' },
                    { value: 'risk', icon: ShieldAlert, label: 'Risk Analysis' },
                    { value: 'obligations', icon: ClipboardList, label: 'Obligations' },
                    { value: 'text', icon: FileText, label: 'Extracted Text' },
                    { value: 'history', icon: History, label: 'History' },
                    { value: 'copilot', icon: MessageSquare, label: 'Copilot' },
                  ].map(({ value, icon: Icon, label }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-neutral-500 data-[state=active]:text-white hover:text-neutral-300 px-5 py-3 text-sm flex items-center gap-1.5 shrink-0"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* ── Intelligence Tab ── */}
                <TabsContent value="intelligence" className="p-6">
                  {(pipeline.extraction === 'none' || pipeline.extraction === 'pending') && (
                    <EmptyState icon={Brain} message="Analysis is queued and starting..." spinner />
                  )}
                  {pipeline.extraction === 'processing' && (
                    <EmptyState icon={Brain} message="Extracting and analyzing contract text..." spinner />
                  )}
                  {(pipeline.extraction === 'failed' || pipeline.extraction === 'requires_ocr') && (
                    <ErrorState message={pipeline.extractionError || 'Text extraction failed.'} onRetry={handleRerun} />
                  )}
                  {pipeline.extraction === 'completed' && intelligence && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                          {intelligence.model_name || 'AI Extracted'}
                        </Badge>
                        <span className="text-xs text-neutral-500">
                          Analyzed {format(new Date(intelligence.analyzed_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Contract Type', value: intelligence.contract_type },
                          { label: 'Effective Date', value: intelligence.effective_date },
                          { label: 'Expiration Date', value: intelligence.expiration_date },
                          { label: 'Renewal Date', value: intelligence.renewal_date },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                            <p className="text-xs text-neutral-500 mb-1">{label}</p>
                            <p className="font-medium text-sm text-neutral-200">{value || '—'}</p>
                          </div>
                        ))}
                      </div>

                      {intelligence.payment_terms && (
                        <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                          <p className="text-xs text-neutral-500 mb-1">Payment Terms</p>
                          <p className="text-sm text-neutral-200">{intelligence.payment_terms}</p>
                        </div>
                      )}

                      {intelligence.parties?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Parties Identified</p>
                          <div className="space-y-2">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {intelligence.parties.map((p: any, i: number) => (
                              <div key={i} className="flex justify-between items-center bg-neutral-950 px-3 py-2 rounded-lg border border-neutral-800">
                                <span className="text-sm font-medium text-neutral-200">{p.name}</span>
                                {p.role && <Badge variant="secondary" className="bg-neutral-800 text-neutral-400 text-xs">{p.role}</Badge>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {pipeline.extraction === 'completed' && !intelligence && (
                    <EmptyState icon={Brain} message="Intelligence data loading..." spinner />
                  )}
                </TabsContent>

                {/* ── Risk Analysis Tab ── */}
                <TabsContent value="risk" className="p-6">
                  {pipeline.extraction !== 'completed' && (
                    <EmptyState icon={ShieldAlert} message="Waiting for text extraction to complete..." />
                  )}
                  {pipeline.extraction === 'completed' && (pipeline.risk === 'none' || pipeline.risk === 'pending' || pipeline.risk === 'processing') && (
                    <EmptyState icon={ShieldAlert} message="AI is evaluating risks..." spinner />
                  )}
                  {pipeline.risk === 'failed' && (
                    <ErrorState message={pipeline.riskError || 'Risk analysis failed.'} onRetry={handleRerun} />
                  )}
                  {pipeline.risk === 'completed' && riskData && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                        <div>
                          <p className="text-xs text-neutral-500">Overall Risk Score</p>
                          <div className="text-3xl font-bold tracking-tight mt-1">
                            <span className={
                              riskData.risk_level === 'Critical' ? 'text-red-500' :
                                riskData.risk_level === 'High' ? 'text-orange-500' :
                                  riskData.risk_level === 'Medium' ? 'text-yellow-500' :
                                    'text-emerald-500'
                            }>{riskData.risk_score}</span>
                            <span className="text-neutral-600 text-lg">/100</span>
                          </div>
                        </div>
                        <Badge variant="outline" className={
                          riskData.risk_level === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                            riskData.risk_level === 'High' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' :
                              riskData.risk_level === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                                'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                        }>
                          {riskData.risk_level} Risk
                        </Badge>
                      </div>

                      {['high', 'medium', 'low'].map(severity => {
                        const findings = riskData.findings?.[severity]
                        if (!findings?.length) return null
                        return (
                          <div key={severity} className="space-y-3">
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                              {severity} Risks ({findings.length})
                            </p>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {findings.map((f: any, i: number) => (
                              <div key={i} className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="bg-neutral-800 text-neutral-400 text-xs">{f.category}</Badge>
                                  <span className="font-semibold text-sm text-neutral-200">{f.title}</span>
                                </div>
                                <p className="text-sm text-neutral-400">{f.explanation}</p>
                                <div className="bg-neutral-900 px-3 py-2 rounded border-l-2 border-l-blue-500 text-sm text-neutral-400 italic">
                                  &quot;{f.evidence}&quot;
                                </div>
                                <div>
                                  <p className="text-xs text-neutral-500 font-medium">Recommendation</p>
                                  <p className="text-sm text-blue-400">{f.recommendation}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })}

                      {riskData.missing_clauses?.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Missing Protections</p>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {riskData.missing_clauses.map((mc: any, i: number) => (
                            <div key={i} className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex justify-between items-start gap-4">
                              <div>
                                <p className="font-medium text-sm text-neutral-200">{mc.category}</p>
                                <p className="text-sm text-neutral-400 mt-1">{mc.explanation}</p>
                              </div>
                              <Badge variant="outline" className={mc.importance === 'high' ? 'text-orange-500 border-orange-500/30 bg-orange-500/10' : 'text-neutral-400 border-neutral-700 bg-neutral-800'}>
                                {mc.importance} impact
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* ── Obligations Tab ── */}
                <TabsContent value="obligations" className="p-6">
                  {pipeline.extraction !== 'completed' && (
                    <EmptyState icon={ClipboardList} message="Waiting for text extraction to complete..." />
                  )}
                  {pipeline.extraction === 'completed' && (pipeline.obligation === 'none' || pipeline.obligation === 'pending' || pipeline.obligation === 'processing') && (
                    <EmptyState icon={ClipboardList} message="AI is extracting obligations..." spinner />
                  )}
                  {pipeline.obligation === 'failed' && (
                    <ErrorState message={pipeline.obligationError || 'Obligation extraction failed.'} onRetry={handleRerun} />
                  )}
                  {pipeline.obligation === 'completed' && (
                    obligations.length === 0 ? (
                      <EmptyState icon={ClipboardList} message="No explicit obligations were found." />
                    ) : (
                      <div className="space-y-4">
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{obligations.length} obligations extracted</p>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {obligations.map((ob: any) => {
                          const isOverdue = ob.status === 'open' && ob.due_date_type === 'exact' && ob.due_date
                            ? isBefore(startOfDay(new Date(ob.due_date)), startOfDay(new Date()))
                            : false

                          return (
                            <div key={ob.id} className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="bg-neutral-800 text-neutral-400 text-xs capitalize">{ob.type}</Badge>
                                    <span className="font-semibold text-sm text-neutral-200">{ob.title}</span>
                                  </div>
                                  <p className="text-sm text-neutral-400">{ob.description}</p>
                                </div>
                                <div className="shrink-0">
                                  {ob.status === 'completed' ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1 text-xs"><CheckCircle2 className="w-3 h-3" /> Done</Badge>
                                  ) : isOverdue ? (
                                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20 flex items-center gap-1 text-xs"><CalendarX2 className="w-3 h-3" /> Overdue</Badge>
                                  ) : (
                                    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">Open</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-neutral-500 block text-xs mb-0.5">Responsible Party</span>
                                  <span className="font-medium text-neutral-300">{ob.responsible_party || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-neutral-500 block text-xs mb-0.5">Due Date</span>
                                  <span className={`font-medium ${isOverdue ? 'text-red-400' : 'text-neutral-300'}`}>
                                    {ob.due_date_type === 'exact' && ob.due_date
                                      ? format(new Date(ob.due_date), 'MMM d, yyyy')
                                      : ob.due_date_type === 'recurring'
                                        ? `Recurring: ${ob.due_date_expression || ob.recurrence}`
                                        : ob.due_date_expression || 'No specific deadline'}
                                  </span>
                                </div>
                              </div>
                              {ob.evidence && (
                                <div className="bg-neutral-900 px-3 py-2 rounded border-l-2 border-l-blue-500 text-sm text-neutral-400 italic">
                                  &quot;{ob.evidence}&quot;
                                </div>
                              )}
                              {ob.status === 'open' && (
                                <div className="flex justify-end">
                                  <Button variant="ghost" size="sm" className="text-xs text-neutral-400 hover:text-emerald-400 h-7" onClick={async () => {
                                    try {
                                      await fetchAPI(`/obligations/${ob.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) })
                                      setObligations(prev => prev.map(o => o.id === ob.id ? { ...o, status: 'completed' } : o))
                                    } catch { alert('Failed to update') }
                                  }}>
                                    Mark Completed
                                  </Button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  )}
                </TabsContent>

                {/* ── Extracted Text Tab ── */}
                <TabsContent value="text" className="p-6">
                  {pipeline.extraction !== 'completed' && (
                    <EmptyState icon={FileText} message={
                      pipeline.extraction === 'processing' || pipeline.extraction === 'pending'
                        ? 'Extracting text from document...'
                        : 'Text extraction has not started yet.'
                    } spinner={pipeline.extraction === 'processing' || pipeline.extraction === 'pending'} />
                  )}
                  {pipeline.extraction === 'completed' && !extractedText && (
                    <EmptyState icon={FileText} message="Loading extracted text..." spinner />
                  )}
                  {pipeline.extraction === 'completed' && extractedText && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Raw Extracted Text</p>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                          {extractedText.split(/\s+/).length.toLocaleString()} words
                        </Badge>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                        <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed">
                          {extractedText}
                        </pre>
                      </div>
                    </div>
                  )}
                  {(pipeline.extraction === 'failed' || pipeline.extraction === 'requires_ocr') && (
                    <ErrorState message={pipeline.extractionError || 'Text extraction failed.'} onRetry={handleRerun} />
                  )}
                </TabsContent>

                {/* ── History Tab ── */}
                <TabsContent value="history" className="p-6">
                  <div className="space-y-4">
                    {contract.contract_versions?.length > 0 ? (
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      contract.contract_versions.map((v: any) => (
                        <div key={v.id} className="flex items-start gap-3">
                          <div className="mt-0.5 p-1.5 bg-neutral-800 rounded-full">
                            <History className="w-3 h-3 text-neutral-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-200">Version {v.version_number}</p>
                            <p className="text-xs text-neutral-500">{format(new Date(v.created_at), 'MMM d, yyyy h:mm a')}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState icon={History} message="No version history available." />
                    )}
                  </div>
                </TabsContent>

                {/* ── Copilot Tab ── */}
                <TabsContent value="copilot" className="p-0 border-t border-neutral-800">
                  {!isAnalysisComplete ? (
                    <div className="p-6">
                      <EmptyState icon={MessageSquare} message="Copilot will be available once analysis is complete." />
                    </div>
                  ) : (
                    <ChatInterface contractId={contractId} />
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

// ─── Helper Components ────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, message, spinner }: { icon: React.ElementType, message: string, spinner?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative mb-4">
        {spinner && <Loader2 className="absolute -top-1 -left-1 w-7 h-7 text-blue-500/30 animate-spin" />}
        <Icon className="w-8 h-8 text-neutral-700" />
      </div>
      <p className="text-sm text-neutral-500 max-w-xs">{message}</p>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string, onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
      <p className="text-sm text-red-400 max-w-xs mb-4">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="border-neutral-800 text-neutral-400 hover:text-white bg-transparent">
        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Analysis
      </Button>
    </div>
  )
}
