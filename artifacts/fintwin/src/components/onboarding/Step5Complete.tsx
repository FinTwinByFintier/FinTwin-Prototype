import { motion } from "framer-motion";
import { Link } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, ArrowRight, Activity, Building, Briefcase } from "lucide-react";

export function Step5Complete() {
  const { state } = useOnboarding();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto text-center"
    >
      <div className="mb-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </motion.div>

        <h2 className="text-4xl font-bold mb-4">Your FinTwin profile is ready!</h2>
        <p className="text-xl text-muted-foreground">
          We've built your digital financial twin based on the data you provided.
        </p>
      </div>

      <div className="bg-card border rounded-3xl p-8 shadow-sm text-left mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Activity className="w-48 h-48" />
        </div>

        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">Profile Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Building className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Business Name</p>
                <p className="font-semibold text-lg">{state.businessName || "Your Business"}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classification</p>
                <p className="font-semibold text-lg">{state.category || "Micro Enterprise"}</p>
                <p className="text-sm text-primary">{state.businessSector}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-2xl p-5 border relative overflow-hidden group">
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Lock className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium uppercase tracking-wider">Unlocks in Dashboard</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Credit Readiness Score</p>
              <div className="flex items-end gap-2 blur-[4px]">
                <span className="text-3xl font-bold">84</span>
                <span className="text-sm text-muted-foreground mb-1">/ 100</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-2xl p-5 border relative overflow-hidden group">
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Lock className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium uppercase tracking-wider">Unlocks in Dashboard</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Green Taxonomy Match</p>
              <div className="flex items-end gap-2 blur-[4px]">
                <span className="text-3xl font-bold">62%</span>
                <span className="text-sm text-primary font-medium mb-1 pl-2">Eligible</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-6">
        <Button size="lg" className="h-16 px-12 text-xl rounded-full shadow-lg w-full sm:w-auto" asChild>
          <Link href="/dashboard" className="flex items-center">
            View My Dashboard <ArrowRight className="ml-2 w-6 h-6" />
          </Link>
        </Button>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block">
          I'll explore later
        </Link>
      </div>
    </motion.div>
  );
}
