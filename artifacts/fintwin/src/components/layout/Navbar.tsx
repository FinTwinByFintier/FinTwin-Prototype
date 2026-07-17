import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "react-i18next";

export function Navbar() {
  const [location] = useLocation();
  const { toggleLanguage } = useLanguage();
  const { t } = useTranslation();

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
            <Link href="/" className={cn("transition-colors hover:text-foreground/80", location === "/" ? "text-foreground" : "text-muted-foreground")}>{t('nav.home')}</Link>
            <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground/80">{t('nav.howItWorks')}</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            aria-label={t('lang.switchAriaLabel')}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            {t('lang.switch')}
          </button>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/dashboard">{t('nav.signIn')}</Link>
          </Button>
          <Button asChild>
            <Link href="/get-started">{t('nav.getStarted')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
