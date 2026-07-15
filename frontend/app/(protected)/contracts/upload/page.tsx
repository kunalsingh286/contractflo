'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Upload, X } from 'lucide-react'

export default function UploadContractPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) return alert('Please select a file to upload')
    
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.append('tags', JSON.stringify([])) // Simple empty tags for now
      
      const res = await fetchAPI('/contracts/upload', {
        method: 'POST',
        body: formData,
      })
      
      router.push(`/contracts/${res.id}`)
    } catch (error) {
      alert((error as Error).message || 'Upload failed')
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 text-neutral-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Contract</h1>
        <p className="text-neutral-400 mt-1">Add a new document to the repository</p>
      </div>

      <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            
            <div className="space-y-2">
              <Label htmlFor="file">Contract File (PDF or DOCX, max 25MB)</Label>
              <div className="border-2 border-dashed border-neutral-700 rounded-lg p-6 flex flex-col items-center justify-center bg-neutral-950/50">
                {file ? (
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-neutral-900 rounded-full">
                      <Upload className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-neutral-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-neutral-500 mb-4" />
                    <Input 
                      id="file" 
                      name="file" 
                      type="file" 
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      required 
                      className="hidden"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                    <Label htmlFor="file" className="cursor-pointer">
                      <Button type="button" variant="secondary" className="pointer-events-none">
                        Browse Files
                      </Button>
                    </Label>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required className="bg-neutral-950 border-neutral-800" placeholder="e.g. Acme Corp NDA" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract_type">Contract Type</Label>
                <Select name="contract_type" required defaultValue="NDA">
                  <SelectTrigger className="bg-neutral-950 border-neutral-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NDA">NDA</SelectItem>
                    <SelectItem value="MSA">MSA</SelectItem>
                    <SelectItem value="DPA">DPA</SelectItem>
                    <SelectItem value="Employment">Employment</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="counterparty">Counterparty</Label>
                <Input id="counterparty" name="counterparty" className="bg-neutral-950 border-neutral-800" placeholder="e.g. Acme Corp" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select name="status" required defaultValue="Draft">
                  <SelectTrigger className="bg-neutral-950 border-neutral-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Executed">Executed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" className="bg-neutral-950 border-neutral-800 min-h-[100px]" placeholder="Brief description of the contract..." />
            </div>

          </CardContent>
          <CardFooter className="flex justify-end gap-4 border-t border-neutral-800 pt-6">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={loading || !file} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Uploading...' : 'Upload Contract'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
