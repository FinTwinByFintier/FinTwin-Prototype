import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Leaf, Landmark } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useTranslation } from "react-i18next";
import heroDataImage from "@assets/Pasted--svg-viewBox-0-0-1200-720-fill-none-xmlns-http-www-w3-o_1784229700790.svg";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } }
};

export default function Home() {
  const { t } = useTranslation();

  const steps = [
    { n: "1", title: t('home.step1Title'), desc: t('home.step1Desc') },
    { n: "2", title: t('home.step2Title'), desc: t('home.step2Desc') },
    { n: "3", title: t('home.step3Title'), desc: t('home.step3Desc') },
    { n: "4", title: t('home.step4Title'), desc: t('home.step4Desc'), highlight: true },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow">
        {/* Hero */}
        <section className="relative pt-24 pb-32 overflow-hidden bg-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial="initial"
                animate="animate"
                variants={stagger}
                className="max-w-2xl"
              >
                <motion.h1
                  variants={fadeIn}
                  className="text-5xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-6"
                >
                  {t('home.heroTitle1')}{" "}
                  <span className="text-primary">{t('home.heroTitleHighlight')}</span>
                  {t('home.heroTitle2')}
                </motion.h1>
                <motion.p variants={fadeIn} className="text-lg text-muted-foreground mb-8">
                  {t('home.heroSubtitle')}
                </motion.p>
                <motion.div variants={fadeIn}>
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full" asChild>
                    <Link href="/get-started">
                      {t('home.getStarted')} <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] blur-2xl z-0" />
                <img
                  src={heroDataImage}
                  alt="FinTwin dashboard preview"
                  className="relative z-10 rounded-[2rem] shadow-2xl border border-white/20 w-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why it matters */}
        <section className="py-20 bg-foreground text-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">
              {t('home.whyTitle')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-7 rounded-2xl bg-card/5 border border-white/10">
                <BarChart3 className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('home.feature1Title')}</h3>
                <p className="text-muted/70 text-sm">{t('home.feature1Desc')}</p>
              </div>
              <div className="p-7 rounded-2xl bg-card/5 border border-white/10">
                <Landmark className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('home.feature2Title')}</h3>
                <p className="text-muted/70 text-sm">{t('home.feature2Desc')}</p>
              </div>
              <div className="p-7 rounded-2xl bg-card/5 border border-white/10">
                <Leaf className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('home.feature3Title')}</h3>
                <p className="text-muted/70 text-sm">{t('home.feature3Desc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-14">{t('home.howItWorksTitle')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {steps.map(({ n, title, desc, highlight }) => (
                <div
                  key={n}
                  className={`p-6 rounded-3xl border shadow-sm flex flex-col ${
                    highlight ? "bg-primary/5 border-primary/20" : "bg-card"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-5 ${
                      highlight
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {n}
                  </div>
                  <h4 className={`text-lg font-semibold mb-2 ${highlight ? "text-primary" : ""}`}>{title}</h4>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">{t('home.ctaTitle')}</h2>
            <p className="text-lg mb-10 opacity-80 max-w-lg mx-auto">
              {t('home.ctaSubtitle')}
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="h-14 px-10 text-lg rounded-full text-foreground"
              asChild
            >
              <Link href="/get-started">{t('home.ctaButton')}</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
