import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { CommitmentsSheet } from "@/components/CommitmentsSheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  fetchDashboardSummary, runDataSync,
  fetchScoringSummary, fetchLoanProducts, fetchLoanApplications, fetchConcentration,
  fetchTransactions,
  getToken,
  type DashboardSummary, type MonthlyCashflowPoint, type RecentTransaction,
  type ScoringSummary, type LoanProduct, type LoanApplication, type ConcentrationSummary,
  type TwinTransaction,
} from "@/lib/api";
import { twinQueryKeys, invalidateTwinData } from "@/lib/queryClient";
import { nextPayment, partitionLoans, formatDueDate } from "@/lib/loanSchedule";
import {
  BarChart3, Leaf, FileText, TrendingUp, TrendingDown, Building,
  Bell, ChevronRight, Coffee, ShoppingBag, Truck, Zap, ArrowUpRight,
  CheckCircle2, Clock, AlertCircle, LogOut, ArrowRight,
  Wallet, Droplets, CreditCard, Plus, ChevronDown, ChevronUp,
  Circle, FlaskConical, ReceiptText, Landmark, RefreshCw, CalendarClock,
  PieChart, Loader2, Info,
} from "lucide-react";


/* ── Fallback mock data (used until real twin data loads / if a source has none) ── */
const MOCK_CASH_FLOW: MonthlyCashflowPoint[] = [
  { month: "Apr", income: 5200, expense: 3800 },
  { month: "May", income: 6100, expense: 4200 },
  { month: "Jun", income: 5700, expense: 3600 },
  { month: "Jul", income: 4800, expense: 2900 },
];


function formatMoney(value: number | string | null | undefined, currency = "JOD"): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (n == null || Number.isNaN(n)) return `— ${currency}`;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency}`;
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function sourceLabelKey(source: string | undefined): string {
  if (source === "jofotara") return "dashboard.sourceJoFotara";
  if (source === "pos") return "dashboard.sourcePos";
  return "dashboard.sourceBank";
}

function sourceIcon(source: string | undefined) {
  if (source === "jofotara") return ReceiptText;
  if (source === "pos") return CreditCard;
  return Landmark;
}

/* ── Component ─────────────────────────────────────────────── */
export default function Dashboard() {
  const { state, signOut, updateState } = useOnboarding();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { toggleLanguage } = useLanguage();
  const [menuOpen, setMenuOpen]               = useState(false);
  const [stepsOpen, setStepsOpen]             = useState(false);
  const [commitmentsOpen, setCommitmentsOpen] = useState(false);
  const [syncing, setSyncing]                 = useState(false);

  // Shared, cached twin data — fetched once (per login session) and reused
  // across every page (Dashboard, Simulation, Loan Prescreening, ...) so
  // numbers never drift and refreshing / changing pages doesn't re-call the
  // API. See src/lib/queryClient.ts.
  const { data: summary } = useQuery<DashboardSummary>({
    queryKey: twinQueryKeys.dashboardSummary,
    queryFn: fetchDashboardSummary,
    retry: 0,
  });
  const { data: scoring } = useQuery<ScoringSummary>({
    queryKey: twinQueryKeys.scoringSummary,
    queryFn: fetchScoringSummary,
    retry: 0,
  });
  const { data: loanProductsData } = useQuery({
    queryKey: twinQueryKeys.loanProducts,
    queryFn: fetchLoanProducts,
    retry: 0,
  });
  const loanProducts: LoanProduct[] = loanProductsData?.products || [];
  const { data: loanAppsData } = useQuery({
    queryKey: twinQueryKeys.loanApplications,
    queryFn: fetchLoanApplications,
    retry: 0,
  });
  const loanApps: LoanApplication[] = loanAppsData?.applications || [];
  const latestLoan = useMemo<LoanApplication | null>(() => {
    const { pending, active } = partitionLoans(loanApps);
    return (
      pending[0] || active[0] ||
      loanApps.find((a) => !["cancelled", "rejected"].includes(a.status)) ||
      loanApps[0] || null
    );
  }, [loanApps]);
  const { data: concentration } = useQuery<ConcentrationSummary>({
    queryKey: twinQueryKeys.concentration,
    queryFn: fetchConcentration,
    retry: 0,
  });

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
    }
  }, [navigate]);

  // Backfill the onboarding display name from the twin the first time it loads.
  useEffect(() => {
    const name = summary?.display_identity?.display_name;
    if (name && !state.businessName) {
      updateState({ businessName: name });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary?.display_identity?.display_name]);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await runDataSync();
      // Data actually changed — force every cached twin number to refetch
      // (Dashboard + Simulation + Loan Prescreening all share this cache).
      await invalidateTwinData();
    } catch {
      // best-effort — keep whatever we already have
    } finally {
      setSyncing(false);
    }
  };

  const handleExportReport = async () => {
    try {
      // ── Fetch live transaction data ──────────────────────────────────────────
      let txns: TwinTransaction[] = [];
      try {
        const res = await fetchTransactions("all");
        txns = res.transactions ?? [];
      } catch {
        // proceed with empty — spec says generate PDF anyway
      }

      const bizName =
        summary?.display_identity?.display_name ||
        state.businessName ||
        summary?.profile?.business_name ||
        "Your Business";

      // ── Reporting period ─────────────────────────────────────────────────────
      const timestamps = txns
        .map((tx) => tx.date)
        .filter((d): d is string => !!d)
        .map((d) => new Date(d).getTime())
        .filter((t) => !isNaN(t));

      const fmtDate = (ts: number) =>
        new Date(ts).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric",
        });

      const periodStr =
        timestamps.length > 0
          ? `For the Period ${fmtDate(Math.min(...timestamps))} \u2013 ${fmtDate(Math.max(...timestamps))}`
          : "Current Reporting Period";

      const today = new Date().toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      });

      // ── Statement calculations ───────────────────────────────────────────────
      const credits = txns
        .filter((tx) => tx.direction === "credit")
        .reduce((s, tx) => s + parseFloat(tx.amount || "0"), 0);

      const debits = txns
        .filter((tx) => tx.direction === "debit")
        .reduce((s, tx) => s + parseFloat(tx.amount || "0"), 0);

      const operatingIncome = credits - debits;
      const netCashFlow     = credits - debits;

      const fmtMoney = (n: number) =>
        n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " JOD";

      const fmtParen = (n: number) =>
        n < 0
          ? `(${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD)`
          : fmtMoney(n);

      // ── Initialise jsPDF ─────────────────────────────────────────────────────
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const PAGE_W    = 210;
      const PAGE_H    = 297;
      const MARGIN    = 20;
      const RIGHT     = PAGE_W - MARGIN;
      const CONTENT_W = RIGHT - MARGIN;
      let   pageNum   = 1;

      // ── Helpers (declared after doc) ─────────────────────────────────────────
      const thinLine = (y: number) => {
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, y, RIGHT, y);
      };
      const thickLine = (y: number) => {
        doc.setDrawColor(50, 50, 50);
        doc.setLineWidth(0.6);
        doc.line(MARGIN, y, RIGHT, y);
      };

      const pageHeader = (title: string) => {
        doc.setFillColor(21, 128, 61);
        doc.rect(0, 0, PAGE_W, 2, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(20, 20, 20);
        doc.text(bizName, PAGE_W / 2, 18, { align: "center" });

        doc.setFontSize(14);
        doc.text(title, PAGE_W / 2, 27, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(periodStr, PAGE_W / 2, 35, { align: "center" });

        thickLine(40);
      };

      const pageFooter = () => {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(
          `Generated by FinTwin on ${today}  \u2022  For informational purposes only`,
          PAGE_W / 2, PAGE_H - 8, { align: "center" },
        );
        doc.text(`Page ${pageNum}`, RIGHT, PAGE_H - 8, { align: "right" });
      };

      // label-left / value-right row with optional shaded background
      const row = (
        label: string,
        value: string,
        yPos: number,
        opts: { bold?: boolean; rG?: number; rB?: number; rR?: number;
                bgR?: number; bgG?: number; bgB?: number; size?: number } = {},
      ) => {
        const { bold = false, rR = 30, rG = 30, rB = 30,
                bgR, bgG, bgB, size = 10.5 } = opts;
        if (bgR !== undefined && bgG !== undefined && bgB !== undefined) {
          doc.setFillColor(bgR, bgG, bgB);
          doc.rect(MARGIN, yPos - 4.5, CONTENT_W, 6.5, "F");
        }
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(rR, rG, rB);
        doc.text(label, MARGIN, yPos);
        doc.text(value, RIGHT, yPos, { align: "right" });
        doc.setTextColor(30, 30, 30);
      };

      const noDataMsg = (yPos: number) => {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10.5);
        doc.setTextColor(100, 100, 100);
        doc.text(
          "No financial transaction data is currently available.\nPlease synchronise your banking data before generating financial statements.",
          PAGE_W / 2, yPos, { align: "center", maxWidth: CONTENT_W },
        );
      };

      // ════════════════════════════════════════════════════════════════════════
      // PAGE 1 — Income Statement
      // ════════════════════════════════════════════════════════════════════════
      pageHeader("INCOME STATEMENT");
      pageFooter();

      let y = 52;

      if (txns.length === 0) {
        noDataMsg(y + 20);
      } else {
        // Revenue heading
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text("Revenue", MARGIN, y);
        y += 7;

        row("   Total Revenue  (all credit transactions)", fmtMoney(credits), y,
          { bgR: 248, bgG: 252, bgB: 248 });
        y += 9;
        thinLine(y);
        y += 7;

        // Operating Expenses heading
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text("Operating Expenses", MARGIN, y);
        y += 7;

        row("   Total Operating Expenses  (all debit transactions)", fmtMoney(debits), y,
          { bgR: 252, bgG: 248, bgB: 248 });
        y += 9;
        thickLine(y);
        y += 8;

        row("Operating Income", fmtMoney(operatingIncome), y,
          { bold: true, size: 11, bgR: 245, bgG: 245, bgB: 245 });
        y += 11;
        thinLine(y);
        y += 7;

        row("Other Expenses", "N/A", y, { rR: 100, rG: 100, rB: 100 });
        y += 7;
        row("Taxes", "N/A", y, { rR: 100, rG: 100, rB: 100 });
        y += 10;
        thickLine(y);
        y += 8;

        // Net Income — dark green per spec
        row("NET INCOME", fmtMoney(operatingIncome), y,
          { bold: true, size: 12, rR: 15, rG: 100, rB: 40, bgR: 240, bgG: 252, bgB: 244 });
        y += 11;
        thickLine(y);
        y += 7;

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(110, 110, 110);
        doc.text(
          "* Other Expenses, Taxes, and Depreciation are not estimated.\n  Net Income equals Operating Income based solely on synchronised Open Banking transaction data.",
          MARGIN, y, { maxWidth: CONTENT_W },
        );
      }

      // ════════════════════════════════════════════════════════════════════════
      // PAGE 2 — Cash Flow Statement
      // ════════════════════════════════════════════════════════════════════════
      doc.addPage();
      pageNum += 1;
      pageHeader("CASH FLOW STATEMENT");
      pageFooter();

      y = 52;

      if (txns.length === 0) {
        noDataMsg(y + 20);
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text("Operating Activities", MARGIN, y);
        y += 9;

        row("Cash Inflows  (sum of all credit transactions)", fmtMoney(credits), y,
          { bgR: 248, bgG: 252, bgB: 248 });
        y += 9;

        // Outflows shown in parentheses per spec
        row("Cash Outflows  (sum of all debit transactions)", `(${fmtMoney(debits)})`, y,
          { bgR: 252, bgG: 248, bgB: 248, rR: 140, rG: 40, rB: 40 });
        y += 9;
        thickLine(y);
        y += 8;

        // Net Cash Flow — dark blue if positive per spec
        const cfR = netCashFlow >= 0 ? 0   : 140;
        const cfG = netCashFlow >= 0 ? 60  : 40;
        const cfB = netCashFlow >= 0 ? 140 : 40;
        row("NET CASH FLOW", fmtParen(netCashFlow), y,
          { bold: true, size: 12, rR: cfR, rG: cfG, rB: cfB, bgR: 242, bgG: 246, bgB: 255 });
        y += 11;
        thickLine(y);
        y += 7;

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(110, 110, 110);
        doc.text(
          "* Simplified Operating Cash Flow Statement based solely on synchronised Open Banking transaction data.\n  Investing and financing activities are not available.",
          MARGIN, y, { maxWidth: CONTENT_W },
        );
      }

      // ── Download ──────────────────────────────────────────────────────────────
      const safeName = bizName.replace(/[^a-z0-9]/gi, "_").replace(/_+/g, "_");
      doc.save(`Financial_Report_${safeName}_${new Date().getFullYear()}.pdf`);
    } catch (err) {
      console.error("Export report error:", err);
      alert("Failed to export report. Please try again.");
    }
  };

  const businessName =
    summary?.display_identity?.display_name
    || state.businessName
    || summary?.profile?.business_name
    || "Your business";
  const category     = state.category       || t('dashboard.microEnterprise');
  const sector       = state.businessSector || "Food & Hospitality";
  const creditScore  = scoring?.credit_score ?? 0;
  const greenScore   = scoring?.green_score ?? 62;
  const creditEligible = scoring?.credit_eligible === true;
  // Pending / not yet computed — show calculating instead of unavailable/"—"
  const creditCalculating = scoring == null || !creditEligible;
  const liquidityScore = scoring?.liquidity_score ?? null;
  const liquidityEligible = scoring?.liquidity_eligible === true;
  const liquidityMetrics = scoring?.liquidity_metrics;
  const runwayDays =
    liquidityMetrics?.runway_days != null && Number.isFinite(Number(liquidityMetrics.runway_days))
      ? Number(liquidityMetrics.runway_days)
      : null;

  function greenLabel(score: number) {
    if (score >= 75) return t('dashboard.greenScoreLabels.strong');
    if (score >= 50) return t('dashboard.greenScoreLabels.developing');
    return t('dashboard.greenScoreLabels.low');
  }
  function creditLabel(score: number) {
    if (score >= 75) return t('dashboard.strong');
    if (score >= 55) return t('dashboard.moderate');
    return t('dashboard.developing');
  }
  function greenColors(score: number) {
    if (score >= 75) return { bar: "bg-emerald-500", text: "text-emerald-600" };
    if (score >= 50) return { bar: "bg-amber-400",   text: "text-amber-500" };
    return               { bar: "bg-red-500",        text: "text-red-500" };
  }
  const gc = { ...greenColors(greenScore), label: greenLabel(greenScore) };

  const hasCommitments = (state.commitments ?? []).length > 0;

  const twinCompleteness = summary?.twin_completeness ?? null;

  const profileItems = [
    { label: t('dashboard.businessIdentity'),   done: true },
    { label: t('dashboard.sizeAndScale'),        done: true },
    { label: t('dashboard.bankConnected'),       done: state.connectedSources.cliq },
    { label: t('dashboard.jofotaraConnected'),   done: state.connectedSources.jofotara },
    { label: t('dashboard.receiptsUploaded'),    done: state.connectedSources.receipts },
    { label: t('dashboard.monthlyCommitments'),  done: hasCommitments, action: () => setCommitmentsOpen(true) },
  ];
  const completedCount = profileItems.filter(p => p.done).length;
  const profilePct     = twinCompleteness?.percent ?? Math.round((completedCount / profileItems.length) * 100);

  /* Real cash flow from the twin (Balances + Transactions sync) — falls back to mock */
  const hasRealCashFlow = !!summary?.monthly_cashflow?.some(m => m.income || m.expense);
  const cashFlow: MonthlyCashflowPoint[] = hasRealCashFlow ? summary!.monthly_cashflow : MOCK_CASH_FLOW;
  const maxIncome = Math.max(...cashFlow.map(d => Math.max(d.income, d.expense)), 1);
  const totalIncomeSum   = cashFlow.reduce((s, d) => s + d.income, 0);
  const totalExpenseSum  = cashFlow.reduce((s, d) => s + d.expense, 0);
  const netSum           = totalIncomeSum - totalExpenseSum;
  const lastMonth        = cashFlow[cashFlow.length - 1];
  const netThisMonthAmt  = lastMonth ? lastMonth.income - lastMonth.expense : 0;

  const hasLiquidity = summary != null && summary.total_available_balance != null && summary.total_available_balance !== "";
  const totalAvailableBalance = hasLiquidity
    ? parseFloat(summary!.total_available_balance || "0")
    : null;
  const liquidityAmount =
    totalAvailableBalance != null && Number.isFinite(totalAvailableBalance)
      ? totalAvailableBalance
      : null;

  function runwayTierLabel(days: number | null): string {
    if (days == null) return "Calculating";
    if (days >= 30) return "Healthy runway";
    if (days >= 7) return "Limited runway";
    return "Critical runway";
  }
  function runwaySubColor(days: number | null): string {
    if (days == null) return "text-muted-foreground";
    if (days >= 30) return "text-emerald-600";
    if (days >= 7) return "text-amber-600";
    return "text-red-500";
  }

  /* Real recent transactions from the twin — falls back to mock */
  const realTransactions: RecentTransaction[] = summary?.recent_transactions ?? [];
  const mockTransactions = [
    { icon: ShoppingBag, label: t('dashboard.tx1Label'), sub: t('dashboard.tx1Sub'), amount: "+340 JOD",   positive: true,  color: "bg-emerald-500/10 text-emerald-600" },
    { icon: Truck,       label: t('dashboard.tx2Label'), sub: t('dashboard.tx2Sub'), amount: "−1,200 JOD", positive: false, color: "bg-red-500/10 text-red-500" },
    { icon: Coffee,      label: t('dashboard.tx3Label'), sub: t('dashboard.tx3Sub'), amount: "+820 JOD",   positive: true,  color: "bg-primary/10 text-primary" },
    { icon: Zap,         label: t('dashboard.tx4Label'), sub: t('dashboard.tx4Sub'), amount: "−95 JOD",    positive: false, color: "bg-red-500/10 text-red-500" },
    { icon: ShoppingBag, label: t('dashboard.tx5Label'), sub: t('dashboard.tx5Sub'), amount: "+1,540 JOD", positive: true,  color: "bg-blue-500/10 text-blue-600" },
  ];
  const transactions = realTransactions.length
    ? realTransactions.map((tx) => ({
        key: `tx-${tx.id}`,
        icon: sourceIcon(tx.source),
        label: tx.description,
        sub: [formatShortDate(tx.date), tx.channel].filter(Boolean).join(" · "),
        amount: `${tx.direction === "credit" ? "+" : "−"}${Number(tx.amount).toLocaleString()} ${tx.currency}`,
        positive: tx.direction === "credit",
        color: tx.direction === "credit" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500",
      }))
    : mockTransactions.map((tx, i) => ({ ...tx, key: `mock-tx-${i}` }));

  const matches = (loanProducts.length
    ? loanProducts
    : []
  ).map((p) => ({
    tag: p.tag,
    tagColor: p.tag_color || "text-primary",
    label: p.name,
    sub: p.bank,
    rate: p.rate || "",
    match: p.match_pct,
    productId: p.id,
  }));

  const breakdownMap: Record<string, { label: string; color: string }> = {
    credit_risk: { label: "Credit risk", color: "bg-emerald-500" },
    cash_flow: { label: t('dashboard.scoreLabelCashFlow'), color: "bg-primary" },
    stability: { label: t('dashboard.scoreLabelBusinessAge'), color: "bg-blue-500" },
    transparency: { label: t('dashboard.scoreLabelDataCoverage'), color: "bg-amber-400" },
    sector_risk: { label: "Sector", color: "bg-violet-500" },
    compliance: { label: "Compliance", color: "bg-teal-500" },
    // legacy keys (pre rule-based engine)
    banking_behavior: { label: t('dashboard.scoreLabelPaymentHistory'), color: "bg-emerald-500" },
    maturity: { label: t('dashboard.scoreLabelBusinessAge'), color: "bg-blue-500" },
    legal_identity: { label: t('dashboard.scoreLabelDataCoverage'), color: "bg-amber-400" },
  };
  const scoreBreakdown = scoring?.credit_breakdown
    ? Object.entries(scoring.credit_breakdown)
        .filter(([k]) => breakdownMap[k])
        .map(([k, v]) => ({
          label: breakdownMap[k].label,
          value: v.component_score,
          pts: v.contribution,
          max: scoring.max_points?.[k] ?? v.weight,
          color: breakdownMap[k].color,
        }))
    : [];

  const greenProductCount = matches.filter((m) =>
    loanProducts.find((p) => p.id === m.productId)?.requires_green_score
  ).length || matches.filter((m) => m.tagColor.includes("emerald")).length;

  const monthsOfHistory = cashFlow.filter(m => m.income || m.expense).length;
  const gateFailures = scoring?.gate_failures ?? [];
  const riskImproveSteps = (scoring?.risk_factors ?? [])
    .filter((f) => f.contribution > 0 && f.factor !== "base_rate")
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 4)
    .map((f) => ({
      label: f.note,
      impact: `−${Math.round(f.contribution * 100)} PD`,
      done: false,
    }));
  const nextSteps = gateFailures.length
    ? gateFailures.map((msg) => ({ label: msg, impact: "Required", done: false }))
    : riskImproveSteps.length
      ? riskImproveSteps
      : twinCompleteness
        ? [
            { label: t('dashboard.monthsOfHistory', { count: monthsOfHistory }), impact: "+8 pts", done: monthsOfHistory > 0 },
            { label: t('dashboard.transactionsDetected', { count: twinCompleteness.transactions_imported }), impact: "+12 pts", done: twinCompleteness.transactions_imported > 0 },
            { label: t('dashboard.standingOrdersOnTime', { count: twinCompleteness.standing_orders_tracked }), impact: "+6 pts", done: twinCompleteness.standing_orders_tracked > 0 },
            { label: t('dashboard.nextStep4'), impact: "+5 pts", done: false },
          ]
        : [
            { label: t('dashboard.nextStep1'), impact: "+8 pts",  done: true },
            { label: t('dashboard.nextStep2'), impact: "+12 pts", done: false },
            { label: t('dashboard.nextStep3'), impact: "+6 pts",  done: false },
            { label: t('dashboard.nextStep4'), impact: "+5 pts",  done: false },
          ];

  const loanParts = partitionLoans(loanApps);
  const pendingLoanCount = loanParts.pending.length;
  const activeLoanCount = loanParts.active.length;
  const scheduleLoan = loanParts.active[0] || loanParts.pending[0] || latestLoan;
  const nextPay = scheduleLoan ? nextPayment(scheduleLoan) : null;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight hover:opacity-90 transition-opacity">
            Fin<span className="text-primary">Twin</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              {t('lang.switch')}
            </button>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 end-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm border border-primary/30 hover:bg-primary/30 transition-colors"
              >
                {businessName.substring(0, 2).toUpperCase()}
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute end-0 top-11 z-20 w-44 bg-card border rounded-2xl shadow-lg overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b">
                        <p className="text-xs font-medium truncate">{businessName}</p>
                        <p className="text-xs text-muted-foreground">{t('nav.freePlan')}</p>
                      </div>
                      <Link
                        href="/my-loans"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-muted/50 transition-colors w-full"
                      >
                        <CreditCard className="w-4 h-4" /> {t('dashboard.viewMyLoans')}
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-muted/50 transition-colors w-full"
                      >
                        <Circle className="w-4 h-4" /> My Profile
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          setMenuOpen(false);
                          await signOut();
                          navigate("/login");
                        }}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors w-full border-t text-start"
                      >
                        <LogOut className="w-4 h-4" /> {t('nav.signOut')}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Page title + actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-7 gap-3">
          <div>
            <h1 className="text-2xl font-bold mb-1">{businessName}</h1>
            <div className="flex items-center text-muted-foreground text-sm gap-2 flex-wrap">
              <Building className="w-4 h-4" />
              <span>{category}</span>
              <span>·</span>
              <span>{sector}</span>
              <span>·</span>
              <span className="flex items-center text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5 me-1" />{t('dashboard.profileActive')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportReport}>
              <FileText className="w-4 h-4 me-2" />{t('dashboard.exportReport')}
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 gap-2"
              onClick={() => navigate('/simulation')}
            >
              <FlaskConical className="w-4 h-4" />{t('dashboard.runSimulation')}
            </Button>
          </div>
        </div>

        {pendingLoanCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                {t('dashboard.pendingOffersBanner', { count: pendingLoanCount })}
              </p>
              <p className="text-xs text-amber-800/80 mt-0.5">{t('myLoans.pendingBannerSub')}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-amber-300 text-amber-900 hover:bg-amber-100"
              onClick={() => navigate('/my-loans')}
            >
              {t('dashboard.pendingOffersCta')} <ArrowRight className="w-3.5 h-3.5 ms-1 rtl:rotate-180" />
            </Button>
          </motion.div>
        )}

        {/* Loan eligibility banner */}
        {!creditCalculating && creditScore >= 55 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-5 flex items-center justify-between gap-4 bg-primary/5 border border-primary/20 rounded-2xl px-5 py-3.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {t('dashboard.loanBannerText', {
                    score: creditScore,
                    product: matches[0]?.label || loanProducts[0]?.name || t('dashboard.financingMatches'),
                  })}
                </p>
                <p className="text-xs text-muted-foreground">{t('dashboard.loanBannerSub')}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-primary/30 text-primary hover:bg-primary/5 gap-1.5"
              onClick={() => navigate(pendingLoanCount > 0 ? '/my-loans' : '/loan-prescreening')}
            >
              {pendingLoanCount > 0 ? t('dashboard.pendingOffersCta') : t('dashboard.loanBannerCta')} <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Button>
          </motion.div>
        )}

        {/* Top stat strip */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            {
              id: "net",
              icon: Wallet,
              label: t('dashboard.netThisMonth'),
              value: `${netThisMonthAmt >= 0 ? "+" : "−"}${Math.abs(netThisMonthAmt).toLocaleString()} JOD`,
              sub: hasRealCashFlow ? t('dashboard.cashFlowSub') : t('dashboard.vsLastMonth', { pct: 14 }),
              subColor: "text-emerald-600",
              viewAllHref: null as string | null,
            },
            {
              id: "liquidity",
              icon: Droplets,
              label: t('dashboard.runway'),
              value:
                liquidityEligible && runwayDays != null
                  ? `${Math.round(runwayDays)} days`
                  : scoring == null
                    ? "···"
                    : "—",
              sub:
                liquidityEligible && runwayDays != null
                  ? `${runwayTierLabel(runwayDays)}${
                      liquidityScore != null ? ` · Score ${Math.round(liquidityScore)}/100` : ""
                    }`
                  : scoring == null
                    ? "Calculating…"
                    : t('dashboard.liquidityEmpty'),
              subColor: runwaySubColor(runwayDays),
              viewAllHref: null as string | null,
              tooltip:
                liquidityEligible && runwayDays != null
                  ? [
                      "Cash runway = available bank balance ÷ average daily outflow.",
                      `Available liquidity: ${formatMoney(liquidityMetrics?.available_liquidity ?? liquidityAmount)}`,
                      `Avg daily outflow: ${formatMoney(liquidityMetrics?.avg_daily_outflow)}`,
                      `Cash runway: ${Math.round(runwayDays)} days`,
                      "≥30 days healthy · 7–29 limited · <7 critical",
                    ].join("\n")
                  : "Cash runway is calculated from your connected bank balance and recent outflows once open banking is linked.",
            },
            {
              id: "loans",
              icon: CreditCard,
              label: t('dashboard.activeLoans'),
              value: t('dashboard.loanLabel', { count: activeLoanCount }),
              sub: pendingLoanCount > 0
                ? t('dashboard.pendingOffersBanner', { count: pendingLoanCount })
                : nextPay
                  ? t('dashboard.nextPaymentDate', { date: formatDueDate(nextPay.dueDate) })
                  : t('dashboard.noLoanYet'),
              subColor: pendingLoanCount > 0 ? "text-amber-600" : "text-muted-foreground",
              viewAllHref: "/my-loans",
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            const tooltip = "tooltip" in stat ? (stat as { tooltip?: string }).tooltip : undefined;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border rounded-2xl px-5 py-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      {tooltip && (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-muted-foreground/70 hover:text-foreground transition-colors"
                                aria-label="Liquidity explanation"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              className="max-w-[280px] whitespace-pre-line leading-relaxed bg-foreground text-background"
                            >
                              {tooltip}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  {stat.viewAllHref && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary text-xs h-7 px-1.5 shrink-0 -mt-1 -me-1"
                      onClick={() => navigate(stat.viewAllHref!)}
                    >
                      {t('common.viewAll')} <ChevronRight className="w-3.5 h-3.5 ms-0.5 rtl:rotate-180" />
                    </Button>
                  )}
                </div>
                <p className="font-bold text-base leading-tight">{stat.value}</p>
                <p className={`text-xs mt-0.5 ${stat.subColor}`}>{stat.sub}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left 2/3 ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Score cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Credit */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border rounded-3xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{t('dashboard.creditReadiness')}</p>
                    {creditCalculating ? (
                      <>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-bold text-muted-foreground">···</span>
                          <span className="text-muted-foreground text-base mb-1">{t('common.outOf100')}</span>
                        </div>
                        <p className="text-xs font-medium mt-1 flex items-center gap-1.5 text-primary">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Calculating…
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-end gap-1.5">
                          <span className="text-4xl font-bold">{creditScore}</span>
                          <span className="text-muted-foreground text-base mb-1">{t('common.outOf100')}</span>
                        </div>
                        <p className="text-xs font-medium mt-1 flex items-center gap-1 text-amber-500">
                          <AlertCircle className="w-3 h-3" />
                          {creditLabel(creditScore)}
                        </p>
                        {scoring?.default_probability != null && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Default risk {(scoring.default_probability * 100).toFixed(1)}%
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {creditCalculating
                      ? <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      : <BarChart3 className="w-5 h-5 text-primary" />}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${creditCalculating ? 35 : creditScore}%` }}
                      transition={
                        creditCalculating
                          ? { duration: 1.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
                          : { duration: 1, delay: 0.3, ease: "easeOut" }
                      }
                      className={`h-full rounded-full ${creditCalculating ? "bg-primary/40" : "bg-primary"}`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1.5"><span>0</span><span>100</span></div>
                </div>

                <div className="space-y-2.5">
                  {creditCalculating ? (
                    <p className="text-xs text-muted-foreground">
                      Your credit readiness score is being calculated from connected data sources…
                    </p>
                  ) : scoreBreakdown.length > 0 ? scoreBreakdown.map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28 shrink-0">{item.label}</span>
                      <div className="flex-grow h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }} className={`h-full rounded-full ${item.color}`} />
                      </div>
                      <span className="text-xs font-medium w-14 text-end">{item.pts}/{item.max}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground">
                      Connect data sources and complete registration to unlock a credit score.
                    </p>
                  )}
                </div>

                {/* Next steps toggle */}
                <button
                  onClick={() => setStepsOpen(o => !o)}
                  className="mt-5 w-full flex items-center justify-between text-xs font-medium text-primary hover:opacity-80 transition-opacity pt-4 border-t"
                >
                  {t('dashboard.howToImprove')}
                  {stepsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <AnimatePresence>
                  {stepsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2.5 pt-3">
                        {nextSteps.map(step => (
                          <div key={step.label} className={`flex items-center gap-3 text-xs ${step.done ? 'opacity-40' : ''}`}>
                            {step.done
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                            <span className={`flex-grow ${step.done ? 'line-through' : ''}`}>{step.label}</span>
                            {!step.done && <span className="text-emerald-600 font-semibold shrink-0">{step.impact}</span>}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Green */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border rounded-3xl p-6 shadow-sm">
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                    {t('dashboard.greenFinanceScore')}
                  </p>
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>

                {/* First-time: no assessment yet */}
                {(!scoring || scoring.is_placeholder) && (
                  <div className="text-center py-2 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                      <Leaf className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base mb-1">No Assessment Yet</h3>
                      <p className="text-xs text-muted-foreground max-w-[220px] mx-auto">
                        Complete your Green Assessment to receive your personalized Green Finance Score.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/green-assessment')}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Leaf className="w-4 h-4" /> Start Green Assessment
                    </button>
                  </div>
                )}

                {/* Returning user: real score */}
                {scoring && !scoring.is_placeholder && (
                  <div className="space-y-4">
                    {/* Score + grade row */}
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold">{greenScore}</span>
                      <span className="text-muted-foreground text-base mb-1">/100</span>
                      <span className={`text-xl font-bold mb-1 ms-1 ${gc.text}`}>{scoring.green_band}</span>
                      <span className={`ms-auto text-xs font-semibold px-2 py-0.5 rounded-full ${gc.text}`}
                        style={{ backgroundColor: greenScore >= 75 ? 'rgb(240 253 244)' : greenScore >= 50 ? 'rgb(255 251 235)' : 'rgb(254 242 242)' }}>
                        {gc.label}
                      </span>
                    </div>

                    {/* Category breakdown */}
                    {Object.keys(scoring.green_breakdown || {}).length > 0 && (
                      <div className="space-y-2.5">
                        {Object.entries(scoring.green_breakdown).map(([key, cat]) => (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                              <span className="font-semibold">{cat.component_score}<span className="text-muted-foreground font-normal">/100</span></span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${cat.component_score}%` }}
                                transition={{ duration: 0.7, ease: "easeOut" }}
                                className={`h-full rounded-full ${gc.bar}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Assessment date */}
                    {scoring.computed_at && (
                      <p className="text-[10px] text-muted-foreground">
                        Assessed {new Date(scoring.computed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}

                    {/* Retake button */}
                    <button
                      onClick={() => navigate('/green-assessment')}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-500/8 hover:bg-emerald-500/12 border border-emerald-500/20 rounded-xl py-2 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retake Assessment
                    </button>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Cash flow */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold">{t('dashboard.cashFlow')}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.cashFlowSub')}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />{t('dashboard.income')}</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40 inline-block" />{t('dashboard.expenses')}</span>
                </div>
              </div>

              <div className="flex items-end gap-3 h-28">
                {cashFlow.map((d, i) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-1 h-20">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.income / maxIncome) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.2 + i * 0.08, ease: "easeOut" }}
                        className="flex-1 bg-primary rounded-t-lg min-h-[4px]"
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.expense / maxIncome) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.25 + i * 0.08, ease: "easeOut" }}
                        className="flex-1 bg-muted-foreground/25 rounded-t-lg min-h-[4px]"
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{d.month}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t">
                {[
                  { label: t('dashboard.totalIncome'),   value: `+${totalIncomeSum.toLocaleString()} JOD`, color: "text-emerald-600" },
                  { label: t('dashboard.totalExpenses'), value: `−${totalExpenseSum.toLocaleString()} JOD`, color: "text-foreground" },
                  { label: t('dashboard.net'),           value: `${netSum >= 0 ? "+" : "−"}${Math.abs(netSum).toLocaleString()} JOD`, color: "text-primary" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <p className={`font-bold text-sm ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Transactions */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold">{t('dashboard.recentTransactions')}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(twinCompleteness?.transactions_imported ?? 0) > 0
                      ? t('dashboard.transactionsDetected', {
                          count: twinCompleteness?.transactions_imported ?? 0,
                        })
                      : t('dashboard.transactionsSub')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary text-xs"
                  onClick={() => navigate("/transactions")}
                >
                  {t('common.viewAll')} <ChevronRight className="w-4 h-4 ms-1 rtl:rotate-180" />
                </Button>
              </div>
              <div className="space-y-1">
                {transactions.map((tx, i) => {
                  const Icon = tx.icon;
                  return (
                    <motion.div key={tx.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.05 }} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/40 transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium truncate">{tx.label}</p>
                        <p className="text-xs text-muted-foreground">{tx.sub}</p>
                      </div>
                      <div className={`text-sm font-semibold flex items-center gap-1 shrink-0 ${tx.positive ? 'text-emerald-600' : 'text-foreground'}`}>
                        {tx.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />}
                        {tx.amount}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Simulation CTA */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-gradient-to-br from-primary/8 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/15 rounded-full flex items-center justify-center shrink-0">
                  <FlaskConical className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold mb-1">{t('dashboard.modelNextDecision')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t('dashboard.modelNextDecisionDesc')}</p>
                  <Button size="sm" onClick={() => navigate('/simulation')} className="gap-2">
                    <FlaskConical className="w-4 h-4" />{t('dashboard.openSimulation')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-5">

            {/* Digital Twin Completeness */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm">
                  {twinCompleteness ? t('dashboard.digitalTwinCompleteness') : t('dashboard.profileCompletion')}
                </h3>
                <span className="text-xs font-bold text-primary">{profilePct}%</span>
              </div>
              {twinCompleteness && (
                <p className="text-[11px] text-muted-foreground mb-3">
                  {t('dashboard.completenessSub', { pct: profilePct })}
                </p>
              )}

              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-4">
                <motion.div initial={{ width: 0 }} animate={{ width: `${profilePct}%` }} transition={{ duration: 0.8, delay: 0.3 }} className="h-full bg-primary rounded-full" />
              </div>

              {twinCompleteness && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: t('dashboard.accountsLinked'),         value: twinCompleteness.accounts_linked },
                    { label: t('dashboard.transactionsImported'),   value: twinCompleteness.transactions_imported },
                    { label: t('dashboard.standingOrdersTracked'),  value: twinCompleteness.standing_orders_tracked },
                  ].map((c) => (
                    <div key={c.label} className="bg-muted/40 rounded-xl p-2.5 text-center">
                      <p className="text-base font-bold leading-tight">{c.value}</p>
                      <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{c.label}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2.5">
                {profileItems.map(item => (
                  <div
                    key={item.label}
                    onClick={item.action}
                    className={`flex items-center gap-2.5 text-xs ${item.action && !item.done ? 'cursor-pointer hover:opacity-80' : ''}`}
                  >
                    {item.done
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      : <Circle className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />}
                    <span className={item.done ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}>
                      {item.label}
                    </span>
                    {item.action && !item.done && (
                      <span className="ms-auto text-primary text-[10px] font-medium">{t('dashboard.addAction')}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Commitments shortcut */}
              {!hasCommitments && (
                <button
                  onClick={() => setCommitmentsOpen(true)}
                  className="mt-4 w-full flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 transition-opacity pt-3 border-t"
                >
                  <ReceiptText className="w-3.5 h-3.5" />
                  {t('dashboard.addMonthlyCommitments')}
                </button>
              )}
              {hasCommitments && profilePct < 100 && (
                <button
                  onClick={() => setCommitmentsOpen(true)}
                  className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-3 border-t"
                >
                  <ReceiptText className="w-3 h-3" />
                  {t('dashboard.commitmentsSummary', {
                    count: (state.commitments ?? []).length,
                    total: (state.commitments ?? []).reduce((s, c) => s + c.amountJOD, 0).toLocaleString(),
                  })}
                  <ArrowRight className="w-3 h-3 ms-auto rtl:rotate-180" />
                </button>
              )}
            </motion.div>

            {/* Linked Accounts & Balances */}
            {summary && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="bg-card border rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm">{t('dashboard.linkedAccounts')}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{t('dashboard.linkedAccountsSub')}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary text-xs gap-1.5 shrink-0"
                    onClick={handleSyncNow}
                    disabled={syncing}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? t('dashboard.syncing') : t('dashboard.syncNow')}
                  </Button>
                </div>

                {summary.linked_accounts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('dashboard.noLinkedAccounts')}</p>
                ) : (
                  <div className="space-y-3">
                    {summary.linked_accounts.map((acc) => {
                      const Icon = sourceIcon(acc.source);
                      return (
                        <div key={`${acc.source}-${acc.account_id}`} className="border rounded-2xl p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                              </div>
                              <span className="text-xs font-semibold truncate">{acc.bank_name_en || t('dashboard.linkedAccounts')}</span>
                            </div>
                            <span className="text-[9px] uppercase tracking-wide text-muted-foreground shrink-0">
                              {t(sourceLabelKey(acc.source))}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {acc.account_type_name} · {acc.iban_masked}
                          </p>
                          <div className="flex items-center justify-between text-xs pt-1 border-t">
                            <span className="text-muted-foreground">{t('dashboard.availableBalance')}</span>
                            <span className="font-semibold">{formatMoney(acc.available_balance, acc.currency)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{t('dashboard.currentBalanceLabel')}</span>
                            <span className="font-semibold">{formatMoney(acc.current_balance, acc.currency)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Upcoming Payments (from Standing Orders / SOSPs) */}
            {summary && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-card border rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-sm">{t('dashboard.upcomingPayments')}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t('dashboard.upcomingPaymentsSub')}</p>
                  </div>
                  <CalendarClock className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>

                {summary.upcoming_payments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('dashboard.noUpcomingPayments')}</p>
                ) : (
                  <div className="space-y-1">
                    {summary.upcoming_payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{p.beneficiary}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {[p.frequency, p.next_payment_at ? t('dashboard.nextPaymentOn', { date: formatShortDate(p.next_payment_at) }) : null]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <div className="text-end shrink-0">
                          <p className="text-xs font-semibold">
                            {p.amount != null ? formatMoney(p.amount, p.currency) : "—"}
                          </p>
                          {p.remaining_payments != null && (
                            <p className="text-[10px] text-muted-foreground">
                              {t('dashboard.paymentsRemaining', { count: p.remaining_payments })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Ongoing loan / latest application */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="bg-card border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-sm">{t('dashboard.ongoingLoan')}</h3>
                  {(pendingLoanCount > 0 || activeLoanCount > 0) && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {pendingLoanCount > 0
                        ? t('dashboard.pendingOffersBanner', { count: pendingLoanCount })
                        : t('dashboard.loanLabel', { count: activeLoanCount })}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary text-xs h-8 px-2"
                  onClick={() => navigate("/my-loans")}
                >
                  {t('common.viewAll')} <ChevronRight className="w-4 h-4 ms-1 rtl:rotate-180" />
                </Button>
              </div>

              {latestLoan ? (
                <>
                  <p className="text-xs text-muted-foreground mb-1">
                    {(latestLoan.product_name || latestLoan.loan_type) +
                      (latestLoan.product_bank ? ` — ${latestLoan.product_bank}` : "")}
                  </p>
                  <p className="text-2xl font-bold mb-1">
                    {Number(latestLoan.requested_amount).toLocaleString()}{" "}
                    <span className="text-sm font-normal text-muted-foreground">JOD</span>
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t('dashboard.loanStatusLabel', { status: latestLoan.status })}
                    {latestLoan.reference_number ? ` · ${latestLoan.reference_number}` : ""}
                  </p>
                  {latestLoan.monthly_installment && (
                    <div className="bg-primary/5 rounded-2xl p-3 flex items-center justify-between mb-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground">{t('dashboard.nextPayment')}</p>
                        <p className="text-sm font-bold">
                          {Number(latestLoan.monthly_installment).toLocaleString()} JOD
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-[10px] text-muted-foreground">
                          {latestLoan.quoted_rate || "—"}
                          {latestLoan.quote_source === "sandbox"
                            ? ` · ${t('dashboard.liveBankQuote')}`
                            : ` · ${t('dashboard.estimatedQuote')}`}
                        </p>
                        <Clock className="w-4 h-4 text-primary ms-auto mt-0.5" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">{t('dashboard.noLoanYet')}</p>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => navigate("/loan-prescreening")}
                  >
                    {t('dashboard.applyForLoan')} <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Revenue concentration */}
            {concentration && concentration.top_counterparties.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{t('dashboard.concentrationTitle')}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.concentrationSub')}</p>
                  </div>
                  <PieChart className="w-4 h-4 text-muted-foreground" />
                </div>
                {concentration.flagged && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3">
                    {t('dashboard.concentrationFlag', { pct: concentration.top_concentration_pct })}
                  </p>
                )}
                <div className="space-y-2.5">
                  {concentration.top_counterparties.slice(0, 4).map((c) => (
                    <div key={c.counterparty} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium truncate me-2">{c.counterparty}</span>
                        <span className="text-muted-foreground shrink-0">{c.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.pct >= 40 ? "bg-amber-500" : "bg-primary"}`}
                          style={{ width: `${Math.min(100, c.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Financing matches */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="bg-card border rounded-3xl p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="font-semibold text-sm">{t('dashboard.financingMatches')}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.matchesSub')}</p>
              </div>
              <div className="space-y-3">
                {matches.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">{t('dashboard.noLoanYet')}</p>
                ) : matches.map(m => (
                  <div key={m.productId} className="border rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${m.tagColor}`}>{m.tag}</span>
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{t('dashboard.matchPct', { pct: m.match })}</span>
                    </div>
                    <p className="text-sm font-semibold leading-snug">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.sub}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">
                        {m.rate ? t('dashboard.rateLabel', { rate: m.rate }) : t('prescreening.rateFromBank')}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5"
                        onClick={() => navigate(`/loan-prescreening?productId=${m.productId}`)}
                      >
                        {t('dashboard.checkEligibility')} <ArrowUpRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <CommitmentsSheet open={commitmentsOpen} onOpenChange={setCommitmentsOpen} />
    </div>
  );
}
