import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { ApiError, register, setToken } from "@/lib/api";
import { SanadSignupHeader, SanadFutureCard } from "@/components/SanadBadge";
import { Loader2, IdCard, Eye, EyeOff, CheckCircle2 } from "lucide-react";

const AUTH_STEPS = [
  "Creating your account…",
  "Securing your credentials…",
  "Preparing onboarding…",
];

const ANIMATION_MS = 4000;
const STEP_INTERVAL_MS = Math.floor(ANIMATION_MS / AUTH_STEPS.length);

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function StepAuth() {
  const { updateState, setCurrentStep, hydrateFromProfile } = useOnboarding();
  const [view, setView] = useState<"form" | "loading">("form");
  const [stepIdx, setStepIdx] = useState(0);
  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(nationalId)) {
      setError("National ID must be exactly 10 digits.");
      return;
    }
    if (password.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setSubmitting(true);
    setView("loading");
    setStepIdx(0);
    const started = Date.now();

    const anim = window.setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, AUTH_STEPS.length));
    }, STEP_INTERVAL_MS);

    try {
      // Future: Authenticate user using Sanad Digital Identity API
      const data = await register(nationalId, password);
      setToken(data.token);
      updateState({ authMethod: "sanad", nationalId });
      hydrateFromProfile(data.profile);

      const remaining = Math.max(0, ANIMATION_MS - (Date.now() - started));
      await sleep(remaining);
      window.clearInterval(anim);
      setStepIdx(AUTH_STEPS.length);
      // Always start at step 2 (Identity) after registration.
      setCurrentStep(2);
    } catch (err) {
      window.clearInterval(anim);
      setView("form");
      if (
        err instanceof ApiError &&
        (err.code === "exists" || /already exists/i.test(err.message))
      ) {
        setError("You already have an account. Please use Login to open your dashboard.");
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Could not create account. Check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-md mx-auto"
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Create your account</h2>
        <p className="text-muted-foreground">
          Register with your national ID to start building your Financial Twin.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {view === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-card border rounded-3xl p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* National ID section with Sanad branding */}
              <div className="space-y-3">
                {/* Future: Replace the block below with a Sanad Digital Identity
                    OAuth/OIDC redirect — user clicks "Verify with Sanad" and is
                    redirected to the Sanad IdP, then returns with a verified token. */}
                <SanadSignupHeader />

                <div>
                  <label className="text-sm font-medium mb-1.5 block">National ID Number</label>
                  <div className="relative">
                    <IdCard className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={nationalId}
                      onChange={(e) => {
                        setNationalId(e.target.value.replace(/\D/g, ""));
                        setError("");
                      }}
                      placeholder="Enter your Jordanian National ID"
                      aria-label="Jordanian National ID Number"
                      className="w-full ps-10 pe-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Future integration info card */}
                <SanadFutureCard />
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
                    placeholder="Create a password"
                    className="w-full px-4 py-3 pe-11 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all mt-2 disabled:opacity-60"
              >
                {submitting ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p className="text-xs text-center text-muted-foreground mt-5">
              Already registered? Use Login — we will resume where you left off.
            </p>
          </motion.div>
        )}

        {view === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-card border rounded-3xl p-10 flex flex-col items-center gap-5 text-center"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div className="space-y-2.5 w-full text-start">
              {AUTH_STEPS.map((step, i) => (
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
  );
}
