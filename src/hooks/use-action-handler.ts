import { useState } from 'react'
import { toast } from 'sonner'
import type { ActionResponse } from '@/types/admin/product'
import { useCallback } from 'react'

interface ActionHandlerOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  successMessage?: string
  showSuccessToast?: boolean
  showErrorToast?: boolean
}

export function useActionHandler<T>(options: ActionHandlerOptions<T> = {}) {
  const [loading, setLoading] = useState(false)
  
  const {
    onSuccess,
    onError,
    successMessage,
    showSuccessToast = true,
    showErrorToast = true
  } = options
  
  const execute = async (promise: Promise<ActionResponse<T>>): Promise<ActionResponse<T>> => {
    try {
      setLoading(true)
      const result = await promise
      
      if (result.success) {
        const message = successMessage || result.message || 'İşlem başarılı'
        if (showSuccessToast) {
          toast.success(message)
        }
        if (result.data) {
          onSuccess?.(result.data)
        } else {
          onSuccess?.(undefined as any) // void return type için
        }
      } else {
        const errorMessage = result.error || 'İşlem başarısız oldu'
        if (showErrorToast) {
          toast.error(errorMessage)
        }
        onError?.(errorMessage)
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata oluştu'
      if (showErrorToast) {
        toast.error(errorMessage)
      }
      onError?.(errorMessage)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }
  
  return { execute, loading }
}

// Specific hooks for common operations
export function useProductActions() {
  const createHandler = useActionHandler({
    successMessage: 'Ürün başarıyla oluşturuldu'
  })
  
  const updateHandler = useActionHandler({
    successMessage: 'Ürün başarıyla güncellendi'
  })
  
  const deleteHandler = useActionHandler({
    successMessage: 'Ürün başarıyla silindi'
  })
  
  return {
    create: createHandler,
    update: updateHandler,
    delete: deleteHandler
  }
} 

export function useSimpleActionHandler() {
  const handleAction = useCallback((action: () => void | Promise<void>) => {
    return async () => {
      try {
        await action()
      } catch (error) {
        console.error('Action failed:', error)
      }
    }
  }, [])

  return { handleAction }
}

// Touch Optimization Hook
export function useTouchOptimization() {
  const optimizeTouch = useCallback((element: HTMLElement) => {
    if (!element) return
    
    // Apply aggressive touch optimization
    element.style.webkitTapHighlightColor = 'transparent'
    element.style.webkitTouchCallout = 'none' 
    element.style.webkitUserSelect = 'none'
    element.style.userSelect = 'none'
    element.style.touchAction = 'manipulation'
    
    // Add data attribute for CSS targeting
    element.setAttribute('data-touch-optimized', 'true')
    
    // Force hardware acceleration
    element.style.transform = 'translateZ(0)'
    element.style.willChange = 'transform'
    
    return element
  }, [])

  const createTouchHandler = useCallback((onClick: () => void) => {
    return {
      onTouchStart: (e: React.TouchEvent) => {
        e.stopPropagation()
      },
      onTouchEnd: (e: React.TouchEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        // Immediate execution - no 300ms delay
        setTimeout(() => {
          onClick()
        }, 0)
      },
      onClick: (e: React.MouseEvent) => {
        // Prevent double execution on non-touch devices
        if ('ontouchstart' in window) {
          e.preventDefault()
          return
        }
        onClick()
      }
    }
  }, [])

  return { optimizeTouch, createTouchHandler }
} 