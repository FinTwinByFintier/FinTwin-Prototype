import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useOnboarding } from "@/context/OnboardingContext";
import { ApiError, login, routeFromNextStep, setToken } from "@/lib/api";
import { IdCard, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

type Phase = "form" | "loading";

const LOGIN_STEPS = [
  "Verifying national ID…",
  "Checking credentials…",
  "Loading your progress…",
];

const ANIMATION_MS = 4000;
const STEP_INTERVAL_MS = Math.floor(ANIMATION_MS / LOGIN_STEPS.length);

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { updateState, resumeAtStep, hydrateFromProfile } = useOnboarding();

  const [phase, setPhase] = useState<Phase>("form");
  const [stepIdx, setStepIdx] = useState(0);
  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(nationalId)) {
      setError("National ID must be exactly 10 digits.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setError("");
    setPhase("loading");
    setStepIdx(0);
    const started = Date.now();

    const anim = window.setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, LOGIN_STEPS.length));
    }, STEP_INTERVAL_MS);

    try {
      const data = await login(nationalId, password);
      setToken(data.token);
      updateState({ authMethod: "sanad", nationalId });
      hydrateFromProfile(data.profile);

      const remaining = Math.max(0, ANIMATION_MS - (Date.now() - started));
      await sleep(remaining);
      window.clearInterval(anim);
      setStepIdx(LOGIN_STEPS.length);

      const next = data.next_step || 2;
      const route = routeFromNextStep(next);
      if (route === "/onboarding") {
        resumeAtStep(next);
        setLocation("/onboarding");
      } else {
        resumeAtStep(8);
        setLocation("/dashboard");
      }
    } catch (err) {
      window.clearInterval(anim);
      setPhase("form");
      if (err instanceof ApiError) setError(err.message);
      else setError("Could not sign in. Check your connection and try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <AnimatePresence mode="wait">
            {phase === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-8 text-center">
                  <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
                  <p className="text-muted-foreground text-sm">
                    Sign in with the same national ID and password you used to register.
                  </p>
                </div>

                <div className="bg-card border rounded-3xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <IdCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Sign in to FinTwin</p>
                      <p className="text-xs text-muted-foreground">
                        We will resume your onboarding if it is incomplete
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">National ID Number</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        value={nationalId}
                        onChange={(e) => {
                          setNationalId(e.target.value.replace(/\D/g, ""));
                          setError("");
                        }}
                        placeholder="10-digit national ID"
                        className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        autoComplete="username"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError("");
                          }}
                          placeholder="Enter your password"
                          className="w-full px-4 py-3 pe-11 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute inset-y-0 end-0 px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {error && <p className="text-sm text-red-500 px-1">{error}</p>}

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all mt-2"
                    >
                      Sign In
                    </button>
                  </form>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Don&apos;t have an account?{" "}
                  <Link href="/onboarding" className="text-primary hover:underline font-medium">
                    Create one
                  </Link>
                </p>
              </motion.div>
            )}

            {phase === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-card border rounded-3xl p-8 space-y-6 text-center"
              >
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                <div className="space-y-3 text-start">
                  {LOGIN_STEPS.map((step, i) => (
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
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
