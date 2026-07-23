import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { Loader2, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

const AUTH_STEPS = [
  'Connecting to Sanad…',
  'Verifying national identity…',
  'Retrieving your profile…',
];

export function StepAuth() {
  const { updateState, setCurrentStep } = useOnboarding();
  const [view, setView] = useState<'choose' | 'loading' | 'done'>('choose');
  const [stepIdx, setStepIdx] = useState(0);

  const handleSanad = () => {
    updateState({ authMethod: 'sanad' });
    setView('loading');
    setStepIdx(0);
    let i = 0;
    const next = () => {
      i++;
      if (i < AUTH_STEPS.length) { setStepIdx(i); setTimeout(next, 900); }
      else { setTimeout(() => setView('done'), 700); setTimeout(() => setCurrentStep(2), 1600); }
    };
    setTimeout(next, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-md mx-auto"
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Sign in to continue</h2>
        <p className="text-muted-foreground">Verify your identity before setting up your Financial Twin.</p>
      </div>

      <AnimatePresence mode="wait">
        {view === 'choose' && (
          <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-card border rounded-3xl p-8"
          >
            <button
              onClick={handleSanad}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all text-start group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-base">Continue with Sanad</p>
                  <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Recommended</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Use your Jordanian national digital identity. Secure and instant.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </button>

            <p className="text-xs text-center text-muted-foreground mt-5">
              Sanad is Jordan's official national digital identity platform. Your credentials are verified directly with the government — FinTwin never stores your Sanad password.
            </p>
          </motion.div>
        )}

        {view === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-card border rounded-3xl p-10 flex flex-col items-center gap-5 text-center"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div className="space-y-2.5 w-full text-start">
              {AUTH_STEPS.map((step, i) => (
                <div key={step} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                  i < stepIdx ? 'bg-primary/5 text-primary' : i === stepIdx ? 'bg-muted font-medium' : 'text-muted-foreground'
                }`}>
                  {i < stepIdx
                    ? <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    : i === stepIdx
                    ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    : <div className="w-4 h-4 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                  }
                  <span className="text-sm">{step}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border rounded-3xl p-10 flex flex-col items-center gap-4 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-lg">Identity verified</p>
              <p className="text-sm text-muted-foreground mt-1">Proceeding to business setup…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
