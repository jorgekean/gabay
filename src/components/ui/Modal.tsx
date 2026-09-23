import * as React from "react"
import { cn } from "../../lib/utils"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className={cn(
          "z-50 grid w-full max-w-lg gap-4 bg-background p-6 shadow-lg sm:rounded-lg animate-in fade-in-90 zoom-in-95 duration-200",
          "h-full sm:h-auto overflow-y-auto",
          className
        )}
      >
        <div className="flex flex-col space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            {title && <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>}
            <button 
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        
        <div className="flex-1 mt-2">
          {children}
        </div>
      </div>
    </div>
  )
}
