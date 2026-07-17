import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding, BusinessSector } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const SECTOR_VALUES: BusinessSector[] = [
  'Retail & Trade',
  'Food & Hospitality',
  'Small Manufacturing',
  'Services',
  'Professional Services',
  'Agriculture',
  'Crafts & Trades',
  'Other'
];

const SECTOR_KEYS: Record<BusinessSector, string> = {
  'Retail & Trade':      'onboarding.step1.sectors.retail',
  'Food & Hospitality':  'onboarding.step1.sectors.food',
  'Small Manufacturing': 'onboarding.step1.sectors.manufacturing',
  'Services':            'onboarding.step1.sectors.services',
  'Professional Services':'onboarding.step1.sectors.professional',
  'Agriculture':         'onboarding.step1.sectors.agriculture',
  'Crafts & Trades':     'onboarding.step1.sectors.crafts',
  'Other':               'onboarding.step1.sectors.other',
};

export function Step1Identity() {
  const { state, updateState, setCurrentStep } = useOnboarding();
  const { t } = useTranslation();
  const [errors, setErrors] = useState<{ name?: string; sector?: string }>({});

  const handleNext = () => {
    const newErrors: { name?: string; sector?: string } = {};
    if (!state.businessName.trim()) newErrors.name = t('common.required');
    if (!state.businessSector) newErrors.sector = t('common.required');
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setCurrentStep(2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-xl mx-auto"
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">{t('onboarding.step1.heading')}</h2>
        <p className="text-muted-foreground">{t('onboarding.step1.sub')}</p>
      </div>

      <div className="space-y-6 bg-card border p-8 rounded-3xl shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="businessName" className="font-medium">
            {t('onboarding.step1.businessName')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="businessName"
            placeholder={t('onboarding.step1.businessNamePlaceholder')}
            className={`h-12 text-base ${errors.name ? 'border-destructive' : ''}`}
            value={state.businessName}
            onChange={(e) => { updateState({ businessName: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }); }}
          />
          {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sector" className="font-medium">
            {t('onboarding.step1.sector')} <span className="text-destructive">*</span>
          </Label>
          <Select
            value={state.businessSector}
            onValueChange={(value: BusinessSector) => { updateState({ businessSector: value }); if (errors.sector) setErrors({ ...errors, sector: undefined }); }}
          >
            <SelectTrigger id="sector" className={`h-12 text-base ${errors.sector ? 'border-destructive' : ''}`}>
              <SelectValue placeholder={t('onboarding.step1.sectorPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {SECTOR_VALUES.map(sector => (
                <SelectItem key={sector} value={sector}>{t(SECTOR_KEYS[sector])}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sector && <p className="text-destructive text-xs">{errors.sector}</p>}
        </div>

        <div className="pt-2 border-t space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">{t('onboarding.step1.registrationNumber')}</Label>
              <p className="text-sm text-muted-foreground">{t('onboarding.step1.doYouHaveOne')}</p>
            </div>
            <Switch
              checked={state.hasRegistrationNumber}
              onCheckedChange={(checked) => updateState({ hasRegistrationNumber: checked })}
            />
          </div>

          <AnimatePresence mode="wait">
            {state.hasRegistrationNumber ? (
              <motion.div
                key="has-reg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Input
                  id="regNumber"
                  placeholder={t('onboarding.step1.registrationNumberPlaceholder')}
                  className="h-12 text-base"
                  value={state.registrationNumber}
                  onChange={(e) => updateState({ registrationNumber: e.target.value })}
                />
              </motion.div>
            ) : (
              <motion.div
                key="no-reg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-4 flex gap-3 text-blue-800 dark:text-blue-300">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{t('onboarding.step1.noRegNote')}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-2 flex justify-end">
          <Button size="lg" className="rounded-full px-8 h-12" onClick={handleNext}>
            {t('onboarding.step1.continueBtn')} <ArrowRight className="ms-2 w-4 h-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
