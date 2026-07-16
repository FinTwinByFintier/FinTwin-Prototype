import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="w-full border-t bg-card text-card-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold tracking-tight">
                Fin<span className="text-primary">Twin</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Turning Jordan's financially invisible businesses into fundable ones. Build your digital financial profile today.
            </p>
            <div className="text-xs font-medium px-3 py-1 bg-muted text-muted-foreground rounded-full inline-block">
              Built for Jordan's MSME ecosystem
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground transition-colors">How it works</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">Data Security</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">Supported Integrations</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} FinTwin. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
