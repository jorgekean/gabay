import * as React from "react"
import { cn } from "../../lib/utils"
import { X } from "lucide-react"

interface SlideoutProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Slideout({ isOpen, onClose, title, description, children, className }: SlideoutProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Slideout Content */}
      <div 
        className={cn(
          "z-50 flex flex-col w-full max-w-md h-full bg-background shadow-xl animate-in slide-in-from-right duration-300 sm:border-l",
          className
        )}
      >
        {/* Header - Fixed */}
        <div className="flex flex-col space-y-1.5 p-6 border-b shrink-0">
          <div className="flex items-center justify-between">
            {title && <h2 className="text-xl font-semibold leading-none tracking-tight">{title}</h2>}
            <button 
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        
        {/* Body - Handled by children (overflow-hidden here allows child to control scrolling) */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </div>
  )
}
