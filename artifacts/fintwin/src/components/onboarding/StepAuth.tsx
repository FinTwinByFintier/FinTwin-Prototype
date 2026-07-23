import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { Loader2, IdCard, Eye, EyeOff, CheckCircle2 } from "lucide-react";

const AUTH_STEPS = [
  'Verifying national ID…',
  'Confirming identity…',
  'Retrieving your profile…',
];

export function StepAuth() {
  const { updateState, setCurrentStep } = useOnboarding();
  const [view, setView] = useState<'form' | 'loading' | 'done'>('form');
  const [stepIdx, setStepIdx] = useState(0);
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(nationalId)) { setError('National ID must be exactly 10 digits.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }
    setError('');
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
        {view === 'form' && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-card border rounded-3xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <IdCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Sign in with Sanad</p>
                <p className="text-xs text-muted-foreground">Use your Sanad national identity credentials</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">National ID Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={nationalId}
                  onChange={e => { setNationalId(e.target.value.replace(/\D/g, '')); setError(''); }}
                  placeholder="10-digit national ID"
                  className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pe-11 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 end-0 px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 px-1">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all mt-2"
              >
                Sign In
              </button>
            </form>

            <p className="text-xs text-center text-muted-foreground mt-5">
              Your credentials are verified securely — FinTwin never stores your password.
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
