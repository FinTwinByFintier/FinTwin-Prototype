import { motion } from "framer-motion";
import { Link } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, BarChart3, Zap, Leaf } from "lucide-react";

const HIGHLIGHTS = [
  { icon: BarChart3, label: 'Explore financing opportunities matched to your profile' },
  { icon: Zap, label: 'Simulate financial decisions before committing' },
  { icon: Leaf, label: 'Discover green financing and tax incentives' },
];

export function Step5Complete() {
  const { state } = useOnboarding();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto text-center"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle2 className="w-12 h-12 text-primary" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-4xl font-bold mb-3">Financial Twin Created Successfully</h2>
        <p className="text-lg text-muted-foreground mb-2">
          Your financial profile has been prepared successfully.
        </p>
        <p className="text-muted-foreground mb-10 max-w-md mx-auto">
          You can now explore financing opportunities, simulate financial decisions, and monitor your business health.
        </p>
      </motion.div>

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card border rounded-3xl p-6 mb-8 text-start"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">
              {state.businessName ? state.businessName[0] : 'F'}
            </span>
          </div>
          <div>
            <p className="font-bold text-base">{state.businessName || 'Your Business'}</p>
            <p className="text-sm text-muted-foreground">{state.businessSector || 'Business'} · {state.category || 'Micro Enterprise'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {(['jofotara', 'cliq', 'pos'] as const).map(key => (
            <div key={key} className={`rounded-xl p-3 text-xs font-medium ${state.connectedSources[key] ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
              {key === 'cliq' ? 'Bank' : key === 'jofotara' ? 'JoFotara' : 'POS'}
              <br />
              <span className="font-semibold">{state.connectedSources[key] ? '✓ Connected' : 'Not connected'}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* What's next */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"
      >
        {HIGHLIGHTS.map(({ icon: Icon, label }) => (
          <div key={label} className="bg-muted/40 rounded-2xl p-4 flex flex-col items-center gap-2 text-sm text-center text-muted-foreground">
            <Icon className="w-5 h-5 text-primary" />
            {label}
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        <Button size="lg" className="h-14 px-10 text-base rounded-full shadow-md w-full sm:w-auto" asChild>
          <Link href="/dashboard">
            Go to Dashboard <ArrowRight className="ms-2 w-5 h-5 rtl:rotate-180" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="h-14 px-10 text-base rounded-full w-full sm:w-auto" asChild>
          <Link href="/dashboard">View Profile</Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}
