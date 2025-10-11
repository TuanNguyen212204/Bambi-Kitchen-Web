import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ReusableModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
  className?: string
  contentClassName?: string
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md", 
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl"
}

export default function ReusableModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
  contentClassName
}: ReusableModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          sizeClasses[size],
          contentClassName
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className={cn("space-y-4", className)}>
          {children}
        </div>
        
        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Helper components for common modal patterns
export interface ModalFormProps {
  children: React.ReactNode
  onSubmit?: (e: React.FormEvent) => void
  className?: string
}

export function ModalForm({ children, onSubmit, className }: ModalFormProps) {
  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)}>
      {children}
    </form>
  )
}

export interface ModalActionsProps {
  onCancel: () => void
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  loading?: boolean
  disabled?: boolean
}

export function ModalActions({
  onCancel,
  onConfirm,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  confirmVariant = "default",
  loading = false,
  disabled = false
}: ModalActionsProps) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button 
        type="button"
        variant="outline" 
        onClick={onCancel}
        disabled={loading}
      >
        {cancelText}
      </Button>
      {onConfirm && (
        <Button 
          type="button"
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={disabled || loading}
        >
          {loading ? "Đang xử lý..." : confirmText}
        </Button>
      )}
    </div>
  )
}

// Confirmation Modal Pattern
export interface ConfirmationModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  loading?: boolean
}

export function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "default",
  loading = false
}: ConfirmationModalProps) {
  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={onConfirm}
          confirmText={confirmText}
          cancelText={cancelText}
          confirmVariant={variant === "destructive" ? "destructive" : "default"}
          loading={loading}
        />
      }
    >
      <p className="text-gray-700">{description}</p>
    </ReusableModal>
  )
}
