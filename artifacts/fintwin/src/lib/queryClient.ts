import { QueryClient, dehydrate, hydrate } from "@tanstack/react-query";
import { registerTwinCacheClearer } from "@/lib/api";

// Read the auth token key directly (not imported from lib/api) to avoid a
// circular import — api.ts also clears this cache on login/register.
const TOKEN_KEY = "fintwin_token";
function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Single shared cache for every "twin" number (balances, transactions,
 * scores, simulation baseline, loans...) used across Dashboard, Simulation,
 * Loan Prescreening, etc.
 *
 * Goals (per product ask): fetch once after login, reuse everywhere, never
 * silently re-hit the API just because the user changed pages or hit
 * refresh — and never show two different numbers for the same thing.
 *
 *  - staleTime is long, so navigating between pages / remounting a route
 *    reuses the in-memory cache instead of refetching.
 *  - The cache is also mirrored to localStorage (keyed to the current auth
 *    token) so a hard refresh (F5) rehydrates instantly instead of
 *    refetching too.
 *  - Call `invalidateTwinData()` after any action that actually changes the
 *    underlying numbers (sync, connecting a source, submitting a loan,
 *    green assessment, onboarding save, ...) so the cache stays correct.
 */

const CACHE_KEY = "fintwin_query_cache_v2";
const MAX_CACHE_AGE_MS = 12 * 60 * 60 * 1000; // 12h safety valve

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 min — no refetch just from a route change
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

interface PersistedCache {
  token: string;
  savedAt: number;
  state: unknown;
}

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Snapshot every successful query into localStorage, scoped to the current token. */
export function persistQueryCache(): void {
  const token = getToken();
  const storage = safeLocalStorage();
  if (!token || !storage) return;
  try {
    const state = dehydrate(queryClient, {
      shouldDehydrateQuery: (q) => q.state.status === "success",
    });
    const payload: PersistedCache = { token, savedAt: Date.now(), state };
    storage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // storage full/unavailable — cache just won't survive a hard refresh
  }
}

/** Rehydrate the cache from localStorage — call before the app renders. */
export function hydrateQueryCacheFromStorage(): void {
  const token = getToken();
  const storage = safeLocalStorage();
  if (!token || !storage) return;
  try {
    const raw = storage.getItem(CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as PersistedCache;
    if (parsed.token !== token || Date.now() - parsed.savedAt > MAX_CACHE_AGE_MS) {
      storage.removeItem(CACHE_KEY);
      return;
    }
    hydrate(queryClient, parsed.state);
  } catch {
    storage.removeItem(CACHE_KEY);
  }
}

/** Wipe the persisted + in-memory cache — call on logout / login as a new user. */
export function clearQueryCache(): void {
  const storage = safeLocalStorage();
  try {
    storage?.removeItem(CACHE_KEY);
  } catch {
    // noop
  }
  queryClient.clear();
}

// Keep localStorage in sync with every successful fetch (cheap — payload is
// small JSON, and React Query batches cache updates internally).
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.query.state.status === "success") {
    persistQueryCache();
  }
});

/** Canonical query keys shared by every page that reads twin data. */
export const twinQueryKeys = {
  dashboardSummary: ["twin", "dashboard-summary"] as const,
  scoringSummary: ["twin", "scoring-summary"] as const,
  simulationBaseline: (commitmentsSignature: string) =>
    ["twin", "simulation-baseline", commitmentsSignature] as const,
  loanProducts: ["twin", "loan-products"] as const,
  loanApplications: ["twin", "loan-applications"] as const,
  concentration: ["twin", "concentration"] as const,
  businessProfile: ["twin", "business-profile"] as const,
};

/** Force-refresh every cached twin number — call after an action that changes them. */
export function invalidateTwinData(): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: ["twin"] });
}

registerTwinCacheClearer(clearQueryCache);
