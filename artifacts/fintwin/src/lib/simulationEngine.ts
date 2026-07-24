/* ─────────────────────────────────────────────────────────────
   FinTwin Simulation — shared types.

   The actual what-if math used to live here as a client-only, disconnected
   formula. It's been replaced by a real backend engine (`/api/v1/simulation/`)
   that re-runs FinTwin's actual credit-risk / credit-readiness / liquidity
   rule engine on a hypothetical version of the business — see
   `apps/simulation/engine.py` on the backend and `SimulationContext.tsx` here.

   This file now only holds the shared UI-facing types.
───────────────────────────────────────────────────────────── */

export interface Commitment {
  id: string;
  category: 'rent' | 'payroll' | 'utilities' | 'supplier' | 'loan' | 'subscription' | 'insurance' | 'other';
  label: string;
  amountJOD: number;
}

export interface SimOverrides {
  revenueMultiplier: number;     // 50–200 (percent), default 100
  extraEmployees: number;        // 0–10 added employees, default 0
  avgSalaryJOD: number;          // override per-employee salary
  newLoanAmount: number;         // 0–50000 JOD, default 0
  loanTermMonths: number;        // 12/24/36/48, default 24
  rentMultiplier: number;        // 50–200 (percent), default 100
  utilitiesMultiplier: number;   // 50–200 (percent), default 100
  oneOffPurchaseJOD: number;     // 0–30000 JOD, amortised over 12 months
  latePaymentDays: number;       // 0/30/60/90 days late payment from a client
  latePaymentAmount: number;     // JOD value of the late payment (default: 30% monthly revenue)
  solarPanels: boolean;          // 8000 JOD cost, saves 15% utilities, +8 green pts
  energyEfficiency: boolean;     // +5 green pts, saves 5% utilities
}
