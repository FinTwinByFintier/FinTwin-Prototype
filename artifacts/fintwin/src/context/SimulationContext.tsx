import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import { simulate, defaultOverrides, mockBaseState } from '@/lib/simulationEngine';
import type { SimOverrides, SimResult, BaseState } from '@/lib/simulationEngine';
import { useOnboarding } from '@/context/OnboardingContext';
import { fetchScoringSummary, fetchDashboardSummary } from '@/lib/api';

interface SimulationContextType {
  overrides: SimOverrides;
  setOverride: <K extends keyof SimOverrides>(key: K, value: SimOverrides[K]) => void;
  resetOverrides: () => void;
  applyScenario: (scenario: keyof typeof SCENARIOS) => void;
  activeScenario: string | null;
  result: SimResult;
  baseline: SimResult;
  baseState: BaseState;
  displayName: string;
}

export const SCENARIOS = {
  'New Hire': (base: BaseState): Partial<SimOverrides> => ({
    extraEmployees: 2,
    avgSalaryJOD: base.avgSalaryJOD,
  }),
  'New Loan': (_base: BaseState): Partial<SimOverrides> => ({
    newLoanAmount: 20000,
    loanTermMonths: 36,
  }),
  'Sales Shock −20%': (_base: BaseState): Partial<SimOverrides> => ({
    revenueMultiplier: 80,
  }),
  'Energy Cost +20%': (_base: BaseState): Partial<SimOverrides> => ({
    utilitiesMultiplier: 120,
  }),
  'Solar Panels': (_base: BaseState): Partial<SimOverrides> => ({
    solarPanels: true,
  }),
  'Late Payment 60d': (base: BaseState): Partial<SimOverrides> => ({
    latePaymentDays: 60,
    latePaymentAmount: Math.round(base.monthlyRevenue * 0.30),
  }),
} as const;

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const { state, updateState } = useOnboarding();
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [twinScores, setTwinScores] = useState<{ credit?: number; green?: number }>({});
  const [twinFinance, setTwinFinance] = useState<{
    existingLoanPayment?: number;
    availableCash?: number;
    monthlyRevenue?: number;
    displayName?: string;
  }>({});

  useEffect(() => {
    fetchScoringSummary()
      .then((s) => setTwinScores({ credit: s.credit_score, green: s.green_score }))
      .catch(() => {});
    fetchDashboardSummary()
      .then((summary) => {
        const name = summary.display_identity?.display_name;
        if (name && !state.businessName) {
          updateState({ businessName: name });
        }
        const debt = parseFloat(summary.monthly_debt?.total_monthly || '0');
        const cash = parseFloat(summary.total_available_balance || '0');
        const last = summary.monthly_cashflow?.[summary.monthly_cashflow.length - 1];
        setTwinFinance({
          existingLoanPayment: Number.isFinite(debt) ? debt : 0,
          availableCash: Number.isFinite(cash) ? cash : 0,
          monthlyRevenue: last?.income || undefined,
          displayName: name,
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baseState = useMemo(() => mockBaseState(
    state.annualRevenue,
    state.employees,
    state.yearsInOperation,
    state.connectedSources,
    state.businessSector,
    state.commitments ?? [],
    twinScores,
    twinFinance,
  ), [state, twinScores, twinFinance]);

  const [overrides, setOverrides] = useState<SimOverrides>(() => defaultOverrides(baseState));

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

  const baseline = useMemo(() => simulate(baseState, defaultOverrides(baseState)), [baseState]);
  const result   = useMemo(() => simulate(baseState, overrides), [baseState, overrides]);
  const displayName = twinFinance.displayName || state.businessName || 'Your business';

  return (
    <SimulationContext.Provider value={{
      overrides, setOverride, resetOverrides, applyScenario, activeScenario,
      result, baseline, baseState, displayName,
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
