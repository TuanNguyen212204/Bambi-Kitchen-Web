import "./App.css"
import { AppRoute } from "@routers/index"
import { Toaster } from "sonner"

function App() {
  return (
    <>
      <AppRoute />
      <Toaster 
        position="top-right" 
        richColors={true}
        closeButton={true}
        expand={true}
        duration={4000}
      />
    </>
  )
}

export default App