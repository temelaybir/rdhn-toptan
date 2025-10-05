import { useState } from 'react'

interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastState {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const toast = ({ title, description, variant = 'default' }: ToastProps) => {
    const id = (++toastCount).toString()
    const newToast = { id, title, description, variant }
    
    setToasts((prev) => [...prev, newToast])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
    
    return { id }
  }

  const dismiss = (toastId?: string) => {
    setToasts((prev) => 
      toastId ? prev.filter((t) => t.id !== toastId) : []
    )
  }

  return {
    toast,
    dismiss,
    toasts
  }
}
