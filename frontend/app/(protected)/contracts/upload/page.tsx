'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, X, FileText, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

export default function UploadContractPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [contractType, setContractType] = useState('NDA')
  const [status, setStatus] = useState('Review')
  const [dragOver, setDragOver] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) { toast('error', 'No file selected', 'Please choose a PDF or DOCX file.'); return }
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.append('tags', JSON.stringify([]))
      formData.set('contract_type', contractType)
      formData.set('status', status)
      formData.set('file', file)

      const res = await fetchAPI('/contracts/upload', { method: 'POST', body: formData })

      // Auto-trigger analysis silently
      try {
        await fetchAPI(`/contracts/${res.id}/analyze`, { method: 'POST' })
      } catch (analyzeErr) {
        console.error('Failed to start analysis automatically:', analyzeErr)
      }

      toast('success', 'Contract uploaded!', 'AI analysis has started — results will appear shortly.')
      router.push(`/contracts/${res.id}`)
    } catch (error) {
      toast('error', 'Upload failed', (error as Error).message || 'Please try again.')
      setLoading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-neutral-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 border-b border-neutral-800 pb-6">
          <Link href="/contracts">
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white w-8 h-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Upload Contract</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Add a document to your repository for AI analysis</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Drop Zone */}
          <div>
            <Label className="text-sm font-medium text-neutral-300 mb-2 block">Document File</Label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragOver
                  ? 'border-blue-500 bg-blue-500/5'
                  : file
                    ? 'border-emerald-600/40 bg-emerald-500/5'
                    : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
              }`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-neutral-200">{file.name}</p>
                    <p className="text-sm text-neutral-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-4 text-neutral-500 hover:text-red-400 w-7 h-7"
                    onClick={() => setFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-neutral-400" />
                  </div>
                  <p className="text-sm font-medium text-neutral-300 mb-1">
                    Drag and drop your file here, or{' '}
                    <label htmlFor="file" className="text-blue-400 hover:text-blue-300 cursor-pointer underline underline-offset-2">
                      browse
                    </label>
                  </p>
                  <p className="text-xs text-neutral-500">PDF or DOCX, up to 25MB</p>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium text-neutral-300">Title <span className="text-red-500">*</span></Label>
              <Input id="title" name="title" required className="bg-neutral-900 border-neutral-800 text-neutral-100 placeholder:text-neutral-600" placeholder="e.g. Acme Corp NDA 2024" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-300">Contract Type <span className="text-red-500">*</span></Label>
              <Select name="contract_type" value={contractType} onValueChange={setContractType}>
                <SelectTrigger className="bg-neutral-900 border-neutral-800 text-neutral-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['NDA', 'MSA', 'DPA', 'SLA', 'Employment', 'Vendor', 'Partnership', 'Other'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="counterparty" className="text-sm font-medium text-neutral-300">Counterparty</Label>
              <Input id="counterparty" name="counterparty" className="bg-neutral-900 border-neutral-800 text-neutral-100 placeholder:text-neutral-600" placeholder="e.g. Acme Corp" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-300">Initial Status</Label>
              <Select name="status" value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-neutral-900 border-neutral-800 text-neutral-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Draft', 'Review', 'Approved', 'Executed'].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium text-neutral-300">Description</Label>
            <Textarea id="description" name="description" className="bg-neutral-900 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 min-h-[80px] resize-none" placeholder="Brief description of this contract..." />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="text-neutral-400 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !file} className="bg-blue-600 hover:bg-blue-500 text-white min-w-[140px]">
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Upload Contract</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
