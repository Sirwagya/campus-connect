import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
      <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
      </p>
      <Button asChild className="rounded-full">
        <Link href="/" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Return Home
        </Link>
      </Button>
    </div>
  );
}
