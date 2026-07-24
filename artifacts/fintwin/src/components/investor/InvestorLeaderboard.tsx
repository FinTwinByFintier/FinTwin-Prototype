import { motion } from "framer-motion";
import { ShieldCheck, Medal } from "lucide-react";
import { TOP_10, type InvestorProfile } from "@/data/investorMockData";

interface Props {
  onView: (p: InvestorProfile) => void;
}

const MEDAL: Record<number, string> = { 1: "text-amber-400", 2: "text-slate-400", 3: "text-amber-700" };

export function InvestorLeaderboard({ onView }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Medal className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Top 10 Leaderboard
        </h3>
      </div>

      <div className="rounded-2xl border overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[2.5rem_1fr_6rem_5rem_5rem_5rem_5rem_6rem] gap-x-3 px-4 py-2.5 bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span>#</span>
          <span>Business</span>
          <span>Sector</span>
          <span className="text-center">FinTwin</span>
          <span className="text-center">Financial</span>
          <span className="text-center">Green</span>
          <span className="text-center">Growth</span>
          <span className="text-right">Ranking</span>
        </div>

        {TOP_10.map((p, i) => {
          const rank = i + 1;
          const medalClass = MEDAL[rank] ?? "text-muted-foreground";

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onView(p)}
              className="grid sm:grid-cols-[2.5rem_1fr_6rem_5rem_5rem_5rem_5rem_6rem] gap-x-3 items-center px-4 py-3.5 border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
            >
              {/* Rank */}
              <span className={`font-bold text-sm ${medalClass}`}>#{rank}</span>

              {/* Name + badges */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm truncate">{p.name}</span>
                  {p.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    p.type === "enterprise" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"
                  }`}>
                    {p.type === "enterprise" ? "Enterprise" : "Individual"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{p.city}</span>
                  <span className="sm:hidden text-[10px] text-muted-foreground">{p.sector}</span>
                </div>
                {/* Mobile scores */}
                <div className="flex sm:hidden gap-3 mt-1.5 text-xs flex-wrap">
                  <span className="text-primary font-bold">{p.fintwinScore} FT</span>
                  <span className="text-blue-600 font-bold">{p.financialHealthScore} FH</span>
                  <span className="text-emerald-600 font-bold">{p.greenScore} G</span>
                  <span className="text-violet-600 font-bold">{p.growthReadinessScore} GR</span>
                  <span className="font-bold">= {p.ranking}</span>
                </div>
              </div>

              {/* Desktop columns */}
              <span className="hidden sm:block text-xs text-muted-foreground truncate">{p.sector}</span>
              <span className="hidden sm:block text-center font-bold text-sm text-primary">{p.fintwinScore}</span>
              <span className="hidden sm:block text-center font-semibold text-sm text-blue-600">{p.financialHealthScore}</span>
              <span className="hidden sm:block text-center font-semibold text-sm text-emerald-600">{p.greenScore}</span>
              <span className="hidden sm:block text-center font-semibold text-sm text-violet-600">{p.growthReadinessScore}</span>
              <span className="hidden sm:block text-right font-bold text-base text-primary">{p.ranking}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-[11px] text-muted-foreground">
        <span><span className="font-semibold text-primary">FT</span> FinTwin (×0.40)</span>
        <span><span className="font-semibold text-blue-600">FH</span> Financial Health (×0.30)</span>
        <span><span className="font-semibold text-emerald-600">G</span> Green Score (×0.20)</span>
        <span><span className="font-semibold text-violet-600">GR</span> Growth Readiness (×0.10)</span>
      </div>
    </div>
  );
}
