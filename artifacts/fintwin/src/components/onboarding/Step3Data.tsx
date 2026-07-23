import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft, ArrowRight, FileText, Landmark, CreditCard,
  CheckCircle2, Loader2, ShieldCheck, Wifi, Lock, ScanLine,
} from "lucide-react";
import { Step4Receipts } from "@/components/onboarding/Step4Receipts";
import {
  ApiError,
  fetchOpenBankingAccounts,
  saveOpenBankingAccounts,
  type OpenBankingAccount,
} from "@/lib/api";

type SourceKey = 'jofotara' | 'cliq' | 'pos' | 'receipts';

function formatLastSync(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "Never";
  const diffMs = Date.now() - then.getTime();
  if (diffMs < 60_000) return "Just now";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return then.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Open Banking — list + multi-select SME accounts ───────────────────────────
function OpenBankingDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (payload: { iban: string; count: number }) => void;
}) {
  const [phase, setPhase] = useState<"loading" | "select" | "saving" | "done" | "error">(
    "loading",
  );
  const [accounts, setAccounts] = useState<OpenBankingAccount[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const [primaryIban, setPrimaryIban] = useState("");
  const [fromCache, setFromCache] = useState(false);

  const loadAccounts = async (refresh = false) => {
    setPhase("loading");
    setError("");
    try {
      const result = await fetchOpenBankingAccounts({ refresh });
      if (result.status !== "ok") {
        setError(result.message || "Could not load bank accounts");
        setPhase("error");
        return;
      }
      setAccounts(result.accounts || []);
      setSelected(new Set(result.selected_account_ids || []));
      setFromCache(Boolean(result.cached) && !refresh);
      setPhase("select");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load bank accounts",
      );
      setPhase("error");
    }
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      // Instant reopen: use in-memory list if we already loaded this session.
      if (accounts.length && !cancelled) {
        setPhase("select");
        setError("");
        return;
      }
      await loadAccounts(false);
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (accountId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) next.delete(accountId);
      else next.add(accountId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selected.size) {
      setError("Select at least one SME account");
      return;
    }
    setError("");
    setPhase("saving");
    try {
      const result = await saveOpenBankingAccounts([...selected]);
      setSavedCount(result.saved);
      setPrimaryIban(result.accounts[0]?.iban || "");
      setPhase("done");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save accounts");
      setPhase("select");
    }
  };

  const handleDone = () => {
    onSuccess({ iban: primaryIban, count: savedCount });
    onClose();
  };

  const formatBalance = (a: OpenBankingAccount) => {
    if (a.available_balance == null || a.available_balance === "") return null;
    const n = Number(a.available_balance);
    if (Number.isNaN(n)) return `${a.available_balance} ${a.currency || "JOD"}`;
    return `${n.toLocaleString()} ${a.currency || "JOD"}`;
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connect Open Banking</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 flex flex-col items-center gap-4 text-center"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="font-medium">Fetching your bank accounts…</p>
              <p className="text-sm text-muted-foreground">Jordan Open Finance (sandbox)</p>
            </motion.div>
          )}

          {phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 py-4"
            >
              <p className="text-sm text-destructive">{error}</p>
              <Button className="w-full rounded-full" variant="outline" onClick={onClose}>
                Close
              </Button>
            </motion.div>
          )}

          {(phase === "select" || phase === "saving") && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Select the account(s) that belong to your MSME. We save their account IDs
                  for your Financial Twin.
                </p>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline shrink-0 pt-0.5"
                  disabled={phase === "saving"}
                  onClick={() => void loadAccounts(true)}
                >
                  Refresh
                </button>
              </div>
              {fromCache && (
                <p className="text-[11px] text-muted-foreground -mt-2">
                  Showing cached accounts · Refresh to call the bank again
                </p>
              )}

              {!accounts.length ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No accounts returned from the bank for this sandbox customer.
                </p>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {accounts.map((a) => {
                    const checked = selected.has(a.account_id);
                    const bal = formatBalance(a);
                    return (
                      <button
                        key={a.account_id}
                        type="button"
                        onClick={() => toggle(a.account_id)}
                        disabled={phase === "saving"}
                        className={`w-full text-start rounded-2xl border p-4 transition-colors ${
                          checked
                            ? "border-emerald-500/40 bg-emerald-500/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                              checked
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="font-semibold text-sm truncate">
                              {a.bank_name_en || "Bank"}
                              {a.account_type_name ? ` · ${a.account_type_name}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {a.iban_masked || a.iban}
                              {a.account_status ? ` · ${a.account_status}` : ""}
                              {a.account_type_code ? ` · ${a.account_type_code}` : ""}
                            </p>
                            {(bal || a.branch_name_en) && (
                              <p className="text-xs text-muted-foreground">
                                {bal}
                                {bal && a.branch_name_en ? " · " : ""}
                                {a.branch_name_en}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="bg-muted/40 rounded-xl p-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-4 h-4 flex-shrink-0" />
                Read-only AIS access. FinTwin cannot move funds.
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={onClose}
                  disabled={phase === "saving"}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-full"
                  onClick={() => void handleSave()}
                  disabled={!selected.size || phase === "saving"}
                >
                  {phase === "saving" ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" /> Saving…
                    </>
                  ) : (
                    `Save ${selected.size || ""} account${selected.size === 1 ? "" : "s"}`
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-4 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">Accounts imported</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {savedCount} SME account{savedCount === 1 ? "" : "s"} linked to your twin.
                </p>
                {primaryIban && (
                  <p className="text-xs font-mono text-muted-foreground mt-2 truncate px-4">
                    {primaryIban}
                  </p>
                )}
              </div>
              <Button
                className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleDone}
              >
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ── JoFotara flow ──────────────────────────────────────────────────────────────
function JoFotaraDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle');
  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const handleAuth = () => { setPhase('loading'); setTimeout(() => setPhase('done'), 2200); };
  const handleDone = () => { onSuccess(); onClose(); setPhase('idle'); };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); setPhase('idle'); }}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Connect JoFotara</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connecting JoFotara gives FinTwin read-only access to your electronic invoices, allowing us to
                <strong> verify your revenue and business activity</strong> — a key factor in your Credit Readiness Score.
              </p>
              <div className="bg-muted/40 rounded-2xl p-4 space-y-2 text-xs text-muted-foreground">
                <p>✓ Reads issued and received e-invoices</p>
                <p>✓ Verifies revenue patterns over time</p>
                <p>✓ Read-only — no changes are made to your invoices</p>
              </div>
              <div className="bg-muted/40 rounded-2xl p-4 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Authenticated via Sanad</p>
                  <p className="text-xs text-muted-foreground">Jordan's national digital identity</p>
                </div>
              </div>
              <Button className="w-full rounded-full gap-2" onClick={handleAuth}>
                <ShieldCheck className="w-4 h-4" /> Connect JoFotara
              </Button>
            </motion.div>
          )}

          {phase === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-8 flex flex-col items-center gap-4 text-center"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="font-medium">Authenticating with Sanad…</p>
              <p className="text-sm text-muted-foreground">Importing your invoice records.</p>
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="py-4 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">JoFotara Connected</p>
                <p className="text-sm text-muted-foreground mt-1">124 invoices imported</p>
                <p className="text-xs text-muted-foreground">Last synchronisation: Today at {now}</p>
              </div>
              <Button className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={handleDone}>Done</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ── POS flow ───────────────────────────────────────────────────────────────────
const POS_PROVIDERS = [
  { name: 'Network International', hasApi: true },
  { name: 'HyperPay',              hasApi: true },
  { name: 'MadfooatCom',           hasApi: true },
  { name: 'Other',                 hasApi: false },
];

function PosDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [selectedProvider, setSelectedProvider] = useState<typeof POS_PROVIDERS[0] | null>(null);
  const [phase, setPhase] = useState<'select' | 'manual' | 'loading' | 'done'>('select');
  const [mid, setMid] = useState('');
  const [tid, setTid] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleProviderNext = () => {
    if (!selectedProvider) return;
    if (selectedProvider.hasApi) { setPhase('loading'); setTimeout(() => setPhase('done'), 2500); }
    else { setPhase('manual'); }
  };

  const handleManualSubmit = () => {
    const errs: Record<string, string> = {};
    if (!mid.trim()) errs.mid = 'Merchant ID is required';
    if (!tid.trim()) errs.tid = 'Terminal ID is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setPhase('loading');
    setTimeout(() => setPhase('done'), 1500);
  };

  const handleDone = () => { onSuccess(); onClose(); reset(); };
  const reset = () => { setSelectedProvider(null); setPhase('select'); setMid(''); setTid(''); setErrors({}); };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); reset(); }}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Connect POS Provider</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {phase === 'select' && (
            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connecting your POS provider allows FinTwin to <strong>verify your sales activity and transaction history</strong>,
                which helps improve your Credit Readiness Score.
              </p>
              <div className="space-y-2">
                {POS_PROVIDERS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => setSelectedProvider(p)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm transition-all ${
                      selectedProvider?.name === p.name ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className="font-medium">{p.name}</span>
                    {p.hasApi
                      ? <span className="text-xs text-emerald-600 flex items-center gap-1"><Wifi className="w-3 h-3" />API</span>
                      : <span className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" />Manual</span>
                    }
                  </button>
                ))}
              </div>
              <Button className="w-full rounded-full" disabled={!selectedProvider} onClick={handleProviderNext}>
                Connect {selectedProvider?.name || ''}
              </Button>
            </motion.div>
          )}

          {phase === 'manual' && (
            <motion.div key="manual" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter your terminal credentials to link your POS data.</p>
              <div className="space-y-2">
                <Label className="font-medium">Merchant ID (MID)</Label>
                <Input placeholder="e.g. 123456789" value={mid}
                  onChange={e => { setMid(e.target.value); setErrors(p => ({ ...p, mid: '' })); }}
                  className={errors.mid ? 'border-destructive' : ''} />
                {errors.mid && <p className="text-destructive text-xs">{errors.mid}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Terminal ID (TID)</Label>
                <Input placeholder="e.g. T0001" value={tid}
                  onChange={e => { setTid(e.target.value); setErrors(p => ({ ...p, tid: '' })); }}
                  className={errors.tid ? 'border-destructive' : ''} />
                {errors.tid && <p className="text-destructive text-xs">{errors.tid}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setPhase('select')}>Back</Button>
                <Button className="flex-1 rounded-full" onClick={handleManualSubmit}>Connect</Button>
              </div>
            </motion.div>
          )}

          {phase === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-8 flex flex-col items-center gap-4 text-center"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="font-medium">{selectedProvider?.hasApi ? 'Connecting via API…' : 'Verifying credentials…'}</p>
              <p className="text-sm text-muted-foreground">Syncing your sales data.</p>
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="py-4 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">POS Connected</p>
                <p className="text-sm text-muted-foreground">{selectedProvider?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">Estimated monthly sales synced · Last sync: Just now</p>
              </div>
              <Button className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={handleDone}>Done</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function Step3Data() {
  const { state, updateState, setCurrentStep, persistProfile } = useOnboarding();
  const [activeModal, setActiveModal] = useState<SourceKey | null>(null);
  const [linkedAccountCount, setLinkedAccountCount] = useState(0);

  const sources = [
    {
      id: 'cliq' as SourceKey,
      label: 'Open Banking',
      description: 'Connect via Jordan Open Finance. Pick the SME account(s) to feed your twin with balances and transactions.',
      icon: Landmark,
      color: 'bg-emerald-500/10 text-emerald-600',
      successText: linkedAccountCount
        ? `${linkedAccountCount} account${linkedAccountCount === 1 ? "" : "s"} linked`
        : 'Bank accounts linked',
    },
    {
      id: 'jofotara' as SourceKey,
      label: 'JoFotara',
      description: 'Verify your electronic invoices and revenue through the national e-invoicing platform. Strengthens your financial profile.',
      icon: FileText,
      color: 'bg-blue-500/10 text-blue-600',
      successText: '124 invoices imported',
    },
    {
      id: 'pos' as SourceKey,
      label: 'POS Terminal',
      description: 'Verify sales activity and transaction history from your point-of-sale system. Improves your Credit Readiness Score.',
      icon: CreditCard,
      color: 'bg-purple-500/10 text-purple-600',
      successText: 'Monthly sales synced',
    },
    {
      id: 'receipts' as SourceKey,
      label: 'Digitize receipts',
      description: 'Upload bills, CliQ confirmations, or statement pages. AI extracts every debit and credit into your twin.',
      icon: ScanLine,
      color: 'bg-amber-500/10 text-amber-700',
      successText: 'Receipts digitized',
    },
  ];

  const handleSuccess = (
    id: Exclude<SourceKey, 'receipts'>,
    opts?: { iban?: string; count?: number },
  ) => {
    const nextSources = { ...state.connectedSources, [id]: true };
    const nowIso = new Date().toISOString();
    updateState({
      connectedSources: nextSources,
      lastSynced: { ...state.lastSynced, [id]: nowIso },
      ...(id === 'cliq' && opts?.iban ? { iban: opts.iban } : {}),
    });
    if (id === 'cliq' && opts?.count != null) setLinkedAccountCount(opts.count);
    // Only patch the source that just connected (avoids rewriting other sync times).
    void persistProfile({
      ...(id === 'cliq'
        ? { connected_cliq: true, ...(opts?.iban ? { iban: opts.iban } : {}) }
        : id === 'jofotara'
          ? { connected_jofotara: true }
          : { connected_pos: true }),
    });
  };

  const connectedCount = (['jofotara', 'cliq', 'pos', 'receipts'] as SourceKey[]).filter(
    (k) => state.connectedSources[k],
  ).length;

  const handleContinue = () => {
    void persistProfile({
      connected_cliq: state.connectedSources.cliq,
      connected_jofotara: state.connectedSources.jofotara,
      connected_pos: state.connectedSources.pos,
      connected_receipts: state.connectedSources.receipts,
      iban: state.iban,
    });
    setCurrentStep(7);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-3xl mx-auto"
    >
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold mb-2">Connect Data Sources</h2>
        <p className="text-muted-foreground">Link your financial accounts to build an accurate Digital Twin.</p>
      </div>

      {/* Trust banner */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold text-emerald-700 text-sm">Your data is secure</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-emerald-700/80">
          <span>✓ All access is read-only</span>
          <span>✓ You authenticate directly with each provider</span>
          <span>✓ FinTwin never stores banking credentials</span>
          <span>✓ Data encrypted in transit and at rest</span>
        </div>
      </div>

      {/* Source cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {sources.map(({ id, label, description, icon: Icon, color, successText }) => {
          const isConnected = state.connectedSources[id];
          return (
            <div key={id}
              className={`bg-card border rounded-3xl p-6 flex flex-col transition-all duration-300 ${
                isConnected ? 'border-emerald-500/30 bg-emerald-500/5 shadow-sm' : 'hover:border-primary/30'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{label}</h3>
                  {isConnected && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground flex-1 mb-4">{description}</p>

              {isConnected && id === 'cliq' ? (
                <div className="space-y-2">
                  <div className="bg-emerald-500/10 rounded-xl p-3 text-xs text-emerald-700">
                    <p className="font-medium">{successText}</p>
                    <p className="opacity-80">Last sync: {formatLastSync(state.lastSynced.cliq)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full w-full"
                    onClick={() => setActiveModal('cliq')}
                  >
                    Manage accounts
                  </Button>
                </div>
              ) : isConnected && id !== 'receipts' ? (
                <div className="bg-emerald-500/10 rounded-xl p-3 text-xs text-emerald-700">
                  <p className="font-medium">{successText}</p>
                  <p className="opacity-80">
                    Last sync: {formatLastSync(state.lastSynced[id as 'jofotara' | 'pos'])}
                  </p>
                </div>
              ) : isConnected && id === 'receipts' ? (
                <div className="space-y-2">
                  <div className="bg-emerald-500/10 rounded-xl p-3 text-xs text-emerald-700">
                    <p className="font-medium">{successText}</p>
                    <p className="opacity-80">Last sync: {formatLastSync(state.lastSynced.receipts)}</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full w-full" onClick={() => setActiveModal('receipts')}>
                    Upload more
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="rounded-full w-full" onClick={() => setActiveModal(id)}>
                  {id === 'receipts' ? 'Upload & digitize' : id === 'cliq' ? 'Connect Open Banking' : 'Connect'}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" className="rounded-full" onClick={() => setCurrentStep(5)}>
          <ArrowLeft className="me-2 w-4 h-4" /> Back
        </Button>
        <Button className="rounded-full px-8" onClick={handleContinue}>
          {connectedCount === 0 ? 'Skip for now' : 'Continue'}
          <ArrowRight className="ms-2 w-4 h-4" />
        </Button>
      </div>

      {/* Dialogs */}
      <OpenBankingDialog
        open={activeModal === 'cliq'}
        onClose={() => setActiveModal(null)}
        onSuccess={({ iban, count }) => handleSuccess('cliq', { iban, count })}
      />
      <JoFotaraDialog
        open={activeModal === 'jofotara'}
        onClose={() => setActiveModal(null)}
        onSuccess={() => handleSuccess('jofotara')}
      />
      <PosDialog
        open={activeModal === 'pos'}
        onClose={() => setActiveModal(null)}
        onSuccess={() => handleSuccess('pos')}
      />
      <Dialog open={activeModal === 'receipts'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="!max-w-[min(98vw,92rem)] !w-[min(98vw,92rem)] rounded-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle>Digitize receipts</DialogTitle>
          </DialogHeader>
          <Step4Receipts
            embedded
            onDone={() => setActiveModal(null)}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
