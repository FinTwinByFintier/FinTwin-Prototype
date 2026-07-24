import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import {
  fetchLoanApplications,
  getToken,
  respondToLoanOffer,
  type LoanApplication,
} from "@/lib/api";
import { queryClient, twinQueryKeys, invalidateTwinData } from "@/lib/queryClient";
import {
  buildPaymentSchedule,
  formatDueDate,
  formatLoanMoney,
  nextPayment,
  partitionLoans,
  type LoanTab,
} from "@/lib/loanSchedule";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Loader2,
  XCircle,
} from "lucide-react";

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === "pending" || s === "draft") return "bg-amber-100 text-amber-800";
  if (s === "approved" || s === "active") return "bg-emerald-100 text-emerald-800";
  if (s === "rejected" || s === "cancelled") return "bg-red-100 text-red-700";
  return "bg-muted text-muted-foreground";
}

function ScheduleTable({ app }: { app: LoanApplication }) {
  const { t } = useTranslation();
  const rows = useMemo(() => buildPaymentSchedule(app), [app]);
  const preview = rows.slice(0, 12);
  const hasMore = rows.length > 12;

  return (
    <div className="mt-4 border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 bg-muted/40 border-b flex items-center justify-between">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
          {t("myLoans.paymentSchedule")}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {t("myLoans.scheduleHint", { count: rows.length })}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-start font-medium px-4 py-2">#</th>
              <th className="text-start font-medium px-4 py-2">{t("myLoans.dueDate")}</th>
              <th className="text-end font-medium px-4 py-2">{t("myLoans.amount")}</th>
              <th className="text-end font-medium px-4 py-2">{t("myLoans.installmentStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((row) => (
              <tr key={row.installment} className="border-b last:border-0">
                <td className="px-4 py-2.5 tabular-nums">{row.installment}</td>
                <td className="px-4 py-2.5">{formatDueDate(row.dueDate)}</td>
                <td className="px-4 py-2.5 text-end font-medium tabular-nums">
                  {formatLoanMoney(row.amount, row.currency)}
                </td>
                <td className="px-4 py-2.5 text-end">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      row.status === "paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : row.status === "due"
                          ? "bg-amber-100 text-amber-800"
                          : row.status === "upcoming"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t(`myLoans.rowStatus.${row.status}`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <p className="text-[10px] text-muted-foreground px-4 py-2 border-t">
          {t("myLoans.showingFirst", { shown: 12, total: rows.length })}
        </p>
      )}
    </div>
  );
}

function LoanCard({
  app,
  expanded,
  onToggle,
  onRespond,
  responding,
}: {
  app: LoanApplication;
  expanded: boolean;
  onToggle: () => void;
  onRespond: (id: number, decision: "approved" | "rejected") => void;
  responding: number | null;
}) {
  const { t } = useTranslation();
  const title = app.product_name || app.loan_type || t("myLoans.untitled");
  const bank = app.product_bank || "—";
  const next = nextPayment(app);
  const isPending = ["pending", "draft"].includes(app.status.toLowerCase());
  const busy = responding === app.id;

  return (
    <motion.div
      layout
      className="bg-card border rounded-3xl p-5 shadow-sm"
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-start flex items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadgeClass(app.status)}`}>
              {t(`myLoans.status.${app.status}`, { defaultValue: app.status })}
            </span>
            {app.quote_source === "sandbox" && (
              <span className="text-[10px] text-muted-foreground">{t("dashboard.liveBankQuote")}</span>
            )}
          </div>
          <p className="font-semibold text-sm truncate">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {bank}
            {app.reference_number ? ` · ${app.reference_number}` : ""}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div>
          <p className="text-[10px] text-muted-foreground">{t("myLoans.principal")}</p>
          <p className="text-sm font-semibold tabular-nums">
            {formatLoanMoney(app.requested_amount)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">{t("myLoans.rate")}</p>
          <p className="text-sm font-semibold">
            {app.quoted_rate || "—"}
            {app.quoted_rate_type ? ` · ${app.quoted_rate_type}` : ""}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">{t("myLoans.monthly")}</p>
          <p className="text-sm font-semibold tabular-nums">
            {app.monthly_installment
              ? formatLoanMoney(app.monthly_installment)
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">{t("myLoans.tenor")}</p>
          <p className="text-sm font-semibold">
            {t("myLoans.months", { count: app.tenor_months || 0 })}
          </p>
        </div>
      </div>

      {next && (
        <div className="mt-3 bg-primary/5 rounded-2xl px-3 py-2.5 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground">
              {isPending ? t("myLoans.firstPaymentIfAccepted") : t("myLoans.nextPayment")}
            </p>
            <p className="text-sm font-bold tabular-nums">
              {formatLoanMoney(next.amount)} · {formatDueDate(next.dueDate)}
            </p>
          </div>
          <CreditCard className="w-4 h-4 text-primary shrink-0" />
        </div>
      )}

      {isPending && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button
            className="flex-1 gap-1.5"
            disabled={busy}
            onClick={() => onRespond(app.id, "approved")}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {t("prescreening.success.acceptOffer")}
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-1.5"
            disabled={busy}
            onClick={() => onRespond(app.id, "rejected")}
          >
            <XCircle className="w-4 h-4" />
            {t("prescreening.success.rejectOffer")}
          </Button>
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {(app.total_repayment || app.financing_need) && (
              <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs">
                {app.total_repayment && (
                  <div className="border rounded-xl px-3 py-2">
                    <p className="text-muted-foreground">{t("myLoans.totalRepayment")}</p>
                    <p className="font-semibold mt-0.5">{formatLoanMoney(app.total_repayment)}</p>
                  </div>
                )}
                {app.financing_need && (
                  <div className="border rounded-xl px-3 py-2">
                    <p className="text-muted-foreground">{t("myLoans.purpose")}</p>
                    <p className="font-medium mt-0.5 line-clamp-3">{app.financing_need}</p>
                  </div>
                )}
              </div>
            )}
            {!!app.jopacc_reply_messages?.length && (
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                {app.jopacc_reply_messages.map((m) => (
                  <p key={m}>• {m}</p>
                ))}
              </div>
            )}
            {app.monthly_installment ? (
              <ScheduleTable app={app} />
            ) : (
              <p className="text-xs text-muted-foreground mt-4">{t("myLoans.noSchedule")}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function MyLoans() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { toggleLanguage } = useLanguage();
  const { state } = useOnboarding();
  const [apps, setApps] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<LoanTab>("pending");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [responding, setResponding] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await queryClient.fetchQuery({
        queryKey: twinQueryKeys.loanApplications,
        queryFn: fetchLoanApplications,
      });
      const list = res.applications || [];
      setApps(list);
      const parts = partitionLoans(list);
      if (parts.pending.length) setTab("pending");
      else if (parts.active.length) setTab("active");
      else setTab("history");
      if (parts.pending[0]) setExpandedId(parts.pending[0].id);
      else if (parts.active[0]) setExpandedId(parts.active[0].id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load loans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    void load();
  }, [load, navigate]);

  const parts = useMemo(() => partitionLoans(apps), [apps]);
  const visible =
    tab === "pending" ? parts.pending : tab === "active" ? parts.active : parts.history;

  const handleRespond = async (id: number, decision: "approved" | "rejected") => {
    setResponding(id);
    setError(null);
    try {
      const updated = await respondToLoanOffer(id, decision);
      setApps((prev) => prev.map((a) => (a.id === id ? updated : a)));
      void invalidateTwinData(); // loan status changed — refresh cached loans/dashboard everywhere
      if (decision === "approved") {
        setTab("active");
        setExpandedId(id);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not update offer");
    } finally {
      setResponding(null);
    }
  };

  const businessName = state.businessName || t("myLoans.title");

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <Link href="/dashboard" className="text-xl font-bold tracking-tight hover:opacity-90 transition-opacity">
              Fin<span className="text-primary">Twin</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("lang.switch")}
            </button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Bell className="w-5 h-5" />
            </Button>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm border border-primary/30">
              {businessName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">{t("myLoans.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("myLoans.subtitle")}</p>
          </div>
          <Button onClick={() => navigate("/loan-prescreening")} className="shrink-0">
            {t("dashboard.applyForLoan")}
          </Button>
        </div>

        {parts.pending.length > 0 && tab !== "pending" && (
          <button
            type="button"
            onClick={() => setTab("pending")}
            className="w-full mb-5 text-start bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {t("myLoans.pendingBanner", { count: parts.pending.length })}
              </p>
              <p className="text-xs text-amber-800/80 mt-0.5">{t("myLoans.pendingBannerSub")}</p>
            </div>
            <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-1 rounded-full shrink-0">
              {parts.pending.length}
            </span>
          </button>
        )}

        <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl mb-6">
          {(
            [
              { id: "pending" as const, count: parts.pending.length },
              { id: "active" as const, count: parts.active.length },
              { id: "history" as const, count: parts.history.length },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                tab === item.id
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`myLoans.tabs.${item.id}`)}
              <span className="ms-1.5 text-[10px] opacity-70">{item.count}</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3 mb-4">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">{t("myLoans.loading")}</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="border rounded-3xl bg-card p-10 text-center">
            <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">{t(`myLoans.empty.${tab}`)}</p>
            <p className="text-sm text-muted-foreground mb-5">{t(`myLoans.empty.${tab}Sub`)}</p>
            {tab !== "history" && (
              <Button onClick={() => navigate("/loan-prescreening")}>
                {t("dashboard.applyForLoan")}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((app) => (
              <LoanCard
                key={app.id}
                app={app}
                expanded={expandedId === app.id}
                onToggle={() => setExpandedId((id) => (id === app.id ? null : app.id))}
                onRespond={handleRespond}
                responding={responding}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
