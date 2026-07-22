import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding, BusinessType, BusinessSector } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";

const BUSINESS_TYPES: BusinessType[] = ['LLC', 'Sole Proprietorship', 'Partnership', 'Other'];

const SECTORS: BusinessSector[] = [
  'Retail & Trade', 'Food & Hospitality', 'Small Manufacturing',
  'Services', 'Professional Services', 'Agriculture', 'Crafts & Trades', 'Other'
];

function regNumberLabel(businessType: BusinessType | '') {
  if (businessType === 'LLC' || businessType === 'Partnership') return 'Commercial Registration Number';
  if (businessType === 'Sole Proprietorship') return 'Registration Number';
  return 'Registration Number';
}

function regNumberPlaceholder(businessType: BusinessType | '') {
  if (businessType === 'LLC') return 'e.g. 12345-LLC';
  if (businessType === 'Sole Proprietorship') return 'e.g. SP-98765';
  return 'Enter registration number';
}

export function Step1Identity() {
  const { state, updateState, setCurrentStep } = useOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!state.businessType) errs.businessType = 'Please select a business type';
    if (state.isOfficiallyRegistered === null) errs.registered = 'Please select an option';
    if (state.isOfficiallyRegistered && !state.registrationNumber.trim())
      errs.registrationNumber = 'Registration number is required';
    return errs;
  };

  const handleNext = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setCurrentStep(3);
  };

  const clear = (key: string) => setErrors(p => { const n = { ...p }; delete n[key]; return n; });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-xl mx-auto"
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Business Information</h2>
        <p className="text-muted-foreground">Tell us about your business to get started.</p>
      </div>

      <div className="space-y-6 bg-card border p-8 rounded-3xl shadow-sm">
        {/* Business Type */}
        <div className="space-y-2">
          <Label className="font-medium">
            Business Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={state.businessType}
            onValueChange={(v: BusinessType) => { updateState({ businessType: v }); clear('businessType'); }}
          >
            <SelectTrigger className={`h-12 text-base ${errors.businessType ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.businessType && <p className="text-destructive text-xs">{errors.businessType}</p>}
        </div>

        {/* Business Sector */}
        <div className="space-y-2">
          <Label className="font-medium">Business Sector</Label>
          <Select
            value={state.businessSector}
            onValueChange={(v: BusinessSector) => updateState({ businessSector: v })}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select sector (optional)" />
            </SelectTrigger>
            <SelectContent>
              {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Registration question */}
        <div className="space-y-3">
          <Label className="font-medium">
            Is your business officially registered? <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={state.isOfficiallyRegistered === null ? '' : state.isOfficiallyRegistered ? 'yes' : 'no'}
            onValueChange={v => { updateState({ isOfficiallyRegistered: v === 'yes' }); clear('registered'); }}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yes" id="reg-yes" />
              <Label htmlFor="reg-yes" className="cursor-pointer font-normal">Yes</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id="reg-no" />
              <Label htmlFor="reg-no" className="cursor-pointer font-normal">No</Label>
            </div>
          </RadioGroup>
          {errors.registered && <p className="text-destructive text-xs">{errors.registered}</p>}
        </div>

        {/* Registration Number — conditional */}
        <AnimatePresence>
          {state.isOfficiallyRegistered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <Label htmlFor="regNumber" className="font-medium">
                {regNumberLabel(state.businessType)} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="regNumber"
                placeholder={regNumberPlaceholder(state.businessType)}
                className={`h-12 text-base ${errors.registrationNumber ? 'border-destructive' : ''}`}
                value={state.registrationNumber}
                onChange={e => { updateState({ registrationNumber: e.target.value }); clear('registrationNumber'); }}
              />
              {errors.registrationNumber && <p className="text-destructive text-xs">{errors.registrationNumber}</p>}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                Your business name will be filled in automatically after verification.
              </p>
            </motion.div>
          )}

          {state.isOfficiallyRegistered === false && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-muted/40 rounded-2xl p-4 text-sm text-muted-foreground">
                No problem — you can still build your Financial Twin. Some financing products require registration later.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="ghost" className="rounded-full" onClick={() => setCurrentStep(1)}>
          <ArrowLeft className="me-2 w-4 h-4" /> Back
        </Button>
        <Button className="rounded-full px-8" onClick={handleNext}>
          Continue <ArrowRight className="ms-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
