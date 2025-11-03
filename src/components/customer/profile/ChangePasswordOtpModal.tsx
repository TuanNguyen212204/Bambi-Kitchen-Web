import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { useState } from "react"
import { Lock, Save, X } from "lucide-react"
import { bambiApi } from "@utils/api"

interface Props {
  open: boolean
  onClose: () => void
  email: string
}

export function ChangePasswordOtpModal({ open, onClose, email }: Props) {
  const [step, setStep] = useState<"request" | "reset">("request")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const sendOtp = async () => {
    setLoading(true)
    try {
      await bambiApi.get<string>(`/api/user/forgot-password?email=${encodeURIComponent(email)}`, { skipAuth: true })
      setStep("reset")
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await bambiApi.post<string>(`/api/user/reset-password?otp=${encodeURIComponent(otp)}&email=${encodeURIComponent(email)}&newPassword=${encodeURIComponent(newPassword)}`, undefined, { skipAuth: true })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Lock className="w-5 h-5"/>Đổi mật khẩu (OTP)</DialogTitle>
        </DialogHeader>
        {step === "request" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}><X className="w-4 h-4 mr-2"/>Hủy</Button>
              <Button onClick={sendOtp} disabled={loading} className="bg-orange-600 hover:bg-orange-700">{loading?"Đang gửi...":"Gửi OTP"}</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label>OTP</Label>
              <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Nhập OTP" />
            </div>
            <div className="space-y-2">
              <Label>Mật khẩu mới</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}><X className="w-4 h-4 mr-2"/>Hủy</Button>
              <Button type="submit" disabled={loading || !otp || newPassword.length < 6} className="bg-orange-600 hover:bg-orange-700"><Save className="w-4 h-4 mr-2"/>{loading?"Đang đổi...":"Xác nhận"}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}


