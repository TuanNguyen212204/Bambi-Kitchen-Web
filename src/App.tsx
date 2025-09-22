import { Button } from "@ui/Button"
import { Toaster, toast } from "sonner"

function App() {
  const handlePrimaryClick = () => {
    toast.success("Welcome to Bambi Kitchen!", {
      description: "Your kitchen management system is ready!",
    })
  }

  const handleOutlineClick = () => {
    toast.info("Learn more about our features", {
      action: {
        label: "Explore",
        onClick: () => console.log("Explore clicked"),
      },
    })
  }

  const handleDeleteClick = () => {
    toast.error("Delete action", {
      description: "This action cannot be undone",
      action: {
        label: "Undo",
        onClick: () => toast.success("Action undone!"),
      },
    })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Bambi Kitchen
          </h1>
          <p className="text-muted-foreground max-w-[600px] text-lg">
            Welcome to the modern kitchen management system
          </p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button size="lg" onClick={handlePrimaryClick}>
            Get Started
          </Button>
          <Button variant="outline" size="lg" onClick={handleOutlineClick}>
            Learn More
          </Button>
          <Button variant="secondary" size="sm">
            Secondary
          </Button>
          <Button variant="ghost" size="sm">
            Ghost
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteClick}>
            Delete
          </Button>
        </div>
      </div>
      <Toaster 
        position="top-right"
        richColors
        expand={true}
        closeButton
      />
    </div>
  )
}

export default App