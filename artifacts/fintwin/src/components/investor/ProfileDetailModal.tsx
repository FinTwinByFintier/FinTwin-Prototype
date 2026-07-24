import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  MapPin, Briefcase, Calendar, ShieldCheck, Target, TrendingUp,
  Leaf, BarChart3, Zap, Star, Plus, Check,
} from "lucide-react";
import { generateStandoutReasons, type InvestorProfile } from "@/data/investorMockData";
import { ExpressInterestModal } from "@/components/investor/ExpressInterestModal";

interface Props {
  profile: InvestorProfile | null;
  onClose: () => void;
  onCompare: (p: InvestorProfile) => void;
  inCompare: boolean;
  compareDisabled: boolean;
}

function ScoreBar({ label, value, color, barColor }: { label: string; value: number; color: string; barColor: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-sm font-bold ${color}`}>{value}/100</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
    </div>
  );
}

export function ProfileDetailModal({ profile, onClose, onCompare, inCompare, compareDisabled }: Props) {
  const [interestOpen, setInterestOpen] = useState(false);

  if (!profile) return null;

  const standout = generateStandoutReasons(profile);

  return (
    <>
      <Dialog open={!!profile} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader className="pb-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <DialogTitle className="text-lg">{profile.name}</DialogTitle>
                  {profile.verified && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{profile.sector}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.city}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{profile.yearsOperating} years operating</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-bold text-primary">{profile.ranking}</p>
                <p className="text-[10px] text-muted-foreground">Overall Ranking</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                profile.type === "enterprise" ? "bg-blue-500/10 text-blue-700" : "bg-purple-500/10 text-purple-700"
              }`}>
                {profile.type === "enterprise" ? "Enterprise" : "Individual Entrepreneur"}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground">
                {profile.classification} Enterprise
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground">
                Last updated {profile.lastUpdated}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.description}</p>

            {/* Funding */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/40 rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Funding Goal</p>
                <p className="font-semibold text-sm">{profile.fundingGoal}</p>
              </div>
              <div className="bg-muted/40 rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Funding Range</p>
                <p className="font-semibold text-sm">{profile.fundingRange}</p>
              </div>
            </div>

            {/* Scores */}
            <div className="bg-card border rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Platform Scores</h4>
              <ScoreBar label="FinTwin Score (×0.40 weight)" value={profile.fintwinScore} color="text-primary" barColor="bg-primary" />
              <ScoreBar label="Financial Health Score (×0.30)" value={profile.financialHealthScore} color="text-blue-600" barColor="bg-blue-500" />
              <ScoreBar label="Green Score (×0.20)" value={profile.greenScore} color="text-emerald-600" barColor="bg-emerald-500" />
              <ScoreBar label="Growth Readiness Score (×0.10)" value={profile.growthReadinessScore} color="text-violet-600" barColor="bg-violet-500" />
            </div>

            {/* Why this business stands out */}
            {standout.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Why This Business Stands Out</h4>
                </div>
                <ul className="space-y-1.5">
                  {standout.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5 shrink-0">·</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sustainability highlights */}
            {profile.sustainabilityHighlights.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sustainability Highlights</h4>
                </div>
                <ul className="space-y-1.5">
                  {profile.sustainabilityHighlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Investment highlights */}
            {profile.investmentHighlights.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Investment Highlights</h4>
                </div>
                <ul className="space-y-1.5">
                  {profile.investmentHighlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-blue-500 mt-0.5 shrink-0">·</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
              <button
                onClick={() => setInterestOpen(true)}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Express Interest
              </button>
              <button
                onClick={() => { onCompare(profile); }}
                disabled={compareDisabled && !inCompare}
                className={`flex-1 py-3 rounded-xl border font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                  inCompare
                    ? "border-primary text-primary bg-primary/5"
                    : compareDisabled
                    ? "opacity-40 cursor-not-allowed border-muted text-muted-foreground"
                    : "border-muted text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {inCompare ? <><Check className="w-4 h-4" /> In Comparison</> : <><Plus className="w-4 h-4" /> Add to Compare</>}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ExpressInterestModal
        profile={profile}
        open={interestOpen}
        onClose={() => setInterestOpen(false)}
      />
    </>
  );
}
