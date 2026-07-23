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
  pos_provider?: string;
  consent_given?: boolean;
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
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  headers.set("ngrok-skip-browser-warning", "true");

  const token = getToken();
  if (token) headers.set("Authorization", `Token ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
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
  return apiFetch<AuthResponse>("/api/v1/auth/register/", {
    method: "POST",
    body: JSON.stringify({ national_id: nationalId, password }),
  });
}

export function login(nationalId: string, password: string) {
  return apiFetch<AuthResponse>("/api/v1/auth/login/", {
    method: "POST",
    body: JSON.stringify({ national_id: nationalId, password }),
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

export function logout() {
  return apiFetch<void>("/api/v1/auth/logout/", { method: "POST" }).finally(() =>
    setToken(null),
  );
}

/** Route after auth: incomplete onboarding → /onboarding, else dashboard. */
export function routeFromNextStep(nextStep: number): "/onboarding" | "/dashboard" {
  return nextStep < 8 ? "/onboarding" : "/dashboard";
}
