import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { useState } from "react"
import { Mail, Save, X } from "lucide-react"
import { bambiApi, API_ENDPOINTS } from "@utils/api"

interface Props {
  open: boolean
  onClose: () => void
  user: { id?: number; name?: string; email?: string }
  onSuccess?: () => void
}

export function ChangeEmailOtpModal({ open, onClose, user, onSuccess }: Props) {
  const [email, setEmail] = useState(user?.email || "")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"input" | "verify">("input")
  const [loading, setLoading] = useState(false)

  const sendOtp = async () => {
    setLoading(true)
    try {
      await bambiApi.get<string>(`/api/mail/send-otp?email=${encodeURIComponent(email)}`, { skipAuth: true })
      setStep("verify")
    } finally {
      setLoading(false)
    }
  }

  const verifyAndUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await bambiApi.post<string>(`/api/mail/verify-otp?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`, undefined, { skipAuth: true })
      await bambiApi.put(API_ENDPOINTS.PROFILE, {
        id: user?.id,
        name: user?.name,
        mail: email,
        active: true,
      } as any)
      onSuccess?.()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="w-5 h-5"/>Đổi email (OTP)</DialogTitle>
        </DialogHeader>
        {step === "input" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email mới</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}><X className="w-4 h-4 mr-2"/>Hủy</Button>
              <Button onClick={sendOtp} disabled={loading || !email} className="bg-orange-600 hover:bg-orange-700">{loading?"Đang gửi...":"Gửi OTP"}</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={verifyAndUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Mã OTP</Label>
              <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Nhập mã OTP" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}><X className="w-4 h-4 mr-2"/>Hủy</Button>
              <Button type="submit" disabled={loading || !otp} className="bg-orange-600 hover:bg-orange-700"><Save className="w-4 h-4 mr-2"/>{loading?"Đang xác minh...":"Xác nhận"}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}


