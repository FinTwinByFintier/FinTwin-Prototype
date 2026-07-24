import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  ApiError,
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

/* ─── Step config ───────────────────────────────────────────── */
const STEPS = [
  { id: "energy",          label: "Energy",         icon: Zap      },
  { id: "water",           label: "Water",          icon: Droplets },
  { id: "transportation",  label: "Transport",      icon: Car      },
  { id: "certifications",  label: "Certifications", icon: Award    },
];

/* ─── Field helpers ─────────────────────────────────────────── */
function ToggleCard({
  label, sub, value, onChange,
}: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
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
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
        value ? "bg-emerald-600 border-emerald-600" : "border-muted-foreground/40"
      }`}>
        {value && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </button>
  );
}

function RadioGroup({
  label, options, value, onChange,
}: { label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => (
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

/* ─── Step panels ───────────────────────────────────────────── */
function EnergyStep({
  form, set,
}: { form: GreenAssessmentPayload; set: <K extends keyof GreenAssessmentPayload>(k: K, v: GreenAssessmentPayload[K]) => void }) {
  return (
    <div className="space-y-5">
      <RadioGroup
        label="Primary energy source"
        value={form.energy_source}
        onChange={v => set("energy_source", v)}
        options={[
          { value: "grid",   label: "⚡ National grid" },
          { value: "solar",  label: "☀️ Solar only" },
          { value: "mixed",  label: "🔀 Grid + Solar" },
          { value: "other",  label: "🔧 Other" },
        ]}
      />
      <RadioGroup
        label="Renewable energy share"
        value={form.renewable_energy_pct}
        onChange={v => set("renewable_energy_pct", v)}
        options={[
          { value: "0",      label: "None (0%)" },
          { value: "1-25",   label: "Low (1–25%)" },
          { value: "26-50",  label: "Moderate (26–50%)" },
          { value: "51-75",  label: "High (51–75%)" },
          { value: "76-100", label: "Mostly renewable (76–100%)" },
        ]}
      />
      <div className="space-y-2">
        <p className="text-sm font-medium">Energy practices</p>
        <ToggleCard
          label="LED / energy-efficient lighting"
          sub="All or most of your lighting uses energy-efficient bulbs"
          value={form.energy_efficient_lighting}
          onChange={v => set("energy_efficient_lighting", v)}
        />
        <ToggleCard
          label="Energy consumption monitoring"
          sub="You track monthly electricity use or have smart meters"
          value={form.energy_monitoring}
          onChange={v => set("energy_monitoring", v)}
        />
      </div>
    </div>
  );
}

function WaterStep({
  form, set,
}: { form: GreenAssessmentPayload; set: <K extends keyof GreenAssessmentPayload>(k: K, v: GreenAssessmentPayload[K]) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Water practices</p>
      <ToggleCard
        label="Water-efficient fixtures"
        sub="Low-flow taps, dual-flush toilets, or similar"
        value={form.water_efficient_fixtures}
        onChange={v => set("water_efficient_fixtures", v)}
      />
      <ToggleCard
        label="Water usage monitoring"
        sub="You track monthly water consumption"
        value={form.water_monitoring}
        onChange={v => set("water_monitoring", v)}
      />
      <ToggleCard
        label="Water recycling or reuse"
        sub="Greywater recycling, rainwater harvesting, or similar"
        value={form.water_recycling}
        onChange={v => set("water_recycling", v)}
      />
    </div>
  );
}

function TransportStep({
  form, set,
}: { form: GreenAssessmentPayload; set: <K extends keyof GreenAssessmentPayload>(k: K, v: GreenAssessmentPayload[K]) => void }) {
  return (
    <div className="space-y-5">
      <RadioGroup
        label="Primary business transportation"
        value={form.primary_transport}
        onChange={v => set("primary_transport", v)}
        options={[
          { value: "none",          label: "🏠 No travel needed" },
          { value: "personal_car",  label: "🚗 Personal vehicles" },
          { value: "company_fleet", label: "🚐 Company fleet" },
          { value: "public",        label: "🚌 Public transport" },
        ]}
      />
      <RadioGroup
        label="Monthly business trips (outside city)"
        value={form.monthly_business_trips}
        onChange={v => set("monthly_business_trips", v)}
        options={[
          { value: "0",    label: "None" },
          { value: "1-5",  label: "1–5 trips" },
          { value: "6-20", label: "6–20 trips" },
          { value: "20+",  label: "20+ trips" },
        ]}
      />
      <div className="space-y-2">
        <p className="text-sm font-medium">Transport practices</p>
        <ToggleCard
          label="Electric or hybrid vehicles"
          sub="At least one EV or hybrid in your business fleet"
          value={form.has_electric_vehicles}
          onChange={v => set("has_electric_vehicles", v)}
        />
        <ToggleCard
          label="Remote work supported"
          sub="Employees can work remotely at least part of the week"
          value={form.supports_remote_work}
          onChange={v => set("supports_remote_work", v)}
        />
      </div>
    </div>
  );
}

function CertificationsStep({
  form, set,
}: { form: GreenAssessmentPayload; set: <K extends keyof GreenAssessmentPayload>(k: K, v: GreenAssessmentPayload[K]) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Green certifications & policies</p>
      <ToggleCard
        label="ISO 14001 certified"
        sub="International environmental management standard"
        value={form.has_iso_14001}
        onChange={v => set("has_iso_14001", v)}
      />
      <ToggleCard
        label="Green Star or equivalent"
        sub="Local or regional green building / operations certification"
        value={form.has_green_star}
        onChange={v => set("has_green_star", v)}
      />
      <ToggleCard
        label="Other green certification"
        sub="Any other environmental or sustainability certification"
        value={form.has_other_green_cert}
        onChange={v => set("has_other_green_cert", v)}
      />
      <ToggleCard
        label="Documented sustainability policy"
        sub="Written policy covering environmental commitments"
        value={form.has_sustainability_policy}
        onChange={v => set("has_sustainability_policy", v)}
      />
    </div>
  );
}

/* ─── Default form state ────────────────────────────────────── */
function defaultForm(): GreenAssessmentPayload {
  return {
    energy_source: "",
    renewable_energy_pct: "",
    energy_efficient_lighting: false,
    energy_monitoring: false,
    water_efficient_fixtures: false,
    water_monitoring: false,
    water_recycling: false,
    primary_transport: "",
    has_electric_vehicles: false,
    supports_remote_work: false,
    monthly_business_trips: "",
    has_iso_14001: false,
    has_green_star: false,
    has_other_green_cert: false,
    has_sustainability_policy: false,
  };
}

/* ─── Step validation ───────────────────────────────────────── */
function isStepValid(step: number, form: GreenAssessmentPayload): boolean {
  if (step === 0) return !!form.energy_source && !!form.renewable_energy_pct;
  if (step === 2) return !!form.primary_transport && !!form.monthly_business_trips;
  return true; // water & certifications are all optional toggles
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function GreenAssessment() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<GreenAssessmentPayload>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof GreenAssessmentPayload>(k: K, v: GreenAssessmentPayload[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const canAdvance = isStepValid(step, form);
  const isLastStep = step === STEPS.length - 1;
  const fillPct = (step / (STEPS.length - 1)) * 100;

  const handleNext = () => {
    if (!canAdvance) return;
    if (isLastStep) {
      void handleSubmit();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitGreenAssessment(form);
      lastGreenAssessmentResult = result;
      navigate("/green-score");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  const StepIcon = STEPS[step].icon;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-10 max-w-2xl">
        {/* Progress header */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative mb-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-muted rounded-full -z-10" />
            <motion.div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary rounded-full -z-10"
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
            {STEPS.map((s, i) => {
              const done   = i < step;
              const active = i === step;
              const Icon   = s.icon;
              return (
                <div key={s.id} className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    done
                      ? "bg-primary border-primary text-primary-foreground"
                      : active
                      ? "bg-primary border-primary text-primary-foreground scale-110 shadow-md shadow-primary/20"
                      : "bg-card border-muted text-muted-foreground"
                  }`}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-medium hidden sm:block ${active || done ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        {/* Step card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-card border rounded-3xl p-8"
          >
            {/* Step heading */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <StepIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{STEPS[step].label}</h2>
                <p className="text-xs text-muted-foreground">
                  {step === 0 && "Tell us about your energy setup and usage"}
                  {step === 1 && "How does your business manage water?"}
                  {step === 2 && "How do you and your team get around?"}
                  {step === 3 && "Any green certifications or formal policies?"}
                </p>
              </div>
            </div>

            {/* Fields */}
            {step === 0 && <EnergyStep form={form} set={set} />}
            {step === 1 && <WaterStep  form={form} set={set} />}
            {step === 2 && <TransportStep form={form} set={set} />}
            {step === 3 && <CertificationsStep form={form} set={set} />}

            {/* Validation hint */}
            {!canAdvance && step !== 1 && step !== 3 && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5 mt-4">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Please answer all required questions before continuing.
              </p>
            )}

            {/* Submission error */}
            {error && isLastStep && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            className="rounded-full gap-1.5"
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate("/dashboard")}
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
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
            ) : isLastStep ? (
              <><CheckCircle2 className="w-4 h-4" /> Submit</>
            ) : (
              <>Next <ChevronRight className="w-4 h-4" /></>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
