interface ErrorPageProps {
  code?: number
  message?: string
}

export const ErrorPage = ({ code, message }: ErrorPageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold mb-2">{code ?? 500}</h1>
        <p className="text-muted-foreground">{message ?? "Đã xảy ra lỗi."}</p>
      </div>
    </div>
  )
}

export default ErrorPage;