import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, BarChart3 } from "lucide-react";
import type { InvestorProfile } from "@/data/investorMockData";

interface Props {
  profiles: InvestorProfile[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

function Cell({ value, best }: { value: string | number | boolean; best?: boolean }) {
  const display =
    typeof value === "boolean"
      ? (value ? "✓ Verified" : "— Not verified")
      : value;
  return (
    <div className={`px-3 py-2.5 text-sm border-b text-center ${
      best ? "text-primary font-bold" : ""
    } ${typeof value === "boolean" && value ? "text-emerald-600 font-medium" : ""}`}>
      {String(display)}
    </div>
  );
}

const ROWS: { label: string; key: keyof InvestorProfile; numeric?: boolean }[] = [
  { label: "Sector",              key: "sector" },
  { label: "City",                key: "city" },
  { label: "Classification",      key: "classification" },
  { label: "Funding Goal",        key: "fundingGoal" },
  { label: "Funding Range",       key: "fundingRange" },
  { label: "FinTwin Score",       key: "fintwinScore",         numeric: true },
  { label: "Financial Health",    key: "financialHealthScore", numeric: true },
  { label: "Green Score",         key: "greenScore",           numeric: true },
  { label: "Growth Readiness",    key: "growthReadinessScore", numeric: true },
  { label: "Overall Ranking",     key: "ranking",              numeric: true },
  { label: "Verification Status", key: "verified" },
];

export function ComparePanel({ profiles, onRemove, onClear }: Props) {
  if (profiles.length === 0) return null;

  const cols = profiles.length;

  return (
    <AnimatePresence>
      <motion.div
        key="compare"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="fixed bottom-0 inset-x-0 z-40 bg-background border-t shadow-2xl"
        style={{ maxHeight: "75vh" }}
      >
        {/* Sticky header */}
        <div className="sticky top-0 bg-background z-10 flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Compare Profiles</span>
            <span className="text-xs text-muted-foreground">({cols}/3 selected)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="overflow-auto" style={{ maxHeight: "calc(75vh - 3rem)" }}>
          <div className={`grid min-w-[600px]`} style={{ gridTemplateColumns: `10rem repeat(${cols}, 1fr)` }}>
            {/* Profile headers */}
            <div className="border-b border-r py-3 px-3 bg-muted/30" />
            {profiles.map((p) => (
              <div key={p.id} className="border-b border-r py-3 px-3 bg-muted/30 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold truncate">{p.name}</span>
                  {p.verified && <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />}
                  <button
                    onClick={() => onRemove(p.id)}
                    className="text-muted-foreground hover:text-destructive ml-1 shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  p.type === "enterprise" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"
                }`}>
                  {p.type === "enterprise" ? "Enterprise" : "Individual"}
                </span>
              </div>
            ))}

            {/* Data rows */}
            {ROWS.map(({ label, key, numeric }) => {
              const vals = profiles.map((p) => p[key] as number | string | boolean);
              const max = numeric
                ? Math.max(...(vals as number[]))
                : null;

              return (
                <>
                  <div key={`label-${label}`} className="border-b border-r px-3 py-2.5 text-xs font-medium text-muted-foreground bg-muted/20 flex items-center">
                    {label}
                  </div>
                  {profiles.map((p, i) => (
                    <Cell
                      key={`${label}-${p.id}`}
                      value={p[key] as string | number | boolean}
                      best={numeric ? (vals[i] as number) === max : false}
                    />
                  ))}
                </>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
