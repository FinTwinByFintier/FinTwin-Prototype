import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { type GreenAssessmentResult } from "@/lib/api";
import { lastGreenAssessmentResult } from "@/pages/GreenAssessment";
import { Leaf, BarChart3, Zap, Droplets, Car, Award, ArrowRight, RotateCcw } from "lucide-react";

/* ─── Grade helpers ─────────────────────────────────────────── */
function gradeColor(grade: string) {
  if (grade === "A") return { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/30", bar: "bg-emerald-500" };
  if (grade === "B") return { bg: "bg-blue-500/10",    text: "text-blue-600",    border: "border-blue-500/30",    bar: "bg-blue-500"    };
  if (grade === "C") return { bg: "bg-amber-400/10",   text: "text-amber-600",   border: "border-amber-400/30",   bar: "bg-amber-400"   };
  return                     { bg: "bg-red-500/10",    text: "text-red-600",     border: "border-red-500/30",     bar: "bg-red-500"     };
}

function scoreLabel(score: number) {
  if (score >= 75) return "Strong";
  if (score >= 55) return "Developing";
  if (score >= 40) return "Emerging";
  return "Low";
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  energy:          { label: "Energy",         icon: Zap,      description: "Energy source, renewables, and consumption monitoring" },
  water:           { label: "Water",          icon: Droplets, description: "Water conservation and recycling practices" },
  transportation:  { label: "Transportation", icon: Car,      description: "Fleet type, remote work, and business travel" },
  certifications:  { label: "Certifications", icon: Award,    description: "Green certifications and sustainability policies" },
};

/* ─── Category card ─────────────────────────────────────────── */
function CategoryCard({
  id, score, weight, index,
}: { id: string; score: number; weight: number; index: number }) {
  const meta = CATEGORY_META[id] ?? { label: id, icon: Leaf, description: "" };
  const Icon = meta.icon;
  const colors = gradeColor(score >= 75 ? "A" : score >= 55 ? "B" : score >= 40 ? "C" : "D");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.07 }}
      className="bg-card border rounded-2xl p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colors.bg}`}>
            <Icon className={`w-4 h-4 ${colors.text}`} />
          </div>
          <div>
            <p className="text-sm font-semibold">{meta.label}</p>
            <p className="text-[10px] text-muted-foreground">{weight}% of total score</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${colors.text}`}>{score}</span>
          <span className="text-muted-foreground text-sm">/100</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, delay: 0.3 + index * 0.07, ease: "easeOut" }}
            className={`h-full rounded-full ${colors.bar}`}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">{meta.description}</p>
      </div>
    </motion.div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function GreenScore() {
  const [, navigate] = useLocation();

  // Use the module-level result, or fall back to a stored copy in sessionStorage
  const [result, setResult] = useState<GreenAssessmentResult | null>(null);

  useEffect(() => {
    if (lastGreenAssessmentResult) {
      setResult(lastGreenAssessmentResult);
      // Also persist to sessionStorage so a refresh doesn't lose it
      sessionStorage.setItem("ft_green_result", JSON.stringify(lastGreenAssessmentResult));
    } else {
      const stored = sessionStorage.getItem("ft_green_result");
      if (stored) {
        try { setResult(JSON.parse(stored) as GreenAssessmentResult); } catch { /* ignore */ }
      }
    }
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Leaf className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">No assessment yet</h2>
            <p className="text-muted-foreground text-sm">
              Complete a Green Assessment to see your score and category breakdown.
            </p>
            <Button className="rounded-full gap-2" onClick={() => navigate("/green-assessment")}>
              <Leaf className="w-4 h-4" /> Take Assessment
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const colors = gradeColor(result.grade);
  const categoryEntries = Object.entries(result.categories) as Array<[string, { score: number; weight: number }]>;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-2xl">

        {/* Hero score card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl border-2 p-8 mb-6 text-center ${colors.border} ${colors.bg}`}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className={`w-5 h-5 ${colors.text}`} />
            <span className={`text-xs font-bold uppercase tracking-widest ${colors.text}`}>
              Green Finance Score
            </span>
          </div>

          <div className="flex items-end justify-center gap-3 my-4">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="text-7xl font-bold leading-none"
            >
              {result.green_score}
            </motion.span>
            <span className="text-2xl text-muted-foreground mb-2">/100</span>
            <span className={`text-3xl font-bold mb-2 ${colors.text}`}>{result.grade}</span>
          </div>

          <p className={`text-sm font-semibold mb-1 ${colors.text}`}>{scoreLabel(result.green_score)}</p>

          {/* Score bar */}
          <div className="h-3 w-full bg-background/60 rounded-full overflow-hidden my-4 max-w-xs mx-auto">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.green_score}%` }}
              transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
              className={`h-full rounded-full ${colors.bar}`}
            />
          </div>

          {/* Metadata row */}
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              Confidence: <span className="font-semibold text-foreground ml-0.5">{result.confidence}%</span>
            </span>
          </div>
        </motion.div>

        {/* Message */}
        {result.message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-5 px-5 py-3.5 rounded-2xl bg-muted/50 border text-sm text-muted-foreground"
          >
            {result.message}
          </motion.div>
        )}

        {/* Category breakdown */}
        <div className="mb-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Category Breakdown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categoryEntries.map(([id, cat], i) => (
              <CategoryCard key={id} id={id} score={cat.score} weight={cat.weight} index={i} />
            ))}
          </div>
        </div>

        {/* Weight legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6 rounded-2xl border bg-muted/30 p-4"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Score Weights</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {categoryEntries.map(([id, cat]) => {
              const meta = CATEGORY_META[id] ?? { label: id, icon: Leaf };
              const Icon = meta.icon;
              return (
                <div key={id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{meta.label}</span>
                  <span className="font-semibold text-foreground">{cat.weight}%</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button
            variant="outline"
            className="flex-1 rounded-full gap-2"
            onClick={() => navigate("/green-assessment")}
          >
            <RotateCcw className="w-4 h-4" /> Retake Assessment
          </Button>
          <Button
            className="flex-1 rounded-full gap-2"
            onClick={() => navigate("/dashboard")}
          >
            <BarChart3 className="w-4 h-4" /> Back to Dashboard
          </Button>
          {result.green_score >= 55 && (
            <Button
              variant="outline"
              className="flex-1 rounded-full gap-2 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/5"
              onClick={() => navigate("/loan-prescreening?productId=energy-efficiency-cbj")}
            >
              <Leaf className="w-4 h-4" /> Apply for Green Loan <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </motion.div>
      </main>
    </div>
  );
}
