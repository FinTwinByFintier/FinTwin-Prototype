import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useSimulation, SCENARIOS } from "@/context/SimulationContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { CommitmentsSheet } from "@/components/CommitmentsSheet";
import { requestLoanQuote } from "@/lib/api";
import {
  X, RotateCcw, BarChart3, Leaf, Wallet, Timer, TrendingUp, TrendingDown,
  Users, Zap, Home, CreditCard, Sun, Cpu, Clock, Bell, AlertCircle,
  ChevronDown, Package, ReceiptText, Loader2, Lock,
} from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";

/* ── Delta chip ────────────────────────────────────────────── */
function Delta({ sim, base, higherBetter = true, unit = '' }: {
  sim: number; base: number; higherBetter?: boolean; unit?: string;
}) {
  const { t } = useTranslation();
  const diff = sim - base;
  if (Math.abs(diff) < 0.05) return <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{t('common.noChange')}</span>;
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
function useGreenColor(score: number) {
  const { t } = useTranslation();
  if (score >= 75) return { text: "text-emerald-600", label: t('simulation.creditScore.strong') };
  if (score >= 50) return { text: "text-amber-500",   label: t('simulation.creditScore.developing') };
  return                 { text: "text-red-500",      label: t('simulation.creditScore.low') };
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
      {/* Toggle track */}
      <div className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${value ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0.5 rtl:-translate-x-0.5'}`} />
      </div>
    </div>
  );
}

/* ── Projected cash flow mini-chart ─────────────────────────── */
const CHART_H = 64; // px — must match h-16

function MiniChart({ data, baseline }: {
  data: Array<{ month: string; income: number; expense: number }>;
  baseline: Array<{ month: string; income: number; expense: number }>;
}) {
  const maxVal = Math.max(
    ...data.map(d => d.income), ...data.map(d => d.expense),
    ...baseline.map(d => d.income), ...baseline.map(d => d.expense),
    1, // prevent division by zero
  );
  return (
    <div className="flex gap-2" style={{ height: CHART_H + 16 }}>
      {data.map((d, i) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          {/* bar area — fixed height, clipped, bars grow from bottom via absolute positioning */}
          <div className="relative w-full overflow-hidden rounded-t-md flex gap-0.5" style={{ height: CHART_H }}>
            {/* income bar */}
            <div className="relative flex-1 h-full">
              <motion.div
                key={`inc-${d.income}`}
                initial={{ height: 0 }}
                animate={{ height: Math.max(3, Math.round((d.income / maxVal) * CHART_H)) }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-md"
              />
            </div>
            {/* expense bar */}
            <div className="relative flex-1 h-full">
              <motion.div
                key={`exp-${d.expense}`}
                initial={{ height: 0 }}
                animate={{ height: Math.max(3, Math.round((d.expense / maxVal) * CHART_H)) }}
                transition={{ duration: 0.4, delay: i * 0.05 + 0.03 }}
                className="absolute bottom-0 left-0 right-0 bg-muted-foreground/30 rounded-t-md"
              />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Scenario key → translation key mapping ─────────────────── */
const SCENARIO_T_KEYS: Record<string, string> = {
  'New Hire':          'simulation.scenarios.newHire',
  'New Loan':          'simulation.scenarios.newLoan',
  'Sales Shock −20%':  'simulation.scenarios.salesShock',
  'Energy Cost +20%':  'simulation.scenarios.energyCost',
  'Solar Panels':      'simulation.scenarios.solarPanels',
  'Late Payment 60d':  'simulation.scenarios.latePayment',
};

/* ── Main page ───────────────────────────────────────────────── */
export default function Simulation() {
  const [, navigate] = useLocation();
  const { state } = useOnboarding();
  const { t } = useTranslation();
  const { toggleLanguage } = useLanguage();
  const {
    overrides, setOverride, resetOverrides, applyScenario, activeScenario,
    result, baseline, baseState, displayName,
  } = useSimulation();

  const { hasPremium, setUpgradeOpen } = useSubscription();

  const [commitmentsOpen, setCommitmentsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoting, setQuoting] = useState(false);

  // Scenarios free for all plans; everything else requires Premium
  const FREE_SCENARIOS = new Set(['New Hire', 'New Loan']);

  const businessName = displayName;
  const gc = useGreenColor(result.greenScore);
  const baseGc = useGreenColor(baseline.greenScore);

  const hasNoCommitments = state.commitments.length === 0;

  const fmt = (n: number) => n.toLocaleString('en-JO');

  const handleApplyForLoan = async () => {
    setQuoting(true);
    try {
      await requestLoanQuote({
        amount: overrides.newLoanAmount,
        tenor_months: overrides.loanTermMonths,
        loan_category: "Business",
        loan_type: "Business financing",
      });
    } catch {
      // Quote is best-effort; still continue into prescreening
    } finally {
      setQuoting(false);
    }
    navigate(
      `/loan-prescreening?productId=new-loan&amount=${overrides.newLoanAmount}&term=${overrides.loanTermMonths}`,
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight">Fin<span className="text-primary">Twin</span></span>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-primary text-white px-2.5 py-1 rounded-full">
              {t('simulation.simulationMode')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              {t('lang.switch')}
            </button>
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
            <span className="font-semibold text-foreground">{t('simulation.digitalTwin')}</span>
            {' · '}{t('simulation.simulating', { name: businessName })}
            {' · '}{t('simulation.baseline')}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={resetOverrides}>
              <RotateCcw className="w-3.5 h-3.5" />{t('simulation.resetButton')}
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => navigate('/dashboard')}>
              <X className="w-3.5 h-3.5" />{t('simulation.exitButton')}
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
                <p className="text-xs">{t('simulation.addCommitmentsNudge')}</p>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={() => setCommitmentsOpen(true)}>
                {t('simulation.addCommitments')}
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
            <Section title={t('simulation.scenariosTitle')}>
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
                  const displayLabel = SCENARIO_T_KEYS[s] ? t(SCENARIO_T_KEYS[s]) : s;
                  const locked = !hasPremium && !FREE_SCENARIOS.has(s);
                  return (
                    <button
                      key={s}
                      onClick={() => locked ? setUpgradeOpen(true) : applyScenario(s)}
                      className={`relative flex flex-col gap-1 px-3 py-2.5 rounded-xl border text-start transition-all text-xs font-medium ${
                        locked
                          ? 'opacity-55 border-border cursor-pointer hover:opacity-70'
                          : active
                            ? 'border-primary bg-primary/8 text-primary shadow-sm'
                            : 'hover:border-primary/30 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 shrink-0 ${locked ? 'text-muted-foreground' : active ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="leading-tight">{displayLabel}</span>
                        {locked && <Lock className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />}
                      </div>
                      {locked && (
                        <span className="text-[10px] text-muted-foreground leading-tight">
                          Upgrade to unlock
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Revenue */}
            <Section title={t('simulation.revenueTitle')}>
              <div className="bg-card border rounded-2xl p-4 space-y-4">
                <SliderRow
                  label={t('simulation.monthlyRevenue')}
                  value={overrides.revenueMultiplier}
                  min={50} max={200} unit="%"
                  displayVal={`${fmt(Math.round(baseState.monthlyRevenue * overrides.revenueMultiplier / 100))} JOD (${overrides.revenueMultiplier}%)`}
                  onValueChange={v => setOverride('revenueMultiplier', v)}
                />
                <div className="space-y-2">
                  <p className="text-xs text-foreground">{t('simulation.clientLatePayment')}</p>
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
                        {d === 0 ? t('common.onTime') : `${d}d`}
                      </button>
                    ))}
                  </div>
                  {overrides.latePaymentDays > 0 && (
                    <p className="text-[10px] text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {t('simulation.lateDelayed', { amount: fmt(overrides.latePaymentAmount), days: overrides.latePaymentDays })}
                    </p>
                  )}
                </div>
              </div>
            </Section>

            {/* People */}
            <Section title={t('simulation.peopleTitle')}>
              <div className="bg-card border rounded-2xl p-4 space-y-4">
                <Stepper
                  label={t('simulation.additionalEmployees')}
                  value={overrides.extraEmployees}
                  onChange={v => setOverride('extraEmployees', v)}
                />
                <SliderRow
                  label={t('simulation.avgMonthlySalary')}
                  value={overrides.avgSalaryJOD}
                  min={200} max={2000} step={50} unit=" JOD"
                  displayVal={`${fmt(overrides.avgSalaryJOD)} JOD`}
                  onValueChange={v => setOverride('avgSalaryJOD', v)}
                />
                {overrides.extraEmployees > 0 && (
                  <div className="bg-muted/40 rounded-xl px-3 py-2 text-xs text-muted-foreground">
                    {t('simulation.additionalPayroll', { amount: fmt(overrides.extraEmployees * overrides.avgSalaryJOD) })}
                  </div>
                )}
              </div>
            </Section>

            {/* Expenses */}
            <Section title={t('simulation.expensesTitle')}>
              <div className="bg-card border rounded-2xl p-4 space-y-4">
                <SliderRow
                  label={t('simulation.rentAdjustment')}
                  value={overrides.rentMultiplier}
                  min={50} max={200} unit="%"
                  onValueChange={v => setOverride('rentMultiplier', v)}
                />
                <SliderRow
                  label={t('simulation.utilitiesAdjustment')}
                  value={overrides.utilitiesMultiplier}
                  min={50} max={200} unit="%"
                  onValueChange={v => setOverride('utilitiesMultiplier', v)}
                />
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs">{t('simulation.oneOffEquipment')}</span>
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
                      {t('simulation.spreadOverMonths', { amount: fmt(Math.round(overrides.oneOffPurchaseJOD / 12)) })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setCommitmentsOpen(true)}
                  className="w-full flex items-center gap-2 text-xs text-primary hover:opacity-80 pt-2 border-t"
                >
                  <ReceiptText className="w-3.5 h-3.5" />
                  {t('simulation.editCommitments', {
                    count: state.commitments.length,
                    total: fmt(state.commitments.reduce((s, c) => s + c.amountJOD, 0)),
                  })}
                </button>
              </div>
            </Section>

            {/* Financing */}
            <Section title={t('simulation.financingTitle')}>
              <div className="bg-card border rounded-2xl p-4 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs">{t('simulation.newLoanAmount')}</span>
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
                  <p className="text-xs">{t('simulation.loanTerm')}</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[12, 24, 36, 48].map(t_mo => (
                      <button
                        key={t_mo}
                        onClick={() => setOverride('loanTermMonths', t_mo)}
                        className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          overrides.loanTermMonths === t_mo
                            ? 'bg-primary text-white border-primary'
                            : 'border-muted text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        {t_mo}mo
                      </button>
                    ))}
                  </div>
                </div>
                {overrides.newLoanAmount > 0 && (
                  <div className="space-y-2">
                    <div className="bg-muted/40 rounded-xl px-3 py-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('simulation.monthlyRepayment')}</span>
                        <span className="font-bold">{fmt(result.newLoanMonthlyPayment)} JOD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('simulation.interestRate')}</span>
                        <span className="font-semibold text-emerald-600">{result.interestRate}% / yr</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{t('simulation.rateAutoSet')}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                      disabled={quoting}
                      onClick={handleApplyForLoan}
                    >
                      {quoting
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{t('simulation.fetchingQuote')}</>
                        : <>{t('simulation.applyForLoan')} <CreditCard className="w-3.5 h-3.5" /></>}
                    </Button>
                  </div>
                )}
              </div>
            </Section>

            {/* Green */}
            <Section title={t('simulation.greenTitle')}>
              <div className="bg-card border rounded-2xl p-4 space-y-3">
                <ToggleRow
                  label={t('simulation.solarPanels')}
                  sub={t('simulation.solarPanelsSub')}
                  value={overrides.solarPanels}
                  onChange={v => setOverride('solarPanels', v)}
                  icon={Sun}
                />
                <ToggleRow
                  label={t('simulation.energyEfficiency')}
                  sub={t('simulation.energyEfficiencySub')}
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
                  icon: Wallet, label: t('simulation.netThisMonth'),
                  val: `${result.netCash >= 0 ? '+' : '−'}${fmt(Math.abs(result.netCash))} JOD`,
                  delta: <Delta sim={result.netCash} base={baseline.netCash} unit=" JOD" />,
                  alert: result.netCash < 0,
                },
                {
                  icon: Timer, label: t('simulation.runway'),
                  val: result.runwayMonths === null ? t('simulation.runwayInfinity') : t('simulation.months', { n: result.runwayMonths }),
                  delta: result.runwayMonths !== null && baseline.runwayMonths !== null
                    ? <Delta sim={result.runwayMonths} base={baseline.runwayMonths} unit=" mo" />
                    : null,
                  alert: result.runwayMonths !== null && result.runwayMonths < 2,
                },
                {
                  icon: CreditCard, label: t('simulation.monthlyExpenses'),
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
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">{t('simulation.creditReadiness')}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-bold">{result.creditScore}</span>
                      <span className="text-muted-foreground text-sm">/100</span>
                      <Delta sim={result.creditScore} base={baseline.creditScore} unit=" pts" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('simulation.baselineLabel', { score: baseline.creditScore })}
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
                    <span>0</span><span className="text-muted-foreground/60">{t('simulation.baselineMarker')}</span><span>100</span>
                  </div>
                </div>
              </motion.div>

              {/* Green */}
              <motion.div layout className="bg-card border rounded-3xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">{t('simulation.greenScore')}</p>
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
                    {t('simulation.loanRate', { rate: result.interestRate })}
                    {' '}{t('simulation.vsBaseline', { rate: baseline.interestRate })}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Projected cash flow */}
            <motion.div layout className="bg-card border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-sm">{t('simulation.projectedCashFlow')}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('simulation.projectedCashFlowSub')}</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />{t('dashboard.income')}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />{t('dashboard.expenses')}</span>
                </div>
              </div>
              <MiniChart data={result.projectedCashFlow} baseline={baseline.projectedCashFlow} />
            </motion.div>

            {/* Loan affordability */}
            {overrides.newLoanAmount > 0 && (
              <motion.div layout className="bg-card border rounded-3xl p-5 shadow-sm">
                <h3 className="font-semibold text-sm mb-1">{t('simulation.loanAffordability')}</h3>
                <p className="text-xs text-muted-foreground mb-4">{t('simulation.loanAffordabilitySub')}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">{t('simulation.monthlyInstalment')}</p>
                    <p className="font-bold text-lg">{fmt(result.newLoanMonthlyPayment)}</p>
                    <p className="text-[10px] text-muted-foreground">JOD/mo</p>
                  </div>
                  <div className={`rounded-xl p-3 text-center ${result.netCash > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <p className="text-[10px] text-muted-foreground mb-1">{t('simulation.loanCoverage')}</p>
                    <p className={`font-bold text-lg ${result.netCash > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {result.netCash > 0
                        ? `${Math.round((result.netCash / result.newLoanMonthlyPayment) * 10) / 10}×`
                        : '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{t('simulation.loanCoverageSub')}</p>
                  </div>
                </div>
                <div className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium text-center ${result.netCash > result.newLoanMonthlyPayment ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {result.netCash > result.newLoanMonthlyPayment ? t('simulation.affordable') : t('simulation.tightCashFlow')}
                </div>
              </motion.div>
            )}

            {/* Green impact */}
            <motion.div layout className="bg-card border rounded-3xl p-5 shadow-sm">
              <h3 className="font-semibold text-sm mb-1">{t('simulation.greenImpact')}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t('simulation.greenImpactSub')}</p>
              {(overrides.solarPanels || overrides.energyEfficiency) ? (
                <div className="space-y-2.5">
                  {overrides.solarPanels && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-500" />{t('simulation.solarPanels')}</span>
                      <span className="font-bold text-emerald-600">+8 pts</span>
                    </div>
                  )}
                  {overrides.energyEfficiency && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-teal-500" />{t('simulation.energyEfficiency')}</span>
                      <span className="font-bold text-emerald-600">+5 pts</span>
                    </div>
                  )}
                  <div className="border-t pt-2.5 flex items-center justify-between text-sm font-semibold">
                    <span>{t('simulation.greenScore')}</span>
                    <span className="text-emerald-600">{t('simulation.greenPoints', { pts: (overrides.solarPanels ? 8 : 0) + (overrides.energyEfficiency ? 5 : 0) })}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Leaf className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">{t('simulation.noGreenActive')}</p>
                  <p className="text-[10px] mt-1">{t('simulation.selectGreenHint')}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <CommitmentsSheet open={commitmentsOpen} onOpenChange={setCommitmentsOpen} />
    </div>
  );
}
