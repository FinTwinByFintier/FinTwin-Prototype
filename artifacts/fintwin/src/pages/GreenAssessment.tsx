import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboarding } from "@/context/OnboardingContext";
import {
  ApiError,
  getToken,
  submitGreenAssessment,
  type GreenAssessmentPayload,
  type GreenAssessmentResult,
} from "@/lib/api";
import {
  Zap, Droplets, Car, Award,
  CheckCircle2, ChevronRight, ChevronLeft,
  Loader2, AlertCircle,
} from "lucide-react";

/* ─── Store result for GreenScore page ─────────────────────── */
export let lastGreenAssessmentResult: GreenAssessmentResult | null = null;

const STEPS = [
  { id: "energy", label: "Energy", icon: Zap },
  { id: "water", label: "Water", icon: Droplets },
  { id: "transportation", label: "Transport", icon: Car },
  { id: "certifications", label: "Certifications", icon: Award },
];

const EQUIPMENT_OPTIONS = [
  "LED lighting",
  "Efficient HVAC",
  "Smart thermostat",
  "Energy-efficient appliances",
  "Variable-speed motors",
];

const DELIVERY_OPTIONS = [
  "EV delivery",
  "Bike / cargo bike",
  "Hybrid van",
  "Petrol / diesel fleet",
  "Third-party courier",
];

function ToggleCard({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
        value
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-border hover:border-primary/30 hover:bg-muted/30"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
          value ? "bg-emerald-600 border-emerald-600" : "border-muted-foreground/40"
        }`}
      >
        {value && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </button>
  );
}

function ChipMulti({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((x) => x !== opt));
    else onChange([...value, opt]);
  };
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${
                on
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 font-medium"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
              value === opt.value
                ? "border-primary bg-primary/8 text-primary font-medium"
                : "border-border hover:border-primary/30 hover:bg-muted/30 text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function defaultForm(): GreenAssessmentPayload {
  return {
    solar_panels: false,
    energy_efficient_equipment: [],
    monthly_electricity_consumption: 800,
    energy_monitoring: false,
    renewable_percentage: 0,
    water_source: "municipal",
    water_recycling: false,
    monthly_water_consumption: 25000,
    water_monitoring: false,
    employee_commute: "personal_car",
    ev_charging: false,
    delivery_methods: [],
    route_optimization: false,
    iso14001: false,
    green_building: false,
    local_green_awards: false,
    environmental_audits: false,
    sustainability_report: false,
  };
}

function isStepValid(step: number, form: GreenAssessmentPayload): boolean {
  if (step === 0) {
    return (
      form.renewable_percentage >= 0 &&
      form.renewable_percentage <= 100 &&
      form.monthly_electricity_consumption >= 0
    );
  }
  if (step === 1) return !!form.water_source && form.monthly_water_consumption >= 0;
  if (step === 2) return !!form.employee_commute;
  return true;
}

export default function GreenAssessment() {
  const [, navigate] = useLocation();
  const { state: onboardingState } = useOnboarding();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<GreenAssessmentPayload>(defaultForm);
  const [rawRenewable, setRawRenewable] = useState<string>("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof GreenAssessmentPayload>(k: K, v: GreenAssessmentPayload[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const canAdvance = isStepValid(step, form);
  const isLastStep = step === STEPS.length - 1;
  const fillPct = (step / (STEPS.length - 1)) * 100;

  const handleNext = () => {
    if (!canAdvance) return;
    if (isLastStep) void handleSubmit();
    else setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    // Sector is required — the backend uses it to apply sector-specific weights
    if (!onboardingState.businessSector) {
      setError(
        "Your business sector is required before submitting an assessment. " +
        "Please complete your business profile first.",
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitGreenAssessment(form);
      lastGreenAssessmentResult = result;
      sessionStorage.setItem("ft_green_result", JSON.stringify(result));
      navigate("/green-score");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not submit. Check your connection and try again.",
      );
      setSubmitting(false);
    }
  };

  const StepIcon = STEPS[step].icon;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-10 max-w-2xl">
        <div className="mb-10">
          <div className="flex items-center justify-between relative mb-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-muted rounded-full -z-10" />
            <motion.div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary rounded-full -z-10"
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                      done
                        ? "bg-primary border-primary text-primary-foreground"
                        : active
                          ? "bg-primary border-primary text-primary-foreground scale-110 shadow-md shadow-primary/20"
                          : "bg-card border-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`text-[10px] font-medium hidden sm:block ${
                      active || done ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length} · Sector-weighted green score
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-card border rounded-3xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <StepIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{STEPS[step].label}</h2>
                <p className="text-xs text-muted-foreground">
                  {step === 0 && "Solar, renewables, equipment, and electricity use"}
                  {step === 1 && "Water source, recycling, and monthly consumption"}
                  {step === 2 && "Commute, EV charging, deliveries, and routing"}
                  {step === 3 && "ISO, green building, audits, and reporting"}
                </p>
              </div>
            </div>

            {step === 0 && (
              <div className="space-y-5">
                <ToggleCard
                  label="Solar panels installed"
                  sub="On-site solar generation for the business"
                  value={form.solar_panels}
                  onChange={(v) => set("solar_panels", v)}
                />
                <ToggleCard
                  label="Energy consumption monitoring"
                  sub="Smart meters or monthly tracking"
                  value={form.energy_monitoring}
                  onChange={(v) => set("energy_monitoring", v)}
                />
                <ChipMulti
                  label="Energy-efficient equipment"
                  options={EQUIPMENT_OPTIONS}
                  value={form.energy_efficient_equipment}
                  onChange={(v) => set("energy_efficient_equipment", v)}
                />
                <div className="space-y-2">
                  <Label>Renewable energy share (%)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    value={rawRenewable}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setRawRenewable(raw);
                      if (raw !== "" && raw !== "-") {
                        set("renewable_percentage", Math.min(100, Math.max(0, Number(raw) || 0)));
                      }
                    }}
                    onBlur={() => {
                      // Normalise on blur: empty → 0
                      const n = Math.min(100, Math.max(0, Number(rawRenewable) || 0));
                      set("renewable_percentage", n);
                      setRawRenewable(String(n));
                    }}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly electricity consumption (kWh)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.monthly_electricity_consumption}
                    onChange={(e) =>
                      set("monthly_electricity_consumption", Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <RadioGroup
                  label="Primary water source"
                  value={form.water_source}
                  onChange={(v) => set("water_source", v)}
                  options={[
                    { value: "municipal", label: "Municipal network" },
                    { value: "well", label: "Private well" },
                    { value: "rain", label: "Rainwater harvesting" },
                    { value: "recycled", label: "Recycled / greywater" },
                  ]}
                />
                <ToggleCard
                  label="Water recycling or reuse"
                  value={form.water_recycling}
                  onChange={(v) => set("water_recycling", v)}
                />
                <ToggleCard
                  label="Water usage monitoring"
                  value={form.water_monitoring}
                  onChange={(v) => set("water_monitoring", v)}
                />
                <div className="space-y-2">
                  <Label>Monthly water consumption (liters)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.monthly_water_consumption}
                    onChange={(e) =>
                      set("monthly_water_consumption", Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <RadioGroup
                  label="Typical employee commute"
                  value={form.employee_commute}
                  onChange={(v) => set("employee_commute", v)}
                  options={[
                    { value: "public_transit", label: "Public transit" },
                    { value: "personal_car", label: "Personal car" },
                    { value: "carpool", label: "Carpool / shared" },
                    { value: "walk_bike", label: "Walk / bike" },
                    { value: "remote", label: "Mostly remote / WFH" },
                  ]}
                />
                <ToggleCard
                  label="EV charging available"
                  value={form.ev_charging}
                  onChange={(v) => set("ev_charging", v)}
                />
                <ToggleCard
                  label="Route optimization for deliveries"
                  value={form.route_optimization}
                  onChange={(v) => set("route_optimization", v)}
                />
                <ChipMulti
                  label="Delivery methods used"
                  options={DELIVERY_OPTIONS}
                  value={form.delivery_methods}
                  onChange={(v) => set("delivery_methods", v)}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <ToggleCard
                  label="ISO 14001 certified"
                  value={form.iso14001}
                  onChange={(v) => set("iso14001", v)}
                />
                <ToggleCard
                  label="Green building certification"
                  value={form.green_building}
                  onChange={(v) => set("green_building", v)}
                />
                <ToggleCard
                  label="Local green awards"
                  value={form.local_green_awards}
                  onChange={(v) => set("local_green_awards", v)}
                />
                <ToggleCard
                  label="Environmental audits"
                  value={form.environmental_audits}
                  onChange={(v) => set("environmental_audits", v)}
                />
                <ToggleCard
                  label="Published sustainability report"
                  value={form.sustainability_report}
                  onChange={(v) => set("sustainability_report", v)}
                />
              </div>
            )}

            {!canAdvance && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5 mt-4">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Please complete the required fields before continuing.
              </p>
            )}

            {error && isLastStep && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            className="rounded-full gap-1.5"
            onClick={() => (step > 0 ? setStep((s) => s - 1) : navigate("/dashboard"))}
            disabled={submitting}
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>

          <Button
            className="rounded-full gap-1.5 min-w-32"
            onClick={handleNext}
            disabled={!canAdvance || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
              </>
            ) : isLastStep ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Submit
              </>
            ) : (
              <>
                Next <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
