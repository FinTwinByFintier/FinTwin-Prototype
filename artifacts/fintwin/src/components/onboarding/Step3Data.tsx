import { useState } from "react";
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
  CheckCircle2, Loader2, ShieldCheck, Lock, Wifi,
} from "lucide-react";

type SourceKey = 'jofotara' | 'cliq' | 'pos';

// ── Bank flow ──────────────────────────────────────────────────────────────────
const BANKS = [
  'Arab Bank', 'Jordan Ahli Bank', 'Cairo Amman Bank',
  'Bank of Jordan', 'Housing Bank', 'Capital Bank',
  'Jordan Islamic Bank', 'ABC Bank Jordan',
];

const BANK_STEPS = [
  'Redirecting to your bank…',
  'Authenticating…',
  'Granting consent…',
  'Importing transactions…',
];

function BankDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [selectedBank, setSelectedBank] = useState('');
  const [phase, setPhase] = useState<'select' | 'connecting' | 'done'>('select');
  const [stepIdx, setStepIdx] = useState(0);

  const handleConnect = () => {
    if (!selectedBank) return;
    setPhase('connecting');
    setStepIdx(0);
    let i = 0;
    const next = () => {
      i++;
      if (i < BANK_STEPS.length) { setStepIdx(i); setTimeout(next, 900); }
      else { setTimeout(() => setPhase('done'), 800); }
    };
    setTimeout(next, 900);
  };

  const handleDone = () => { onSuccess(); onClose(); };

  const reset = () => { setSelectedBank(''); setPhase('select'); setStepIdx(0); };
  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Connect Bank Account</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {phase === 'select' && (
            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-sm text-muted-foreground">Select your bank to begin the Open Banking flow.</p>
              <div className="grid grid-cols-2 gap-2">
                {BANKS.map(bank => (
                  <button
                    key={bank}
                    onClick={() => setSelectedBank(bank)}
                    className={`p-3 rounded-xl border text-xs font-medium text-start transition-all ${
                      selectedBank === bank ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
              <Button className="w-full rounded-full" disabled={!selectedBank} onClick={handleConnect}>
                Connect to {selectedBank || 'Bank'}
              </Button>
            </motion.div>
          )}

          {phase === 'connecting' && (
            <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-6 flex flex-col items-center gap-5 text-center"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <div className="space-y-3 w-full">
                {BANK_STEPS.map((step, i) => (
                  <div key={step} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                    i < stepIdx ? 'bg-primary/5 text-primary' : i === stepIdx ? 'bg-muted font-medium' : 'text-muted-foreground'
                  }`}>
                    {i < stepIdx
                      ? <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      : i === stepIdx
                      ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                      : <div className="w-4 h-4 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                    }
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
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
                <p className="font-semibold text-lg">Connected</p>
                <p className="font-medium text-base text-foreground/80">{selectedBank}</p>
                <p className="text-xs text-muted-foreground mt-1">Last sync: Just now · 847 transactions imported</p>
              </div>
              <Button className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={handleDone}>
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

  const handleAuth = () => {
    setPhase('loading');
    setTimeout(() => setPhase('done'), 2200);
  };

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
                Authenticate with Sanad to grant FinTwin read-only access to your e-invoice data.
              </p>
              <div className="bg-muted/40 rounded-2xl p-4 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Secure via Sanad</p>
                  <p className="text-xs text-muted-foreground">Jordan's national digital identity</p>
                </div>
              </div>
              <Button className="w-full rounded-full gap-2" onClick={handleAuth}>
                <ShieldCheck className="w-4 h-4" /> Authenticate with Sanad
              </Button>
            </motion.div>
          )}

          {phase === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-8 flex flex-col items-center gap-4 text-center"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="font-medium">Authenticating with Sanad…</p>
              <p className="text-sm text-muted-foreground">Importing your invoice data.</p>
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
                <p className="font-semibold text-lg">Connected</p>
                <p className="text-sm text-muted-foreground mt-1">124 invoices imported</p>
                <p className="text-xs text-muted-foreground">Last synchronization: Today at {now}</p>
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
  { name: 'CliQ Pay', hasApi: true },
  { name: 'PayWay Jordan', hasApi: true },
  { name: 'Other POS Terminal', hasApi: false },
];

function PosDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [selectedProvider, setSelectedProvider] = useState<typeof POS_PROVIDERS[0] | null>(null);
  const [phase, setPhase] = useState<'select' | 'manual' | 'loading' | 'done'>('select');
  const [mid, setMid] = useState('');
  const [tid, setTid] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleProviderNext = () => {
    if (!selectedProvider) return;
    if (selectedProvider.hasApi) {
      setPhase('loading');
      setTimeout(() => setPhase('done'), 2500);
    } else {
      setPhase('manual');
    }
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
          <DialogTitle>Connect POS Terminal</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {phase === 'select' && (
            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <p className="text-sm text-muted-foreground">Select your POS provider.</p>
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
                    ? <span className="text-xs text-emerald-600 flex items-center gap-1"><Wifi className="w-3 h-3" /> API</span>
                    : <span className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" /> Manual</span>
                  }
                </button>
              ))}
              <Button className="w-full rounded-full mt-2" disabled={!selectedProvider} onClick={handleProviderNext}>
                Continue
              </Button>
            </motion.div>
          )}

          {phase === 'manual' && (
            <motion.div key="manual" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter your terminal credentials.</p>
              <div className="space-y-2">
                <Label className="font-medium">Merchant ID (MID)</Label>
                <Input placeholder="e.g. 123456789" value={mid} onChange={e => { setMid(e.target.value); setErrors(p => ({ ...p, mid: '' })); }}
                  className={errors.mid ? 'border-destructive' : ''} />
                {errors.mid && <p className="text-destructive text-xs">{errors.mid}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Terminal ID (TID)</Label>
                <Input placeholder="e.g. T0001" value={tid} onChange={e => { setTid(e.target.value); setErrors(p => ({ ...p, tid: '' })); }}
                  className={errors.tid ? 'border-destructive' : ''} />
                {errors.tid && <p className="text-destructive text-xs">{errors.tid}</p>}
              </div>
              <div className="flex gap-2 pt-1">
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
                <p className="font-semibold text-lg">Connected</p>
                <p className="text-sm text-muted-foreground">{selectedProvider?.name} · Terminal synced</p>
                <p className="text-xs text-muted-foreground">Last sync: Just now</p>
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
  const { state, updateState, setCurrentStep } = useOnboarding();
  const [activeModal, setActiveModal] = useState<SourceKey | null>(null);

  const sources = [
    {
      id: 'cliq' as SourceKey,
      label: 'Bank Account',
      description: 'Connect via Jordan Open Banking. Read-only access to transactions.',
      icon: Landmark,
      color: 'bg-emerald-500/10 text-emerald-600',
      successText: '847 transactions synced',
    },
    {
      id: 'jofotara' as SourceKey,
      label: 'JoFotara',
      description: 'Import your e-invoices issued and received via the national platform.',
      icon: FileText,
      color: 'bg-blue-500/10 text-blue-600',
      successText: '124 invoices imported',
    },
    {
      id: 'pos' as SourceKey,
      label: 'POS Terminal',
      description: 'Sync daily sales data from your point-of-sale system.',
      icon: CreditCard,
      color: 'bg-purple-500/10 text-purple-600',
      successText: 'Terminal synced',
    },
  ];

  const handleSuccess = (id: SourceKey) =>
    updateState({ connectedSources: { ...state.connectedSources, [id]: true } });

  const connectedCount = (['jofotara', 'cliq', 'pos'] as SourceKey[]).filter(k => state.connectedSources[k]).length;

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

      {/* Trust section */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <span className="font-semibold text-emerald-700">Your data is secure</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-emerald-700/80">
          <span>✓ Bank access is read-only</span>
          <span>✓ Authentication happens directly with your bank</span>
          <span>✓ FinTwin never stores your banking credentials</span>
          <span>✓ All data is encrypted in transit and at rest</span>
        </div>
      </div>

      {/* Source cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

              {isConnected ? (
                <div className="bg-emerald-500/10 rounded-xl p-3 text-xs text-emerald-700">
                  <p className="font-medium">{successText}</p>
                  <p className="opacity-80">Last sync: Just now</p>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="rounded-full w-full" onClick={() => setActiveModal(id)}>
                  Connect
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
        <Button className="rounded-full px-8" onClick={() => setCurrentStep(7)}>
          {connectedCount === 0 ? 'Skip for now' : 'Continue'}
          <ArrowRight className="ms-2 w-4 h-4" />
        </Button>
      </div>

      {/* Dialogs */}
      <BankDialog
        open={activeModal === 'cliq'}
        onClose={() => setActiveModal(null)}
        onSuccess={() => handleSuccess('cliq')}
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
    </motion.div>
  );
}
