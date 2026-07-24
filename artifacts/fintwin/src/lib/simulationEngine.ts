/* ─────────────────────────────────────────────────────────────
   FinTwin Simulation Engine
   Pure deterministic computation — no side effects, no API calls.
   All values in JOD (Jordanian Dinar).
───────────────────────────────────────────────────────────── */

export interface Commitment {
  id: string;
  category: 'rent' | 'payroll' | 'utilities' | 'supplier' | 'loan' | 'subscription' | 'insurance' | 'other';
  label: string;
  amountJOD: number;
}

export interface BaseState {
  monthlyRevenue: number;        // JOD
  commitments: Commitment[];
  existingLoanPayment: number;   // JOD/month (from open banking)
  availableCash: number;         // JOD (current balance)
  employees: number;
  avgSalaryJOD: number;
  yearsInOperation: number;
  connectedSourcesCount: number; // 0-4
  hasReceipts: boolean;
  sector: string;
  /** Twin scores from API — simulation layers what-if deltas on top. */
  baselineCreditScore?: number;
  baselineGreenScore?: number;
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

export interface SimResult {
  monthlyIncome: number;
  monthlyExpenses: number;
  netCash: number;
  runwayMonths: number | null;   // null = positive net (infinite runway)
  creditScore: number;
  greenScore: number;
  projectedCashFlow: Array<{ month: string; income: number; expense: number }>;
  newLoanMonthlyPayment: number;
  interestRate: number;          // auto-derived from green score
  totalCommitmentsMonthly: number;
}

/* ── Interest rate by green score (CBJ green taxonomy inspired) ── */
function deriveInterestRate(greenScore: number): number {
  if (greenScore >= 75) return 2.75;
  if (greenScore >= 60) return 5.5;
  if (greenScore >= 45) return 6.5;
  return 7.5;
}

/* ── Monthly payment for a flat-rate loan ── */
function loanMonthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (principal === 0 || months === 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

/* ── Main simulation function ── */
export function simulate(base: BaseState, overrides: SimOverrides): SimResult {
  // --- Green score (anchor on twin score when available) ---
  const greenAnchor = base.baselineGreenScore ?? 38;
  let greenDelta = 0;
  if (base.baselineGreenScore == null) {
    greenDelta += base.connectedSourcesCount * 5;
    if (base.hasReceipts) greenDelta += 5;
    const greenSectors = ['Food & Hospitality', 'Agriculture', 'Small Manufacturing'];
    if (greenSectors.some(s => base.sector.includes(s))) greenDelta += 5;
  }
  if (overrides.solarPanels) greenDelta += 8;
  if (overrides.energyEfficiency) greenDelta += 5;
  const greenScore = Math.min(100, Math.max(0, greenAnchor + greenDelta));

  // --- Interest rate ---
  const interestRate = deriveInterestRate(greenScore);

  // --- New loan payment ---
  const newLoanMonthlyPayment = overrides.newLoanAmount > 0
    ? loanMonthlyPayment(overrides.newLoanAmount, interestRate, overrides.loanTermMonths)
    : 0;

  // --- Monthly income ---
  const baseIncome = base.monthlyRevenue * (overrides.revenueMultiplier / 100);
  // Late payment: a portion arrives late, so this month's income dips
  const lateDeduction = overrides.latePaymentDays > 0
    ? overrides.latePaymentAmount * (overrides.latePaymentDays / 90)
    : 0;
  const monthlyIncome = Math.max(0, baseIncome - lateDeduction);

  // --- Monthly expenses ---
  const commitments = base.commitments ?? [];
  const rentBase = commitments
    .filter(c => c.category === 'rent')
    .reduce((s, c) => s + c.amountJOD, 0);
  const utilitiesBase = commitments
    .filter(c => c.category === 'utilities')
    .reduce((s, c) => s + c.amountJOD, 0);
  const otherCommitments = commitments
    .filter(c => c.category !== 'rent' && c.category !== 'utilities' && c.category !== 'payroll')
    .reduce((s, c) => s + c.amountJOD, 0);

  // Payroll: base employees + overrides, using override salary
  const totalEmployees = base.employees + overrides.extraEmployees;
  const payrollTotal = totalEmployees * overrides.avgSalaryJOD;

  const adjustedRent = rentBase * (overrides.rentMultiplier / 100);
  let adjustedUtilities = utilitiesBase * (overrides.utilitiesMultiplier / 100);
  if (overrides.solarPanels) adjustedUtilities *= 0.85;   // 15% saving
  if (overrides.energyEfficiency) adjustedUtilities *= 0.95; // 5% saving

  // Solar capital cost amortised over 12 months
  const solarMonthly = overrides.solarPanels ? 8000 / 12 : 0;
  const oneOffMonthly = overrides.oneOffPurchaseJOD / 12;

  const monthlyExpenses =
    adjustedRent +
    adjustedUtilities +
    payrollTotal +
    otherCommitments +
    base.existingLoanPayment +
    newLoanMonthlyPayment +
    solarMonthly +
    oneOffMonthly;

  const totalCommitmentsMonthly = monthlyExpenses;
  const netCash = monthlyIncome - monthlyExpenses;

  // --- Runway ---
  const runwayMonths = netCash < 0
    ? +(base.availableCash / Math.abs(netCash)).toFixed(1)
    : null;

  // --- Credit score ---
  // Payment history: 35% — driven by connected sources & on-time loan payments
  const paymentHistory = Math.min(100, 50 + base.connectedSourcesCount * 10 + (base.existingLoanPayment > 0 ? 15 : 0));
  // Cash flow health: 25% — net/income ratio
  const cashFlowRatio = monthlyIncome > 0 ? Math.max(-1, Math.min(1, netCash / monthlyIncome)) : -1;
  const cashFlowScore = Math.round(50 + cashFlowRatio * 50);
  // Business age: 20%
  const ageScore = Math.min(100, base.yearsInOperation * 12);
  // Data coverage: 20%
  const dataScore = Math.round((base.connectedSourcesCount / 4) * 100);
  // New loan adds debt burden — penalises slightly
  const debtPenalty = overrides.newLoanAmount > 0 ? Math.min(15, overrides.newLoanAmount / 3000) : 0;

  let creditScore = Math.round(
    paymentHistory  * 0.35 +
    cashFlowScore   * 0.25 +
    ageScore        * 0.20 +
    dataScore       * 0.20 -
    debtPenalty
  );
  if (base.baselineCreditScore != null) {
    const cashDelta = Math.round((cashFlowScore - 50) * 0.15);
    creditScore = Math.round(base.baselineCreditScore - debtPenalty + cashDelta);
  }

  // --- Projected cash flow (next 4 months) ---
  const months = ['Aug', 'Sep', 'Oct', 'Nov'];
  // Slight natural growth assumed unless overridden
  const projectedCashFlow = months.map((month, i) => {
    const growthFactor = 1 + i * 0.02; // 2% monthly natural growth
    const lateRecovery = (overrides.latePaymentDays > 0 && i === 1) ? lateDeduction : 0; // late payment arrives next month
    return {
      month,
      income: Math.round((monthlyIncome + lateRecovery) * growthFactor),
      expense: Math.round(monthlyExpenses),
    };
  });

  return {
    monthlyIncome: Math.round(monthlyIncome),
    monthlyExpenses: Math.round(monthlyExpenses),
    netCash: Math.round(netCash),
    runwayMonths,
    creditScore: Math.min(100, Math.max(0, creditScore)),
    greenScore: Math.min(100, Math.max(0, greenScore)),
    projectedCashFlow,
    newLoanMonthlyPayment: Math.round(newLoanMonthlyPayment),
    interestRate,
    totalCommitmentsMonthly: Math.round(totalCommitmentsMonthly),
  };
}

/* ── Default overrides (baseline — no changes) ── */
export const defaultOverrides = (base: BaseState): SimOverrides => ({
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
});

/* ── Default mock base state ── */
export const mockBaseState = (
  annualRevenue: string,
  employees: string,
  years: string,
  connectedSources: { jofotara: boolean; cliq: boolean; pos: boolean; receipts: boolean },
  sector: string,
  commitments: Commitment[],
  baselineScores?: { credit?: number; green?: number },
  twin?: { existingLoanPayment?: number; availableCash?: number; monthlyRevenue?: number },
): BaseState => {
  const revenueFromAnnual = annualRevenue ? parseInt(annualRevenue, 10) / 12 : NaN;
  const revenue = twin?.monthlyRevenue ?? (isNaN(revenueFromAnnual) ? 0 : revenueFromAnnual);
  const emp = employees ? parseInt(employees, 10) : 4;
  const yrs = years ? parseFloat(years) : 3;
  const connected = Object.values(connectedSources).filter(Boolean).length;
  return {
    monthlyRevenue: revenue > 0 ? revenue : 0,
    commitments,
    existingLoanPayment: twin?.existingLoanPayment ?? 0,
    availableCash: twin?.availableCash ?? 0,
    employees: isNaN(emp) ? 4 : emp,
    avgSalaryJOD: 400,
    yearsInOperation: isNaN(yrs) ? 3 : yrs,
    connectedSourcesCount: connected,
    hasReceipts: connectedSources.receipts,
    sector: sector || 'Food & Hospitality',
    baselineCreditScore: baselineScores?.credit,
    baselineGreenScore: baselineScores?.green,
  };
};
