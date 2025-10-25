import { useState, useEffect } from "react"
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
  const [sendToAll, setSendToAll] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined)
  const [errors, setErrors] = useState<{ title?: string; message?: string; account?: string }>({})

  useEffect(() => { 
    if (open) fetchAccounts() 
  }, [open, fetchAccounts])

  useEffect(() => {
    if (!open) {
      setTitle("")
      setMessage("")
      setSendToAll(false)
      setSelectedAccountId(undefined)
      setErrors({})
    }
  }, [open])

  const submit = async () => {
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
      
      await create({ 
        title: title.trim(), 
        message: message.trim(),
        account: accountData
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
      </ModalForm>
      
      <ModalActions
        onCancel={onClose}
        onConfirm={submit}
        confirmText="Tạo"
        cancelText="Hủy"
        loading={loading}
        disabled={!title.trim() || !message.trim() || (!sendToAll && selectedAccountId === undefined)}
      />
    </ReusableModal>
  )
}

