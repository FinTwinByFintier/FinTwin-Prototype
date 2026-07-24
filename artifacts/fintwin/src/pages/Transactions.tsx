import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  fetchTransactions,
  type TransactionFilter,
  type TransactionsListResponse,
  type TwinTransaction,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Landmark,
  ReceiptText,
  CreditCard,
  Zap,
  FileText,
  Loader2,
} from "lucide-react";

const FILTERS: { key: TransactionFilter; labelKey: string; icon: typeof Landmark }[] = [
  { key: "all", labelKey: "transactions.filterAll", icon: FileText },
  { key: "open_banking", labelKey: "transactions.filterBank", icon: Landmark },
  { key: "jofotara", labelKey: "transactions.filterJoFotara", icon: ReceiptText },
  { key: "pos", labelKey: "transactions.filterPos", icon: CreditCard },
  { key: "digitized", labelKey: "transactions.filterDigitized", icon: FileText },
  { key: "cliq", labelKey: "transactions.filterCliq", icon: Zap },
];

function sourceIcon(source: string) {
  if (source === "jofotara") return ReceiptText;
  if (source === "pos") return CreditCard;
  if (source === "digitized") return FileText;
  if (source === "cliq") return Zap;
  return Landmark;
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function sourceBadge(source: string, t: (k: string) => string): string {
  if (source === "jofotara") return t("dashboard.sourceJoFotara");
  if (source === "pos") return t("dashboard.sourcePos");
  if (source === "digitized") return t("transactions.filterDigitized");
  return t("dashboard.sourceBank");
}

export default function Transactions() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [data, setData] = useState<TransactionsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchTransactions(filter)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Failed to load transactions");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const rows: TwinTransaction[] = data?.transactions ?? [];
  const counts = data?.counts;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              {t("transactions.back")}
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">{t("transactions.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {data ? t("transactions.countLabel", { count: data.count }) : t("transactions.loading")}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6 max-w-3xl">
        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(({ key, labelKey, icon: Icon }) => {
            const active = filter === key;
            const count = counts?.[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t(labelKey)}
                {typeof count === "number" && (
                  <span
                    className={`ms-0.5 tabular-nums ${
                      active ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">{t("transactions.loading")}</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="rounded-3xl border bg-card p-10 text-center text-sm text-muted-foreground">
            {t("transactions.empty")}
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="bg-card border rounded-3xl p-3 sm:p-4 shadow-sm space-y-1">
            {rows.map((tx, i) => {
              const Icon = tx.is_cliq ? Zap : sourceIcon(tx.source);
              const positive = tx.direction === "credit";
              const amount = Number(tx.amount);
              const amountLabel = `${positive ? "+" : "−"}${Number.isFinite(amount) ? amount.toLocaleString() : tx.amount} ${tx.currency}`;
              return (
                <motion.div
                  key={`${tx.source}-${tx.id}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/40 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      positive
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.description || tx.counterparty || t("transactions.untitled")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[
                        formatShortDate(tx.date),
                        tx.channel || sourceBadge(tx.source, t),
                        tx.is_cliq ? "CliQ" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    <div
                      className={`text-sm font-semibold flex items-center justify-end gap-1 ${
                        positive ? "text-emerald-600" : "text-foreground"
                      }`}
                    >
                      {positive ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      {amountLabel}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {sourceBadge(tx.source, t)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
