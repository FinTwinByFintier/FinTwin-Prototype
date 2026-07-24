import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { InvestorProfileCard } from "@/components/investor/InvestorProfileCard";
import { InvestorLeaderboard } from "@/components/investor/InvestorLeaderboard";
import { ProfileDetailModal } from "@/components/investor/ProfileDetailModal";
import { ComparePanel } from "@/components/investor/ComparePanel";
import {
  MOCK_PROFILES,
  ALL_SECTORS,
  ALL_CITIES,
  ALL_CLASSIFICATIONS,
  type InvestorProfile,
  type SectorKey,
  type ClassificationKey,
} from "@/data/investorMockData";
import {
  Telescope, Building2, Users, Globe2, Info, SlidersHorizontal,
  Search, X, ChevronDown, Leaf, BarChart3, TrendingUp, DollarSign,
} from "lucide-react";

// ─── Filter state ────────────────────────────────────────────────────────────

interface Filters {
  type: "all" | "enterprise" | "individual";
  sector: SectorKey | "all";
  classification: ClassificationKey | "all";
  city: string;
  minFintwin: number;
  minGreen: number;
  verifiedOnly: boolean;
  sortBy: "ranking" | "fintwinScore" | "greenScore" | "financialHealthScore" | "growthReadinessScore" | "fundingRange";
}

const DEFAULT_FILTERS: Filters = {
  type: "all",
  sector: "all",
  classification: "all",
  city: "",
  minFintwin: 0,
  minGreen: 0,
  verifiedOnly: false,
  sortBy: "ranking",
};

// ─── Overview cards ──────────────────────────────────────────────────────────

const OVERVIEW_CARDS = [
  {
    icon: Building2,
    title: "For Businesses",
    description:
      "Build a trusted public investment profile using FinTwin's financial and sustainability indicators.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Users,
    title: "For Investors",
    description:
      "Discover promising SMEs and entrepreneurs using standardized platform insights instead of scattered information.",
    color: "bg-violet-500/10 text-violet-600",
  },
  {
    icon: Globe2,
    title: "For the Ecosystem",
    description:
      "Strengthen investment opportunities while encouraging financial health and sustainable business practices.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
];

// ─── Sort labels ─────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: Filters["sortBy"]; label: string }[] = [
  { value: "ranking",              label: "Overall Ranking" },
  { value: "fintwinScore",         label: "FinTwin Score" },
  { value: "greenScore",           label: "Green Score" },
  { value: "financialHealthScore", label: "Financial Health" },
  { value: "growthReadinessScore", label: "Growth Readiness" },
  { value: "fundingRange",         label: "Funding Range" },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InvestorDiscovery() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<InvestorProfile | null>(null);
  const [compareList, setCompareList] = useState<InvestorProfile[]>([]);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [k]: v }));

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = MOCK_PROFILES.filter((p) => {
      if (filters.type !== "all" && p.type !== filters.type) return false;
      if (filters.sector !== "all" && p.sector !== filters.sector) return false;
      if (filters.classification !== "all" && p.classification !== filters.classification) return false;
      if (filters.city && p.city !== filters.city) return false;
      if (p.fintwinScore < filters.minFintwin) return false;
      if (p.greenScore < filters.minGreen) return false;
      if (filters.verifiedOnly && !p.verified) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.sector.toLowerCase().includes(q) &&
          !p.city.toLowerCase().includes(q) &&
          !p.description.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (filters.sortBy === "fundingRange") {
        // Sort by the first number in the funding range string
        const extract = (s: string) => parseInt(s.replace(/\D/g, ""), 10) || 0;
        return extract(b.fundingRange) - extract(a.fundingRange);
      }
      return (b[filters.sortBy] as number) - (a[filters.sortBy] as number);
    });

    return list;
  }, [filters, search]);

  // ── Compare helpers ────────────────────────────────────────────────────────
  const toggleCompare = (p: InvestorProfile) => {
    setCompareList((prev) => {
      if (prev.find((x) => x.id === p.id)) return prev.filter((x) => x.id !== p.id);
      if (prev.length >= 3) return prev;
      return [...prev, p];
    });
  };

  const rankOf = (id: string) =>
    MOCK_PROFILES.findIndex((p) => p.id === id) + 1;

  const activeFilterCount =
    (filters.type !== "all" ? 1 : 0) +
    (filters.sector !== "all" ? 1 : 0) +
    (filters.classification !== "all" ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.minFintwin > 0 ? 1 : 0) +
    (filters.minGreen > 0 ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <Navbar />

      <main className="flex-grow">
        {/* ── Hero ── */}
        <section className="border-b bg-card">
          <div className="container mx-auto px-4 py-14 max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-center gap-2">
                <Telescope className="w-6 h-6 text-primary" />
                <h1 className="text-4xl font-bold">Investor Discovery Platform</h1>
                <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-amber-400/15 text-amber-700 border border-amber-400/30 uppercase tracking-wider">
                  Future Work
                </span>
              </div>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Connecting promising SMEs and entrepreneurs with investors through trusted
                financial and sustainability insights.
              </p>

              {/* Prototype banner */}
              <div className="inline-flex items-start gap-3 bg-blue-500/5 border border-blue-500/20 rounded-2xl px-5 py-3.5 text-left max-w-2xl mx-auto">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  This is a prototype demonstrating a future expansion of the FinTwin
                  ecosystem. It is not part of the current MVP.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Overview cards ── */}
        <section className="container mx-auto px-4 py-10 max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {OVERVIEW_CARDS.map(({ icon: Icon, title, description, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border rounded-2xl p-6"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Leaderboard ── */}
        <section className="container mx-auto px-4 pb-10 max-w-4xl">
          <InvestorLeaderboard onView={setSelectedProfile} />
        </section>

        {/* ── Discovery grid ── */}
        <section className="container mx-auto px-4 pb-16 max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-bold text-xl">Investor Discovery</h2>
              <p className="text-sm text-muted-foreground">
                {filtered.length} profile{filtered.length !== 1 ? "s" : ""} — demonstration data only
              </p>
            </div>

            {/* Search + filter toggle */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, sector, city…"
                  className="pl-9 pr-4 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-56"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  filtersOpen || activeFilterCount > 0
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary-foreground/20 text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filters panel */}
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border rounded-2xl p-5 mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {/* Type */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => set("type", e.target.value as Filters["type"])}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="all">All</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="individual">Individual</option>
                </select>
              </div>

              {/* Sector */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Sector</label>
                <select
                  value={filters.sector}
                  onChange={(e) => set("sector", e.target.value as SectorKey | "all")}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="all">All sectors</option>
                  {ALL_SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Classification */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Classification</label>
                <select
                  value={filters.classification}
                  onChange={(e) => set("classification", e.target.value as ClassificationKey | "all")}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="all">All sizes</option>
                  {ALL_CLASSIFICATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">City</label>
                <select
                  value={filters.city}
                  onChange={(e) => set("city", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">All cities</option>
                  {ALL_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Min FinTwin */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                  Min FinTwin Score: <span className="text-foreground">{filters.minFintwin}</span>
                </label>
                <input
                  type="range" min={0} max={90} step={5}
                  value={filters.minFintwin}
                  onChange={(e) => set("minFintwin", Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              {/* Min Green */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                  Min Green Score: <span className="text-foreground">{filters.minGreen}</span>
                </label>
                <input
                  type="range" min={0} max={90} step={5}
                  value={filters.minGreen}
                  onChange={(e) => set("minGreen", Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              {/* Sort */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => set("sortBy", e.target.value as Filters["sortBy"])}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Verified only */}
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => set("verifiedOnly", e.target.checked)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="text-sm font-medium">Verified Only</span>
                </label>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="mt-3 text-xs text-muted-foreground hover:text-foreground underline text-left"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No profiles match your filters.</p>
              <button
                onClick={() => { setFilters(DEFAULT_FILTERS); setSearch(""); }}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p, i) => (
                <InvestorProfileCard
                  key={p.id}
                  profile={p}
                  rank={rankOf(p.id)}
                  onView={setSelectedProfile}
                  onCompare={toggleCompare}
                  inCompare={!!compareList.find((x) => x.id === p.id)}
                  compareDisabled={compareList.length >= 3}
                  index={i}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Footer / roadmap ── */}
        <footer className="border-t bg-card">
          <div className="container mx-auto px-4 py-12 max-w-3xl text-center space-y-4">
            <h3 className="font-bold text-base">Future Roadmap</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This prototype illustrates how FinTwin could evolve into an investment
              discovery ecosystem where SMEs and entrepreneurs voluntarily share trusted
              financial and sustainability indicators to increase visibility and access to
              funding.
            </p>
            <p className="text-xs text-muted-foreground/70 max-w-xl mx-auto">
              Profiles, rankings, and investment interactions shown here are demonstration
              data and do not represent real investment recommendations.
            </p>
          </div>
        </footer>
      </main>

      {/* ── Modals ── */}
      <ProfileDetailModal
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        onCompare={toggleCompare}
        inCompare={!!selectedProfile && !!compareList.find((x) => x.id === selectedProfile.id)}
        compareDisabled={compareList.length >= 3}
      />

      {/* Compare panel — fixed bottom */}
      {compareList.length > 0 && (
        <ComparePanel
          profiles={compareList}
          onRemove={(id) => setCompareList((prev) => prev.filter((x) => x.id !== id))}
          onClear={() => setCompareList([])}
        />
      )}
    </div>
  );
}
