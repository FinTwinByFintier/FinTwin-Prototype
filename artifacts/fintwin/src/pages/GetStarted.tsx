import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useTranslation } from "react-i18next";

export default function GetStarted() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl w-full text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {t('getStarted.title')}
          </h1>
          <p className="text-lg text-muted-foreground mb-10">
            {t('getStarted.subtitle')}
          </p>

          <Button size="lg" className="h-14 px-10 text-lg rounded-full" asChild>
            <Link href="/onboarding">
              {t('getStarted.startButton')} <ArrowRight className="ms-2 w-5 h-5 rtl:rotate-180" />
            </Link>
          </Button>

          <p className="mt-6 text-sm text-muted-foreground">
            {t('getStarted.alreadyHaveProfile')}{" "}
            <Link href="/dashboard" className="text-primary hover:underline font-medium">
              {t('getStarted.goToDashboard')}
            </Link>
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
