'use client'

import { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'default' | 'success' | 'error'

interface ToastState {
  message: string
  type: ToastType
  visible: boolean
}

const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'default', visible: false })
  let timer: ReturnType<typeof setTimeout>

  const show = useCallback((message: string, type: ToastType = 'default') => {
    clearTimeout(timer)
    setToast({ message, type, visible: true })
    timer = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }, [])

  const borderColor = toast.type === 'error' ? 'var(--p1)' : toast.type === 'success' ? 'var(--p3)' : 'var(--gold)'
  const textColor   = toast.type === 'error' ? 'var(--p1)' : toast.type === 'success' ? 'var(--p3)' : 'var(--gold)'

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="toast"
        style={{
          borderColor,
          color: textColor,
          opacity: toast.visible ? 1 : 0,
          transform: toast.visible ? 'translateY(0)' : 'translateY(6px)',
          pointerEvents: 'none',
        }}
      >
        {toast.message}
      </div>
    </ToastContext.Provider>
  )
}
