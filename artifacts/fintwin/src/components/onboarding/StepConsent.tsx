import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const PRIVACY_SECTIONS = [
  {
    title: "1. Data Collection",
    body: "We collect business registration data, financial transaction history (via Open Banking), e-invoice records (via JoFotara), POS sales data, and documents you upload. We only collect data necessary to generate your Financial Twin and improve your financing readiness.",
  },
  {
    title: "2. Data Storage",
    body: "All data is stored on servers located within the region and protected by industry-standard access controls. Data is retained for the duration of your account and deleted within 30 days of account closure, unless a longer retention period is required by law.",
  },
  {
    title: "3. Encryption",
    body: "All data in transit is encrypted using TLS 1.3. Sensitive financial data at rest is encrypted using AES-256. FinTwin staff access to raw financial data is strictly limited and logged for audit purposes.",
  },
  {
    title: "4. Third-Party Integrations",
    body: "FinTwin integrates with Sanad (national digital identity), Jordan Open Banking providers, JoFotara (national e-invoicing), and POS providers. These integrations are read-only. We do not share your data with lenders or third parties without your explicit, per-request approval.",
  },
  {
    title: "5. Your Rights",
    body: "You have the right to access, correct, export, or delete your personal and financial data at any time from your account settings. To exercise any right or raise a concern, contact our Data Protection Officer at privacy@fintwin.jo.",
  },
];

function DocModal({
  open,
  onClose,
  title,
  sections,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sections: { title: string; body: string }[];
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

// ── Consent items ───────────────────────────────────────────────────────────────
const CONSENT_ITEMS = [
  {
    id: 'openbanking',
    label: 'Access Open Banking transaction history',
    description: 'Used only to calculate cash flow, income stability, and financing readiness.',
  },
  {
    id: 'jofotara',
    label: 'Access JoFotara invoices',
    description: 'Read-only access to issued and received e-invoices for revenue and activity analysis.',
  },
  {
    id: 'pos',
    label: 'Access POS transaction summaries',
    description: 'Used to estimate monthly sales volume and business activity patterns.',
  },
  {
    id: 'registration',
    label: 'Verify business registration',
    description: 'Confirms your legal entity status with the Companies Control Department.',
  },
  {
    id: 'documents',
    label: 'Use uploaded documents for financial analysis',
    description: 'Receipts and statements are analysed to supplement your Financial Twin profile.',
  },
];

function ConsentCheckbox({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex items-start gap-4 cursor-pointer group">
      <div className="flex-shrink-0 mt-0.5">
        <div
          onClick={() => onChange(!checked)}
          className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
            checked
              ? 'bg-primary border-primary'
              : 'border-muted-foreground/40 group-hover:border-primary/60'
          }`}
        >
          {checked && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
        </div>
      </div>
      <div className="flex-1 min-w-0" onClick={() => onChange(!checked)}>
        <p className={`text-sm font-medium ${checked ? 'text-foreground' : 'text-foreground/80'}`}>{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </label>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function StepConsent() {
  const { updateState, setCurrentStep } = useOnboarding();

  const [consentChecks, setConsentChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(CONSENT_ITEMS.map(i => [i.id, false]))
  );
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const allConsentGiven =
    Object.values(consentChecks).every(Boolean) && termsChecked && privacyChecked;

  const handleToggle = (id: string, val: boolean) =>
    setConsentChecks(p => ({ ...p, [id]: val }));

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
      <div className="mb-6 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Data Sharing Consent</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          To generate your Credit Readiness Score, FinTwin requires your permission to securely access selected financial and business information.
        </p>
      </div>

      {/* Per-item consent checkboxes */}
      <div className="bg-card border rounded-2xl p-6 mb-4 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Permissions requested</p>
        {CONSENT_ITEMS.map(item => (
          <ConsentCheckbox
            key={item.id}
            checked={consentChecks[item.id]}
            onChange={v => handleToggle(item.id, v)}
            label={item.label}
            description={item.description}
          />
        ))}
      </div>

      {/* T&C + Privacy Policy */}
      <div className="bg-card border rounded-2xl p-6 mb-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Legal agreements</p>

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
            I have read and agree to the{" "}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setShowTerms(true); }}
              className="text-primary hover:underline font-medium"
            >
              Terms &amp; Conditions
            </button>
          </p>
        </label>

        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="flex-shrink-0 mt-0.5">
            <div
              onClick={() => setPrivacyChecked(p => !p)}
              className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                privacyChecked ? 'bg-primary border-primary' : 'border-muted-foreground/40 group-hover:border-primary/60'
              }`}
            >
              {privacyChecked && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed" onClick={() => setPrivacyChecked(p => !p)}>
            I have read and agree to the{" "}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setShowPrivacy(true); }}
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
        <Button variant="ghost" className="rounded-full" onClick={() => setCurrentStep(7)}>
          <ArrowLeft className="me-2 w-4 h-4" /> Back
        </Button>
        <Button className="rounded-full px-8" disabled={!allConsentGiven} onClick={handleAgree}>
          Agree &amp; Continue
        </Button>
      </div>

      {/* Modals */}
      <DocModal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        title="Terms & Conditions"
        sections={TERMS_SECTIONS}
      />
      <DocModal
        open={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Privacy Policy"
        sections={PRIVACY_SECTIONS}
      />
    </motion.div>
  );
}
