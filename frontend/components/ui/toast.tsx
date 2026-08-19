'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, title, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    error: <AlertCircle className="w-4 h-4 text-red-400" />,
    info: <Info className="w-4 h-4 text-blue-400" />,
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-300"
          >
            <div className="mt-0.5 shrink-0">{icons[t.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-100">{t.title}</p>
              {t.message && <p className="text-xs text-neutral-400 mt-0.5">{t.message}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="shrink-0 text-neutral-500 hover:text-neutral-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
