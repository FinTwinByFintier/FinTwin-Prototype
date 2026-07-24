import { motion } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, ArrowRight } from "lucide-react";

const CATEGORY_META: Record<string, { color: string; badge: string; desc: string }> = {
  'Micro Enterprise': {
    color: 'text-blue-600 bg-blue-500/10',
    badge: 'bg-blue-500/10 text-blue-700',
    desc: 'Under 5 employees · Under 100,000 JOD annual revenue',
  },
  'Small Enterprise': {
    color: 'text-primary bg-primary/10',
    badge: 'bg-primary/10 text-primary',
    desc: '5–19 employees · 100,000–999,999 JOD annual revenue',
  },
  'Medium Enterprise': {
    color: 'text-purple-600 bg-purple-500/10',
    badge: 'bg-purple-500/10 text-purple-700',
    desc: '20+ employees · 1,000,000+ JOD annual revenue',
  },
};

export function StepClassification() {
  const { state, setCurrentStep } = useOnboarding();
  const category = state.category || 'Micro Enterprise';
  const meta = CATEGORY_META[category] || CATEGORY_META['Micro Enterprise'];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-xl mx-auto"
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Business Classification</h2>
        <p className="text-muted-foreground">Based on Jordan's MSME classification framework.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-card border-2 border-primary/20 rounded-3xl p-10 text-center relative overflow-hidden shadow-sm"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${meta.color}`}
        >
          <Building2 className="w-10 h-10" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Your business is classified as
          </p>
          <h3 className="text-4xl font-bold mb-3">{category}</h3>
          <p className="text-sm text-muted-foreground mb-2">{meta.desc}</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-4">
            This helps us match you with suitable financing products and credit readiness tools.
          </p>
        </motion.div>
      </motion.div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" className="rounded-full" onClick={() => setCurrentStep(4)}>
          <ArrowLeft className="me-2 w-4 h-4" /> Edit Information
        </Button>
        <Button className="rounded-full px-8" onClick={() => setCurrentStep(6)}>
          Continue <ArrowRight className="ms-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
