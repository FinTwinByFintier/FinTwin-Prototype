const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://sam-heterozygotic-incongruently.ngrok-free.dev";

const TOKEN_KEY = "fintwin_token";

export function getApiBase(): string {
  return API_BASE;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export type BusinessProfilePayload = {
  is_officially_registered?: boolean | null;
  registration_number?: string;
  business_name?: string;
  business_type?: string;
  business_sector?: string;
  verified_legal_entity?: string;
  verified_registration_date?: string;
  employees?: string | number | null;
  years_in_operation?: string | number | null;
  annual_revenue_jod?: string | number | null;
  category?: string;
  iban?: string;
  contact_phone?: string;
  connected_cliq?: boolean;
  connected_jofotara?: boolean;
  connected_pos?: boolean;
  connected_receipts?: boolean;
  pos_provider?: string;
  consent_given?: boolean;
  last_synced_cliq?: string | null;
  last_synced_jofotara?: string | null;
  last_synced_pos?: string | null;
  last_synced_receipts?: string | null;
};
export type BusinessProfile = BusinessProfilePayload & {
  consent_at?: string | null;
  updated_at?: string | null;
};

export type AuthResponse = {
  token: string;
  next_step: number;
  created?: boolean;
  user: {
    id: number;
    onboarding_step: number;
    next_step: number;
    date_joined: string;
  };
  profile?: BusinessProfile;
};

export type MeResponse = {
  next_step: number;
  user: AuthResponse["user"];
  profile?: BusinessProfile;
};

export type ProfileResponse = {
  next_step: number;
  profile: BusinessProfile;
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("ngrok-skip-browser-warning", "true");

  const token = getToken();
  if (token && !skipAuth) headers.set("Authorization", `Token ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      (typeof data.detail === "string" && data.detail) ||
      (Array.isArray(data.national_id) && data.national_id[0]) ||
      (Array.isArray(data.password) && data.password[0]) ||
      "Request failed";
    throw new ApiError(detail, res.status, data.code);
  }
  return data as T;
}

export function register(nationalId: string, password: string) {
  // Drop any stale token — DRF rejects AllowAny routes if Authorization is invalid.
  setToken(null);
  clearOpenBankingAccountsCache();
  return apiFetch<AuthResponse>("/api/v1/auth/register/", {
    method: "POST",
    body: JSON.stringify({ national_id: nationalId, password }),
    skipAuth: true,
  });
}

export function login(nationalId: string, password: string) {
  setToken(null);
  clearOpenBankingAccountsCache();
  return apiFetch<AuthResponse>("/api/v1/auth/login/", {
    method: "POST",
    body: JSON.stringify({ national_id: nationalId, password }),
    skipAuth: true,
  });
}

export function fetchMe() {
  return apiFetch<MeResponse>("/api/v1/auth/me/");
}

export function saveOnboardingStep(step: number) {
  return apiFetch<MeResponse>("/api/v1/auth/onboarding/", {
    method: "PATCH",
    body: JSON.stringify({ step }),
  });
}

export function fetchBusinessProfile() {
  return apiFetch<ProfileResponse>("/api/v1/onboarding/profile/");
}

export function saveBusinessProfile(payload: BusinessProfilePayload) {
  return apiFetch<ProfileResponse>("/api/v1/onboarding/profile/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export type PreviewTransaction = {
  temp_id: string;
  direction: "debit" | "credit" | "unknown";
  kind: string;
  amount: number | string | null;
  currency: string;
  transaction_date: string | null;
  due_date: string | null;
  description: string;
  counterparty: string;
  reference_number: string;
  account_number: string;
  iban: string;
  commission_amount: number | string | null;
  source_filename?: string;
};

export type ExtractedTransaction = PreviewTransaction & {
  id?: number;
  upload_id?: number;
  created_at?: string | null;
};

export type ReceiptExtractResponse = {
  status: "complete" | "insufficient" | "error" | "pending";
  document_type: string;
  message?: string | null;
  transaction_count: number;
  transactions: PreviewTransaction[];
};

export async function extractReceipt(file: File): Promise<ReceiptExtractResponse> {
  const headers = new Headers();
  headers.set("ngrok-skip-browser-warning", "true");
  const token = getToken();
  if (token) headers.set("Authorization", `Token ${token}`);

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${getApiBase()}/api/v1/receipts/extract/`, {
    method: "POST",
    headers,
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (typeof data.detail === "string" && data.detail) ||
        data.message ||
        "Receipt extraction failed",
      res.status,
      data.code,
    );
  }
  return data as ReceiptExtractResponse;
}

export function importReceiptTransactions(payload: {
  source_label?: string;
  transactions: Array<Partial<PreviewTransaction>>;
}) {
  return apiFetch<{ imported: number; upload_id: number; transactions: ExtractedTransaction[] }>(
    "/api/v1/receipts/import/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function fetchExtractedTransactions() {
  return apiFetch<{ transactions: ExtractedTransaction[] }>(
    "/api/v1/receipts/transactions/",
  );
}

export type OpenBankingAccount = {
  account_id: string;
  source?: string;
  iban: string;
  iban_masked: string;
  currency: string;
  account_status: string;
  account_type_code: string;
  account_type_name: string;
  bank_name_en: string;
  bank_name_ar: string;
  branch_name_en: string;
  available_balance: number | string | null;
  balance_position: string;
  shared_account?: boolean;
  locked_for_credit?: boolean;
  locked_for_debit?: boolean;
  has_balance?: boolean;
  has_transactions?: boolean;
  usable?: boolean;
};

export type OpenBankingAccountsResponse = {
  status: "ok" | "error";
  message?: string | null;
  accounts: OpenBankingAccount[];
  selected_account_ids: string[];
  recommended_account_ids?: string[];
  jopacc_customer_id?: string | null;
  cached?: boolean;
};

let openBankingAccountsCache: OpenBankingAccountsResponse | null = null;

export function clearOpenBankingAccountsCache() {
  openBankingAccountsCache = null;
}

export function fetchOpenBankingAccounts(opts?: { refresh?: boolean }) {
  if (!opts?.refresh && openBankingAccountsCache?.status === "ok") {
    return Promise.resolve(openBankingAccountsCache);
  }
  const q = opts?.refresh ? "?refresh=1" : "";
  return apiFetch<OpenBankingAccountsResponse>(
    `/api/v1/openbanking/accounts/${q}`,
  ).then((result) => {
    if (result.status === "ok") openBankingAccountsCache = result;
    return result;
  });
}

export function saveOpenBankingAccounts(accountIds: string[]) {
  return apiFetch<{ saved: number; accounts: OpenBankingAccount[] }>(
    "/api/v1/openbanking/accounts/select/",
    {
      method: "POST",
      body: JSON.stringify({ account_ids: accountIds }),
    },
  ).then((result) => {
    if (openBankingAccountsCache?.status === "ok") {
      openBankingAccountsCache = {
        ...openBankingAccountsCache,
        selected_account_ids: accountIds,
      };
    }
    return result;
  });
}

export function fetchLinkedBankAccounts() {
  return apiFetch<{ accounts: OpenBankingAccount[] }>(
    "/api/v1/openbanking/accounts/linked/",
  );
}

export type SourceConnectResponse = {
  source: string;
  jopacc_customer_id: string;
  account: OpenBankingAccount;
  profile: BusinessProfile;
};

export function connectJoFotaraSource() {
  return apiFetch<SourceConnectResponse>(
    "/api/v1/openbanking/sources/jofotara/connect/",
    { method: "POST", body: JSON.stringify({}) },
  );
}

export function connectPosSource(posProvider?: string) {
  return apiFetch<SourceConnectResponse>(
    "/api/v1/openbanking/sources/pos/connect/",
    {
      method: "POST",
      body: JSON.stringify({ pos_provider: posProvider || "" }),
    },
  );
}

export type LinkedAccountSummary = OpenBankingAccount & {
  current_balance: number | string | null;
  balance_updated_at: string | null;
};

export type MonthlyCashflowPoint = {
  month: string;
  income: number;
  expense: number;
};

export type RecentTransaction = {
  id: number;
  source: string;
  amount: string;
  currency: string;
  direction: "credit" | "debit";
  date: string | null;
  description: string;
  counterparty: string;
  channel: string;
};

export type UpcomingPayment = {
  id: number;
  source: string;
  nickname: string;
  beneficiary: string;
  amount: string | null;
  currency: string;
  frequency: string;
  status: string;
  next_payment_at: string | null;
  remaining_payments: number | null;
};

export type TwinCompleteness = {
  percent: number;
  accounts_linked: number;
  transactions_imported: number;
  standing_orders_tracked: number;
  beneficiaries_imported?: number;
};

export type DisplayIdentity = {
  display_name: string;
  business_name: string;
  beneficiary_name: string;
  beneficiary_name_ar: string;
  trade_name: string;
  nickname: string;
  iban: string;
  cliq_alias: string;
  phone: string;
  bank_name: string;
  source: "beneficiary" | "profile" | "fallback" | string;
};

export type MonthlyDebtItem = {
  id: number;
  label: string;
  beneficiary: string;
  amount_monthly: string;
  currency: string;
  frequency: string | null;
  kind: "sosp" | "loan_application" | string;
  reference_number?: string;
  requested_amount?: string;
  status?: string;
};

export type MonthlyDebt = {
  total_monthly: string;
  sosp_monthly: string;
  loan_monthly: string;
  currency: string;
  items: MonthlyDebtItem[];
};

export type BeneficiarySummary = {
  id: number;
  beneficiary_id: string;
  beneficiary_type: string;
  name_en: string;
  name_ar: string;
  trade_name_en: string;
  trade_name_ar: string;
  display_name: string;
  nickname: string;
  iban: string;
  cliq_alias: string;
  notes: string;
  bank_name_en: string;
  is_primary: boolean;
  account_id: string;
  source: string;
};

export type DashboardSummary = {
  linked_accounts: LinkedAccountSummary[];
  total_available_balance: string;
  monthly_cashflow: MonthlyCashflowPoint[];
  recent_transactions: RecentTransaction[];
  upcoming_payments: UpcomingPayment[];
  beneficiaries?: BeneficiarySummary[];
  display_identity?: DisplayIdentity;
  monthly_debt?: MonthlyDebt;
  profile: BusinessProfile;
  twin_completeness: TwinCompleteness;
};

export type SyncRunResult = {
  synced_sources: string[];
  accounts: number;
  balances_updated: number;
  transactions_imported: number;
  sosps_imported: number;
  beneficiaries_imported?: number;
};

export function runDataSync() {
  return apiFetch<SyncRunResult>("/api/v1/openbanking/sync/run/", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function fetchDashboardSummary() {
  return apiFetch<DashboardSummary>("/api/v1/openbanking/dashboard-summary/");
}

export type TwinTransaction = {
  id: number;
  source: string;
  amount: string;
  currency: string;
  direction: "credit" | "debit";
  date: string | null;
  description: string;
  counterparty: string;
  channel: string;
  channel_code?: string;
  is_cliq?: boolean;
  origin?: string;
};

export type TransactionsListResponse = {
  filter: string;
  count: number;
  counts: {
    all: number;
    open_banking: number;
    jofotara: number;
    pos: number;
    digitized: number;
    cliq: number;
  };
  transactions: TwinTransaction[];
};

export type TransactionFilter =
  | "all"
  | "open_banking"
  | "jofotara"
  | "pos"
  | "digitized"
  | "cliq";

export function fetchTransactions(source: TransactionFilter = "all") {
  const q = source && source !== "all" ? `?source=${encodeURIComponent(source)}` : "";
  return apiFetch<TransactionsListResponse>(`/api/v1/openbanking/transactions/${q}`);
}

/* ── Scoring ─────────────────────────────────────────────── */

export type ScoringSummary = {
  credit_score: number;
  credit_band: string;
  credit_eligible?: boolean;
  gate_failures?: string[];
  default_probability?: number | null;
  risk_factors?: Array<{
    factor: string;
    contribution: number;
    note: string;
  }>;
  max_points?: Record<string, number>;
  liquidity_score?: number | null;
  liquidity_eligible?: boolean;
  liquidity_breakdown?: Record<string, number>;
  liquidity_factors?: Array<{
    factor: string;
    contribution: number;
    note: string;
  }>;
  liquidity_gate_failures?: string[];
  liquidity_max_points?: Record<string, number>;
  green_score: number;
  green_band: string;
  credit_breakdown: Record<
    string,
    { weight: number; component_score: number; contribution: number }
  >;
  green_breakdown: Record<
    string,
    { weight: number; component_score: number; contribution: number }
  >;
  is_placeholder: boolean;
  computed_at: string | null;
  engine?: string;
};

export function fetchScoringSummary() {
  return apiFetch<ScoringSummary>("/api/v1/scoring/summary/");
}

export function refreshScoringSummary() {
  return apiFetch<ScoringSummary>("/api/v1/scoring/summary/", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/* ── Lending ─────────────────────────────────────────────── */

export type LoanProduct = {
  id: string;
  tag: string;
  tag_color: string;
  name: string;
  bank: string;
  description: string;
  max_amount_jod: string;
  rate: string;
  rate_value: number;
  match_pct: number;
  min_credit_score: number;
  min_years_operation: number;
  requires_registration: boolean;
  requires_green_score: boolean;
  min_green_score: number;
  requires_green_sector: boolean;
  meets_credit: boolean;
  meets_green: boolean;
};

export type LoanQuote = {
  rate: string;
  rate_type: string;
  monthly_installment: string | null;
  total_repayment: string | null;
  currency: string;
  loan_tenor: string;
  additional_details: string[];
  quote_source: "sandbox" | "local_fallback" | string;
};

export type LoanApplicationDocument = {
  document_type: string;
  label: string;
  is_required: boolean;
  status: string;
};

export type LoanApplication = {
  id: number;
  reference_number: string;
  status: string;
  loan_category: string;
  loan_type: string;
  requested_amount: string;
  tenor_months: number;
  financing_need: string;
  product_id: string | null;
  product_name: string | null;
  product_bank: string | null;
  completeness_pct: number;
  readiness_verdict: string;
  application_score: number;
  readiness_detail: Record<string, unknown>;
  credit_score_snapshot: number | null;
  green_score_snapshot: number | null;
  quoted_rate: string;
  quoted_rate_type: string;
  monthly_installment: string | null;
  total_repayment: string | null;
  quote_source: string;
  quote_additional_details: string[];
  jopacc_loan_id: string | null;
  jopacc_last_status: string | null;
  jopacc_reply_messages: string[];
  manual_profile: Record<string, string>;
  documents: LoanApplicationDocument[];
  created_at: string | null;
  updated_at: string | null;
};

export type ConcentrationSummary = {
  total_inflow: string;
  currency: string;
  top_counterparties: Array<{
    counterparty: string;
    amount: string;
    pct: number;
  }>;
  top_concentration_pct: number;
  risk_level: "low" | "moderate" | "high" | string;
  flagged: boolean;
};

export function fetchLoanProducts() {
  return apiFetch<{ products: LoanProduct[] }>("/api/v1/lending/products/");
}

export function requestLoanQuote(payload: {
  amount: number | string;
  tenor_months?: number;
  loan_category?: string;
  loan_type?: string;
  down_payment?: number | string | null;
  product_id?: string;
}) {
  return apiFetch<LoanQuote>("/api/v1/lending/quote/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchLoanApplications() {
  return apiFetch<{ applications: LoanApplication[] }>("/api/v1/lending/applications/");
}

export function submitLoanApplication(payload: {
  product_id?: string;
  requested_amount: number | string;
  tenor_months?: number;
  financing_need?: string;
  loan_category?: string;
  loan_type?: string;
  down_payment_amount?: number | string | null;
  manual_profile?: Record<string, string>;
}) {
  return apiFetch<LoanApplication>("/api/v1/lending/applications/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchLoanApplication(id: number) {
  return apiFetch<LoanApplication>(`/api/v1/lending/applications/${id}/`);
}

export function respondToLoanOffer(id: number, decision: "approved" | "rejected") {
  return apiFetch<LoanApplication>(`/api/v1/lending/applications/${id}/respond/`, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}

export function fetchConcentration() {
  return apiFetch<ConcentrationSummary>("/api/v1/lending/concentration/");
}

/* ── Green Scoring (sector assessment → TwinScore) ───────── */

export type GreenAssessmentPayload = {
  solar_panels: boolean;
  energy_efficient_equipment: string[];
  monthly_electricity_consumption: number;
  energy_monitoring: boolean;
  renewable_percentage: number;
  water_source: string;
  water_recycling: boolean;
  monthly_water_consumption: number;
  water_monitoring: boolean;
  employee_commute: string;
  ev_charging: boolean;
  delivery_methods: string[];
  route_optimization: boolean;
  iso14001: boolean;
  green_building: boolean;
  local_green_awards: boolean;
  environmental_audits: boolean;
  sustainability_report: boolean;
};

export type GreenCategoryResult = {
  score: number;
  weight: number;
};

export type GreenAssessmentResult = {
  message: string;
  assessment_id: number;
  business_id: number;
  green_score: number;
  grade: string;
  confidence: number;
  algorithm_version: string;
  categories: {
    energy: GreenCategoryResult;
    water: GreenCategoryResult;
    transportation: GreenCategoryResult;
    certifications: GreenCategoryResult;
  };
  twin?: {
    credit_score: number;
    green_score: number;
    is_placeholder: boolean;
  };
};

export function submitGreenAssessment(payload: GreenAssessmentPayload) {
  return apiFetch<GreenAssessmentResult>("/api/v1/green-scoring/assessment/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return apiFetch<void>("/api/v1/auth/logout/", { method: "POST" }).finally(() =>
    setToken(null),
  );
}

/** Route after auth: incomplete onboarding → /onboarding, else dashboard. */
export function routeFromNextStep(nextStep: number): "/onboarding" | "/dashboard" {
  return nextStep < 8 ? "/onboarding" : "/dashboard";
}
