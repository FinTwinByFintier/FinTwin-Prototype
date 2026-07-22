import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, ArrowRight, Building2, Loader2, RotateCcw } from "lucide-react";

type Status = 'loading' | 'success' | 'error';

const LOADING_MESSAGES = [
  'Verifying business registration…',
  'Checking official records…',
  'Cross-referencing registry database…',
  'Almost done…',
];

// Simulated verified business data based on registration number
function getMockVerification(regNumber: string, businessType: string) {
  const seed = regNumber.length + businessType.length;
  const names = ['Al Noor Trading Co.', 'Jordan Fresh Foods LLC', 'Al Baraka Services', 'Amman Craft Studio', 'Green Valley Enterprise'];
  const entities = ['Limited Liability Company', 'Sole Proprietorship', 'Partnership', 'LLC'];
  const sectors = ['Retail & Trade', 'Food & Hospitality', 'Services', 'Crafts & Trades', 'Small Manufacturing'];
  const years = ['2018', '2019', '2020', '2021', '2022'];
  return {
    businessName: names[seed % names.length],
    legalEntity: entities[seed % entities.length],
    registrationDate: `${['Jan','Mar','Jun','Sep','Nov'][seed % 5]} ${years[seed % years.length]}`,
    sector: sectors[seed % sectors.length] as any,
  };
}

export function StepVerification() {
  const { state, updateState, setCurrentStep } = useOnboarding();
  const [status, setStatus] = useState<Status>('loading');
  const [msgIdx, setMsgIdx] = useState(0);
  const [verified, setVerified] = useState<ReturnType<typeof getMockVerification> | null>(null);

  const runVerification = () => {
    setStatus('loading');
    setMsgIdx(0);

    // Cycle through messages
    const interval = setInterval(() => {
      setMsgIdx(i => {
        if (i >= LOADING_MESSAGES.length - 1) { clearInterval(interval); return i; }
        return i + 1;
      });
    }, 700);

    // Resolve after ~3s. If no registration number, simulate error.
    setTimeout(() => {
      clearInterval(interval);
      if (!state.registrationNumber && state.isOfficiallyRegistered) {
        setStatus('error');
      } else {
        const data = getMockVerification(state.registrationNumber || 'DEFAULT', state.businessType);
        setVerified(data);
        updateState({
          businessName: data.businessName,
          businessSector: data.sector,
          verifiedLegalEntity: data.legalEntity,
          verifiedRegistrationDate: data.registrationDate,
        });
        setStatus('success');
      }
    }, 3000);
  };

  useEffect(() => { runVerification(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-xl mx-auto"
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Registration Verification</h2>
        <p className="text-muted-foreground">We're checking your business details with official records.</p>
      </div>

      <AnimatePresence mode="wait">
        {/* Loading */}
        {status === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-card border rounded-3xl p-12 flex flex-col items-center gap-6 text-center"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
              <Loader2 className="absolute -bottom-1 -right-1 w-7 h-7 text-primary animate-spin bg-card rounded-full p-0.5" />
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={msgIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-lg font-medium"
              >
                {LOADING_MESSAGES[msgIdx]}
              </motion.p>
            </AnimatePresence>
            {/* Skeleton rows */}
            <div className="w-full space-y-2 mt-2">
              {[80, 60, 70, 50].map((w, i) => (
                <div key={i} className="h-3 bg-muted rounded-full animate-pulse mx-auto" style={{ width: `${w}%` }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Success */}
        {status === 'success' && verified && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border-2 border-primary/20 rounded-3xl p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-primary">Verification Successful</p>
                <p className="text-xs text-muted-foreground">Business found in official registry</p>
              </div>
            </div>

            <div className="space-y-4">
              <VerifyRow label="Company Name" value={verified.businessName} highlight />
              <VerifyRow label="Legal Entity" value={verified.legalEntity} />
              <VerifyRow label="Registration Status" value="Active ✓" statusGreen />
              <VerifyRow label="Registration Date" value={verified.registrationDate} />
              <VerifyRow label="Sector" value={verified.sector} />
            </div>

            <div className="mt-6 bg-muted/40 rounded-2xl p-3 text-xs text-muted-foreground">
              ✓ Business name, type, and sector have been auto-filled from registry data.
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="ghost" className="rounded-full" onClick={() => setCurrentStep(2)}>
                ← Edit Details
              </Button>
              <Button className="rounded-full px-8" onClick={() => setCurrentStep(4)}>
                Continue <ArrowRight className="ms-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {status === 'error' && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border-2 border-destructive/20 rounded-3xl p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Verification Failed</h3>
            <p className="text-muted-foreground text-sm mb-6">
              We couldn't find a matching business record. Please check your registration number and try again.
            </p>
            <div className="flex flex-col gap-3">
              <Button variant="outline" className="rounded-full gap-2" onClick={() => setCurrentStep(2)}>
                <RotateCcw className="w-4 h-4" /> Edit Details
              </Button>
              <Button className="rounded-full" onClick={runVerification}>
                Retry Verification
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function VerifyRow({ label, value, highlight, statusGreen }: { label: string; value: string; highlight?: boolean; statusGreen?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-foreground font-semibold' : ''} ${statusGreen ? 'text-emerald-600' : ''}`}>
        {value}
      </span>
    </div>
  );
}
