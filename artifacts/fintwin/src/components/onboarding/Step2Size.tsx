import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding, EnterpriseCategory } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Step2Size() {
  const { state, updateState, setCurrentStep } = useOnboarding();
  const { t } = useTranslation();
  const [showReveal, setShowReveal] = useState(false);

  const isFormComplete =
    state.employees.trim() !== "" &&
    state.annualRevenue.trim() !== "" &&
    state.yearsInOperation !== "";

  const determineCategory = (): EnterpriseCategory => {
    const empCount = parseInt(state.employees) || 0;
    const revenue = parseFloat(state.annualRevenue) || 0;
    if (empCount >= 20 || revenue >= 1_000_000) return "Medium Enterprise";
    if (empCount >= 5 || revenue >= 100_000) return "Small Enterprise";
    return "Micro Enterprise";
  };

  const handleReveal = () => {
    const category = determineCategory();
    updateState({ category });
    setShowReveal(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-xl mx-auto"
    >
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold mb-3">{t('onboarding.step2.heading')}</h2>
        <p className="text-muted-foreground">{t('onboarding.step2.sub')}</p>
      </div>

      <AnimatePresence mode="wait">
        {!showReveal ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8 bg-card border p-8 rounded-3xl shadow-sm"
          >
            {/* Employees */}
            <div className="space-y-3">
              <Label htmlFor="employees" className="text-base font-medium">
                {t('onboarding.step2.employees')}
              </Label>
              <div className="relative">
                <Input
                  id="employees"
                  type="number"
                  min={1}
                  placeholder={t('onboarding.step2.employeesPlaceholder')}
                  value={state.employees}
                  onChange={(e) => updateState({ employees: e.target.value })}
                  className="h-12 text-lg pe-24"
                />
                <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  {t('onboarding.step2.employeeUnit')}
                </span>
              </div>
            </div>

            {/* Years in Operation */}
            <div className="space-y-3">
              <Label htmlFor="years" className="text-base font-medium">{t('onboarding.step2.yearsInOperation')}</Label>
              <div className="relative">
                <Input
                  id="years"
                  type="number"
                  min={0}
                  placeholder={t('onboarding.step2.yearsPlaceholder')}
                  value={state.yearsInOperation}
                  onChange={(e) => updateState({ yearsInOperation: e.target.value })}
                  className="h-12 text-lg pe-16"
                />
                <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  {t('onboarding.step2.yearUnit')}
                </span>
              </div>
            </div>

            {/* Annual Revenue */}
            <div className="space-y-3">
              <Label htmlFor="revenue" className="text-base font-medium">
                {t('onboarding.step2.annualRevenue')}
              </Label>
              <div className="relative">
                <span className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">
                  {t('common.jod')}
                </span>
                <Input
                  id="revenue"
                  type="number"
                  min={0}
                  placeholder={t('onboarding.step2.revenuePlaceholder')}
                  value={state.annualRevenue}
                  onChange={(e) => updateState({ annualRevenue: e.target.value })}
                  className="h-12 text-lg ps-14"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('onboarding.step2.revenueSub')}</p>
            </div>

            <div className="pt-6 flex justify-between">
              <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="me-2 w-4 h-4 rtl:rotate-180" /> {t('common.back')}
              </Button>
              <Button
                size="lg"
                className="rounded-full px-8 h-12"
                disabled={!isFormComplete}
                onClick={handleReveal}
              >
                {t('onboarding.step2.calculateTier')} <ArrowRight className="ms-2 w-4 h-4 rtl:rotate-180" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border-2 border-primary/20 p-10 rounded-3xl shadow-lg text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Building2 className="w-10 h-10 text-primary" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
                  {t('onboarding.step2.classificationTitle')}
                </h3>
                <h2 className="text-4xl font-bold mb-4">{state.category}</h2>
                <p className="text-muted-foreground mb-10 max-w-sm mx-auto">
                  {t('onboarding.step2.classificationSub')}
                </p>

                <div className="flex justify-center gap-4">
                  <Button variant="outline" className="rounded-full" onClick={() => setShowReveal(false)}>
                    {t('onboarding.step2.changeDetails')}
                  </Button>
                  <Button size="lg" className="rounded-full px-8" onClick={() => setCurrentStep(3)}>
                    <CheckCircle2 className="me-2 w-5 h-5" /> {t('onboarding.step2.thisLooksRight')}
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
