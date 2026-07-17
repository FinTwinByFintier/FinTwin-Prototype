import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { CommitmentsSheet } from "@/components/CommitmentsSheet";
import {
  BarChart3, Leaf, FileText, TrendingUp, TrendingDown, Building,
  Bell, ChevronRight, Coffee, ShoppingBag, Truck, Zap, ArrowUpRight,
  CheckCircle2, Clock, AlertCircle, LogOut, ArrowRight,
  Wallet, Timer, CreditCard, Plus, ChevronDown, ChevronUp,
  Circle, FlaskConical, ReceiptText, Landmark,
} from "lucide-react";

/* ── Static mock data ─────────────────────────────────────── */
const cashFlow = [
  { month: "Apr", income: 5200, expense: 3800 },
  { month: "May", income: 6100, expense: 4200 },
  { month: "Jun", income: 5700, expense: 3600 },
  { month: "Jul", income: 4800, expense: 2900 },
];

const ongoingLoan = {
  label: "Murabaha Facility — Arab Bank",
  total: 20000,
  remaining: 13400,
  nextPayment: { amount: 850, date: "Aug 1, 2026" },
  installments: { paid: 8, total: 24 },
};

const maxIncome = Math.max(...cashFlow.map(d => d.income));

/* ── Component ─────────────────────────────────────────────── */
export default function Dashboard() {
  const { state, resetState } = useOnboarding();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { toggleLanguage } = useLanguage();
  const [menuOpen, setMenuOpen]               = useState(false);
  const [stepsOpen, setStepsOpen]             = useState(false);
  const [commitmentsOpen, setCommitmentsOpen] = useState(false);

  const businessName = state.businessName   || "Amman Coffee Roasters";
  const category     = state.category       || t('dashboard.microEnterprise');
  const sector       = state.businessSector || "Food & Hospitality";
  const creditScore  = 74;
  const greenScore   = 62;

  function greenLabel(score: number) {
    if (score >= 75) return t('dashboard.greenScoreLabels.strong');
    if (score >= 50) return t('dashboard.greenScoreLabels.developing');
    return t('dashboard.greenScoreLabels.low');
  }
  function greenColors(score: number) {
    if (score >= 75) return { bar: "bg-emerald-500", text: "text-emerald-600" };
    if (score >= 50) return { bar: "bg-amber-400",   text: "text-amber-500" };
    return               { bar: "bg-red-500",        text: "text-red-500" };
  }
  const gc = { ...greenColors(greenScore), label: greenLabel(greenScore) };

  const hasCommitments = (state.commitments ?? []).length > 0;

  const profileItems = [
    { label: t('dashboard.businessIdentity'),   done: true },
    { label: t('dashboard.sizeAndScale'),        done: true },
    { label: t('dashboard.bankConnected'),       done: state.connectedSources.cliq },
    { label: t('dashboard.jofotaraConnected'),   done: state.connectedSources.jofotara },
    { label: t('dashboard.receiptsUploaded'),    done: state.connectedSources.receipts },
    { label: t('dashboard.monthlyCommitments'),  done: hasCommitments, action: () => setCommitmentsOpen(true) },
  ];
  const completedCount = profileItems.filter(p => p.done).length;
  const profilePct     = Math.round((completedCount / profileItems.length) * 100);

  const transactions = [
    { icon: ShoppingBag, label: t('dashboard.tx1Label'), sub: t('dashboard.tx1Sub'), amount: "+340 JOD",   positive: true,  color: "bg-emerald-500/10 text-emerald-600" },
    { icon: Truck,       label: t('dashboard.tx2Label'), sub: t('dashboard.tx2Sub'), amount: "−1,200 JOD", positive: false, color: "bg-red-500/10 text-red-500" },
    { icon: Coffee,      label: t('dashboard.tx3Label'), sub: t('dashboard.tx3Sub'), amount: "+820 JOD",   positive: true,  color: "bg-primary/10 text-primary" },
    { icon: Zap,         label: t('dashboard.tx4Label'), sub: t('dashboard.tx4Sub'), amount: "−95 JOD",    positive: false, color: "bg-red-500/10 text-red-500" },
    { icon: ShoppingBag, label: t('dashboard.tx5Label'), sub: t('dashboard.tx5Sub'), amount: "+1,540 JOD", positive: true,  color: "bg-blue-500/10 text-blue-600" },
  ];

  const matches = [
    { tag: t('prescreening.steps.selectLoan') === "اختر القرض" ? "تمويل إسلامي" : "Islamic Finance", tagColor: "text-primary",     label: "Murabaha Working Capital",    sub: "Arab Bank · Up to 25,000 JOD", rate: "6.5%",  match: 87, productId: "murabaha-arab-bank" },
    { tag: t('prescreening.steps.selectLoan') === "اختر القرض" ? "قرض أخضر"   : "Green Loan",      tagColor: "text-emerald-600", label: "Energy Efficiency Fund",      sub: "CBJ · Up to 50,000 JOD",       rate: "2.75%", match: 62, productId: "energy-efficiency-cbj" },
    { tag: t('prescreening.steps.selectLoan') === "اختر القرض" ? "قرض MSME"   : "MSME Loan",       tagColor: "text-blue-600",    label: "Jordan Loan Guarantee Corp.", sub: "JLGC · Up to 15,000 JOD",      rate: "7.0%",  match: 74, productId: "msme-jlgc" },
  ];

  const scoreBreakdown = [
    { label: t('dashboard.scoreLabelPaymentHistory'), value: 82, color: "bg-emerald-500" },
    { label: t('dashboard.scoreLabelCashFlow'),       value: 70, color: "bg-primary" },
    { label: t('dashboard.scoreLabelBusinessAge'),    value: 65, color: "bg-blue-500" },
    { label: t('dashboard.scoreLabelDataCoverage'),   value: 55, color: "bg-amber-400" },
  ];

  const nextSteps = [
    { label: t('dashboard.nextStep1'), impact: "+8 pts",  done: true },
    { label: t('dashboard.nextStep2'), impact: "+12 pts", done: false },
    { label: t('dashboard.nextStep3'), impact: "+6 pts",  done: false },
    { label: t('dashboard.nextStep4'), impact: "+5 pts",  done: false },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">Fin<span className="text-primary">Twin</span></span>
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
                        href="/"
                        onClick={() => { resetState(); setMenuOpen(false); }}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" /> {t('nav.signOut')}
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
              <span className="flex items-center text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5 me-1" />{t('dashboard.profileActive')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
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

        {/* Loan eligibility banner */}
        {creditScore >= 55 && (
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
                    product: 'Murabaha Working Capital',
                    rate: '6.5%',
                  })}
                </p>
                <p className="text-xs text-muted-foreground">{t('dashboard.loanBannerSub')}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-primary/30 text-primary hover:bg-primary/5 gap-1.5"
              onClick={() => navigate('/loan-prescreening?productId=murabaha-arab-bank')}
            >
              {t('dashboard.loanBannerCta')} <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Button>
          </motion.div>
        )}

        {/* Top stat strip */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: Wallet,     label: t('dashboard.netThisMonth'),  value: "+2,305 JOD",  sub: t('dashboard.vsLastMonth', { pct: 14 }),       subColor: "text-emerald-600" },
            { icon: Timer,      label: t('dashboard.runway'),         value: "4.2 months",  sub: t('dashboard.basedOnBurn'),                    subColor: "text-muted-foreground" },
            { icon: CreditCard, label: t('dashboard.activeLoans'),    value: t('dashboard.loanLabel', { count: 1 }), sub: t('dashboard.nextPaymentDate', { date: 'Aug 1' }), subColor: "text-muted-foreground" },
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{t('dashboard.creditReadiness')}</p>
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-bold">{creditScore}</span>
                      <span className="text-muted-foreground text-base mb-1">{t('common.outOf100')}</span>
                    </div>
                    <p className="text-xs text-amber-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{t('dashboard.moderate')}
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
                      <span className="text-xs font-medium w-8 text-end">{item.value}</span>
                    </div>
                  ))}
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
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{t('dashboard.greenFinanceScore')}</p>
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-bold">{greenScore}</span>
                      <span className="text-muted-foreground text-base mb-1">{t('common.outOf100')}</span>
                    </div>
                    <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${gc.text}`}>
                      <Leaf className="w-3 h-3" />{gc.label}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

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
                    <span>{t('dashboard.lowHigh')}</span><span>{t('dashboard.midLabel')}</span><span>{t('dashboard.highLabel')}</span>
                  </div>
                </div>

                <div className={`rounded-xl p-3 text-xs border ${gc.text}`} style={{ backgroundColor: greenScore >= 75 ? 'rgb(240 253 244)' : greenScore >= 50 ? 'rgb(255 251 235)' : 'rgb(254 242 242)' }}>
                  <p className="font-semibold mb-0.5">{t('dashboard.cbgEligible')}</p>
                  <p className="text-muted-foreground">{t('dashboard.cbgEligibleDesc', { rate: '2.75%' })}</p>
                </div>

                <div className="mt-4 flex justify-between text-xs text-muted-foreground border-t pt-4">
                  <span>{t('dashboard.matchedGreenProducts')}</span>
                  <span className="font-semibold text-foreground">{t('dashboard.available', { count: 2 })}</span>
                </div>
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
                  { label: t('dashboard.totalIncome'),   value: "+4,800 JOD", color: "text-emerald-600" },
                  { label: t('dashboard.totalExpenses'), value: "−2,900 JOD", color: "text-foreground" },
                  { label: t('dashboard.net'),           value: "+1,900 JOD", color: "text-primary" },
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
                  <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.transactionsSub')}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-primary text-xs">{t('common.viewAll')} <ChevronRight className="w-4 h-4 ms-1 rtl:rotate-180" /></Button>
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

            {/* Profile completion */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">{t('dashboard.profileCompletion')}</h3>
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

            {/* Ongoing loan */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="bg-card border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">{t('dashboard.ongoingLoan')}</h3>
                <CreditCard className="w-4 h-4 text-muted-foreground" />
              </div>

              <p className="text-xs text-muted-foreground mb-1">{ongoingLoan.label}</p>
              <p className="text-2xl font-bold mb-1">{ongoingLoan.remaining.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{t('dashboard.jodLeft')}</span></p>

              <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((ongoingLoan.total - ongoingLoan.remaining) / ongoingLoan.total) * 100}%` }}
                  transition={{ duration: 0.9, delay: 0.4 }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-4">
                <span>{t('dashboard.installmentsPaid', { paid: ongoingLoan.installments.paid, total: ongoingLoan.installments.total })}</span>
                <span>{t('dashboard.paidOff')}</span>
              </div>

              <div className="bg-primary/5 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">{t('dashboard.nextPayment')}</p>
                  <p className="text-sm font-bold">{ongoingLoan.nextPayment.amount.toLocaleString()} JOD</p>
                </div>
                <div className="text-end">
                  <p className="text-[10px] text-muted-foreground">{ongoingLoan.nextPayment.date}</p>
                  <Clock className="w-4 h-4 text-primary ms-auto mt-0.5" />
                </div>
              </div>
            </motion.div>

            {/* Financing matches */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="bg-card border rounded-3xl p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="font-semibold text-sm">{t('dashboard.financingMatches')}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.matchesSub')}</p>
              </div>
              <div className="space-y-3">
                {matches.map(m => (
                  <div key={m.productId} className="border rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${m.tagColor}`}>{m.tag}</span>
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{t('dashboard.matchPct', { pct: m.match })}</span>
                    </div>
                    <p className="text-sm font-semibold leading-snug">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.sub}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">{t('dashboard.rateLabel', { rate: m.rate })}</span>
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
