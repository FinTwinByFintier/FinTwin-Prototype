import { useState } from "react";
import { motion } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";

// ── Placeholder document content ───────────────────────────────────────────────
const TERMS_SECTIONS = [
  {
    title: "1. Platform Usage",
    body: "FinTwin grants you a limited, non-exclusive, non-transferable licence to access and use the platform solely for the purpose of generating your Financial Twin profile and exploring financing opportunities. You agree not to misuse the platform, circumvent security controls, or use it for any unlawful purpose.",
  },
  {
    title: "2. Data Processing",
    body: "By using FinTwin, you authorise the platform to collect, process, and analyse your financial data — including bank transactions, invoice records, and POS sales — for the sole purpose of generating credit readiness and financing readiness scores. Data is processed in accordance with Jordanian data protection regulations.",
  },
  {
    title: "3. User Responsibilities",
    body: "You are responsible for ensuring that all information provided is accurate and up to date. You must not impersonate another business, misrepresent your financial position, or submit fraudulent documents. FinTwin reserves the right to suspend accounts where misuse is detected.",
  },
  {
    title: "4. Financing Disclaimer",
    body: "FinTwin does not provide financing directly. The platform generates readiness scores and matches businesses with potential financing providers. Any financing decision is made solely by the relevant financial institution. FinTwin does not guarantee approval, specific terms, or any financing outcome.",
  },
];

function DocModal({
  open, onClose, title, sections,
}: {
  open: boolean; onClose: () => void; title: string; sections: { title: string; body: string }[];
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground mb-4">Last updated: July 2026 · Effective immediately</p>
        <div className="space-y-5">
          {sections.map(s => (
            <div key={s.title}>
              <h3 className="font-semibold mb-1 text-sm">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t mt-4">
          <Button className="w-full rounded-full" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StepConsent() {
  const { updateState, setCurrentStep, persistProfile } = useOnboarding();
  const [termsChecked, setTermsChecked] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleAgree = () => {
    updateState({ consentGiven: true });
    void persistProfile({ consent_given: true });
    setCurrentStep(7);
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
        <h2 className="text-3xl font-bold mb-2">Data Sharing Consent</h2>
      </div>

      {/* Authorization paragraph */}
      <div className="bg-card border rounded-2xl p-6 mb-4">
        <p className="text-sm text-foreground/80 leading-relaxed">
          By continuing, you authorize FinTwin to securely retrieve and process your business information
          from the connected services solely for generating your{" "}
          <span className="font-semibold text-foreground">Credit Readiness Score</span> and financing insights.
          This authorization is limited to read-only access and does not permit FinTwin to initiate transactions,
          move funds, or modify any account on your behalf.
        </p>
      </div>

      {/* T&C checkbox */}
      <div className="bg-card border rounded-2xl p-6 mb-4">
        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="flex-shrink-0 mt-0.5">
            <div
              onClick={() => setTermsChecked(p => !p)}
              className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                termsChecked ? 'bg-primary border-primary' : 'border-muted-foreground/40 group-hover:border-primary/60'
              }`}
            >
              {termsChecked && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed" onClick={() => setTermsChecked(p => !p)}>
            I agree to the{" "}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setShowTerms(true); }}
              className="text-primary hover:underline font-medium"
            >
              Terms &amp; Conditions
            </button>
            {" "}and acknowledge the{" "}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setShowTerms(true); }}
              className="text-primary hover:underline font-medium"
            >
              Privacy Policy
            </button>
          </p>
        </label>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-5 py-4 mb-6">
        <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-700 leading-relaxed">
          Your data is encrypted, securely stored, and will never be shared with lenders without your explicit approval.
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" className="rounded-full" onClick={() => setCurrentStep(5)}>
          <ArrowLeft className="me-2 w-4 h-4" /> Back
        </Button>
        <Button className="rounded-full px-8" disabled={!termsChecked} onClick={handleAgree}>
          Agree &amp; Continue
        </Button>
      </div>

      <DocModal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        title="Terms & Conditions and Privacy Policy"
        sections={TERMS_SECTIONS}
      />
    </motion.div>
  );
}
