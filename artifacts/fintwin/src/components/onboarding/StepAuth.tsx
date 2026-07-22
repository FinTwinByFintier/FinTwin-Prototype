import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";

type View = 'choose' | 'email' | 'loading';

export function StepAuth() {
  const { updateState, setCurrentStep } = useOnboarding();
  const [view, setView] = useState<View>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const proceed = (method: 'sanad' | 'email') => {
    updateState({ authMethod: method });
    setView('loading');
    setTimeout(() => setCurrentStep(2), method === 'sanad' ? 2500 : 1500);
  };

  const handleSanad = () => proceed('sanad');

  const handleEmailSubmit = () => {
    const errs: typeof errors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    proceed('email');
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
        {view === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border rounded-3xl p-12 flex flex-col items-center gap-4 text-center"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="font-medium text-lg">Authenticating…</p>
            <p className="text-sm text-muted-foreground">Please wait while we verify your identity.</p>
          </motion.div>
        )}

        {view === 'choose' && (
          <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-card border rounded-3xl p-8 space-y-4"
          >
            {/* Sanad — Primary */}
            <button
              onClick={handleSanad}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all text-start group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-base">Continue with Sanad</p>
                  <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Recommended</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Use your Jordanian national digital identity. Secure and instant.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Email */}
            <button
              onClick={() => setView('email')}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-all text-start group"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-base">Continue with Email</p>
                <p className="text-sm text-muted-foreground mt-0.5">Sign in using your email and password.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </button>
          </motion.div>
        )}

        {view === 'email' && (
          <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-card border rounded-3xl p-8 space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="auth-email" className="font-medium">Email address</Label>
              <Input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                className={`h-12 text-base ${errors.email ? 'border-destructive' : ''}`}
                autoComplete="email"
              />
              {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auth-password" className="font-medium">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <Input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                  className={`h-12 text-base pe-11 ${errors.password ? 'border-destructive' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Remember me</Label>
            </div>

            <div className="space-y-3 pt-1">
              <Button className="w-full h-12 rounded-full text-base" onClick={handleEmailSubmit}>
                Sign In <ArrowRight className="ms-2 w-4 h-4" />
              </Button>
              <Button variant="ghost" className="w-full rounded-full" onClick={() => { setView('choose'); setErrors({}); }}>
                ← Back
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
