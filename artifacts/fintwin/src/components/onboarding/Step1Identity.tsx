import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding, BusinessSector } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, ArrowRight } from "lucide-react";

const sectors: BusinessSector[] = [
  'Retail & Trade',
  'Food & Hospitality',
  'Small Manufacturing',
  'Services',
  'Professional Services',
  'Agriculture',
  'Crafts & Trades',
  'Other'
];

export function Step1Identity() {
  const { state, updateState, setCurrentStep } = useOnboarding();
  const [errors, setErrors] = useState<{ name?: string; sector?: string }>({});

  const handleNext = () => {
    const newErrors: { name?: string; sector?: string } = {};
    if (!state.businessName.trim()) newErrors.name = "Required";
    if (!state.businessSector) newErrors.sector = "Required";
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
        <h2 className="text-3xl font-bold mb-2">Your business</h2>
        <p className="text-muted-foreground">Basic details to get started.</p>
      </div>

      <div className="space-y-6 bg-card border p-8 rounded-3xl shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="businessName" className="font-medium">
            Business Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="businessName"
            placeholder="e.g. Amman Coffee Roasters"
            className={`h-12 text-base ${errors.name ? 'border-destructive' : ''}`}
            value={state.businessName}
            onChange={(e) => { updateState({ businessName: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }); }}
          />
          {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sector" className="font-medium">
            Sector <span className="text-destructive">*</span>
          </Label>
          <Select
            value={state.businessSector}
            onValueChange={(value: BusinessSector) => { updateState({ businessSector: value }); if (errors.sector) setErrors({ ...errors, sector: undefined }); }}
          >
            <SelectTrigger id="sector" className={`h-12 text-base ${errors.sector ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {sectors.map(sector => (
                <SelectItem key={sector} value={sector}>{sector}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sector && <p className="text-destructive text-xs">{errors.sector}</p>}
        </div>

        <div className="pt-2 border-t space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Registration Number</Label>
              <p className="text-sm text-muted-foreground">Do you have one?</p>
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
                  placeholder="e.g. 1002394"
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
                  <p className="text-sm">No problem. You can still build a full FinTwin profile. Add it later as your business grows.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-2 flex justify-end">
          <Button size="lg" className="rounded-full px-8 h-12" onClick={handleNext}>
            Continue <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
