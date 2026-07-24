import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

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
              {t('footer.tagline')}
            </p>
            <div className="text-xs font-medium px-3 py-1 bg-muted text-muted-foreground rounded-full inline-block">
              {t('footer.badge')}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-4">{t('footer.platformTitle')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground transition-colors">{t('footer.howItWorks')}</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">{t('footer.dataSecurity')}</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">{t('footer.supportedIntegrations')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">{t('footer.companyTitle')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">{t('footer.contact')}</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">{t('footer.privacyPolicy')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
