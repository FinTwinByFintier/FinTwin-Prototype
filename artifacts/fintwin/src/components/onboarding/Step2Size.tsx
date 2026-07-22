import { useState } from "react";
import { motion } from "framer-motion";
import { useOnboarding, EnterpriseCategory } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Minus, Plus } from "lucide-react";

function formatRevenue(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('en-US');
}

function Stepper({ label, value, onChange, min = 0, unit }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; unit?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="font-medium">{label}</Label>
      <div className="flex items-center gap-4 bg-muted/30 border rounded-2xl p-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-10 h-10 rounded-full border bg-card flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 flex-shrink-0"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-3xl font-bold tabular-nums">{value}</span>
          {unit && <span className="text-muted-foreground text-sm ms-2">{unit}</span>}
        </div>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-10 h-10 rounded-full border bg-card flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function Step2Size() {
  const { state, updateState, setCurrentStep } = useOnboarding();

  const [employees, setEmployees] = useState(() => parseInt(state.employees) || 0);
  const [years, setYears] = useState(() => parseInt(state.yearsInOperation) || 0);
  const [revenueDisplay, setRevenueDisplay] = useState(() =>
    state.annualRevenue ? parseInt(state.annualRevenue).toLocaleString('en-US') : ''
  );
  const [errors, setErrors] = useState<{ revenue?: string }>({});

  const handleEmployees = (v: number) => {
    setEmployees(v);
    updateState({ employees: String(v) });
  };

  const handleYears = (v: number) => {
    setYears(v);
    updateState({ yearsInOperation: String(v) });
  };

  const handleRevenue = (raw: string) => {
    const formatted = formatRevenue(raw);
    setRevenueDisplay(formatted);
    const numeric = formatted.replace(/,/g, '');
    updateState({ annualRevenue: numeric });
    if (errors.revenue) setErrors({});
  };

  const determineCategory = (): EnterpriseCategory => {
    const revenue = parseInt(state.annualRevenue || '0') || 0;
    if (employees >= 20 || revenue >= 1_000_000) return 'Medium Enterprise';
    if (employees >= 5 || revenue >= 100_000) return 'Small Enterprise';
    return 'Micro Enterprise';
  };

  const handleNext = () => {
    if (!state.annualRevenue) { setErrors({ revenue: 'Please enter annual revenue' }); return; }
    const category = determineCategory();
    updateState({ category, employees: String(employees), yearsInOperation: String(years) });
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
        <h2 className="text-3xl font-bold mb-2">Business Size & Scale</h2>
        <p className="text-muted-foreground">Help us understand the scale of your business.</p>
      </div>

      <div className="space-y-8 bg-card border p-8 rounded-3xl shadow-sm">
        <Stepper
          label="Number of Employees"
          value={employees}
          onChange={handleEmployees}
          min={0}
          unit="employees"
        />

        <Stepper
          label="Years in Operation"
          value={years}
          onChange={handleYears}
          min={0}
          unit="years"
        />

        {/* Annual Revenue */}
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
              className={`w-full h-14 text-xl font-semibold px-4 pe-20 rounded-xl border bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${errors.revenue ? 'border-destructive' : 'border-input'}`}
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
        <Button variant="ghost" className="rounded-full" onClick={() => setCurrentStep(3)}>
          <ArrowLeft className="me-2 w-4 h-4" /> Back
        </Button>
        <Button className="rounded-full px-8" onClick={handleNext}>
          Continue <ArrowRight className="ms-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
