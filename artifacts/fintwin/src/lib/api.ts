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
};

export type OpenBankingAccountsResponse = {
  status: "ok" | "error";
  message?: string | null;
  accounts: OpenBankingAccount[];
  selected_account_ids: string[];
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

export function logout() {
  return apiFetch<void>("/api/v1/auth/logout/", { method: "POST" }).finally(() =>
    setToken(null),
  );
}

/** Route after auth: incomplete onboarding → /onboarding, else dashboard. */
export function routeFromNextStep(nextStep: number): "/onboarding" | "/dashboard" {
  return nextStep < 8 ? "/onboarding" : "/dashboard";
}
