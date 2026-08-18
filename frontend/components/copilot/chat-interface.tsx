'use client'

import { useState, useEffect, useRef } from 'react'
import { fetchAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, User, Send, FileText, Loader2, MessageSquarePlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Citation {
  chunk_id: string
  page_number: number | null
  section_title: string | null
  excerpt: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
}

interface ChatInterfaceProps {
  contractId: string
}

export function ChatInterface({ contractId }: ChatInterfaceProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickActions = [
    "Summarize this contract",
    "What are the biggest risks?",
    "When does it expire?",
    "What are our obligations?",
    "What are the termination conditions?"
  ]

  // Fetch or create session
  useEffect(() => {
    async function initChat() {
      try {
        const sessions = await fetchAPI(`/contracts/${contractId}/chat/sessions`)
        if (sessions && sessions.length > 0) {
          const sid = sessions[0].id
          setSessionId(sid)
          const msgs = await fetchAPI(`/chat/sessions/${sid}/messages`)
          setMessages(msgs || [])
        } else {
          const newSession = await fetchAPI(`/contracts/${contractId}/chat/sessions`, {
            method: 'POST',
            body: JSON.stringify({ title: 'New Chat' })
          })
          setSessionId(newSession.id)
        }
      } catch (err) {
        console.error('Failed to init chat', err)
      } finally {
        setInitLoading(false)
      }
    }
    initChat()
  }, [contractId])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(text: string) {
    if (!text.trim() || !sessionId || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setLoading(true)

    try {
      const response = await fetchAPI(`/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: text })
      })
      setMessages(prev => [...prev, response])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: 'Failed to send message. Please try again.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  async function handleNewChat() {
    setInitLoading(true)
    try {
      const newSession = await fetchAPI(`/contracts/${contractId}/chat/sessions`, {
        method: 'POST',
        body: JSON.stringify({ title: 'New Chat' })
      })
      setSessionId(newSession.id)
      setMessages([])
    } catch (err) {
      console.error(err)
    } finally {
      setInitLoading(false)
    }
  }

  if (initLoading) {
    return (
      <div className="flex justify-center items-center h-[500px] text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Bot className="w-5 h-5 text-blue-500" />
          Contract Copilot
        </div>
        <Button variant="ghost" size="sm" onClick={handleNewChat} className="text-neutral-400 hover:text-white">
          <MessageSquarePlus className="w-4 h-4 mr-2" /> New Chat
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-12">
            <div className="bg-blue-500/10 p-4 rounded-full">
               <Bot className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-lg">How can I help with this contract?</p>
              <p className="text-sm text-neutral-500 mt-1">Ask any question or try a suggestion below.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg mt-4">
              {quickActions.map(action => (
                <Badge 
                  key={action} 
                  variant="outline" 
                  className="cursor-pointer bg-neutral-900 border-neutral-700 hover:bg-neutral-800 py-1.5 px-3"
                  onClick={() => handleSend(action)}
                >
                  {action}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-neutral-800 border border-neutral-700'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-blue-400" />}
                </div>
                
                <div className="space-y-2 flex-1">
                  <div className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-600/20 text-blue-50 border border-blue-500/30' : 'bg-neutral-900 text-neutral-200 border border-neutral-800'}`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  
                  {/* Citations */}
                  {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.citations.map((cit, idx) => (
                        <div key={idx} className="bg-neutral-950 border border-neutral-800 rounded p-2 text-xs flex-1 min-w-[200px] max-w-full">
                          <div className="flex items-center gap-1 text-neutral-400 font-medium mb-1">
                            <FileText className="w-3 h-3" />
                            {cit.section_title || 'Contract Text'} {cit.page_number ? `(Pg ${cit.page_number})` : ''}
                          </div>
                          <p className="text-neutral-500 italic line-clamp-3">&quot;{cit.excerpt}&quot;</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-neutral-800 border border-neutral-700">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div className="p-3 rounded-lg text-sm bg-neutral-900 text-neutral-400 border border-neutral-800 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing contract...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-900/50">
        <form 
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            handleSend(inputValue)
          }}
        >
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about this contract..."
            className="flex-1 bg-neutral-950 border-neutral-800 focus-visible:ring-blue-500"
            disabled={loading}
          />
          <Button type="submit" disabled={!inputValue.trim() || loading} className="bg-blue-600 hover:bg-blue-700">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
