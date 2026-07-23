import { useState } from "react";
import { motion } from "framer-motion";
import { useOnboarding, EnterpriseCategory } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";

function formatRevenue(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('en-US');
}

/** Parse a YYYY-MM-DD date string and return how many years ago it was. */
function yearsFromDate(dateStr: string): number {
  const year = parseInt(dateStr.slice(0, 4));
  return new Date().getFullYear() - year;
}

export function Step2Size() {
  const { state, updateState, setCurrentStep } = useOnboarding();

  // If the business is registered, years are auto-calculated and read-only
  const autoYears = state.isOfficiallyRegistered && state.verifiedRegistrationDate
    ? String(yearsFromDate(state.verifiedRegistrationDate))
    : null;

  const [employees, setEmployees] = useState(state.employees || '');
  const [manualYears, setManualYears] = useState(state.yearsInOperation || '');
  const [revenueDisplay, setRevenueDisplay] = useState(() =>
    state.annualRevenue ? parseInt(state.annualRevenue).toLocaleString('en-US') : ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const effectiveYears = autoYears ?? manualYears;

  const handleEmployees = (val: string) => {
    const digits = val.replace(/[^\d]/g, '');
    setEmployees(digits);
    if (errors.employees) setErrors(p => ({ ...p, employees: '' }));
  };

  const handleRevenue = (raw: string) => {
    const formatted = formatRevenue(raw);
    setRevenueDisplay(formatted);
    updateState({ annualRevenue: formatted.replace(/,/g, '') });
    if (errors.revenue) setErrors(p => ({ ...p, revenue: '' }));
  };

  const determineCategory = (): EnterpriseCategory => {
    const emp = parseInt(employees) || 0;
    const revenue = parseInt(state.annualRevenue || '0') || 0;
    if (emp >= 20 || revenue >= 1_000_000) return 'Medium Enterprise';
    if (emp >= 5  || revenue >= 100_000)   return 'Small Enterprise';
    return 'Micro Enterprise';
  };

  const handleNext = () => {
    const errs: Record<string, string> = {};
    if (!employees.trim()) errs.employees = 'Required';
    if (!autoYears && !manualYears.trim()) errs.years = 'Required';
    if (!state.annualRevenue) errs.revenue = 'Please enter annual revenue';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const category = determineCategory();
    updateState({
      category,
      employees,
      yearsInOperation: effectiveYears,
    });
    setCurrentStep(5);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-xl mx-auto"
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Business Size &amp; Scale</h2>
        <p className="text-muted-foreground">Help us understand the scale of your business.</p>
      </div>

      <div className="space-y-6 bg-card border p-8 rounded-3xl shadow-sm">
        {/* Number of employees */}
        <div className="space-y-2">
          <Label className="font-medium">
            Number of Employees <span className="text-destructive">*</span>
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 12"
            value={employees}
            onChange={e => handleEmployees(e.target.value)}
            className={`h-12 text-base ${errors.employees ? 'border-destructive' : ''}`}
          />
          {errors.employees
            ? <p className="text-destructive text-xs">{errors.employees}</p>
            : <p className="text-xs text-muted-foreground">Full-time equivalent headcount.</p>
          }
        </div>

        {/* Years in operation */}
        <div className="space-y-2">
          <Label className="font-medium">
            Years in Operation {!autoYears && <span className="text-destructive">*</span>}
          </Label>
          {autoYears ? (
            // Read-only auto-calculated field for registered businesses
            <div className="flex items-center gap-3 h-12 px-4 rounded-xl border border-border bg-muted/40">
              <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-base font-medium">{autoYears}</span>
              <span className="text-xs text-muted-foreground ms-auto">Auto-calculated from registration date</span>
            </div>
          ) : (
            <>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 5"
                value={manualYears}
                onChange={e => { setManualYears(e.target.value.replace(/[^\d]/g, '')); setErrors(p => ({ ...p, years: '' })); }}
                className={`h-12 text-base ${errors.years ? 'border-destructive' : ''}`}
              />
              {errors.years
                ? <p className="text-destructive text-xs">{errors.years}</p>
                : <p className="text-xs text-muted-foreground">How many years has the business been running?</p>
              }
            </>
          )}
        </div>

        {/* Annual revenue */}
        <div className="space-y-2">
          <Label className="font-medium">
            Annual Revenue <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={revenueDisplay}
              onChange={e => handleRevenue(e.target.value)}
              className={`w-full h-12 text-base px-4 pe-16 rounded-xl border bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                errors.revenue ? 'border-destructive' : 'border-input'
              }`}
            />
            <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground pointer-events-none">
              JOD
            </span>
          </div>
          {errors.revenue
            ? <p className="text-destructive text-xs">{errors.revenue}</p>
            : <p className="text-xs text-muted-foreground">Approximate annual revenue before taxes.</p>
          }
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="ghost" className="rounded-full" onClick={() => setCurrentStep(2)}>
          <ArrowLeft className="me-2 w-4 h-4" /> Back
        </Button>
        <Button className="rounded-full px-8" onClick={handleNext}>
          Continue <ArrowRight className="ms-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
