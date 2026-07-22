import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { StepAuth } from "@/components/onboarding/StepAuth";
import { Step1Identity } from "@/components/onboarding/Step1Identity";
import { StepVerification } from "@/components/onboarding/StepVerification";
import { Step2Size } from "@/components/onboarding/Step2Size";
import { StepClassification } from "@/components/onboarding/StepClassification";
import { Step3Data } from "@/components/onboarding/Step3Data";
import { Step4Receipts } from "@/components/onboarding/Step4Receipts";
import { StepConsent } from "@/components/onboarding/StepConsent";
import { Step5Complete } from "@/components/onboarding/Step5Complete";
import { Navbar } from "@/components/layout/Navbar";
import { CheckCircle2 } from "lucide-react";

// Only these steps appear in the progress bar.
// Internal steps 1 (Auth), 3 (Verify), 5 (Classify) are hidden from the bar.
const VISIBLE_STEPS = [
  { label: 'Identity',  internalStep: 2 },
  { label: 'Scale',     internalStep: 4 },
  { label: 'Connect',   internalStep: 6 },
  { label: 'Docs',      internalStep: 7 },
  { label: 'Consent',   internalStep: 8 },
  { label: 'Complete',  internalStep: 9 },
];

const OPTIONAL_INTERNAL = new Set([7]);

/** Map the current internal step number to a visible-step index (0-based). */
function getVisibleIndex(internalStep: number): number {
  if (internalStep <= 2) return 0; // Identity
  if (internalStep <= 4) return 1; // Scale
  if (internalStep <= 6) return 2; // Connect
  if (internalStep === 7) return 3; // Docs
  if (internalStep === 8) return 4; // Consent
  return 5;                         // Complete
}

export default function Onboarding() {
  const { currentStep } = useOnboarding();

  const visibleIdx = getVisibleIndex(currentStep);
  const totalVisible = VISIBLE_STEPS.length;
  const fillPct = (visibleIdx / (totalVisible - 1)) * 100;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <Navbar />

      <main className="flex-grow flex flex-col py-10 px-4">
        {/* Progress bar — 6 visible steps */}
        <div className="max-w-3xl mx-auto w-full mb-10">
          <div className="flex items-center justify-between relative">
            {/* Track */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-muted -z-10 rounded-full" />
            {/* Fill */}
            <motion.div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 rounded-full"
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />

            {VISIBLE_STEPS.map((step, i) => {
              const done   = visibleIdx > i;
              const active = visibleIdx === i;
              return (
                <div key={step.label} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-300 ${
                      done
                        ? 'bg-primary border-primary text-primary-foreground'
                        : active
                        ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-md shadow-primary/20'
                        : 'bg-card border-muted text-muted-foreground'
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium hidden sm:block ${active || done ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                    {OPTIONAL_INTERNAL.has(step.internalStep) && (
                      <span className="ms-0.5 text-primary opacity-70"> *</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Step {visibleIdx + 1} of {totalVisible}
            {OPTIONAL_INTERNAL.has(currentStep) && ' · Optional'}
          </p>
        </div>

        {/* Step content */}
        <div className="flex-grow flex items-start justify-center">
          <div className="w-full">
            <AnimatePresence mode="wait">
              {currentStep === 1 && <StepAuth key="step-auth" />}
              {currentStep === 2 && <Step1Identity key="step-identity" />}
              {currentStep === 3 && <StepVerification key="step-verify" />}
              {currentStep === 4 && <Step2Size key="step-size" />}
              {currentStep === 5 && <StepClassification key="step-classify" />}
              {currentStep === 6 && <Step3Data key="step-data" />}
              {currentStep === 7 && <Step4Receipts key="step-receipts" />}
              {currentStep === 8 && <StepConsent key="step-consent" />}
              {currentStep === 9 && <Step5Complete key="step-complete" />}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
