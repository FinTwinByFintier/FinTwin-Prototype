import type { LoanApplication } from "@/lib/api";

export type LoanTab = "pending" | "active" | "history";

export type ScheduleRow = {
  installment: number;
  dueDate: Date;
  amount: number;
  currency: string;
  status: "paid" | "due" | "upcoming" | "projected";
};

export function loanTabForStatus(status: string): LoanTab {
  const s = (status || "").toLowerCase();
  if (s === "pending" || s === "draft") return "pending";
  if (s === "approved" || s === "active") return "active";
  return "history";
}

export function partitionLoans(apps: LoanApplication[]) {
  const pending: LoanApplication[] = [];
  const active: LoanApplication[] = [];
  const history: LoanApplication[] = [];
  for (const app of apps) {
    const tab = loanTabForStatus(app.status);
    if (tab === "pending") pending.push(app);
    else if (tab === "active") active.push(app);
    else history.push(app);
  }
  return { pending, active, history };
}

export function buildPaymentSchedule(app: LoanApplication, now = new Date()): ScheduleRow[] {
  const tenor = Math.max(1, Number(app.tenor_months) || 36);
  const amount = parseFloat(app.monthly_installment || "0") || 0;
  const currency = "JOD";
  const start = app.created_at ? new Date(app.created_at) : new Date();
  const isActive = ["approved", "active"].includes((app.status || "").toLowerCase());
  const isPending = ["pending", "draft"].includes((app.status || "").toLowerCase());

  // Assume first installment one month after application / offer date.
  const rows: ScheduleRow[] = [];
  for (let i = 1; i <= tenor; i++) {
    const due = new Date(start);
    due.setMonth(due.getMonth() + i);
    let status: ScheduleRow["status"] = "projected";
    if (isPending) {
      status = "projected";
    } else if (isActive) {
      if (due < now) status = "paid";
      else if (
        due.getFullYear() === now.getFullYear() &&
        due.getMonth() === now.getMonth()
      ) {
        status = "due";
      } else {
        status = "upcoming";
      }
    } else {
      status = "projected";
    }
    rows.push({ installment: i, dueDate: due, amount, currency, status });
  }
  return rows;
}

export function nextPayment(app: LoanApplication, now = new Date()): ScheduleRow | null {
  const schedule = buildPaymentSchedule(app, now);
  return (
    schedule.find((r) => r.status === "due") ||
    schedule.find((r) => r.status === "upcoming") ||
    schedule.find((r) => r.status === "projected") ||
    null
  );
}

export function formatLoanMoney(amount: number | string | null | undefined, currency = "JOD") {
  const n = typeof amount === "string" ? parseFloat(amount) : Number(amount ?? 0);
  if (!Number.isFinite(n)) return `— ${currency}`;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${currency}`;
}

export function formatDueDate(d: Date) {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
