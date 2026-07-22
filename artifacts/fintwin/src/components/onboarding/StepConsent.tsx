import { useState } from "react";
import { motion } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, ShieldCheck } from "lucide-react";

const WILL_ACCESS = [
  'Read bank transactions and account balances',
  'Read JoFotara invoices (issued and received)',
  'Read POS sales and terminal data',
];

const WILL_NEVER = [
  'Move your money or initiate transfers',
  'Make payments on your behalf',
  'Modify or close your bank accounts',
  'Share your data with third parties',
];

export function StepConsent() {
  const { updateState, setCurrentStep } = useOnboarding();
  const [agreed, setAgreed] = useState(false);

  const handleAgree = () => {
    updateState({ consentGiven: true });
    setCurrentStep(9);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-xl mx-auto"
    >
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Review Permissions</h2>
        <p className="text-muted-foreground">
          FinTwin requests permission only to <strong>read</strong> your financial data — nothing more.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {/* We will access */}
        <div className="bg-card border rounded-2xl p-6">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">We will access</h3>
          <ul className="space-y-3">
            {WILL_ACCESS.map(item => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* We will never */}
        <div className="bg-card border rounded-2xl p-6">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">We will never</h3>
          <ul className="space-y-3">
            {WILL_NEVER.map(item => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X className="w-3 h-3 text-destructive" />
                </div>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Checkbox consent */}
      <label className="flex items-start gap-3 cursor-pointer mb-6 select-none">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="w-4 h-4 mt-0.5 accent-primary flex-shrink-0"
        />
        <span className="text-sm text-muted-foreground">
          I have read and agree to the{" "}
          <button type="button" className="text-primary hover:underline font-medium">Privacy Policy</button>
          {" "}and{" "}
          <button type="button" className="text-primary hover:underline font-medium">Terms & Conditions</button>.
          I understand that FinTwin will access my financial data only to generate my Financial Twin.
        </span>
      </label>

      <div className="flex justify-between">
        <Button variant="ghost" className="rounded-full" onClick={() => setCurrentStep(7)}>
          <ArrowLeft className="me-2 w-4 h-4" /> Back
        </Button>
        <Button className="rounded-full px-8" disabled={!agreed} onClick={handleAgree}>
          Agree & Continue
        </Button>
      </div>
    </motion.div>
  );
}
