import { motion } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import {
  BarChart3, Leaf, FileText, Lock, TrendingUp, Building, RefreshCw, Bell, ChevronRight
} from "lucide-react";

export default function Dashboard() {
  const { state } = useOnboarding();
  const businessName = state.businessName || "Amman Coffee Roasters";
  const category = state.category || "Micro Enterprise";
  const connectedCount = Object.values(state.connectedSources).filter(Boolean).length;

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
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm border border-primary/30">
              {businessName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-3">
          <div>
            <h1 className="text-2xl font-bold mb-1">{businessName}</h1>
            <div className="flex items-center text-muted-foreground text-sm gap-2">
              <Building className="w-4 h-4" />
              <span>{category}</span>
              <span>·</span>
              <span className="flex items-center text-amber-500">
                <RefreshCw className="w-3 h-3 mr-1" /> Building profile
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>

        {/* Status banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/8 border border-primary/20 rounded-2xl p-4 mb-8 flex items-center justify-between gap-4"
        >
          <div>
            <p className="font-medium text-sm text-primary">Your financial twin is being built.</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Analyzing {connectedCount} data source{connectedCount !== 1 ? 's' : ''}. Scores ready soon.
            </p>
          </div>
          <Button size="sm" variant="secondary" className="whitespace-nowrap text-xs">
            Add Data
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Score cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-card border rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <RefreshCw className="w-7 h-7 text-primary animate-spin mb-2 duration-[3000ms]" />
                  <span className="text-sm font-medium bg-background/80 px-3 py-1 rounded-full border">Calculating...</span>
                </div>
                <div className="opacity-40">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Credit Readiness Score</p>
                      <div className="text-4xl font-bold">--<span className="text-lg text-muted-foreground font-normal">/100</span></div>
                    </div>
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full" />
                </div>
              </div>

              <div className="bg-card border rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <Lock className="w-7 h-7 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium bg-background/80 px-3 py-1 rounded-full border">Analyzing...</span>
                </div>
                <div className="opacity-40">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Green Taxonomy Match</p>
                      <div className="text-4xl font-bold">--<span className="text-lg text-muted-foreground font-normal">%</span></div>
                    </div>
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full" />
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="bg-card border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold">Recent Activity</h3>
                <Button variant="ghost" size="sm" className="text-primary text-xs">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="h-3 w-28 bg-muted rounded" />
                        <div className="h-2.5 w-16 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="h-4 w-14 bg-muted rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border rounded-3xl p-6 shadow-sm">
              <h3 className="font-semibold mb-5">Financing Matches</h3>
              <div className="space-y-3 relative">
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-4 rounded-2xl">
                  <TrendingUp className="w-7 h-7 text-primary mb-2" />
                  <p className="text-sm font-medium">Matches appear once your score is ready.</p>
                </div>
                {[
                  { tag: "Islamic Finance", label: "Murabaha Facility", sub: "Up to 50,000 JOD", tagClass: "text-primary" },
                  { tag: "Green Loan", label: "Energy Efficiency Fund", sub: "2.5% fixed rate", tagClass: "text-emerald-600" },
                ].map(m => (
                  <div key={m.label} className="p-4 border rounded-2xl bg-muted/10 opacity-30">
                    <div className={`text-xs font-medium uppercase tracking-wider mb-1 ${m.tagClass}`}>{m.tag}</div>
                    <h4 className="font-medium text-sm mb-0.5">{m.label}</h4>
                    <p className="text-xs text-muted-foreground">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-3xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Verification</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Identity", status: "Verified", color: "bg-emerald-500", textColor: "text-emerald-600" },
                  { label: "Data Sources", status: "Syncing", color: "bg-amber-400", textColor: "text-amber-500" },
                  { label: "Company Registry", status: "Pending", color: "bg-muted-foreground", textColor: "text-muted-foreground" },
                ].map(v => (
                  <div key={v.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{v.label}</span>
                    <span className={`flex items-center font-medium ${v.textColor}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${v.color}`} />{v.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
