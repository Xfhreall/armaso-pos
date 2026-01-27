import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Page Not Found</h1>
      <p className="mb-6 text-muted-foreground">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <div className="flex gap-2">
        <Button asChild variant="default">
          <Link to="/">Go Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="..">Go Back</Link>
        </Button>
      </div>
    </div>
  );
}
