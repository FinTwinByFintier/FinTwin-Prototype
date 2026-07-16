import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { simulate, defaultOverrides, mockBaseState } from '@/lib/simulationEngine';
import type { SimOverrides, SimResult, BaseState } from '@/lib/simulationEngine';
import { useOnboarding } from '@/context/OnboardingContext';

interface SimulationContextType {
  overrides: SimOverrides;
  setOverride: <K extends keyof SimOverrides>(key: K, value: SimOverrides[K]) => void;
  resetOverrides: () => void;
  applyScenario: (scenario: keyof typeof SCENARIOS) => void;
  activeScenario: string | null;
  result: SimResult;
  baseline: SimResult;
  baseState: BaseState;
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
  const { state } = useOnboarding();
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const baseState = useMemo(() => mockBaseState(
    state.annualRevenue,
    state.employees,
    state.yearsInOperation,
    state.connectedSources,
    state.businessSector,
    state.commitments ?? [],
  ), [state]);

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
      // deselect
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

  return (
    <SimulationContext.Provider value={{ overrides, setOverride, resetOverrides, applyScenario, activeScenario, result, baseline, baseState }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider');
  return ctx;
}
