import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { CommitmentsSheet } from "@/components/CommitmentsSheet";
import {
  BarChart3, Leaf, FileText, TrendingUp, TrendingDown, Building,
  Bell, ChevronRight, Coffee, ShoppingBag, Truck, Zap, ArrowUpRight,
  CheckCircle2, Clock, AlertCircle, LogOut, ArrowRight,
  Wallet, Timer, CreditCard, Plus, ChevronDown, ChevronUp,
  Circle, FlaskConical, ReceiptText,
} from "lucide-react";

/* ─── Static mock data ─────────────────────────────────── */
const transactions = [
  { icon: ShoppingBag, label: "Retail Sale — CliQ",        sub: "Today, 10:42 AM",       amount: "+340 JOD",   positive: true,  color: "bg-emerald-500/10 text-emerald-600" },
  { icon: Truck,       label: "Supplier Payment",           sub: "Yesterday, 3:15 PM",    amount: "−1,200 JOD", positive: false, color: "bg-red-500/10 text-red-500" },
  { icon: Coffee,      label: "Daily POS Sales",            sub: "Yesterday, 8:00 PM",    amount: "+820 JOD",   positive: true,  color: "bg-primary/10 text-primary" },
  { icon: Zap,         label: "Electricity Bill",           sub: "Jul 14, 9:00 AM",       amount: "−95 JOD",    positive: false, color: "bg-red-500/10 text-red-500" },
  { icon: ShoppingBag, label: "JoFotara Invoice #2041",     sub: "Jul 13, 11:30 AM",      amount: "+1,540 JOD", positive: true,  color: "bg-blue-500/10 text-blue-600" },
];

const cashFlow = [
  { month: "Apr", income: 5200, expense: 3800 },
  { month: "May", income: 6100, expense: 4200 },
  { month: "Jun", income: 5700, expense: 3600 },
  { month: "Jul", income: 4800, expense: 2900 },
];

const matches = [
  { tag: "Islamic Finance", tagColor: "text-primary",     label: "Murabaha Working Capital",      sub: "Arab Bank · Up to 25,000 JOD", rate: "6.5%",  match: 87 },
  { tag: "Green Loan",      tagColor: "text-emerald-600", label: "Energy Efficiency Fund",        sub: "CBJ · Up to 50,000 JOD",       rate: "2.75%", match: 62 },
  { tag: "MSME Loan",       tagColor: "text-blue-600",    label: "Jordan Loan Guarantee Corp.",   sub: "JLGC · Up to 15,000 JOD",      rate: "7.0%",  match: 74 },
];

const scoreBreakdown = [
  { label: "Payment History", value: 82, color: "bg-emerald-500" },
  { label: "Cash Flow",       value: 70, color: "bg-primary" },
  { label: "Business Age",    value: 65, color: "bg-blue-500" },
  { label: "Data Coverage",   value: 55, color: "bg-amber-400" },
];

const nextSteps = [
  { label: "Connect your bank account via CliQ",     impact: "+8 pts",  done: true },
  { label: "Verify company registration number",     impact: "+12 pts", done: false },
  { label: "Upload 3 months of bank statements",     impact: "+6 pts",  done: false },
  { label: "Add tax identification number",          impact: "+5 pts",  done: false },
];

const ongoingLoan = {
  label: "Murabaha Facility — Arab Bank",
  total: 20000,
  remaining: 13400,
  nextPayment: { amount: 850, date: "Aug 1, 2026" },
  installments: { paid: 8, total: 24 },
};

/* ─── Helpers ───────────────────────────────────────────── */
function greenColor(score: number) {
  if (score >= 75) return { bar: "bg-emerald-500", text: "text-emerald-600", label: "Strong" };
  if (score >= 50) return { bar: "bg-amber-400",   text: "text-amber-500",   label: "Developing" };
  return               { bar: "bg-red-500",        text: "text-red-500",     label: "Low" };
}

const maxIncome = Math.max(...cashFlow.map(d => d.income));

/* ─── Component ─────────────────────────────────────────── */
export default function Dashboard() {
  const { state, resetState } = useOnboarding();
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen]             = useState(false);
  const [stepsOpen, setStepsOpen]           = useState(false);
  const [commitmentsOpen, setCommitmentsOpen] = useState(false);

  const businessName = state.businessName   || "Amman Coffee Roasters";
  const category     = state.category       || "Micro Enterprise";
  const sector       = state.businessSector || "Food & Hospitality";
  const creditScore  = 74;
  const greenScore   = 62;
  const gc           = greenColor(greenScore);

  const hasCommitments = (state.commitments ?? []).length > 0;

  // Profile completion — commitments replaces company registry as the most impactful next step
  const profileItems = [
    { label: "Business identity",     done: true },
    { label: "Size & scale",          done: true },
    { label: "Bank connected",        done: state.connectedSources.cliq },
    { label: "JoFotara connected",    done: state.connectedSources.jofotara },
    { label: "Receipts uploaded",     done: state.connectedSources.receipts },
    { label: "Monthly commitments",   done: hasCommitments, action: () => setCommitmentsOpen(true) },
  ];
  const completedCount = profileItems.filter(p => p.done).length;
  const profilePct     = Math.round((completedCount / profileItems.length) * 100);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">Fin<span className="text-primary">Twin</span></span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
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
                      className="absolute right-0 top-11 z-20 w-44 bg-card border rounded-2xl shadow-lg overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b">
                        <p className="text-xs font-medium truncate">{businessName}</p>
                        <p className="text-xs text-muted-foreground">Free plan</p>
                      </div>
                      <Link
                        href="/"
                        onClick={() => { resetState(); setMenuOpen(false); }}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </Link>
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
              <span className="flex items-center text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Profile active</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />Export Report
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 gap-2"
              onClick={() => navigate('/simulation')}
            >
              <FlaskConical className="w-4 h-4" />Run Simulation
            </Button>
          </div>
        </div>

        {/* Top stat strip */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: Wallet,     label: "Net this month",  value: "+2,305 JOD",  sub: "↑ 14% vs last month",     subColor: "text-emerald-600" },
            { icon: Timer,      label: "Runway",           value: "4.2 months",  sub: "Based on current burn rate", subColor: "text-muted-foreground" },
            { icon: CreditCard, label: "Active loans",     value: "1 loan",      sub: "Next payment Aug 1",        subColor: "text-muted-foreground" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border rounded-2xl px-5 py-4 flex items-center gap-4"
              >
                <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
                  <p className="font-bold text-base leading-tight">{stat.value}</p>
                  <p className={`text-xs mt-0.5 ${stat.subColor}`}>{stat.sub}</p>
                </div>
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Credit Readiness</p>
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-bold">{creditScore}</span>
                      <span className="text-muted-foreground text-base mb-1">/100</span>
                    </div>
                    <p className="text-xs text-amber-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />Moderate — room to grow
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${creditScore}%` }} transition={{ duration: 1, delay: 0.3, ease: "easeOut" }} className="h-full bg-primary rounded-full" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1.5"><span>0</span><span>100</span></div>
                </div>

                <div className="space-y-2.5">
                  {scoreBreakdown.map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28 shrink-0">{item.label}</span>
                      <div className="flex-grow h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }} className={`h-full rounded-full ${item.color}`} />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Next steps toggle */}
                <button
                  onClick={() => setStepsOpen(o => !o)}
                  className="mt-5 w-full flex items-center justify-between text-xs font-medium text-primary hover:opacity-80 transition-opacity pt-4 border-t"
                >
                  How to improve your score
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
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Green Finance Score</p>
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-bold">{greenScore}</span>
                      <span className="text-muted-foreground text-base mb-1">/100</span>
                    </div>
                    <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${gc.text}`}>
                      <Leaf className="w-3 h-3" />{gc.label}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                {/* Color-coded bar */}
                <div className="mb-5">
                  <div className="relative h-3 rounded-full overflow-hidden flex">
                    <div className="h-full bg-red-400/70" style={{ width: "50%" }} />
                    <div className="h-full bg-amber-400/70" style={{ width: "25%" }} />
                    <div className="h-full bg-emerald-400/70" style={{ width: "25%" }} />
                  </div>
                  <div className="relative h-0">
                    <motion.div
                      initial={{ left: "0%" }}
                      animate={{ left: `${greenScore}%` }}
                      transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                      className="absolute -top-4 -translate-x-1/2"
                    >
                      <div className="w-2.5 h-5 bg-foreground rounded-full shadow" />
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-3">
                    <span>0 · Low</span><span>50 · Mid</span><span>75 · High</span>
                  </div>
                </div>

                <div className={`rounded-xl p-3 text-xs border ${gc.text}`} style={{ backgroundColor: greenScore >= 75 ? 'rgb(240 253 244)' : greenScore >= 50 ? 'rgb(255 251 235)' : 'rgb(254 242 242)' }}>
                  <p className="font-semibold mb-0.5">CBJ Green Finance eligible</p>
                  <p className="text-muted-foreground">Qualifies for Energy Efficiency Fund at <strong>2.75% fixed rate</strong>. Raise score to 75 to unlock top-tier green products.</p>
                </div>

                <div className="mt-4 flex justify-between text-xs text-muted-foreground border-t pt-4">
                  <span>Matched green products</span>
                  <span className="font-semibold text-foreground">2 available</span>
                </div>
              </motion.div>
            </div>

            {/* Cash flow */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold">Cash Flow</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Income vs. expenses · Last 4 months</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />Income</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40 inline-block" />Expenses</span>
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
                  { label: "Total income",   value: "+4,800 JOD", color: "text-emerald-600" },
                  { label: "Total expenses", value: "−2,900 JOD", color: "text-foreground" },
                  { label: "Net",            value: "+1,900 JOD", color: "text-primary" },
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
                  <h3 className="font-semibold">Recent Transactions</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Last 7 days · 5 entries</p>
                </div>
                <Button variant="ghost" size="sm" className="text-primary text-xs">View All <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
              <div className="space-y-1">
                {transactions.map((tx, i) => {
                  const Icon = tx.icon;
                  return (
                    <motion.div key={tx.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.05 }} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/40 transition-colors">
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
                  <h3 className="font-semibold mb-1">Model your next decision</h3>
                  <p className="text-sm text-muted-foreground mb-4">What happens if you hire, take a loan, or go green? The digital twin updates every score in real time.</p>
                  <Button size="sm" onClick={() => navigate('/simulation')} className="gap-2">
                    <FlaskConical className="w-4 h-4" />Open Simulation
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-5">

            {/* Profile completion */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Profile completion</h3>
                <span className="text-xs font-bold text-primary">{profilePct}%</span>
              </div>

              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-4">
                <motion.div initial={{ width: 0 }} animate={{ width: `${profilePct}%` }} transition={{ duration: 0.8, delay: 0.3 }} className="h-full bg-primary rounded-full" />
              </div>

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
                      <span className="ml-auto text-primary text-[10px] font-medium">Add →</span>
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
                  Add monthly commitments
                </button>
              )}
              {hasCommitments && profilePct < 100 && (
                <button
                  onClick={() => setCommitmentsOpen(true)}
                  className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-3 border-t"
                >
                  <ReceiptText className="w-3 h-3" />
                  {(state.commitments ?? []).length} commitments · {(state.commitments ?? []).reduce((s, c) => s + c.amountJOD, 0).toLocaleString()} JOD/mo
                  <ArrowRight className="w-3 h-3 ml-auto" />
                </button>
              )}
            </motion.div>

            {/* Ongoing loan */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="bg-card border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Ongoing Loan</h3>
                <CreditCard className="w-4 h-4 text-muted-foreground" />
              </div>

              <p className="text-xs text-muted-foreground mb-1">{ongoingLoan.label}</p>
              <p className="text-2xl font-bold mb-1">{ongoingLoan.remaining.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">JOD left</span></p>

              <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((ongoingLoan.total - ongoingLoan.remaining) / ongoingLoan.total) * 100}%` }}
                  transition={{ duration: 0.9, delay: 0.4 }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-4">
                <span>{ongoingLoan.installments.paid} of {ongoingLoan.installments.total} installments paid</span>
                <span>{Math.round(((ongoingLoan.total - ongoingLoan.remaining) / ongoingLoan.total) * 100)}%</span>
              </div>

              <div className="bg-muted/40 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <p className="text-muted-foreground">Next payment</p>
                  <p className="font-semibold">{ongoingLoan.nextPayment.date}</p>
                </div>
                <p className="font-bold text-base">{ongoingLoan.nextPayment.amount} JOD</p>
              </div>
            </motion.div>

            {/* Financing matches */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Financing Matches</h3>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-3">
                {matches.map((m, i) => (
                  <motion.div key={m.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07 }} className="p-3.5 border rounded-2xl hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${m.tagColor}`}>{m.tag}</span>
                      <span className="text-[10px] font-semibold text-emerald-600">{m.match}% match</span>
                    </div>
                    <h4 className="font-medium text-xs mb-0.5">{m.label}</h4>
                    <p className="text-[10px] text-muted-foreground mb-2">{m.sub}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{m.rate} / yr</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
              <button className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors pt-3 border-t">
                <Plus className="w-3.5 h-3.5" /> See all matches
              </button>
            </motion.div>

            {/* Verification */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="bg-card border rounded-3xl p-5 shadow-sm">
              <h3 className="font-semibold text-sm mb-4">Verification</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Identity",           status: "Verified",    Icon: CheckCircle2, color: "text-emerald-600" },
                  { label: "Data Sources",       status: "3 connected", Icon: CheckCircle2, color: "text-emerald-600" },
                  { label: "Company Registry",   status: "Pending",     Icon: Clock,        color: "text-muted-foreground" },
                ].map(v => (
                  <div key={v.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">{v.label}</span>
                    <span className={`flex items-center gap-1.5 font-medium text-xs ${v.color}`}>
                      <v.Icon className="w-3.5 h-3.5" />{v.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Commitments sheet */}
      <CommitmentsSheet open={commitmentsOpen} onOpenChange={setCommitmentsOpen} />
    </div>
  );
}
