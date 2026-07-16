import { motion } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Leaf, 
  FileText, 
  Lock, 
  TrendingUp,
  Building,
  RefreshCw,
  Bell,
  Search,
  ChevronRight
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
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold tracking-tight text-foreground">
              Fin<span className="text-primary">Twin</span>
            </span>
            <div className="hidden md:flex items-center gap-1 bg-muted/50 rounded-full px-4 py-2 border">
              <Search className="w-4 h-4 text-muted-foreground mr-2" />
              <input 
                type="text" 
                placeholder="Search transactions, insights..." 
                className="bg-transparent border-none outline-none text-sm w-64 placeholder:text-muted-foreground"
                disabled
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            </Button>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm border border-primary/30">
              {businessName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {businessName}</h1>
            <div className="flex items-center text-muted-foreground text-sm gap-2">
              <Building className="w-4 h-4" />
              <span>{category}</span>
              <span>•</span>
              <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                <RefreshCw className="w-3 h-3 mr-1" /> Profile Syncing
              </span>
            </div>
          </div>
          <Button variant="outline" className="hidden md:flex">
            <FileText className="w-4 h-4 mr-2" /> Export Report
          </Button>
        </div>

        {/* Global Banner for Sync State */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border border-primary/20 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h3 className="font-semibold text-primary mb-1">Your financial twin is being built</h3>
            <p className="text-sm text-muted-foreground">
              We are currently analyzing your connected data sources ({connectedCount} connected) to generate your true credit profile. Check back soon.
            </p>
          </div>
          <Button size="sm" variant="secondary" className="whitespace-nowrap">
            Add More Data
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Dashboard Columns */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Core Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Credit Score Card (Locked/Calculating) */}
              <div className="bg-card border rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3 duration-[3000ms]" />
                  <span className="font-medium text-foreground bg-background/80 px-4 py-1.5 rounded-full border shadow-sm">Calculating Score...</span>
                </div>
                
                <div className="flex items-start justify-between mb-8 opacity-50">
                  <div>
                    <h3 className="text-muted-foreground text-sm font-medium mb-1">Credit Readiness Score</h3>
                    <div className="text-4xl font-bold text-foreground">--<span className="text-xl text-muted-foreground font-normal">/100</span></div>
                  </div>
                  <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                </div>
                
                <div className="space-y-3 opacity-50">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[0%]" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Insufficient Data</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>

              {/* Green Score Card */}
              <div className="bg-card border rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <Lock className="w-8 h-8 text-muted-foreground mb-3" />
                  <span className="font-medium text-foreground bg-background/80 px-4 py-1.5 rounded-full border shadow-sm">Analyzing Taxonomy...</span>
                </div>

                <div className="flex items-start justify-between mb-8 opacity-50">
                  <div>
                    <h3 className="text-muted-foreground text-sm font-medium mb-1">Green Taxonomy Match</h3>
                    <div className="text-4xl font-bold text-foreground">--<span className="text-xl text-muted-foreground font-normal">%</span></div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-xl text-xs text-muted-foreground border opacity-50">
                  Matches your operations against the CBJ Green Finance Taxonomy to unlock subsidized 2.5% rates.
                </div>
              </div>
            </div>

            {/* Financial Activity Stub */}
            <div className="bg-card border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Recent Financial Activity</h3>
                <Button variant="ghost" size="sm" className="text-primary">View All <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
              
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-muted bg-muted/20 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-20 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="h-5 w-16 bg-muted rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Matches Stub */}
            <div className="bg-card border rounded-3xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-6">Financing Matches</h3>
              
              <div className="space-y-4 relative">
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-6 rounded-2xl">
                  <TrendingUp className="w-8 h-8 text-primary mb-3" />
                  <p className="font-medium text-sm">Matches will appear once your score is calculated.</p>
                </div>

                {/* Fake match cards underneath */}
                <div className="p-4 border rounded-2xl bg-muted/10 opacity-30">
                  <div className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">Islamic Finance</div>
                  <h4 className="font-medium mb-1">Murabaha Facility</h4>
                  <p className="text-xs text-muted-foreground mb-3">Up to 50,000 JOD</p>
                  <div className="h-8 bg-muted rounded-lg w-full"></div>
                </div>
                
                <div className="p-4 border rounded-2xl bg-muted/10 opacity-30">
                  <div className="text-xs font-medium text-emerald-600 mb-1 uppercase tracking-wider">Green Loan</div>
                  <h4 className="font-medium mb-1">Energy Efficiency Fund</h4>
                  <p className="text-xs text-muted-foreground mb-3">2.5% fixed rate</p>
                  <div className="h-8 bg-muted rounded-lg w-full"></div>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-card border rounded-3xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Profile Verification</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Identity</span>
                  <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></div> Verified
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data Sources</span>
                  <span className="flex items-center text-amber-500 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"></div> Syncing
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Company Registry</span>
                  <span className="flex items-center text-muted-foreground font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-2"></div> Pending
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
