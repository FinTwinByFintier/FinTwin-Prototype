import { motion } from "framer-motion";
import { MapPin, Briefcase, Leaf, TrendingUp, BarChart3, Zap, ShieldCheck, Plus, Check } from "lucide-react";
import type { InvestorProfile } from "@/data/investorMockData";

interface Props {
  profile: InvestorProfile;
  rank: number;
  onView: (p: InvestorProfile) => void;
  onCompare: (p: InvestorProfile) => void;
  inCompare: boolean;
  compareDisabled: boolean;
  index?: number;
}

function ScorePill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={`text-xs font-bold ${color}`}>{value}</span>
    </div>
  );
}

export function InvestorProfileCard({
  profile, rank, onView, onCompare, inCompare, compareDisabled, index = 0,
}: Props) {
  const isTop3 = rank <= 3;

  const rankBadge =
    rank === 1 ? "bg-amber-400 text-white" :
    rank === 2 ? "bg-slate-400 text-white" :
    rank === 3 ? "bg-amber-700/80 text-white" :
    "bg-muted text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-card border rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer ${isTop3 ? "border-primary/20" : ""}`}
      onClick={() => onView(profile)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Rank badge */}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${rankBadge}`}>
            #{rank}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-semibold text-sm truncate">{profile.name}</p>
              {profile.verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                profile.type === "enterprise"
                  ? "bg-blue-500/10 text-blue-600"
                  : "bg-purple-500/10 text-purple-600"
              }`}>
                {profile.type === "enterprise" ? "Enterprise" : "Individual"}
              </span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {profile.classification}
              </span>
            </div>
          </div>
        </div>

        {/* Ranking score */}
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-primary">{profile.ranking}</p>
          <p className="text-[10px] text-muted-foreground">Ranking</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Briefcase className="w-3 h-3" /> {profile.sector}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {profile.city}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{profile.description}</p>

      {/* Scores row */}
      <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 border-t pt-3">
        <ScorePill label="FinTwin" value={profile.fintwinScore} color="text-primary" />
        <ScorePill label="Financial" value={profile.financialHealthScore} color="text-blue-600" />
        <ScorePill label="Green" value={profile.greenScore} color="text-emerald-600" />
        <ScorePill label="Growth" value={profile.growthReadinessScore} color="text-violet-600" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[10px] text-muted-foreground truncate">{profile.fundingGoal} · {profile.fundingRange}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onCompare(profile); }}
          disabled={compareDisabled && !inCompare}
          title={inCompare ? "Remove from compare" : "Add to compare"}
          className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
            inCompare
              ? "bg-primary text-primary-foreground border-primary"
              : compareDisabled
              ? "opacity-40 cursor-not-allowed border-muted text-muted-foreground"
              : "border-muted text-muted-foreground hover:border-primary hover:text-primary"
          }`}
        >
          {inCompare ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>
    </motion.div>
  );
}
