import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { runDataSync, fetchDashboardSummary, fetchScoringSummary } from "@/lib/api";
import { queryClient, twinQueryKeys } from "@/lib/queryClient";
import { SanadLogo } from "@/components/SanadBadge";
import { CheckCircle2, ArrowRight, BarChart3, Zap, Leaf, Loader2 } from "lucide-react";

const HIGHLIGHTS = [
  { icon: BarChart3, label: 'Explore financing opportunities matched to your profile' },
  { icon: Zap,       label: 'Simulate financial decisions before committing' },
  { icon: Leaf,      label: 'Discover green financing and tax incentives' },
];

const BUILD_STEPS = [
  "Importing your transactions…",
  "Syncing account balances…",
  "Reviewing standing orders…",
  "Calculating your Credit Readiness Score…",
  "Finalizing your Digital Twin…",
];

const BUILD_MIN_MS = 3500;
const BUILD_TIMEOUT_MS = 8000;
const STEP_INTERVAL_MS = Math.floor(BUILD_MIN_MS / BUILD_STEPS.length);

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function timeout(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function Step5Complete() {
  const { state } = useOnboarding();
  const [phase, setPhase] = useState<"building" | "ready">("building");
  const [stepIdx, setStepIdx] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const anim = window.setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, BUILD_STEPS.length - 1));
    }, STEP_INTERVAL_MS);

    const startedAt = Date.now();
    Promise.race([runDataSync(), timeout(BUILD_TIMEOUT_MS)])
      .catch(() => undefined)
      .then(() =>
        // First login — warm the shared cache once here so Dashboard,
        // Simulation, and Loan Prescreening open instantly with numbers
        // already in hand instead of each firing their own request.
        Promise.allSettled([
          queryClient.prefetchQuery({ queryKey: twinQueryKeys.dashboardSummary, queryFn: fetchDashboardSummary }),
          queryClient.prefetchQuery({ queryKey: twinQueryKeys.scoringSummary, queryFn: fetchScoringSummary }),
        ])
      )
      .then(async () => {
        const remaining = Math.max(0, BUILD_MIN_MS - (Date.now() - startedAt));
        if (remaining > 0) await sleep(remaining);
        window.clearInterval(anim);
        setStepIdx(BUILD_STEPS.length - 1);
        setPhase("ready");
      });

    return () => window.clearInterval(anim);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {phase === "building" ? (
        <motion.div
          key="building"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="max-w-md mx-auto bg-card border rounded-3xl p-10 flex flex-col items-center gap-6 text-center"
        >
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <div>
            <h2 className="text-2xl font-bold mb-1">Building your Digital Twin</h2>
            <p className="text-sm text-muted-foreground">
              We're pulling in your real business data — this only takes a moment.
            </p>
          </div>
          <div className="space-y-2.5 w-full text-start">
            {BUILD_STEPS.map((step, i) => (
              <div
                key={step}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                  i < stepIdx
                    ? "bg-primary/5 text-primary"
                    : i === stepIdx
                      ? "bg-muted font-medium"
                      : "text-muted-foreground"
                }`}
              >
                {i < stepIdx ? (
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                ) : i === stepIdx ? (
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                )}
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="ready"
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
            <p className="text-sm font-semibold text-emerald-600 mb-2 tracking-wide uppercase">
              ✓ Account Created Successfully
            </p>
            <h2 className="text-4xl font-bold mb-3">Financial Twin Created</h2>
            <p className="text-lg text-muted-foreground mb-2">Your financial profile has been prepared successfully.</p>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              You can now explore financing opportunities, simulate financial decisions, and monitor your business health.
            </p>
          </motion.div>

          {/* Sanad identity confirmation card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="bg-card border rounded-3xl p-6 mb-6 flex flex-col items-center gap-3 text-center"
          >
            {/*
             * Future integration point:
             * Display Sanad-verified identity badge here once Sanad OAuth
             * is implemented and a verified_identity token is available.
             */}
            <SanadLogo size={56} />
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Your account has been created successfully.{" "}
              Future versions of FinTwin will allow secure identity verification
              through Sanad.
            </p>
          </motion.div>

          {/* Business summary card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
                <p className="text-sm text-muted-foreground">
                  {state.businessSector || 'Business'} · {state.category || 'Micro Enterprise'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {(['cliq', 'jofotara', 'pos'] as const).map(key => (
                <div
                  key={key}
                  className={`rounded-xl p-3 text-xs font-medium ${
                    state.connectedSources[key] ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'
                  }`}
                >
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
            transition={{ delay: 0.48 }}
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
            transition={{ delay: 0.56 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button size="lg" className="h-14 px-10 text-base rounded-full shadow-md w-full sm:w-auto" asChild>
              <Link href="/dashboard">
                Go to Dashboard <ArrowRight className="ms-2 w-5 h-5 rtl:rotate-180" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-10 text-base rounded-full w-full sm:w-auto" asChild>
              <Link href="/profile">View Profile</Link>
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
