import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useOnboarding } from "@/context/OnboardingContext";
import { ApiError, login, routeFromNextStep, setToken, fetchDashboardSummary, fetchScoringSummary } from "@/lib/api";
import { queryClient, twinQueryKeys } from "@/lib/queryClient";
import { SanadLoginBadge, SanadFutureCard, SanadLogo } from "@/components/SanadBadge";
import { IdCard, LayoutDashboard, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [, setLocation] = useLocation();
  const { updateState, resumeAtStep, hydrateFromProfile, isAuthenticated } = useOnboarding();

  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Brief "Identity verified" flash shown after a successful login
  const [verified, setVerified] = useState(false);

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
    setSubmitting(true);

    try {
      // Future: Authenticate user using Sanad Digital Identity API
      const data = await login(nationalId, password);
      setToken(data.token);
      updateState({ authMethod: "sanad", nationalId });
      hydrateFromProfile(data.profile);

      // First login this session — warm the shared cache so Dashboard opens
      // instantly with numbers already in hand.
      void Promise.allSettled([
        queryClient.prefetchQuery({ queryKey: twinQueryKeys.dashboardSummary, queryFn: fetchDashboardSummary }),
        queryClient.prefetchQuery({ queryKey: twinQueryKeys.scoringSummary, queryFn: fetchScoringSummary }),
      ]);

      // Show the "Identity verified" Sanad flash for ~1 second
      setVerified(true);
      await new Promise(r => window.setTimeout(r, 1100));

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
      setVerified(false);
      if (err instanceof ApiError) setError(err.message);
      else setError("Could not sign in. Check your connection and try again.");
    } finally {
      setSubmitting(false);
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
          {isAuthenticated && !verified ? (
            <div className="bg-card border rounded-3xl p-8 text-center space-y-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
                Signed in
              </span>
              <div>
                <h1 className="text-2xl font-bold mb-2">You&apos;re already signed in</h1>
                <p className="text-muted-foreground text-sm">
                  Your session is active. Continue to your FinTwin dashboard.
                </p>
              </div>
              <Button asChild className="w-full gap-2">
                <Link href="/dashboard">
                  <LayoutDashboard className="w-4 h-4" />
                  Go to dashboard
                </Link>
              </Button>
            </div>
          ) : (
            <>
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-muted-foreground text-sm">
              Sign in with the same national ID and password you used to register.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* ── Identity Verified flash ── */}
            {verified ? (
              <motion.div
                key="verified"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-card border rounded-3xl p-10 flex flex-col items-center gap-4 text-center"
              >
                <SanadLogo size={64} />
                <div className="flex items-center gap-2 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-semibold text-base">Identity verified</span>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                    {/* National ID with Sanad branding */}
                    <div>
                      {/* Future: Replace with Sanad Digital Identity OAuth trigger */}
                      <SanadLoginBadge />

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
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Use your Jordanian National ID. Future versions will verify your identity
                        securely through Sanad.
                      </p>
                    </div>

                    {/* Future Integration info card */}
                    <SanadFutureCard />

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
                      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all mt-2 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Signing in…
                        </>
                      ) : (
                        "Sign In"
                      )}
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
          </AnimatePresence>
            </>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
