import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useSimulation, SCENARIOS } from "@/context/SimulationContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { CommitmentsSheet } from "@/components/CommitmentsSheet";
import {
  X, RotateCcw, BarChart3, Leaf, Wallet, Timer, TrendingUp, TrendingDown,
  Users, Zap, Home, CreditCard, Sun, Cpu, Clock, Bell, AlertCircle,
  ChevronDown, Package, ReceiptText,
} from "lucide-react";

/* ── Delta chip ────────────────────────────────────────────── */
function Delta({ sim, base, higherBetter = true, unit = '' }: {
  sim: number; base: number; higherBetter?: boolean; unit?: string;
}) {
  const diff = sim - base;
  if (Math.abs(diff) < 0.05) return <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">no change</span>;
  const positive = higherBetter ? diff > 0 : diff < 0;
  const sign = diff > 0 ? '+' : '';
  const display = Number.isInteger(diff) ? diff : diff.toFixed(1);
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${positive ? 'text-emerald-700 bg-emerald-100' : 'text-red-600 bg-red-100'}`}>
      {positive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {sign}{display}{unit}
    </span>
  );
}

/* ── Green color helper ─────────────────────────────────────── */
function greenColor(score: number) {
  if (score >= 75) return { text: "text-emerald-600", label: "Strong" };
  if (score >= 50) return { text: "text-amber-500", label: "Developing" };
  return { text: "text-red-500", label: "Low" };
}

/* ── Section wrapper ────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1">{title}</p>
      {children}
    </div>
  );
}

/* ── Slider row ─────────────────────────────────────────────── */
function SliderRow({
  label, value, min, max, step = 1, unit = '', onValueChange, displayVal,
}: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string;
  onValueChange: (v: number) => void; displayVal?: string;
}) {
  const show = displayVal ?? `${value}${unit}`;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-foreground">{label}</span>
        <span className="text-xs font-semibold tabular-nums">{show}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onValueChange(v)} />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

/* ── Stepper ─────────────────────────────────────────────────── */
function Stepper({ label, value, min = 0, max = 10, onChange }: {
  label: string; value: number; min?: number; max?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="w-7 h-7 rounded-lg border bg-muted flex items-center justify-center text-sm font-bold hover:bg-muted/80">−</button>
        <span className="w-6 text-center font-semibold text-sm">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} className="w-7 h-7 rounded-lg border bg-muted flex items-center justify-center text-sm font-bold hover:bg-muted/80">+</button>
      </div>
    </div>
  );
}

/* ── Toggle row ─────────────────────────────────────────────── */
function ToggleRow({ label, sub, value, onChange, icon: Icon }: {
  label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; icon: React.ElementType;
}) {
  return (
    <div
      onClick={() => onChange(!value)}
      className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
        value ? 'border-emerald-500/40 bg-emerald-500/5' : 'hover:bg-muted/40'
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${value ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-xs font-medium">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
      <div className={`w-8 h-4 rounded-full transition-colors relative ${value ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
    </div>
  );
}

/* ── Projected cash flow mini-chart ─────────────────────────── */
function MiniChart({ data, baseline }: {
  data: Array<{ month: string; income: number; expense: number }>;
  baseline: Array<{ month: string; income: number; expense: number }>;
}) {
  const maxIncome = Math.max(...data.map(d => d.income), ...baseline.map(d => d.income));
  return (
    <div className="flex items-end gap-2 h-20">
      {data.map((d, i) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end gap-0.5 h-16">
            <motion.div
              key={`inc-${d.income}`}
              initial={{ height: 0 }}
              animate={{ height: `${(d.income / maxIncome) * 100}%` }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex-1 bg-primary rounded-t-md min-h-[3px]"
            />
            <motion.div
              key={`exp-${d.expense}`}
              initial={{ height: 0 }}
              animate={{ height: `${(d.expense / maxIncome) * 100}%` }}
              transition={{ duration: 0.4, delay: i * 0.05 + 0.03 }}
              className="flex-1 bg-muted-foreground/30 rounded-t-md min-h-[3px]"
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────── */
export default function Simulation() {
  const [, navigate] = useLocation();
  const { state } = useOnboarding();
  const {
    overrides, setOverride, resetOverrides, applyScenario, activeScenario,
    result, baseline, baseState,
  } = useSimulation();

  const [commitmentsOpen, setCommitmentsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const businessName = state.businessName || "Amman Coffee Roasters";
  const gc = greenColor(result.greenScore);
  const baseGc = greenColor(baseline.greenScore);

  const hasNoCommitments = state.commitments.length === 0;

  const fmt = (n: number) => n.toLocaleString('en-JO');

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight">Fin<span className="text-primary">Twin</span></span>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-primary text-white px-2.5 py-1 rounded-full">
              Simulation Mode
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="w-5 h-5" />
            </Button>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm border border-primary/30"
            >
              {businessName.substring(0, 2).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* Baseline banner */}
      <div className="border-b bg-primary/5">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Digital Twin</span>
            {' · '}Simulating: <span className="font-medium">{businessName}</span>
            {' · '}Jul 2026 baseline
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={resetOverrides}>
              <RotateCcw className="w-3.5 h-3.5" />Reset
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => navigate('/dashboard')}>
              <X className="w-3.5 h-3.5" />Exit
            </Button>
          </div>
        </div>
      </div>

      {/* No-commitments nudge */}
      <AnimatePresence>
        {hasNoCommitments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-4 container mx-auto">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-xs">Add monthly commitments to make the simulation meaningful — your expenses are currently zero.</p>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={() => setCommitmentsOpen(true)}>
                Add commitments
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-grow container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left panel: Controls (2/5) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Scenario cards */}
            <Section title="Scenarios">
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(SCENARIOS) as Array<keyof typeof SCENARIOS>).map(s => {
                  const icons: Record<string, React.ElementType> = {
                    'New Hire': Users,
                    'New Loan': CreditCard,
                    'Sales Shock −20%': TrendingDown,
                    'Energy Cost +20%': Zap,
                    'Solar Panels': Sun,
                    'Late Payment 60d': Clock,
                  };
                  const Icon = icons[s] ?? Package;
                  const active = activeScenario === s;
                  return (
                    <button
                      key={s}
                      onClick={() => applyScenario(s)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all text-xs font-medium ${
                        active
                          ? 'border-primary bg-primary/8 text-primary shadow-sm'
                          : 'hover:border-primary/30 hover:bg-muted/40'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="leading-tight">{s}</span>
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Revenue */}
            <Section title="Revenue">
              <div className="bg-card border rounded-2xl p-4 space-y-4">
                <SliderRow
                  label="Monthly revenue"
                  value={overrides.revenueMultiplier}
                  min={50} max={200} unit="%"
                  displayVal={`${fmt(Math.round(baseState.monthlyRevenue * overrides.revenueMultiplier / 100))} JOD (${overrides.revenueMultiplier}%)`}
                  onValueChange={v => setOverride('revenueMultiplier', v)}
                />
                <div className="space-y-2">
                  <p className="text-xs text-foreground">Client late payment</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 30, 60, 90].map(d => (
                      <button
                        key={d}
                        onClick={() => setOverride('latePaymentDays', d)}
                        className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          overrides.latePaymentDays === d
                            ? 'bg-primary text-white border-primary'
                            : 'border-muted text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        {d === 0 ? 'On time' : `${d}d`}
                      </button>
                    ))}
                  </div>
                  {overrides.latePaymentDays > 0 && (
                    <p className="text-[10px] text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fmt(overrides.latePaymentAmount)} JOD delayed by {overrides.latePaymentDays} days
                    </p>
                  )}
                </div>
              </div>
            </Section>

            {/* People */}
            <Section title="People">
              <div className="bg-card border rounded-2xl p-4 space-y-4">
                <Stepper
                  label="Additional employees"
                  value={overrides.extraEmployees}
                  onChange={v => setOverride('extraEmployees', v)}
                />
                <SliderRow
                  label="Avg monthly salary"
                  value={overrides.avgSalaryJOD}
                  min={200} max={2000} step={50} unit=" JOD"
                  displayVal={`${fmt(overrides.avgSalaryJOD)} JOD`}
                  onValueChange={v => setOverride('avgSalaryJOD', v)}
                />
                {overrides.extraEmployees > 0 && (
                  <div className="bg-muted/40 rounded-xl px-3 py-2 text-xs text-muted-foreground">
                    Additional monthly payroll:{' '}
                    <span className="font-semibold text-foreground">
                      {fmt(overrides.extraEmployees * overrides.avgSalaryJOD)} JOD
                    </span>
                  </div>
                )}
              </div>
            </Section>

            {/* Expenses */}
            <Section title="Expenses">
              <div className="bg-card border rounded-2xl p-4 space-y-4">
                <SliderRow
                  label="Rent adjustment"
                  value={overrides.rentMultiplier}
                  min={50} max={200} unit="%"
                  onValueChange={v => setOverride('rentMultiplier', v)}
                />
                <SliderRow
                  label="Utilities adjustment"
                  value={overrides.utilitiesMultiplier}
                  min={50} max={200} unit="%"
                  onValueChange={v => setOverride('utilitiesMultiplier', v)}
                />
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs">One-off equipment purchase</span>
                    <span className="text-xs font-semibold">{fmt(overrides.oneOffPurchaseJOD)} JOD</span>
                  </div>
                  <Slider
                    value={[overrides.oneOffPurchaseJOD]}
                    min={0} max={30000} step={500}
                    onValueChange={([v]) => setOverride('oneOffPurchaseJOD', v)}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0 JOD</span><span>30,000 JOD</span>
                  </div>
                  {overrides.oneOffPurchaseJOD > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      Spread over 12 months = <span className="font-medium text-foreground">{fmt(Math.round(overrides.oneOffPurchaseJOD / 12))} JOD/mo</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setCommitmentsOpen(true)}
                  className="w-full flex items-center gap-2 text-xs text-primary hover:opacity-80 pt-2 border-t"
                >
                  <ReceiptText className="w-3.5 h-3.5" />
                  Edit monthly commitments ({state.commitments.length} items · {fmt(state.commitments.reduce((s, c) => s + c.amountJOD, 0))} JOD/mo)
                </button>
              </div>
            </Section>

            {/* Financing */}
            <Section title="Financing">
              <div className="bg-card border rounded-2xl p-4 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs">New loan amount</span>
                    <span className="text-xs font-semibold">{fmt(overrides.newLoanAmount)} JOD</span>
                  </div>
                  <Slider
                    value={[overrides.newLoanAmount]}
                    min={0} max={50000} step={1000}
                    onValueChange={([v]) => setOverride('newLoanAmount', v)}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0 JOD</span><span>50,000 JOD</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs">Loan term</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[12, 24, 36, 48].map(t => (
                      <button
                        key={t}
                        onClick={() => setOverride('loanTermMonths', t)}
                        className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          overrides.loanTermMonths === t
                            ? 'bg-primary text-white border-primary'
                            : 'border-muted text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        {t}mo
                      </button>
                    ))}
                  </div>
                </div>
                {overrides.newLoanAmount > 0 && (
                  <div className="space-y-2">
                    <div className="bg-muted/40 rounded-xl px-3 py-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly repayment</span>
                        <span className="font-bold">{fmt(result.newLoanMonthlyPayment)} JOD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Interest rate</span>
                        <span className="font-semibold text-emerald-600">{result.interestRate}% / yr</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Rate auto-set from green score. Raise green score to reduce it.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                      onClick={() => navigate(`/loan-prescreening?productId=new-loan&amount=${overrides.newLoanAmount}&term=${overrides.loanTermMonths}`)}
                    >
                      Apply for this loan <CreditCard className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </Section>

            {/* Green */}
            <Section title="Green Investments">
              <div className="bg-card border rounded-2xl p-4 space-y-3">
                <ToggleRow
                  label="Solar panels"
                  sub="8,000 JOD · saves 15% utilities · +8 green pts"
                  value={overrides.solarPanels}
                  onChange={v => setOverride('solarPanels', v)}
                  icon={Sun}
                />
                <ToggleRow
                  label="Energy efficiency upgrade"
                  sub="Saves 5% utilities · +5 green pts"
                  value={overrides.energyEfficiency}
                  onChange={v => setOverride('energyEfficiency', v)}
                  icon={Cpu}
                />
              </div>
            </Section>
          </div>

          {/* ── Right panel: Live metrics (3/5) ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Stat strip */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: Wallet, label: "Net this month",
                  val: `${result.netCash >= 0 ? '+' : '−'}${fmt(Math.abs(result.netCash))} JOD`,
                  delta: <Delta sim={result.netCash} base={baseline.netCash} unit=" JOD" />,
                  alert: result.netCash < 0,
                },
                {
                  icon: Timer, label: "Runway",
                  val: result.runwayMonths === null ? '∞ runway' : `${result.runwayMonths} months`,
                  delta: result.runwayMonths !== null && baseline.runwayMonths !== null
                    ? <Delta sim={result.runwayMonths} base={baseline.runwayMonths} unit=" mo" />
                    : null,
                  alert: result.runwayMonths !== null && result.runwayMonths < 2,
                },
                {
                  icon: CreditCard, label: "Monthly expenses",
                  val: `${fmt(result.monthlyExpenses)} JOD`,
                  delta: <Delta sim={result.monthlyExpenses} base={baseline.monthlyExpenses} higherBetter={false} unit=" JOD" />,
                  alert: false,
                },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    layout
                    className={`bg-card border rounded-2xl px-4 py-3.5 flex items-start gap-3 ${s.alert ? 'border-red-300 bg-red-50' : ''}`}
                  >
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground mb-0.5">{s.label}</p>
                      <p className={`font-bold text-sm leading-tight ${s.alert ? 'text-red-600' : ''}`}>{s.val}</p>
                      <div className="mt-1">{s.delta}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Score cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Credit */}
              <motion.div layout className="bg-card border rounded-3xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Credit Readiness</p>
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-bold">{result.creditScore}</span>
                      <span className="text-muted-foreground text-sm">/100</span>
                      <Delta sim={result.creditScore} base={baseline.creditScore} unit=" pts" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Baseline: <span className="font-medium">{baseline.creditScore}</span>
                    </p>
                  </div>
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div layout animate={{ width: `${result.creditScore}%` }} transition={{ duration: 0.4 }} className="h-full bg-primary rounded-full" />
                  </div>
                  <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                    <div className="h-full bg-muted-foreground/20 rounded-full" style={{ width: `${baseline.creditScore}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0</span><span className="text-muted-foreground/60">▲ baseline</span><span>100</span>
                  </div>
                </div>
              </motion.div>

              {/* Green */}
              <motion.div layout className="bg-card border rounded-3xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Green Score</p>
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-bold">{result.greenScore}</span>
                      <span className="text-muted-foreground text-sm">/100</span>
                      <Delta sim={result.greenScore} base={baseline.greenScore} unit=" pts" />
                    </div>
                    <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${gc.text}`}>
                      <Leaf className="w-3 h-3" />{gc.label}
                    </p>
                  </div>
                  <div className="w-9 h-9 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <div className="relative h-3 rounded-full overflow-hidden flex mb-4">
                  <div className="h-full bg-red-400/60" style={{ width: '50%' }} />
                  <div className="h-full bg-amber-400/60" style={{ width: '25%' }} />
                  <div className="h-full bg-emerald-400/60" style={{ width: '25%' }} />
                </div>
                <div className="relative h-0 mb-6">
                  <motion.div
                    animate={{ left: `${result.greenScore}%` }}
                    transition={{ duration: 0.4 }}
                    className="absolute -top-4 -translate-x-1/2"
                  >
                    <div className="w-2.5 h-5 bg-foreground rounded-full shadow" />
                  </motion.div>
                </div>
                {result.interestRate !== baseline.interestRate && (
                  <div className={`rounded-lg px-3 py-2 text-xs ${result.interestRate < baseline.interestRate ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    Loan rate: <span className="font-bold">{result.interestRate}%</span>
                    {' '}vs baseline {baseline.interestRate}%
                  </div>
                )}
              </motion.div>
            </div>

            {/* Projected cash flow */}
            <motion.div layout className="bg-card border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-sm">Projected Cash Flow</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Simulated · Aug–Nov 2026</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Income</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/30 inline-block" />Expenses</span>
                </div>
              </div>
              <MiniChart data={result.projectedCashFlow} baseline={baseline.projectedCashFlow} />
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
                {[
                  { label: 'Avg income/mo',   val: `+${fmt(Math.round(result.projectedCashFlow.reduce((s,d)=>s+d.income,0)/4))} JOD`, color: 'text-emerald-600' },
                  { label: 'Avg expenses/mo', val: `−${fmt(Math.round(result.projectedCashFlow.reduce((s,d)=>s+d.expense,0)/4))} JOD`, color: 'text-foreground' },
                  { label: 'Avg net/mo',      val: `${result.netCash >= 0 ? '+' : '−'}${fmt(Math.abs(result.netCash))} JOD`, color: result.netCash >= 0 ? 'text-primary' : 'text-red-500' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{s.label}</p>
                    <p className={`font-bold text-xs ${s.color}`}>{s.val}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Insights */}
            <motion.div layout className="bg-card border rounded-3xl p-5 shadow-sm">
              <h3 className="font-semibold text-sm mb-4">Simulation Insights</h3>
              <div className="space-y-3">
                {result.netCash < 0 && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-2xl">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold text-red-700">Negative cash flow</p>
                      <p className="text-red-600 mt-0.5">Under this scenario the business burns {fmt(Math.abs(result.netCash))} JOD/month. Runway: {result.runwayMonths} months at current cash balance.</p>
                    </div>
                  </div>
                )}
                {result.creditScore > baseline.creditScore && (
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold text-emerald-700">Credit score improves</p>
                      <p className="text-emerald-600 mt-0.5">Score rises by {result.creditScore - baseline.creditScore} pts — could unlock better loan terms.</p>
                    </div>
                  </div>
                )}
                {result.greenScore >= 75 && baseline.greenScore < 75 && (
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <Leaf className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold text-emerald-700">Green Finance unlocked</p>
                      <p className="text-emerald-600 mt-0.5">Score crossed 75 — now eligible for CBJ top-tier green loans at the lowest available rate.</p>
                    </div>
                  </div>
                )}
                {overrides.solarPanels && (
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                    <Sun className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold text-amber-700">Solar payback period</p>
                      <p className="text-amber-600 mt-0.5">
                        At {fmt(Math.round((state.commitments.find(c=>c.category==='utilities')?.amountJOD ?? 300) * 0.15))} JOD/month saved,
                        the 8,000 JOD investment pays back in ~{Math.ceil(8000 / ((state.commitments.find(c=>c.category==='utilities')?.amountJOD ?? 300) * 0.15))} months.
                      </p>
                    </div>
                  </div>
                )}
                {result.netCash >= 0 && result.netCash === baseline.netCash && (
                  <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-2xl">
                    <BarChart3 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">Adjust the controls on the left to model different scenarios. All metrics update in real time.</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Financing impact (only when new loan selected) */}
            {overrides.newLoanAmount > 0 && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border rounded-3xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-sm mb-4">Loan Affordability</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Loan amount', val: `${fmt(overrides.newLoanAmount)} JOD` },
                    { label: 'Term', val: `${overrides.loanTermMonths} months` },
                    { label: 'Interest rate', val: `${result.interestRate}% / yr` },
                    { label: 'Monthly repayment', val: `${fmt(result.newLoanMonthlyPayment)} JOD` },
                    { label: 'Total repayable', val: `${fmt(Math.round(result.newLoanMonthlyPayment * overrides.loanTermMonths))} JOD` },
                    { label: 'Debt-to-income ratio', val: `${Math.round((result.newLoanMonthlyPayment / Math.max(1, result.monthlyIncome)) * 100)}%` },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-xs py-1.5 border-b last:border-0">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-semibold">{r.val}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3">
                  {result.newLoanMonthlyPayment / Math.max(1, result.monthlyIncome) < 0.3
                    ? '✅ Debt-to-income below 30% — affordable range.'
                    : '⚠️ Debt-to-income above 30% — may strain cash flow.'}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Commitments sheet */}
      <CommitmentsSheet open={commitmentsOpen} onOpenChange={setCommitmentsOpen} />
    </div>
  );
}
