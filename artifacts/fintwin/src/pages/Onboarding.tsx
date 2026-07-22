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

const STEPS = [
  { num: 1, label: 'Auth' },
  { num: 2, label: 'Identity' },
  { num: 3, label: 'Verify' },
  { num: 4, label: 'Scale' },
  { num: 5, label: 'Classify' },
  { num: 6, label: 'Connect' },
  { num: 7, label: 'Docs' },
  { num: 8, label: 'Consent' },
  { num: 9, label: 'Done' },
];

const OPTIONAL_STEPS = new Set([7]);
const TOTAL = STEPS.length;

export default function Onboarding() {
  const { currentStep } = useOnboarding();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <Navbar />

      <main className="flex-grow flex flex-col py-10 px-4">
        {/* Progress bar */}
        <div className="max-w-4xl mx-auto w-full mb-10">
          <div className="flex items-center justify-between relative">
            {/* Track */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-muted -z-10 rounded-full" />
            {/* Fill */}
            <motion.div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 rounded-full"
              animate={{ width: `${((currentStep - 1) / (TOTAL - 1)) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />

            {STEPS.map((step) => {
              const done = currentStep > step.num;
              const active = currentStep === step.num;
              return (
                <div key={step.num} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-300 ${
                      done
                        ? 'bg-primary border-primary text-primary-foreground'
                        : active
                        ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-md shadow-primary/20'
                        : 'bg-card border-muted text-muted-foreground'
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                  </div>
                  <span className={`text-[10px] font-medium hidden sm:block ${active || done ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                    {OPTIONAL_STEPS.has(step.num) && <span className="ms-0.5 text-primary opacity-70"> *</span>}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Step {currentStep} of {TOTAL}
            {OPTIONAL_STEPS.has(currentStep) && ' · Optional'}
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
