import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1 group">
            <span className="text-xl font-bold tracking-tight text-foreground">
              Fin<span className="text-primary transition-colors group-hover:text-primary/80">Twin</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className={cn("transition-colors hover:text-foreground/80", location === "/" ? "text-foreground" : "text-muted-foreground")}>Home</Link>
            <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground/80">How It Works</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/dashboard">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/get-started">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
