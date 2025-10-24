import { useState, useEffect } from "react"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { useNotificationStore } from "@zustand/stores/notification"
import { useAccountStore } from "@zustand/stores/account"
import { toast } from "sonner"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"

interface Props { 
  open: boolean
  onClose: () => void
}

export default function AddNotificationModal({ open, onClose }: Props) {
  const { create, loading } = useNotificationStore()
  const { fetchAll: fetchAccounts, items: accounts } = useAccountStore()
  
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined)
  const [errors, setErrors] = useState<{ title?: string; message?: string; account?: string }>({})

  useEffect(() => { 
    if (open) fetchAccounts() 
  }, [open, fetchAccounts])

  useEffect(() => {
    if (!open) {
      setTitle("")
      setMessage("")
      setSelectedAccountId(undefined)
      setErrors({})
    }
  }, [open])

  const submit = async () => {
    const e: { title?: string; message?: string; account?: string } = {}
    
    if (!title.trim()) e.title = "Tiêu đề là bắt buộc"
    if (!message.trim()) e.message = "Nội dung là bắt buộc"
    if (selectedAccountId === undefined) e.account = "Vui lòng chọn tài khoản"
    
    setErrors(e)
    if (Object.keys(e).length) return
    
    try {
      const selectedAccount = accounts.find(a => a.id === selectedAccountId)
      if (!selectedAccount) {
        toast.error("Không tìm thấy tài khoản")
        return
      }
      
      await create({ 
        title: title.trim(), 
        message: message.trim(),
        account: {
          id: selectedAccount.id,
          name: selectedAccount.name,
          mail: selectedAccount.mail,
          role: selectedAccount.role,
          active: selectedAccount.active
        }
      })
      onClose()
    } catch (error) {
      console.error("Error creating notification:", error)
    }
  }

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title="Thêm thông báo mới"
      description="Tạo thông báo mới cho người dùng."
      size="md"
    >
      <ModalForm onSubmit={(e) => { e.preventDefault(); submit() }}>
        <div>
          <Label className="mb-1 block">Tiêu đề *</Label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Nhập tiêu đề thông báo" 
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && <div className="text-red-600 text-xs mt-1">{errors.title}</div>}
        </div>
        
        <div>
          <Label className="mb-1 block">Nội dung *</Label>
          <textarea 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            placeholder="Nhập nội dung thông báo"
            className={`w-full min-h-[100px] border rounded px-3 py-2 ${errors.message ? 'border-red-500' : ''}`}
          />
          {errors.message && <div className="text-red-600 text-xs mt-1">{errors.message}</div>}
        </div>
        
        <div>
          <Label className="mb-1 block">Người nhận *</Label>
          <select 
            className={`w-full h-10 border rounded px-3 ${errors.account ? 'border-red-500' : ''}`} 
            value={selectedAccountId ?? ""} 
            onChange={(e) => setSelectedAccountId(e.target.value === "" ? undefined : Number(e.target.value))}
          >
            <option value="">Chọn người nhận</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.mail})
              </option>
            ))}
          </select>
          {errors.account && <div className="text-red-600 text-xs mt-1">{errors.account}</div>}
        </div>
      </ModalForm>
      
      <ModalActions
        onCancel={onClose}
        onConfirm={submit}
        confirmText="Tạo"
        cancelText="Hủy"
        loading={loading}
        disabled={!title.trim() || !message.trim() || selectedAccountId === undefined}
      />
    </ReusableModal>
  )
}

