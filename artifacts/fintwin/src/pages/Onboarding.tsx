import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTranslation } from "react-i18next";
import { Step1Identity } from "@/components/onboarding/Step1Identity";
import { Step2Size } from "@/components/onboarding/Step2Size";
import { Step3Data } from "@/components/onboarding/Step3Data";
import { Step4Receipts } from "@/components/onboarding/Step4Receipts";
import { Step5Complete } from "@/components/onboarding/Step5Complete";
import { Navbar } from "@/components/layout/Navbar";

export default function Onboarding() {
  const { currentStep } = useOnboarding();
  const { t } = useTranslation();

  const steps = [
    { num: 1, label: t('onboarding.steps.identity') },
    { num: 2, label: t('onboarding.steps.size') },
    { num: 3, label: t('onboarding.steps.data') },
    { num: 4, label: t('onboarding.steps.receipts') },
    { num: 5, label: t('onboarding.steps.complete') },
  ];

  const totalSteps = steps.length;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <Navbar />

      <main className="flex-grow flex flex-col py-10 px-4">
        {/* Progress bar */}
        <div className="max-w-3xl mx-auto w-full mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />

            {steps.map((step) => (
              <div key={step.num} className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-colors duration-300 ${
                    currentStep >= step.num
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-card border-muted text-muted-foreground"
                  }`}
                >
                  {step.num}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    currentStep >= step.num ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                  {step.num === 4 && (
                    <span className="ms-1 text-primary opacity-70">{t('common.optional')}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow flex items-start justify-center">
          <div className="w-full">
            <AnimatePresence mode="wait">
              {currentStep === 1 && <Step1Identity key="step1" />}
              {currentStep === 2 && <Step2Size key="step2" />}
              {currentStep === 3 && <Step3Data key="step3" />}
              {currentStep === 4 && <Step4Receipts key="step4" />}
              {currentStep === 5 && <Step5Complete key="step5" />}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
