/* ─────────────────────────────────────────────────────────────
   FinTwin Prescreening Engine
   Pure deterministic computation — no side effects.
───────────────────────────────────────────────────────────── */

import type { OnboardingState } from '@/context/OnboardingContext';

/* ── Bank product catalogue ──────────────────────────────── */
export interface BankProduct {
  id: string;
  tag: string;
  tagColor: string;
  name: string;
  bank: string;
  maxAmountJOD: number;
  rate: string;
  rateValue: number;
  matchPct: number;
  minCreditScore: number;
  minYearsOperation: number;
  requiresRegistration: boolean;
  requiresGreenScore: boolean;
  minGreenScore: number;
  requiresGreenSector: boolean;
  description: string;
}

export const BANK_PRODUCTS: BankProduct[] = [
  {
    id: 'murabaha-arab-bank',
    tag: 'Islamic Finance',
    tagColor: 'text-primary',
    name: 'Murabaha Working Capital',
    bank: 'Arab Bank',
    maxAmountJOD: 25000,
    rate: '',
    rateValue: 0,
    matchPct: 87,
    minCreditScore: 65,
    minYearsOperation: 2,
    requiresRegistration: true,
    requiresGreenScore: false,
    minGreenScore: 0,
    requiresGreenSector: false,
    description: 'Shariah-compliant working capital facility for established businesses with a proven track record.',
  },
  {
    id: 'energy-efficiency-cbj',
    tag: 'Green Loan',
    tagColor: 'text-emerald-600',
    name: 'Energy Efficiency Fund',
    bank: 'CBJ',
    maxAmountJOD: 50000,
    rate: '',
    rateValue: 0,
    matchPct: 62,
    minCreditScore: 60,
    minYearsOperation: 1,
    requiresRegistration: false,
    requiresGreenScore: true,
    minGreenScore: 55,
    requiresGreenSector: true,
    description: 'CBJ green finance under the Feb 2026 Green Taxonomy for energy efficiency investments.',
  },
  {
    id: 'msme-jlgc',
    tag: 'MSME Loan',
    tagColor: 'text-blue-600',
    name: 'MSME Guarantee Loan',
    bank: 'JLGC',
    maxAmountJOD: 15000,
    rate: '',
    rateValue: 0,
    matchPct: 74,
    minCreditScore: 55,
    minYearsOperation: 1,
    requiresRegistration: false,
    requiresGreenScore: false,
    minGreenScore: 0,
    requiresGreenSector: false,
    description: 'Government-backed guarantee loan for micro and small enterprises at accessible terms.',
  },
];

/* ── Auto-generated profile ──────────────────────────────── */
export interface ProfileItem {
  label: string;
  value: string;
  source?: string;
}

export interface AutoSection {
  id: string;
  title: string;
  status: 'complete' | 'partial' | 'missing';
  items: ProfileItem[];
}

export interface DocumentItem {
  label: string;
  status: 'complete' | 'partial' | 'missing';
}

export interface AutoProfile {
  sections: AutoSection[];
  documents: (product: BankProduct) => DocumentItem[];
}

/** Returns 'Not Available' for empty/missing profile values shown in the UI and PDF. */
function profileVal(value: string | number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined) return 'Not Available';
  const str = String(value).trim();
  if (!str || str === '0' || str === '-' || str === '—') return 'Not Available';
  return suffix ? `${str} ${suffix}` : str;
}

export function buildAutoProfile(
  state: OnboardingState,
  creditScore: number,
  greenScore: number,
  twin?: {
    displayName?: string;
    monthlyDebt?: number;
    monthlyRevenue?: number;
    cashBalance?: number;
    debtItems?: { label: string; amount: number }[];
    openBankingConnected?: boolean;
    accountsLinked?: number;
    avgMonthlyInflow?: number;
    avgMonthlyOutflow?: number;
    bankName?: string;
    ibanMasked?: string;
    registrationNumber?: string;
  },
): AutoProfile {
  // ── Core identity values — no hardcoded fallbacks ─────────
  const businessName = twin?.displayName || state.businessName || '';
  const sector       = state.businessSector || '';
  const category     = state.category || '';
  const employees    = state.employees || '';
  const years        = state.yearsInOperation || '';

  const monthlyRev = twin?.monthlyRevenue
    ?? (state.annualRevenue ? parseInt(state.annualRevenue, 10) / 12 : 0);
  const revenue = monthlyRev > 0
    ? `${Math.round(monthlyRev).toLocaleString()} JOD/mo`
    : 'Not Available';

  const registrationNumber = (twin?.registrationNumber || state.registrationNumber || '').trim();
  const hasReg = !!registrationNumber;

  const connected = Object.values(state.connectedSources).filter(Boolean).length;
  const commitments = state.commitments ?? [];
  const existingDebt = twin?.monthlyDebt ?? 0;
  const commitmentTotal = commitments.reduce((s, c) => s + c.amountJOD, 0);
  const totalExpenses = commitmentTotal + existingDebt;
  const netCash = monthlyRev > 0 ? Math.round(monthlyRev - totalExpenses) : null;
  const dti = monthlyRev > 0 ? Math.round((existingDebt / monthlyRev) * 100) : null;
  const cashBalance = twin?.cashBalance;
  const debtLabel = existingDebt > 0
    ? `${Math.round(existingDebt).toLocaleString()} JOD`
    : 'Not Available';
  const openBankingConnected =
    twin?.openBankingConnected ?? state.connectedSources.cliq;
  const accountsLinked = twin?.accountsLinked ?? 0;

  const sections: AutoSection[] = [
    {
      id: 'identity',
      title: 'Business Identity',
      status: businessName && sector ? 'complete' : 'partial',
      items: [
        { label: 'Business name',      value: profileVal(businessName) },
        { label: 'Sector',             value: profileVal(sector) },
        { label: 'Enterprise size',    value: profileVal(category) },
        { label: 'Years in operation', value: years ? `${years} years` : 'Not Available' },
        { label: 'Employees',          value: employees ? `${employees} employees` : 'Not Available' },
        {
          label: 'Registration number',
          value: hasReg ? registrationNumber : 'Not Available',
          source: hasReg ? 'Ministry of Industry' : undefined,
        },
      ],
    },
    {
      id: 'cashflow',
      title: 'Cash Flow & Financial Health',
      status: connected >= 2 ? 'complete' : 'partial',
      items: [
        {
          label: 'Monthly revenue',
          value: revenue,
          source: state.connectedSources.jofotara ? 'JoFotara' : (monthlyRev > 0 ? 'Estimated' : undefined),
        },
        {
          label: 'Monthly expenses',
          value: totalExpenses > 0 ? `${totalExpenses.toLocaleString()} JOD` : 'Not Available',
          source: 'FinTwin profile',
        },
        {
          label: 'Net monthly cash',
          value: netCash == null ? 'Not Available' : `${netCash >= 0 ? '+' : ''}${netCash.toLocaleString()} JOD`,
        },
        {
          label: 'Cash balance',
          value: cashBalance != null && cashBalance > 0
            ? `${Math.round(cashBalance).toLocaleString()} JOD`
            : 'Not Available',
          source: openBankingConnected ? 'Open banking' : undefined,
        },
      ],
    },
    {
      id: 'repayment',
      title: 'Repayment Capacity',
      status: existingDebt > 0 || monthlyRev > 0 ? 'complete' : 'partial',
      items: [
        {
          label: 'Existing monthly debt',
          value: debtLabel,
          source: existingDebt > 0 ? 'Open banking + applications' : undefined,
        },
        {
          label: 'Debt-to-income ratio',
          value: dti == null ? 'Not Available' : `${dti}%`,
        },
        ...(twin?.debtItems?.length
          ? twin.debtItems.slice(0, 4).map((item) => ({
              label: item.label,
              value: item.amount > 0 ? `${Math.round(item.amount).toLocaleString()} JOD/mo` : 'Not Available',
              source: 'Synced obligation',
            }))
          : []),
      ],
    },
    {
      id: 'collateral',
      title: 'Collateral & Assets',
      status: 'partial',
      items: [
        { label: 'Business equipment',    value: 'Not Available' },
        { label: 'Inventory',             value: 'Not Available' },
        { label: 'Real estate / property', value: 'Not Available' },
        { label: 'Vehicles',              value: 'Not Available' },
      ],
    },
    {
      id: 'credit',
      title: 'Credit Score',
      status: creditScore > 0 ? 'complete' : 'partial',
      items: [
        { label: 'FinTwin credit score', value: creditScore > 0 ? `${creditScore} / 100` : 'Not Available', source: 'FinTwin engine' },
        { label: 'Green finance score',  value: greenScore  > 0 ? `${greenScore} / 100`  : 'Not Available', source: 'FinTwin engine' },
        { label: 'Data coverage',        value: `${connected} of 4 sources connected` },
      ],
    },
    {
      id: 'banking',
      title: 'Bank Account Activity',
      status: openBankingConnected ? 'complete' : 'missing',
      items: openBankingConnected
        ? [
            {
              label: 'Open banking',
              value: accountsLinked > 0
                ? `Connected · ${accountsLinked} account${accountsLinked === 1 ? '' : 's'}`
                : 'Connected',
              source: 'JoPACC AIS',
            },
            ...(twin?.bankName
              ? [{ label: 'Bank', value: twin.bankName, source: 'Open banking' }]
              : []),
            ...(twin?.ibanMasked
              ? [{ label: 'Account', value: twin.ibanMasked, source: 'Open banking' }]
              : []),
            {
              label: 'Avg monthly inflow',
              value: twin?.avgMonthlyInflow != null && twin.avgMonthlyInflow > 0
                ? `${Math.round(twin.avgMonthlyInflow).toLocaleString()} JOD`
                : 'Not Available',
              source: 'Open banking',
            },
            {
              label: 'Avg monthly outflow',
              value: twin?.avgMonthlyOutflow != null && twin.avgMonthlyOutflow > 0
                ? `${Math.round(twin.avgMonthlyOutflow).toLocaleString()} JOD`
                : 'Not Available',
              source: 'Open banking',
            },
            {
              label: 'JoFotara',
              value: state.connectedSources.jofotara ? 'Connected' : 'Not connected',
              source: 'JoFotara',
            },
          ]
        : [
            { label: 'Open banking', value: 'Not connected' },
            { label: 'Status', value: 'Connect open banking to populate bank activity' },
          ],
    },
    {
      id: 'legal',
      title: 'Legal & Compliance',
      status: hasReg ? 'complete' : 'partial',
      items: [
        {
          label: 'Registration',
          value: hasReg ? 'Registered' : 'Not Available',
          source: hasReg ? 'Ministry of Industry' : undefined,
        },
        {
          label: 'Tax / JoFotara',
          value: state.connectedSources.jofotara ? 'Connected & compliant' : 'Not Available',
          source: state.connectedSources.jofotara ? 'JoFotara' : undefined,
        },
        { label: 'Sanctions check', value: 'Not Available' },
        { label: 'AML status',      value: 'Not Available' },
      ],
    },
  ];

  const documents = (product: BankProduct): DocumentItem[] => {
    const base: DocumentItem[] = [
      { label: 'National ID / Passport', status: 'complete' },
      { label: 'Bank statements (3–6 months)', status: openBankingConnected ? 'complete' : 'missing' },
      { label: 'Income / revenue evidence', status: state.connectedSources.jofotara ? 'complete' : 'partial' },
      { label: 'Financial statements', status: 'partial' },
    ];
    if (product.requiresRegistration) {
      base.push({ label: 'Business registration certificate', status: hasReg ? 'complete' : 'missing' });
    }
    if (product.requiresGreenScore) {
      base.push({ label: 'Green investment plan / energy audit', status: 'missing' });
      base.push({ label: 'Utility bills (3 months)', status: openBankingConnected ? 'partial' : 'missing' });
    }
    base.push({ label: 'Business plan (brief)', status: 'missing' }); // filled in step 3
    return base;
  };

  return { sections, documents };
}

/* ── Readiness evaluation ─────────────────────────────────── */
export type Verdict = 'pass' | 'marginal' | 'fail';
export type OverallVerdict = 'ready' | 'marginal' | 'not-ready';

export interface CriterionResult {
  label: string;
  actual: string;
  required: string;
  verdict: Verdict;
  fix?: string;
  fixHref?: string;
  impact?: string;
}

export interface ReadinessResult {
  creditCriteria: CriterionResult[];
  greenCriteria: CriterionResult[];
  creditVerdict: Verdict;
  greenVerdict: Verdict;
  overallVerdict: OverallVerdict;
  rateTier: string;
  greenClassification?: string;
  applicationScore: number;
  blockers: number;
}

export interface ManualInputs {
  businessPlan: string;
  mgmtYearsExperience: string;
  mgmtTeamSize: string;
  mgmtPriorLoansRepaid: string;
  mgmtBackground: string;
  industrySector: string;
  industryDescription: string;
  loanPurposeCategory: string;
  loanPurposeDescription: string;
}

export const emptyManualInputs = (): ManualInputs => ({
  businessPlan: '',
  mgmtYearsExperience: '',
  mgmtTeamSize: '',
  mgmtPriorLoansRepaid: '',
  mgmtBackground: '',
  industrySector: '',
  industryDescription: '',
  loanPurposeCategory: '',
  loanPurposeDescription: '',
});

export const demoManualInputs = (): ManualInputs => ({
  businessPlan:
    'Working capital expansion to grow wholesale distribution across Amman and Zarqa. Focus on inventory turnover, supplier terms, and digital invoicing via JoFotara.',
  mgmtYearsExperience: '8',
  mgmtTeamSize: '3',
  mgmtPriorLoansRepaid: '2',
  mgmtBackground:
    'Owner-operator with prior MSME financing repaid on schedule; bookkeeping handled in-house with quarterly accountant review.',
  industrySector: 'Retail & Trade',
  industryDescription:
    'Specialty goods wholesale and retail with recurring B2B customers and seasonal peak demand.',
  loanPurposeCategory: 'working-capital',
  loanPurposeDescription:
    'Inventory purchase and short-term operating float for the next 6 months of growth.',
});

export function calcManualCompletion(inputs: ManualInputs): number {
  const fields = Object.values(inputs);
  return Math.round((fields.filter(f => f.trim().length > 0).length / fields.length) * 100);
}

function scoreVerdict(actual: number, min: number): Verdict {
  if (actual >= min) return 'pass';
  if (actual >= min - 6) return 'marginal';
  return 'fail';
}

export function evaluateReadiness(
  product: BankProduct,
  state: OnboardingState,
  creditScore: number,
  greenScore: number,
  inputs: ManualInputs,
  twin?: { monthlyDebt?: number; monthlyRevenue?: number; registrationNumber?: string },
): ReadinessResult {
  const years = state.yearsInOperation ? parseFloat(state.yearsInOperation) : 3;
  const connected = Object.values(state.connectedSources).filter(Boolean).length;
  const hasReg = !!(twin?.registrationNumber || state.registrationNumber || '').trim();
  const manualPct = calcManualCompletion(inputs);
  const monthlyDebt = twin?.monthlyDebt ?? 0;
  const monthlyRevenue = twin?.monthlyRevenue
    ?? (state.annualRevenue ? parseInt(state.annualRevenue, 10) / 12 : 0);
  const debtToIncome = monthlyRevenue > 0
    ? Math.round((monthlyDebt / monthlyRevenue) * 100)
    : (monthlyDebt > 0 ? 50 : 0);
  const greenSectors = ['Food & Hospitality', 'Agriculture', 'Small Manufacturing'];
  const isGreenSector = greenSectors.some(s => (state.businessSector || '').includes(s));

  // --- Credit criteria ---
  const creditCriteria: CriterionResult[] = [
    {
      label: 'Credit readiness score',
      actual: `${creditScore} pts`,
      required: `≥ ${product.minCreditScore} pts`,
      verdict: scoreVerdict(creditScore, product.minCreditScore),
      fix: creditScore < product.minCreditScore ? 'Connect more data sources to improve your score' : undefined,
      fixHref: '/dashboard',
      impact: creditScore < product.minCreditScore ? `+${product.minCreditScore - creditScore} pts needed` : undefined,
    },
    {
      label: 'Years in operation',
      actual: `${years} years`,
      required: `≥ ${product.minYearsOperation} year${product.minYearsOperation > 1 ? 's' : ''}`,
      verdict: years >= product.minYearsOperation ? 'pass' : 'fail',
      fix: years < product.minYearsOperation ? 'Business must operate longer to qualify for this product' : undefined,
    },
    {
      label: 'Repayment capacity',
      actual: `${debtToIncome}% debt-to-income`,
      required: '< 40%',
      verdict: debtToIncome < 35 ? 'pass' : debtToIncome < 40 ? 'marginal' : 'fail',
      fix: debtToIncome >= 40 ? 'Reduce existing obligations before taking on new debt' : undefined,
    },
    {
      label: 'Data completeness',
      actual: `${connected} sources connected`,
      required: '≥ 2 sources',
      verdict: connected >= 2 ? 'pass' : connected === 1 ? 'marginal' : 'fail',
      fix: connected < 2 ? 'Connect CliQ or JoFotara to complete your financial profile' : undefined,
      fixHref: '/onboarding',
      impact: connected < 2 ? '+8 pts when connected' : undefined,
    },
    ...(product.requiresRegistration ? [{
      label: 'Business registration',
      actual: hasReg ? 'Registered' : 'Not provided',
      required: 'Required',
      verdict: (hasReg ? 'pass' : 'fail') as Verdict,
      fix: !hasReg ? 'Add your registration number in your profile' : undefined,
      fixHref: '/onboarding',
      impact: !hasReg ? '+12 pts when verified' : undefined,
    }] : []),
    {
      label: 'Application completeness',
      actual: `${manualPct}%`,
      required: '≥ 60%',
      verdict: manualPct >= 60 ? 'pass' : manualPct >= 40 ? 'marginal' : 'fail',
      fix: manualPct < 60 ? 'Complete the business plan and loan purpose sections' : undefined,
    },
  ];

  // --- Green criteria ---
  const greenCriteria: CriterionResult[] = [];
  if (product.requiresGreenScore) {
    greenCriteria.push({
      label: 'Green finance score',
      actual: `${greenScore} pts`,
      required: `≥ ${product.minGreenScore} pts`,
      verdict: scoreVerdict(greenScore, product.minGreenScore),
      fix: greenScore < product.minGreenScore ? 'Declare green investments or connect more data sources' : undefined,
      fixHref: '/simulation',
      impact: greenScore < product.minGreenScore ? `+${product.minGreenScore - greenScore} pts needed` : undefined,
    });
  }
  if (product.requiresGreenSector) {
    greenCriteria.push({
      label: 'Eligible sector (CBJ taxonomy)',
      actual: state.businessSector || 'Food & Hospitality',
      required: 'Energy-relevant sector',
      verdict: isGreenSector ? 'pass' : 'marginal',
      fix: !isGreenSector ? 'Describe your energy investment in the Loan Purpose section' : undefined,
    });
    greenCriteria.push({
      label: 'Green investment declared',
      actual: inputs.loanPurposeCategory === 'green' ? 'Yes — green purpose stated' : 'Not declared',
      required: 'Energy or sustainability purpose',
      verdict: inputs.loanPurposeCategory === 'green' ? 'pass' : 'marginal',
      fix: inputs.loanPurposeCategory !== 'green' ? 'Select "Green Investment" as loan purpose' : undefined,
    });
  }

  // Verdicts
  const hasCreditFail = creditCriteria.some(c => c.verdict === 'fail');
  const hasGreenFail = greenCriteria.some(c => c.verdict === 'fail');
  const hasCreditMarginal = creditCriteria.some(c => c.verdict === 'marginal');
  const hasGreenMarginal = greenCriteria.some(c => c.verdict === 'marginal');

  const creditVerdict: Verdict = hasCreditFail ? 'fail' : hasCreditMarginal ? 'marginal' : 'pass';
  const greenVerdict: Verdict = product.requiresGreenScore
    ? (hasGreenFail ? 'fail' : hasGreenMarginal ? 'marginal' : 'pass')
    : 'pass';

  const blockers = creditCriteria.filter(c => c.verdict === 'fail').length +
    greenCriteria.filter(c => c.verdict === 'fail').length;

  const overallVerdict: OverallVerdict = blockers > 0
    ? 'not-ready'
    : (creditVerdict === 'marginal' || greenVerdict === 'marginal') ? 'marginal' : 'ready';

  const rateTier = greenScore >= 75
    ? 'Tier 1 — Best rate'
    : greenScore >= 55
    ? 'Tier 2 — Standard green rate'
    : 'Tier 3 — Standard rate';

  const greenClassification = product.requiresGreenScore && greenScore >= product.minGreenScore
    ? 'CBJ Green Taxonomy — Energy Efficiency'
    : undefined;

  const applicationScore = Math.round(
    (creditCriteria.filter(c => c.verdict === 'pass').length / creditCriteria.length) * 60 +
    (greenCriteria.length > 0
      ? (greenCriteria.filter(c => c.verdict === 'pass').length / greenCriteria.length) * 20
      : 20) +
    (manualPct / 100) * 20
  );

  return {
    creditCriteria,
    greenCriteria,
    creditVerdict,
    greenVerdict,
    overallVerdict,
    rateTier,
    greenClassification,
    applicationScore,
    blockers,
  };
}
