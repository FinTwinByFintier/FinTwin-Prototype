import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import {
  BarChart3, Leaf, FileText, TrendingUp, TrendingDown, Building,
  Bell, ChevronRight, Coffee, ShoppingBag, Truck, Zap, ArrowUpRight,
  CheckCircle2, Clock, AlertCircle, LogOut
} from "lucide-react";

const transactions = [
  { icon: ShoppingBag, label: "Retail Sale — CliQ", sub: "Today, 10:42 AM", amount: "+340 JOD", positive: true, color: "bg-emerald-500/10 text-emerald-600" },
  { icon: Truck, label: "Supplier Payment", sub: "Yesterday, 3:15 PM", amount: "−1,200 JOD", positive: false, color: "bg-red-500/10 text-red-500" },
  { icon: Coffee, label: "Daily POS Sales", sub: "Yesterday, 8:00 PM", amount: "+820 JOD", positive: true, color: "bg-primary/10 text-primary" },
  { icon: Zap, label: "Electricity Bill", sub: "Jul 14, 9:00 AM", amount: "−95 JOD", positive: false, color: "bg-red-500/10 text-red-500" },
  { icon: ShoppingBag, label: "JoFotara Invoice #2041", sub: "Jul 13, 11:30 AM", amount: "+1,540 JOD", positive: true, color: "bg-blue-500/10 text-blue-600" },
];

const matches = [
  {
    tag: "Islamic Finance",
    tagColor: "text-primary",
    label: "Murabaha Working Capital",
    sub: "Arab Bank · Up to 25,000 JOD",
    rate: "6.5%",
    match: 87,
    matchColor: "text-emerald-600",
  },
  {
    tag: "Green Loan",
    tagColor: "text-emerald-600",
    label: "Energy Efficiency Fund",
    sub: "CBJ · Up to 50,000 JOD",
    rate: "2.75%",
    match: 62,
    matchColor: "text-emerald-600",
  },
  {
    tag: "MSME Loan",
    tagColor: "text-blue-600",
    label: "Jordan Loan Guarantee Corp.",
    sub: "JLGC · Up to 15,000 JOD",
    rate: "7.0%",
    match: 74,
    matchColor: "text-amber-500",
  },
];

const scoreBreakdown = [
  { label: "Payment History", value: 82, color: "bg-emerald-500" },
  { label: "Cash Flow", value: 70, color: "bg-primary" },
  { label: "Business Age", value: 65, color: "bg-blue-500" },
  { label: "Data Coverage", value: 55, color: "bg-amber-400" },
];

export default function Dashboard() {
  const { state, resetState } = useOnboarding();
  const [menuOpen, setMenuOpen] = useState(false);
  const businessName = state.businessName || "Amman Coffee Roasters";
  const category = state.category || "Micro Enterprise";
  const sector = state.businessSector || "Food & Hospitality";
  const creditScore = 74;
  const greenMatch = 62;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">
            Fin<span className="text-primary">Twin</span>
          </span>
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
        {/* Page header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-3">
          <div>
            <h1 className="text-2xl font-bold mb-1">{businessName}</h1>
            <div className="flex items-center text-muted-foreground text-sm gap-2 flex-wrap">
              <Building className="w-4 h-4" />
              <span>{category}</span>
              <span>·</span>
              <span>{sector}</span>
              <span>·</span>
              <span className="flex items-center text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Profile active
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" /> Export Report
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Score cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Credit Score */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-card border rounded-3xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">Credit Readiness</p>
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-bold">{creditScore}</span>
                      <span className="text-muted-foreground text-base mb-1">/100</span>
                    </div>
                    <p className="text-xs text-amber-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Moderate — room to grow
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                </div>

                {/* Score bar */}
                <div className="mb-5">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${creditScore}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                    <span>0</span><span>100</span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-2.5">
                  {scoreBreakdown.map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28 shrink-0">{item.label}</span>
                      <div className="flex-grow h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                          className={`h-full rounded-full ${item.color}`}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Green Score */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border rounded-3xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">Green Taxonomy</p>
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-bold">{greenMatch}%</span>
                    </div>
                    <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> CBJ-eligible
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                {/* Donut-style ring */}
                <div className="flex justify-center my-3">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                    <motion.circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke="#22c55e" strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - greenMatch / 100) }}
                      transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                      style={{ transformOrigin: "50% 50%", transform: "rotate(-90deg)" }}
                    />
                    <text x="50" y="55" textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor">{greenMatch}%</text>
                  </svg>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl p-3 text-xs text-emerald-700 dark:text-emerald-300">
                  Qualifies for Energy Efficiency Fund at <strong>2.75% fixed rate</strong>
                </div>
              </motion.div>
            </div>

            {/* Activity */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border rounded-3xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold">Recent Activity</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Last 7 days · 5 transactions</p>
                </div>
                <Button variant="ghost" size="sm" className="text-primary text-xs">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="space-y-2">
                {transactions.map((tx, i) => {
                  const Icon = tx.icon;
                  return (
                    <motion.div
                      key={tx.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                      className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-muted/40 transition-colors"
                    >
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
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Financing Matches */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border rounded-3xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold">Financing Matches</h3>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>

              <div className="space-y-3">
                {matches.map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="p-4 border rounded-2xl hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${m.tagColor}`}>{m.tag}</span>
                      <span className={`text-xs font-semibold ${m.matchColor}`}>{m.match}% match</span>
                    </div>
                    <h4 className="font-medium text-sm mb-0.5">{m.label}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{m.sub}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{m.rate} / yr</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Verification */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-card border rounded-3xl p-6 shadow-sm"
            >
              <h3 className="font-semibold mb-4">Verification</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Identity", status: "Verified", Icon: CheckCircle2, color: "text-emerald-600" },
                  { label: "Data Sources", status: "3 connected", Icon: CheckCircle2, color: "text-emerald-600" },
                  { label: "Company Registry", status: "Pending", Icon: Clock, color: "text-muted-foreground" },
                ].map(v => (
                  <div key={v.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{v.label}</span>
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
    </div>
  );
}
