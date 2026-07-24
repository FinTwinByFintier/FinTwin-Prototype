import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTranslation } from "react-i18next";

export default function GetStarted() {
  const { t } = useTranslation();
  const { isAuthenticated } = useOnboarding();

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
          {isAuthenticated ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
                {t("nav.signedIn")}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                {t("getStarted.title")}
              </h1>
              <p className="text-lg text-muted-foreground mb-10">
                Your session is active. Jump back into your FinTwin.
              </p>
              <Button size="lg" className="h-14 px-10 text-lg rounded-full gap-2" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="w-5 h-5" />
                  {t("getStarted.goToDashboard")}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                {t("getStarted.title")}
              </h1>
              <p className="text-lg text-muted-foreground mb-10">
                {t("getStarted.subtitle")}
              </p>

              <Button size="lg" className="h-14 px-10 text-lg rounded-full" asChild>
                <Link href="/onboarding">
                  {t("getStarted.startButton")}{" "}
                  <ArrowRight className="ms-2 w-5 h-5 rtl:rotate-180" />
                </Link>
              </Button>

              <p className="mt-6 text-sm text-muted-foreground">
                {t("getStarted.alreadyHaveProfile")}{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Login
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
