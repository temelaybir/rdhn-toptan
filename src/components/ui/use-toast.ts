// Mock toast hook for now - replace with real toast later

interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: ToastOptions) => {
    const emoji = variant === 'destructive' ? '❌' : 
                  variant === 'success' ? '✅' : 'ℹ️'
    
    const message = title && description ? 
      `${emoji} ${title}: ${description}` :
      `${emoji} ${title || description || 'Notification'}`
    
    // Simple alert for now - can be replaced with proper toast later
    alert(message)
  }

  return { toast }
} 