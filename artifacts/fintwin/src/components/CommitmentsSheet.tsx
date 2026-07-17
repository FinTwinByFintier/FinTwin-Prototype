import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import type { Commitment } from "@/lib/simulationEngine";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Home, Users, Zap, Truck, CreditCard, RefreshCw, Shield, Package,
  Trash2, Plus, X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

/* ── Category config ──────────────────────────────────────── */
const CATEGORY_ICONS: Record<Commitment['category'], React.ElementType> = {
  rent: Home,
  payroll: Users,
  utilities: Zap,
  supplier: Truck,
  loan: CreditCard,
  subscription: RefreshCw,
  insurance: Shield,
  other: Package,
};

const CATEGORY_COLORS: Record<Commitment['category'], string> = {
  rent: 'text-blue-600 bg-blue-500/10',
  payroll: 'text-violet-600 bg-violet-500/10',
  utilities: 'text-amber-500 bg-amber-400/10',
  supplier: 'text-orange-500 bg-orange-400/10',
  loan: 'text-primary bg-primary/10',
  subscription: 'text-teal-600 bg-teal-500/10',
  insurance: 'text-emerald-600 bg-emerald-500/10',
  other: 'text-muted-foreground bg-muted',
};

const ALL_CATEGORIES: Commitment['category'][] = [
  'rent', 'payroll', 'utilities', 'supplier', 'loan', 'subscription', 'insurance', 'other',
];

/* ── Component ────────────────────────────────────────────── */
interface CommitmentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommitmentsSheet({ open, onOpenChange }: CommitmentsSheetProps) {
  const { state, addCommitment, removeCommitment } = useOnboarding();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    category: Commitment['category'];
    label: string;
    amount: string;
  }>({ category: 'rent', label: '', amount: '' });

  const total = state.commitments.reduce((s, c) => s + c.amountJOD, 0);

  const handleAdd = () => {
    const amt = parseFloat(form.amount);
    if (!form.label.trim() || isNaN(amt) || amt <= 0) return;
    addCommitment({ category: form.category, label: form.label.trim(), amountJOD: amt });
    setForm({ category: 'rent', label: '', amount: '' });
    setShowForm(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-lg">{t('commitments.title')}</SheetTitle>
          <SheetDescription>
            {t('commitments.subtitle')}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable list */}
        <div className="flex-grow overflow-y-auto px-6 py-4 space-y-2.5">
          <AnimatePresence initial={false}>
            {state.commitments.map(c => {
              const Icon = CATEGORY_ICONS[c.category] ?? Package;
              const color = CATEGORY_COLORS[c.category] ?? CATEGORY_COLORS.other;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-3 p-3.5 border rounded-2xl bg-card group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium truncate">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{t(`commitments.categories.${c.category}`)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-sm">{c.amountJOD.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">{t('common.jod')}</span></span>
                    <button
                      onClick={() => removeCommitment(c.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {state.commitments.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('commitments.noCommitments')}</p>
              <p className="text-xs mt-1">{t('commitments.noCommitmentsHint')}</p>
            </div>
          )}

          {/* Add form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="border rounded-2xl p-4 bg-muted/30 space-y-3 mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{t('commitments.newCommitment')}</p>
                    <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Category picker */}
                  <div>
                    <Label className="text-xs mb-2 block">{t('commitments.category')}</Label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {ALL_CATEGORIES.map(catKey => {
                        const Icon = CATEGORY_ICONS[catKey];
                        const selected = form.category === catKey;
                        const label = t(`commitments.categories.${catKey}`);
                        return (
                          <button
                            key={catKey}
                            onClick={() => setForm(f => ({ ...f, category: catKey }))}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                              selected
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-transparent bg-muted/60 text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-[9px] leading-tight">{label.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="commit-label" className="text-xs mb-1.5 block">{t('commitments.description')}</Label>
                    <Input
                      id="commit-label"
                      placeholder={t('commitments.descriptionPlaceholder')}
                      value={form.label}
                      onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                      className="h-10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="commit-amount" className="text-xs mb-1.5 block">{t('commitments.monthlyAmount')}</Label>
                    <div className="relative">
                      <Input
                        id="commit-amount"
                        type="number"
                        min={1}
                        placeholder={t('commitments.amountPlaceholder')}
                        value={form.amount}
                        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                        className="h-10 pe-12"
                      />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{t('common.jod')}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleAdd}
                    disabled={!form.label.trim() || !form.amount}
                    className="w-full h-10"
                  >
                    <Plus className="w-4 h-4 me-2" />{t('commitments.addButton')}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 h-11 border border-dashed rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors mt-1"
            >
              <Plus className="w-4 h-4" /> {t('commitments.addCommitment')}
            </button>
          )}
        </div>

        {/* Footer total */}
        <div className="border-t px-6 py-4 bg-muted/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">{t('commitments.totalObligations')}</span>
            <span className="font-bold text-lg">{total.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{t('common.jod')}</span></span>
          </div>
          <p className="text-xs text-muted-foreground">{t('commitments.usedAsBaseline')}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
