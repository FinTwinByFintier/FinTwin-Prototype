import React, { createContext, useContext, useState, useMemo, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SimOverrides } from '@/lib/simulationEngine';
import { useOnboarding } from '@/context/OnboardingContext';
import { twinQueryKeys } from '@/lib/queryClient';
import {
  fetchSimulationBaseline,
  runSimulation,
  listSimulationScenarios,
  getSimulationScenario,
  renameSimulationScenario,
  deleteSimulationScenario,
  type SimulationBaseline,
  type SimulationRunResult,
  type SimulationSideResult,
  type SimulationScenarioSummary,
} from '@/lib/api';

/* ── Result shape consumed by Simulation.tsx — backed by the real engine ── */
export interface SimResult {
  monthlyIncome: number;
  monthlyExpenses: number;
  netCash: number;
  runwayDays: number | null;      // null = not computable yet (no bank data)
  creditScore: number;
  creditEligible: boolean;
  gateFailures: string[];
  defaultProbability: number;
  riskFactors: Array<{ factor: string; contribution: number; note: string }>;
  liquidityScore: number | null;
  liquidityEligible: boolean;
  greenScore: number;
  projectedCashFlow: Array<{ month: string; income: number; expense: number }>;
  newLoanMonthlyPayment: number;
  interestRate: number;           // green-tier rate (real if a loan is quoted, else illustrative)
  totalCommitmentsMonthly: number;
  dtiPct: number;
  dtiCategory: 'pass' | 'marginal' | 'fail' | string;
}

interface BaseStateLite {
  monthlyRevenue: number;
  avgSalaryJOD: number;
}

const EMPTY_RESULT: SimResult = {
  monthlyIncome: 0, monthlyExpenses: 0, netCash: 0, runwayDays: null,
  creditScore: 0, creditEligible: true, gateFailures: [], defaultProbability: 0,
  riskFactors: [], liquidityScore: null, liquidityEligible: false, greenScore: 0,
  projectedCashFlow: [], newLoanMonthlyPayment: 0, interestRate: 7.5,
  totalCommitmentsMonthly: 0, dtiPct: 0, dtiCategory: 'pass',
};

/* Same published green-tier table the backend uses (apps/lending/services.local_quote) —
   used only to show an illustrative rate when no loan amount is set. */
function deriveInterestRate(greenScore: number): number {
  if (greenScore >= 75) return 2.75;
  if (greenScore >= 60) return 5.5;
  if (greenScore >= 45) return 6.5;
  return 7.5;
}

function mapSide(side: SimulationSideResult): SimResult {
  return {
    monthlyIncome: side.monthly_income,
    monthlyExpenses: side.monthly_expenses,
    netCash: side.net_cash,
    runwayDays: side.runway_days,
    creditScore: side.credit_score,
    creditEligible: side.credit_eligible,
    gateFailures: side.gate_failures ?? [],
    defaultProbability: side.default_probability,
    riskFactors: side.risk_factors ?? [],
    liquidityScore: side.liquidity_score,
    liquidityEligible: side.liquidity_eligible,
    greenScore: side.green_score,
    projectedCashFlow: side.cash_flow_projection ?? [],
    newLoanMonthlyPayment: side.loan?.monthly_installment ?? 0,
    interestRate: side.loan ? parseFloat(side.loan.rate) : deriveInterestRate(side.green_score),
    totalCommitmentsMonthly: side.monthly_expenses,
    dtiPct: side.dti_pct ?? 0,
    dtiCategory: side.dti_category ?? 'pass',
  };
}

function defaultOverrides(base: BaseStateLite): SimOverrides {
  return {
    revenueMultiplier: 100,
    extraEmployees: 0,
    avgSalaryJOD: base.avgSalaryJOD,
    newLoanAmount: 0,
    loanTermMonths: 24,
    rentMultiplier: 100,
    utilitiesMultiplier: 100,
    oneOffPurchaseJOD: 0,
    latePaymentDays: 0,
    latePaymentAmount: Math.round(base.monthlyRevenue * 0.30),
    solarPanels: false,
    energyEfficiency: false,
  };
}

/** Map camelCase UI overrides -> snake_case backend payload. */
function toBackendOverrides(o: SimOverrides) {
  return {
    revenue_multiplier: o.revenueMultiplier,
    extra_employees: o.extraEmployees,
    avg_salary_jod: o.avgSalaryJOD,
    rent_multiplier: o.rentMultiplier,
    utilities_multiplier: o.utilitiesMultiplier,
    one_off_purchase_jod: o.oneOffPurchaseJOD,
    new_loan_amount: o.newLoanAmount,
    loan_term_months: o.loanTermMonths,
    late_payment_days: o.latePaymentDays,
    late_payment_amount: o.latePaymentAmount,
    solar_panels: o.solarPanels,
    energy_efficiency: o.energyEfficiency,
  };
}

/** True when overrides represent "no changes" — i.e. plain baseline. */
function isIdentityOverrides(o: SimOverrides, base: BaseStateLite): boolean {
  const identity = defaultOverrides(base);
  return (Object.keys(identity) as (keyof SimOverrides)[]).every((k) => o[k] === identity[k]);
}

export const SCENARIOS = {
  'New Hire': (base: BaseStateLite): Partial<SimOverrides> => ({
    extraEmployees: 2,
    avgSalaryJOD: base.avgSalaryJOD,
  }),
  'New Loan': (): Partial<SimOverrides> => ({
    newLoanAmount: 20000,
    loanTermMonths: 36,
  }),
  'Sales Shock −20%': (): Partial<SimOverrides> => ({
    revenueMultiplier: 80,
  }),
  'Energy Cost +20%': (): Partial<SimOverrides> => ({
    utilitiesMultiplier: 120,
  }),
  'Solar Panels': (): Partial<SimOverrides> => ({
    solarPanels: true,
  }),
  'Late Payment 60d': (base: BaseStateLite): Partial<SimOverrides> => ({
    latePaymentDays: 60,
    latePaymentAmount: Math.round(base.monthlyRevenue * 0.30),
  }),
} as const;

interface SimulationContextType {
  overrides: SimOverrides;
  setOverride: <K extends keyof SimOverrides>(key: K, value: SimOverrides[K]) => void;
  resetOverrides: () => void;
  applyScenario: (scenario: keyof typeof SCENARIOS) => void;
  activeScenario: string | null;
  result: SimResult;
  baseline: SimResult;
  baseState: BaseStateLite;
  displayName: string;
  isRunning: boolean;
  aiInsight: string;
  lastScenarioId: number | null;
  scenarios: SimulationScenarioSummary[];
  saveScenario: (name: string) => Promise<void>;
  loadScenario: (id: number) => Promise<void>;
  deleteScenario: (id: number) => Promise<void>;
  renameScenario: (id: number, name: string) => Promise<void>;
  refreshScenarios: () => Promise<void>;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const { state } = useOnboarding();
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [liveRunning, setLiveRunning] = useState(false);
  const [liveAiInsight, setLiveAiInsight] = useState('');
  const [lastScenarioId, setLastScenarioId] = useState<number | null>(null);
  const [scenarios, setScenarios] = useState<SimulationScenarioSummary[]>([]);
  const [liveResult, setLiveResult] = useState<{ baseline: SimResult; result: SimResult } | null>(null);

  const commitmentsPayload = useMemo(
    () => (state.commitments ?? []).map((c) => ({ category: c.category, label: c.label, amount: c.amountJOD })),
    [state.commitments],
  );
  const commitmentsSignature = useMemo(() => JSON.stringify(commitmentsPayload), [commitmentsPayload]);

  // Cached, backend-computed identity info (employees/sector/avg salary/...) —
  // fetched once per login session and reused everywhere (survives page
  // changes and hard refreshes). See src/lib/queryClient.ts.
  const { data: baselineInfo = null } = useQuery<SimulationBaseline>({
    queryKey: twinQueryKeys.simulationBaseline(''),
    queryFn: fetchSimulationBaseline,
    retry: 0,
  });

  const baseState: BaseStateLite = useMemo(() => ({
    monthlyRevenue: baselineInfo?.monthly_revenue ?? 0,
    avgSalaryJOD: baselineInfo?.avg_salary_jod ?? 400,
  }), [baselineInfo]);

  const [overrides, setOverrides] = useState<SimOverrides>(() => defaultOverrides({ monthlyRevenue: 0, avgSalaryJOD: 400 }));
  const [overridesSeeded, setOverridesSeeded] = useState(false);
  useEffect(() => {
    if (baselineInfo && !overridesSeeded) {
      setOverrides(defaultOverrides(baseState));
      setOverridesSeeded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baselineInfo]);

  // The "no changes" run — same real engine, cached (not recomputed just
  // because the user revisits the page or refreshes). Reused directly as
  // both baseline *and* result whenever overrides haven't actually changed,
  // so we only ever hit /simulation/run/ once until the user starts
  // adjusting a lever.
  const { data: identityRun, isLoading: identityLoading } = useQuery<SimulationRunResult>({
    queryKey: [...twinQueryKeys.simulationBaseline(commitmentsSignature), 'identity-run'],
    queryFn: () => runSimulation({
      overrides: toBackendOverrides(defaultOverrides(baseState)),
      commitments: commitmentsPayload,
    }),
    enabled: !!baselineInfo,
    retry: 0,
  });

  useEffect(() => {
    if (identityRun) setLiveAiInsight((prev) => prev || identityRun.ai_insight);
  }, [identityRun]);

  const refreshScenarios = useCallback(async () => {
    try {
      const { scenarios: rows } = await listSimulationScenarios();
      setScenarios(rows);
    } catch {
      // best-effort — history panel just stays empty
    }
  }, []);

  useEffect(() => {
    void refreshScenarios();
  }, [refreshScenarios]);

  const atIdentity = useMemo(
    () => isIdentityOverrides(overrides, baseState),
    [overrides, baseState],
  );

  const runRef = useRef(0);
  const runNow = useCallback(async (nextOverrides: SimOverrides) => {
    const runId = ++runRef.current;
    setLiveRunning(true);
    try {
      const res = await runSimulation({
        overrides: toBackendOverrides(nextOverrides),
        commitments: commitmentsPayload,
      });
      if (runId !== runRef.current) return; // superseded by a newer call
      setLiveResult({ baseline: mapSide(res.baseline), result: mapSide(res.scenario) });
      setLiveAiInsight(res.ai_insight);
    } catch {
      // best-effort — keep last good numbers on the screen
    } finally {
      if (runId === runRef.current) setLiveRunning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitmentsPayload]);

  // Debounce backend recompute whenever overrides actually diverge from the
  // cached identity baseline. At identity, skip the network call entirely —
  // the cached identity run already has these exact numbers.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!baselineInfo) return; // wait for baseline to seed real defaults first
    if (atIdentity) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setLiveResult(null); // fall back to the cached identity run below
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void runNow(overrides); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides, commitmentsPayload, baselineInfo, atIdentity]);

  const identityMapped = useMemo(() => {
    if (!identityRun) return null;
    return { baseline: mapSide(identityRun.baseline), result: mapSide(identityRun.scenario) };
  }, [identityRun]);

  const active = liveResult ?? identityMapped;
  const baseline = active?.baseline ?? EMPTY_RESULT;
  const result = active?.result ?? EMPTY_RESULT;
  const isRunning = atIdentity ? identityLoading : liveRunning;
  const aiInsight = liveAiInsight;

  const setOverride = <K extends keyof SimOverrides>(key: K, value: SimOverrides[K]) => {
    setActiveScenario(null);
    setOverrides(prev => ({ ...prev, [key]: value }));
  };

  const resetOverrides = () => {
    setOverrides(defaultOverrides(baseState));
    setActiveScenario(null);
  };

  const applyScenario = (scenario: keyof typeof SCENARIOS) => {
    if (activeScenario === scenario) {
      resetOverrides();
      return;
    }
    const base = defaultOverrides(baseState);
    const delta = SCENARIOS[scenario](baseState);
    setOverrides({ ...base, ...delta });
    setActiveScenario(scenario);
  };

  const saveScenario = async (name: string) => {
    const res: SimulationRunResult = await runSimulation({
      overrides: toBackendOverrides(overrides),
      commitments: commitmentsPayload,
      save: true,
      name,
    });
    setLiveResult({ baseline: mapSide(res.baseline), result: mapSide(res.scenario) });
    setLiveAiInsight(res.ai_insight);
    if (res.scenario_id) setLastScenarioId(res.scenario_id);
    await refreshScenarios();
  };

  const loadScenario = async (id: number) => {
    const detail = await getSimulationScenario(id);
    const o = detail.overrides;
    setActiveScenario(null);
    setOverrides({
      revenueMultiplier: o.revenue_multiplier,
      extraEmployees: o.extra_employees,
      avgSalaryJOD: o.avg_salary_jod,
      newLoanAmount: o.new_loan_amount,
      loanTermMonths: o.loan_term_months,
      rentMultiplier: o.rent_multiplier,
      utilitiesMultiplier: o.utilities_multiplier,
      oneOffPurchaseJOD: o.one_off_purchase_jod,
      latePaymentDays: o.late_payment_days,
      latePaymentAmount: o.late_payment_amount,
      solarPanels: o.solar_panels,
      energyEfficiency: o.energy_efficiency,
    });
    setLiveResult({ baseline: mapSide(detail.result.baseline), result: mapSide(detail.result.scenario) });
    setLiveAiInsight(detail.ai_insight);
    setLastScenarioId(detail.id);
  };

  const deleteScenarioById = async (id: number) => {
    await deleteSimulationScenario(id);
    if (lastScenarioId === id) setLastScenarioId(null);
    await refreshScenarios();
  };

  const renameScenarioById = async (id: number, name: string) => {
    await renameSimulationScenario(id, name);
    await refreshScenarios();
  };

  const displayName = baselineInfo?.display_name || state.businessName || 'Your business';

  return (
    <SimulationContext.Provider value={{
      overrides, setOverride, resetOverrides, applyScenario, activeScenario,
      result, baseline, baseState, displayName,
      isRunning, aiInsight, lastScenarioId, scenarios,
      saveScenario, loadScenario, deleteScenario: deleteScenarioById,
      renameScenario: renameScenarioById, refreshScenarios,
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider');
  return ctx;
}
