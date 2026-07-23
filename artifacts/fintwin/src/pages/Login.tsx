import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

type Phase = 'idle' | 'loading' | 'done';

const SANAD_STEPS = [
  'Redirecting to Sanad…',
  'Verifying identity…',
  'Fetching your profile…',
];

export default function Login() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [stepIdx, setStepIdx] = useState(0);

  const handleLogin = () => {
    setPhase('loading');
    setStepIdx(0);
    let i = 0;
    const next = () => {
      i++;
      if (i < SANAD_STEPS.length) { setStepIdx(i); setTimeout(next, 950); }
      else { setTimeout(() => setPhase('done'), 800); }
    };
    setTimeout(next, 950);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full"
        >
          <AnimatePresence mode="wait">
            {phase === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold">Welcome back</h1>
                  <p className="text-muted-foreground text-sm">Sign in to your FinTwin account using your national digital identity.</p>
                </div>

                <div className="bg-card border rounded-3xl p-6 space-y-5">
                  {/* Sanad primary */}
                  <button
                    onClick={handleLogin}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all text-start group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">Continue with Sanad</p>
                      <p className="text-xs text-muted-foreground">Jordan's national digital identity</p>
                    </div>
                    <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full flex-shrink-0">
                      Recommended
                    </span>
                  </button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link href="/get-started" className="text-primary hover:underline font-medium">
                    Get started
                  </Link>
                </p>
              </motion.div>
            )}

            {phase === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-card border rounded-3xl p-8 space-y-6 text-center"
              >
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                <div className="space-y-3 text-start">
                  {SANAD_STEPS.map((step, i) => (
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

            {phase === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-card border rounded-3xl p-8 text-center space-y-5"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-xl">Identity verified</p>
                  <p className="text-sm text-muted-foreground mt-1">Welcome back. Taking you to your dashboard.</p>
                </div>
                <Button className="w-full rounded-full" asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
