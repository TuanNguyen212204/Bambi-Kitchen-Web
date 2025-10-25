import { useEffect, useRef, useState } from "react"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { useNotificationStore } from "@zustand/stores/notification"
import { useAccountStore } from "@zustand/stores/account"
import { toast } from "sonner"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"

interface Props { 
  open: boolean
  onClose: () => void
  notification: { 
    id: number
    title: string
    message: string
    read: boolean
    account?: {
      id: number
      name: string
      mail: string
      role: string
    }
  } 
}

export default function EditNotificationModal({ open, onClose, notification }: Props) {
  const { update, loading } = useNotificationStore()
  const { fetchAll: fetchAccounts, items: accounts } = useAccountStore()
  
  const [title, setTitle] = useState(notification?.title ?? "")
  const [message, setMessage] = useState(notification?.message ?? "")
  const [read, setRead] = useState(notification?.read ?? false)
  const [sendToAll, setSendToAll] = useState(!notification?.account)
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(notification?.account?.id)
  const [errors, setErrors] = useState<{ title?: string; message?: string; account?: string }>({})

  const initializedRef = useRef(false)
  
  useEffect(() => {
    if (!open) { 
      initializedRef.current = false
      return 
    }
    if (!initializedRef.current) {
      initializedRef.current = true
      fetchAccounts()
      setTitle(notification?.title ?? "")
      setMessage(notification?.message ?? "")
      setRead(notification?.read ?? false)
      setSendToAll(!notification?.account)
      setSelectedAccountId(notification?.account?.id)
      setErrors({})
    }
  }, [open, notification, fetchAccounts])

  const submit = async () => {
    if (!notification?.id) return
    
    const e: { title?: string; message?: string; account?: string } = {}
    
    if (!title.trim()) e.title = "Tiêu đề là bắt buộc"
    if (!message.trim()) e.message = "Nội dung là bắt buộc"
    
    // Chỉ yêu cầu chọn account nếu không phải gửi cho tất cả
    if (!sendToAll && selectedAccountId === undefined) {
      e.account = "Vui lòng chọn người nhận hoặc chọn 'Gửi cho tất cả'"
    }
    
    setErrors(e)
    if (Object.keys(e).length) return
    
    try {
      // Nếu gửi cho tất cả, account sẽ là null
      const accountData = sendToAll ? null : (() => {
        const selectedAccount = accounts.find(a => a.id === selectedAccountId)
        if (!selectedAccount) {
          toast.error("Không tìm thấy tài khoản")
          return null
        }
        return {
          id: selectedAccount.id,
          name: selectedAccount.name,
          mail: selectedAccount.mail,
          role: selectedAccount.role,
          active: selectedAccount.active
        }
      })()
      
      if (!sendToAll && !accountData) {
        return
      }
      
      await update({ 
        id: notification.id,
        title: title.trim(), 
        message: message.trim(),
        read,
        account: accountData
      })
      onClose()
    } catch (error) {
      console.error("Error updating notification:", error)
    }
  }

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title="Chỉnh sửa thông báo"
      size="md"
    >
      <ModalForm onSubmit={(e) => { e.preventDefault(); submit() }}>
        <div>
          <Label className="mb-1 block">Tiêu đề *</Label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && <div className="text-red-600 text-xs mt-1">{errors.title}</div>}
        </div>
        
        <div>
          <Label className="mb-1 block">Nội dung *</Label>
          <textarea 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            className={`w-full min-h-[100px] border rounded px-3 py-2 ${errors.message ? 'border-red-500' : ''}`}
          />
          {errors.message && <div className="text-red-600 text-xs mt-1">{errors.message}</div>}
        </div>
        
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="checkbox"
              id="sendToAll"
              checked={sendToAll}
              onChange={(e) => {
                setSendToAll(e.target.checked)
                if (e.target.checked) {
                  setSelectedAccountId(undefined)
                  setErrors(prev => ({ ...prev, account: undefined }))
                }
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="sendToAll" className="cursor-pointer">
              Gửi cho tất cả (Thông báo chung)
            </Label>
          </div>
          
          <div>
            <Label className="mb-1 block">
              {sendToAll ? "Người nhận (Thông báo chung - tất cả người dùng)" : "Người nhận *"}
            </Label>
                         <select 
               className={`w-full h-10 border rounded px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.account ? 'border-red-500' : 'border-gray-300'} ${sendToAll ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}`}
               value={selectedAccountId ?? ""} 
               onChange={(e) => {
                 setSelectedAccountId(e.target.value === "" ? undefined : Number(e.target.value))
                 setErrors(prev => ({ ...prev, account: undefined }))
               }}
               disabled={sendToAll}
             >
               <option value="">Chọn người nhận</option>
               {accounts.map(account => (
                 <option key={account.id} value={account.id}>
                   {account.name} ({account.mail})
                 </option>
               ))}
             </select>
            {errors.account && <div className="text-red-600 text-xs mt-1">{errors.account}</div>}
            {sendToAll && (
              <div className="text-blue-600 text-xs mt-1">
                Thông báo sẽ được gửi cho tất cả người dùng
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            id="read" 
            type="checkbox" 
            checked={read} 
            onChange={(e) => setRead(e.target.checked)} 
          />
          <Label htmlFor="read">Đã đọc</Label>
        </div>
      </ModalForm>
      
      <ModalActions
        onCancel={onClose}
        onConfirm={submit}
        confirmText="Lưu"
        cancelText="Hủy"
        loading={loading}
        disabled={!title.trim() || !message.trim() || (!sendToAll && selectedAccountId === undefined)}
      />
    </ReusableModal>
  )
}

