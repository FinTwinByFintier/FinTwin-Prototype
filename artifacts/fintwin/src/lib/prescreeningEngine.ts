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
    rate: '6.5%',
    rateValue: 6.5,
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
    rate: '2.75%',
    rateValue: 2.75,
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
    rate: '7.0%',
    rateValue: 7.0,
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

export function buildAutoProfile(
  state: OnboardingState,
  creditScore: number,
  greenScore: number,
): AutoProfile {
  const businessName = state.businessName || 'Amman Coffee Roasters';
  const sector = state.businessSector || 'Food & Hospitality';
  const category = state.category || 'Micro Enterprise';
  const employees = state.employees || '4';
  const years = state.yearsInOperation || '3';
  const revenue = state.annualRevenue ? `${(parseInt(state.annualRevenue) / 12).toLocaleString()} JOD/mo` : '4,800 JOD/mo';
  const hasReg = state.hasRegistrationNumber && state.registrationNumber;
  const connected = Object.values(state.connectedSources).filter(Boolean).length;
  const commitments = state.commitments ?? [];
  const totalExpenses = commitments.reduce((s, c) => s + c.amountJOD, 0) + 850; // +existing loan
  const netCash = 4800 - totalExpenses;

  const sections: AutoSection[] = [
    {
      id: 'identity',
      title: 'Business Identity',
      status: 'complete',
      items: [
        { label: 'Business name', value: businessName },
        { label: 'Sector', value: sector },
        { label: 'Enterprise size', value: category },
        { label: 'Years in operation', value: `${years} years` },
        { label: 'Employees', value: `${employees} employees` },
        { label: 'Registration number', value: hasReg ? state.registrationNumber : 'Not provided', source: hasReg ? 'Ministry of Industry' : undefined },
      ],
    },
    {
      id: 'cashflow',
      title: 'Cash Flow & Financial Health',
      status: connected >= 2 ? 'complete' : 'partial',
      items: [
        { label: 'Monthly revenue', value: revenue, source: state.connectedSources.jofotara ? 'JoFotara' : 'Estimated' },
        { label: 'Monthly expenses', value: `${totalExpenses.toLocaleString()} JOD`, source: 'FinTwin profile' },
        { label: 'Net monthly cash', value: `${netCash >= 0 ? '+' : ''}${netCash.toLocaleString()} JOD` },
        { label: 'Cash trend', value: '↑ 14% vs last month', source: state.connectedSources.cliq ? 'CliQ' : 'Estimated' },
        { label: 'Cash balance', value: '18,500 JOD', source: state.connectedSources.cliq ? 'CliQ' : 'Estimated' },
      ],
    },
    {
      id: 'repayment',
      title: 'Repayment Capacity',
      status: 'complete',
      items: [
        { label: 'Existing monthly debt', value: '850 JOD', source: 'CliQ open banking' },
        { label: 'Debt-to-income ratio', value: `${Math.round((850 / 4800) * 100)}%` },
        { label: 'Cash runway', value: '4.2 months at current burn' },
        { label: 'On-time payment history', value: '8 of 8 installments paid', source: 'Arab Bank' },
      ],
    },
    {
      id: 'collateral',
      title: 'Collateral & Assets',
      status: 'partial',
      items: [
        { label: 'Business equipment', value: 'Declared (not valued)', source: 'Onboarding' },
        { label: 'Inventory', value: 'Partial disclosure', source: 'JoFotara' },
        { label: 'Real estate / property', value: 'Not declared' },
        { label: 'Vehicles', value: 'Not declared' },
      ],
    },
    {
      id: 'credit',
      title: 'Credit Score',
      status: 'complete',
      items: [
        { label: 'FinTwin credit score', value: `${creditScore} / 100`, source: 'FinTwin engine' },
        { label: 'Payment history', value: '82 / 100', source: 'CliQ + Bank' },
        { label: 'Cash flow health', value: '70 / 100' },
        { label: 'Business age score', value: '65 / 100' },
        { label: 'Data coverage', value: `${connected} of 4 sources connected` },
      ],
    },
    {
      id: 'banking',
      title: 'Bank Account Activity',
      status: state.connectedSources.cliq ? 'complete' : 'missing',
      items: state.connectedSources.cliq
        ? [
            { label: 'CliQ account', value: 'Connected', source: 'CliQ' },
            { label: 'Avg monthly inflow', value: '5,700 JOD (last 4 mo)', source: 'CliQ' },
            { label: 'Avg monthly outflow', value: '3,600 JOD (last 4 mo)', source: 'CliQ' },
            { label: 'JoFotara', value: state.connectedSources.jofotara ? 'Connected' : 'Not connected', source: 'JoFotara' },
          ]
        : [
            { label: 'CliQ account', value: 'Not connected' },
            { label: 'Status', value: 'Connect CliQ to populate bank activity' },
          ],
    },
    {
      id: 'legal',
      title: 'Legal & Compliance',
      status: hasReg ? 'complete' : 'partial',
      items: [
        { label: 'Registration', value: hasReg ? 'Registered' : 'Unverified — add registration number', source: hasReg ? 'Ministry of Industry' : undefined },
        { label: 'Tax / JoFotara', value: state.connectedSources.jofotara ? 'Connected & compliant' : 'Not verified', source: state.connectedSources.jofotara ? 'JoFotara' : undefined },
        { label: 'Sanctions check', value: 'Clear', source: 'Internal check' },
        { label: 'AML status', value: 'No flags', source: 'Internal check' },
      ],
    },
  ];

  const documents = (product: BankProduct): DocumentItem[] => {
    const base: DocumentItem[] = [
      { label: 'National ID / Passport', status: 'complete' },
      { label: 'Bank statements (3–6 months)', status: state.connectedSources.cliq ? 'complete' : 'missing' },
      { label: 'Income / revenue evidence', status: state.connectedSources.jofotara ? 'complete' : 'partial' },
      { label: 'Financial statements', status: 'partial' },
    ];
    if (product.requiresRegistration) {
      base.push({ label: 'Business registration certificate', status: hasReg ? 'complete' : 'missing' });
    }
    if (product.requiresGreenScore) {
      base.push({ label: 'Green investment plan / energy audit', status: 'missing' });
      base.push({ label: 'Utility bills (3 months)', status: state.connectedSources.cliq ? 'partial' : 'missing' });
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
): ReadinessResult {
  const years = state.yearsInOperation ? parseFloat(state.yearsInOperation) : 3;
  const connected = Object.values(state.connectedSources).filter(Boolean).length;
  const hasReg = state.hasRegistrationNumber && !!state.registrationNumber;
  const manualPct = calcManualCompletion(inputs);
  const debtToIncome = Math.round((850 / 4800) * 100);
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
