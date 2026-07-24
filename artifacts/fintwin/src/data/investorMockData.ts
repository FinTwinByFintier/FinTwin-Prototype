/**
 * Investor Discovery Platform — Mock Data
 *
 * Frontend-only demonstration data for the hackathon presentation.
 * This does NOT represent real businesses, real investors, or real
 * investment recommendations.
 *
 * Future backend replacement:
 *   GET /api/v1/investor-discovery/profiles
 *   → Replace MOCK_PROFILES with the API response.
 *   → ranking is computed client-side from the score fields, so
 *     the formula stays in computeRanking() regardless of data source.
 */

export type ProfileType = "enterprise" | "individual";
export type SectorKey =
  | "Retail & Trade"
  | "Food & Hospitality"
  | "Small Manufacturing"
  | "Services"
  | "Professional Services"
  | "Agriculture"
  | "Crafts & Trades"
  | "Other";
export type ClassificationKey = "Micro" | "Small" | "Medium";

export interface InvestorProfile {
  id: string;
  type: ProfileType;
  name: string;
  sector: SectorKey;
  classification: ClassificationKey;
  city: string;
  description: string;
  fundingGoal: string;   // e.g. "Equity Investment"
  fundingRange: string;  // e.g. "JOD 50,000 – 150,000"
  fintwinScore: number;        // 0-100
  financialHealthScore: number; // 0-100
  greenScore: number;          // 0-100
  growthReadinessScore: number; // 0-100
  ranking: number;             // computed by computeRanking()
  verified: boolean;
  yearsOperating: number;
  lastUpdated: string;
  sustainabilityHighlights: string[];
  investmentHighlights: string[];
}

/** Ranking formula per spec: FT×0.40 + FH×0.30 + Green×0.20 + Growth×0.10 */
export function computeRanking(p: Omit<InvestorProfile, "ranking">): number {
  return (
    p.fintwinScore * 0.4 +
    p.financialHealthScore * 0.3 +
    p.greenScore * 0.2 +
    p.growthReadinessScore * 0.1
  );
}

/** Generate "Why This Business Stands Out" highlights from scores only — no AI. */
export function generateStandoutReasons(p: InvestorProfile): string[] {
  const reasons: string[] = [];
  if (p.greenScore >= 80)             reasons.push("Excellent sustainability performance.");
  if (p.financialHealthScore >= 80)   reasons.push("Strong financial health.");
  if (p.growthReadinessScore >= 80)   reasons.push("Prepared for growth and scaling.");
  if (p.fintwinScore >= 85)           reasons.push("Among the highest ranked businesses on the platform.");
  if (p.verified)                     reasons.push("Verified profile — data independently confirmed.");
  if (p.yearsOperating >= 5)          reasons.push(`${p.yearsOperating} years of operational track record.`);
  return reasons.length > 0 ? reasons : ["Solid overall platform indicators."];
}

// ─── Raw profile data (ranking injected below) ────────────────────────────────

const RAW: Omit<InvestorProfile, "ranking">[] = [
  // ── Enterprises ─────────────────────────────────────────────────────────────
  {
    id: "ent-01",
    type: "enterprise",
    name: "Jordan Green Energy Solutions",
    sector: "Services",
    classification: "Medium",
    city: "Amman",
    description:
      "A Jordanian clean-energy integrator offering solar installation, energy audits, and efficiency consulting for commercial and industrial clients across the Kingdom.",
    fundingGoal: "Growth Capital",
    fundingRange: "JOD 250,000 – 500,000",
    fintwinScore: 90,
    financialHealthScore: 88,
    greenScore: 85,
    growthReadinessScore: 82,
    verified: true,
    yearsOperating: 8,
    lastUpdated: "2026-07",
    sustainabilityHighlights: [
      "Solar systems installed for 140+ commercial clients",
      "ISO 14001-certified operations",
      "Fleet fully converted to hybrid vehicles",
    ],
    investmentHighlights: [
      "Revenue grew 38% year-on-year for three consecutive years",
      "Active government framework contracts",
      "Scalable service model with low marginal cost per new client",
    ],
  },
  {
    id: "ent-02",
    type: "enterprise",
    name: "Petra Digital Solutions",
    sector: "Professional Services",
    classification: "Small",
    city: "Amman",
    description:
      "A boutique software house specialising in ERP integrations, e-commerce platforms, and digital transformation projects for Jordanian SMEs.",
    fundingGoal: "Equity Investment",
    fundingRange: "JOD 100,000 – 250,000",
    fintwinScore: 87,
    financialHealthScore: 84,
    greenScore: 72,
    growthReadinessScore: 90,
    verified: true,
    yearsOperating: 6,
    lastUpdated: "2026-07",
    sustainabilityHighlights: [
      "Paperless office since 2023",
      "100% remote-capable workforce — low transport footprint",
      "Data centre hosted on certified green infrastructure",
    ],
    investmentHighlights: [
      "Recurring revenue from 60+ SaaS clients",
      "Proprietary ERP connector with 3 active patents",
      "Shortlisted for USAID digital-inclusion programme",
    ],
  },
  {
    id: "ent-03",
    type: "enterprise",
    name: "Sama Technology Park",
    sector: "Services",
    classification: "Medium",
    city: "Amman",
    description:
      "A co-working and technology incubator providing affordable workspace, mentorship, and seed-stage support to Jordanian tech startups.",
    fundingGoal: "Expansion Capital",
    fundingRange: "JOD 300,000 – 600,000",
    fintwinScore: 85,
    financialHealthScore: 82,
    greenScore: 78,
    growthReadinessScore: 88,
    verified: true,
    yearsOperating: 5,
    lastUpdated: "2026-06",
    sustainabilityHighlights: [
      "LEED-certified building fit-out",
      "Solar canopy covering 40% of electricity needs",
      "Zero single-use plastics policy",
    ],
    investmentHighlights: [
      "95% occupancy rate since Q1 2025",
      "Alumni startups raised over JOD 2M collectively",
      "MoU with two international accelerators",
    ],
  },
  {
    id: "ent-04",
    type: "enterprise",
    name: "Al-Noor Organic Farms",
    sector: "Agriculture",
    classification: "Micro",
    city: "Madaba",
    description:
      "A certified-organic produce cooperative supplying supermarkets and hotels in Amman with locally grown vegetables and herbs.",
    fundingGoal: "Working Capital",
    fundingRange: "JOD 30,000 – 80,000",
    fintwinScore: 82,
    financialHealthScore: 78,
    greenScore: 91,
    growthReadinessScore: 75,
    verified: true,
    yearsOperating: 9,
    lastUpdated: "2026-07",
    sustainabilityHighlights: [
      "Organic certification from Jordan's Ministry of Agriculture",
      "Rain-fed irrigation supplemented by solar water pumps",
      "Zero synthetic pesticides — certified by third-party auditor",
    ],
    investmentHighlights: [
      "Long-term supply contracts with two four-star hotel groups",
      "Direct-to-consumer subscription box launched Q2 2026",
      "Surplus production exported to Gulf markets",
    ],
  },
  {
    id: "ent-05",
    type: "enterprise",
    name: "Yaqeen Financial Advisory",
    sector: "Professional Services",
    classification: "Medium",
    city: "Amman",
    description:
      "An accredited financial advisory and corporate restructuring firm serving mid-market Jordanian companies seeking funding, compliance, and strategic planning.",
    fundingGoal: "Equity Partnership",
    fundingRange: "JOD 150,000 – 350,000",
    fintwinScore: 84,
    financialHealthScore: 86,
    greenScore: 68,
    growthReadinessScore: 79,
    verified: true,
    yearsOperating: 11,
    lastUpdated: "2026-05",
    sustainabilityHighlights: [
      "ESG reporting framework adopted across all client deliverables",
      "Green-finance advisory unit launched 2025",
    ],
    investmentHighlights: [
      "Advisory track record spanning JOD 180M in transactions",
      "Retained by two publicly listed Jordanian companies",
      "Expanding to Saudi Arabia — licence in progress",
    ],
  },
  {
    id: "ent-06",
    type: "enterprise",
    name: "Al-Baraka Bakeries Network",
    sector: "Food & Hospitality",
    classification: "Small",
    city: "Irbid",
    description:
      "A regional bakery chain with eight outlets in northern Jordan, known for artisan bread and pastries using locally sourced grain.",
    fundingGoal: "Franchise Expansion Capital",
    fundingRange: "JOD 80,000 – 180,000",
    fintwinScore: 80,
    financialHealthScore: 79,
    greenScore: 76,
    growthReadinessScore: 78,
    verified: true,
    yearsOperating: 7,
    lastUpdated: "2026-06",
    sustainabilityHighlights: [
      "Wood-fired ovens using sustainably sourced fuel",
      "Food waste composting programme — zero landfill commitment",
      "Local grain sourcing reduces supply-chain transport by 60%",
    ],
    investmentHighlights: [
      "Consistent same-store revenue growth of 15% YoY",
      "Franchise model proven across three cities",
      "Branded product line entering two supermarket chains",
    ],
  },
  {
    id: "ent-07",
    type: "enterprise",
    name: "Al-Madina Supermarket Group",
    sector: "Retail & Trade",
    classification: "Small",
    city: "Amman",
    description:
      "A five-branch supermarket group in West Amman offering everyday groceries with a focus on Jordanian produce and competitive pricing.",
    fundingGoal: "New Branch Financing",
    fundingRange: "JOD 120,000 – 280,000",
    fintwinScore: 78,
    financialHealthScore: 81,
    greenScore: 65,
    growthReadinessScore: 76,
    verified: true,
    yearsOperating: 12,
    lastUpdated: "2026-07",
    sustainabilityHighlights: [
      "LED lighting across all branches",
      "Supplier preference for local Jordanian producers",
      "Carrier-bag elimination in progress",
    ],
    investmentHighlights: [
      "Loyal customer base built over 12 years",
      "Proven site-selection methodology for new branches",
      "Private-label product line with 22% margin advantage",
    ],
  },
  {
    id: "ent-08",
    type: "enterprise",
    name: "Crafts of Wadi Rum",
    sector: "Crafts & Trades",
    classification: "Micro",
    city: "Aqaba",
    description:
      "A cooperative of Bedouin artisans producing hand-woven textiles, ceramics, and silver jewellery for domestic tourism and export markets.",
    fundingGoal: "Working Capital & Export Development",
    fundingRange: "JOD 25,000 – 60,000",
    fintwinScore: 76,
    financialHealthScore: 72,
    greenScore: 83,
    growthReadinessScore: 70,
    verified: true,
    yearsOperating: 14,
    lastUpdated: "2026-05",
    sustainabilityHighlights: [
      "All materials locally sourced — zero imported synthetic inputs",
      "Fair-trade certified cooperative structure",
      "Solar-powered workshop lighting",
    ],
    investmentHighlights: [
      "Products stocked in four international design boutiques",
      "UNESCO heritage-craft recognition pending",
      "E-commerce revenue up 45% since 2024",
    ],
  },
  {
    id: "ent-09",
    type: "enterprise",
    name: "Al-Rasheed Textile Workshop",
    sector: "Small Manufacturing",
    classification: "Small",
    city: "Zarqa",
    description:
      "A garment manufacturer supplying private-label clothing to Jordanian and Gulf-market retailers, specialising in sustainable cotton blends.",
    fundingGoal: "Equipment Upgrade Financing",
    fundingRange: "JOD 70,000 – 150,000",
    fintwinScore: 74,
    financialHealthScore: 75,
    greenScore: 70,
    growthReadinessScore: 74,
    verified: false,
    yearsOperating: 6,
    lastUpdated: "2026-04",
    sustainabilityHighlights: [
      "GOTS-certified fabric sourcing",
      "Water recycling system installed in dyeing line",
    ],
    investmentHighlights: [
      "Export orders growing — new Gulf distributor signed",
      "Machine upgrade will triple output capacity",
      "Existing client contracts provide 18-month revenue visibility",
    ],
  },
  {
    id: "ent-10",
    type: "enterprise",
    name: "Tayyibat Kitchen",
    sector: "Food & Hospitality",
    classification: "Micro",
    city: "Irbid",
    description:
      "A home-style catering company delivering authentic Jordanian meals to offices and events across Irbid governorate.",
    fundingGoal: "Commercial Kitchen Fit-Out",
    fundingRange: "JOD 20,000 – 45,000",
    fintwinScore: 68,
    financialHealthScore: 65,
    greenScore: 72,
    growthReadinessScore: 71,
    verified: false,
    yearsOperating: 3,
    lastUpdated: "2026-06",
    sustainabilityHighlights: [
      "Entirely plant-based menu options available",
      "Packaging is compostable — zero plastic",
    ],
    investmentHighlights: [
      "Corporate contract pipeline valued at JOD 45,000/year",
      "Strong social-media following — organic growth",
    ],
  },
  {
    id: "ent-11",
    type: "enterprise",
    name: "Hejaz Transport & Logistics",
    sector: "Services",
    classification: "Small",
    city: "Zarqa",
    description:
      "A last-mile freight and logistics company serving industrial zones in Zarqa and Amman with a fleet of light commercial vehicles.",
    fundingGoal: "Fleet Electrification",
    fundingRange: "JOD 90,000 – 200,000",
    fintwinScore: 65,
    financialHealthScore: 68,
    greenScore: 58,
    growthReadinessScore: 66,
    verified: false,
    yearsOperating: 4,
    lastUpdated: "2026-03",
    sustainabilityHighlights: [
      "Transitioning two diesel vans to EV this quarter",
      "Route optimisation software reducing fuel use by 12%",
    ],
    investmentHighlights: [
      "Contracted by three major industrial tenants",
      "EV transition will qualify company for CBJ green-lending products",
    ],
  },
  {
    id: "ent-12",
    type: "enterprise",
    name: "Jordan Ceramics & Tiles",
    sector: "Small Manufacturing",
    classification: "Small",
    city: "Salt",
    description:
      "A traditional ceramics manufacturer producing decorative tiles and tableware inspired by Jordanian geometric patterns for domestic and export sale.",
    fundingGoal: "Production Scale-Up",
    fundingRange: "JOD 55,000 – 120,000",
    fintwinScore: 63,
    financialHealthScore: 60,
    greenScore: 62,
    growthReadinessScore: 65,
    verified: false,
    yearsOperating: 10,
    lastUpdated: "2026-02",
    sustainabilityHighlights: [
      "Kiln fuel switched from diesel to LPG — lower emissions",
      "Clay sourced exclusively from Jordanian quarries",
    ],
    investmentHighlights: [
      "Export enquiries from European interior design firms",
      "Brand repositioning underway targeting premium market",
    ],
  },

  // ── Individual Entrepreneurs ─────────────────────────────────────────────────
  {
    id: "ind-01",
    type: "individual",
    name: "Layla Al-Mansour",
    sector: "Professional Services",
    classification: "Micro",
    city: "Amman",
    description:
      "An independent management consultant specialising in organisational transformation and digital strategy for Jordanian public-sector and NGO clients.",
    fundingGoal: "Practice Expansion",
    fundingRange: "JOD 15,000 – 40,000",
    fintwinScore: 83,
    financialHealthScore: 80,
    greenScore: 74,
    growthReadinessScore: 85,
    verified: true,
    yearsOperating: 7,
    lastUpdated: "2026-07",
    sustainabilityHighlights: [
      "Carbon-neutral consultancy — offsets all business travel",
      "Paperless workflows across all client engagements",
    ],
    investmentHighlights: [
      "Retained by two UN agencies for ongoing advisory work",
      "Published practitioner in Harvard Business Review Arabic",
      "Expanding into Bahrain market — client signed",
    ],
  },
  {
    id: "ind-02",
    type: "individual",
    name: "Khalid Bani Hani",
    sector: "Agriculture",
    classification: "Micro",
    city: "Karak",
    description:
      "A third-generation farmer pioneering precision agriculture techniques in the southern highlands, growing heritage wheat and olive varieties for export.",
    fundingGoal: "Irrigation Modernisation",
    fundingRange: "JOD 18,000 – 50,000",
    fintwinScore: 74,
    financialHealthScore: 70,
    greenScore: 86,
    growthReadinessScore: 72,
    verified: true,
    yearsOperating: 15,
    lastUpdated: "2026-06",
    sustainabilityHighlights: [
      "Drip irrigation reduces water use by 55% vs. traditional methods",
      "No synthetic fertilisers — biological pest management",
      "Soil carbon sequestration measured annually",
    ],
    investmentHighlights: [
      "Exclusive supply agreement with Jordanian olive oil exporter",
      "Heritage wheat variety gaining premium market attention",
      "FAO sustainable-agriculture demonstration site",
    ],
  },
  {
    id: "ind-03",
    type: "individual",
    name: "Nour Al-Dabbas",
    sector: "Crafts & Trades",
    classification: "Micro",
    city: "Jerash",
    description:
      "A jewellery designer and silversmith whose handcrafted collections blend Nabataean motifs with contemporary aesthetics, sold online and through gallery partnerships.",
    fundingGoal: "Studio Expansion & Export Development",
    fundingRange: "JOD 12,000 – 30,000",
    fintwinScore: 71,
    financialHealthScore: 68,
    greenScore: 80,
    growthReadinessScore: 76,
    verified: false,
    yearsOperating: 4,
    lastUpdated: "2026-05",
    sustainabilityHighlights: [
      "Recycled silver sourced from certified refiners",
      "Studio powered by rooftop solar",
      "Packaging made from recycled Jordanian newspaper",
    ],
    investmentHighlights: [
      "Featured in three international lifestyle magazines",
      "Online store revenue doubled year-on-year",
      "Gallery partnership with Dubai design district pending",
    ],
  },
  {
    id: "ind-04",
    type: "individual",
    name: "Tariq Shammout",
    sector: "Food & Hospitality",
    classification: "Micro",
    city: "Aqaba",
    description:
      "A chef and restaurateur running a waterfront seafood concept in Aqaba, combining sustainable-catch sourcing with traditional Gulf and Levantine recipes.",
    fundingGoal: "Venue Expansion",
    fundingRange: "JOD 35,000 – 80,000",
    fintwinScore: 70,
    financialHealthScore: 72,
    greenScore: 75,
    growthReadinessScore: 73,
    verified: true,
    yearsOperating: 5,
    lastUpdated: "2026-06",
    sustainabilityHighlights: [
      "Exclusively uses sustainably certified Red Sea seafood",
      "Food waste partnership with local urban composting cooperative",
      "Menu printed on seed paper",
    ],
    investmentHighlights: [
      "Ranked in Condé Nast Traveller Middle East top restaurants",
      "Hotel partnership bringing guaranteed covers three nights a week",
      "Catering contract for the Aqaba Special Economic Zone events",
    ],
  },
  {
    id: "ind-05",
    type: "individual",
    name: "Rima Al-Khatib",
    sector: "Retail & Trade",
    classification: "Micro",
    city: "Irbid",
    description:
      "A fashion entrepreneur curating ethical and locally made Jordanian clothing and accessories through a boutique store and a growing social-commerce channel.",
    fundingGoal: "Inventory & Brand Development",
    fundingRange: "JOD 10,000 – 25,000",
    fintwinScore: 67,
    financialHealthScore: 63,
    greenScore: 78,
    growthReadinessScore: 74,
    verified: false,
    yearsOperating: 3,
    lastUpdated: "2026-05",
    sustainabilityHighlights: [
      "100% of product range is locally made in Jordan",
      "Zero fast-fashion sourcing policy",
      "Packaging entirely reusable or compostable",
    ],
    investmentHighlights: [
      "Social-media community of 42,000 engaged followers",
      "Month-on-month revenue growth of 8% for 12 consecutive months",
      "Exclusive collaboration with three Jordanian designers signed",
    ],
  },
  {
    id: "ind-06",
    type: "individual",
    name: "Basem Obeidat",
    sector: "Small Manufacturing",
    classification: "Micro",
    city: "Zarqa",
    description:
      "A precision-engineering specialist producing custom metal components for the automotive aftermarket and light-industrial sectors in Jordan.",
    fundingGoal: "CNC Machine Acquisition",
    fundingRange: "JOD 22,000 – 55,000",
    fintwinScore: 65,
    financialHealthScore: 66,
    greenScore: 60,
    growthReadinessScore: 68,
    verified: false,
    yearsOperating: 6,
    lastUpdated: "2026-04",
    sustainabilityHighlights: [
      "Metal swarf and offcuts 100% recycled",
      "Coolant fluid recycled in closed loop",
    ],
    investmentHighlights: [
      "Sole local supplier for two automotive distributors",
      "New CNC machine will enable ISO-tolerance parts and open export",
    ],
  },
  {
    id: "ind-07",
    type: "individual",
    name: "Hana Al-Zoubi",
    sector: "Services",
    classification: "Micro",
    city: "Amman",
    description:
      "A UX/UI designer and digital-product strategist building mobile applications for Jordanian healthcare and education clients.",
    fundingGoal: "Team Expansion",
    fundingRange: "JOD 20,000 – 45,000",
    fintwinScore: 73,
    financialHealthScore: 69,
    greenScore: 71,
    growthReadinessScore: 80,
    verified: true,
    yearsOperating: 5,
    lastUpdated: "2026-07",
    sustainabilityHighlights: [
      "Remote-first studio — no daily commute emissions",
      "Three of five clients are healthcare or education social-impact organisations",
    ],
    investmentHighlights: [
      "App portfolio used by 120,000 active users",
      "Royal Medical Services pilot partnership in progress",
      "Grant from Jordan Startup programme awarded 2025",
    ],
  },
  {
    id: "ind-08",
    type: "individual",
    name: "Faris Al-Aqrabawi",
    sector: "Professional Services",
    classification: "Micro",
    city: "Madaba",
    description:
      "A heritage-tourism consultant and content creator developing immersive itineraries, documentaries, and digital guides for international travellers visiting Jordan.",
    fundingGoal: "Content Production & International Marketing",
    fundingRange: "JOD 14,000 – 35,000",
    fintwinScore: 60,
    financialHealthScore: 58,
    greenScore: 77,
    growthReadinessScore: 69,
    verified: false,
    yearsOperating: 4,
    lastUpdated: "2026-03",
    sustainabilityHighlights: [
      "All tour itineraries designed to support low-impact travel",
      "Royalties shared with Bedouin guide communities",
      "Carbon offset built into every packaged itinerary",
    ],
    investmentHighlights: [
      "Content reach of 500,000 monthly views across platforms",
      "Jordan Tourism Board partnership in talks",
      "Documentary shortlisted for regional broadcast deal",
    ],
  },
];

// Inject computed ranking into every profile
export const MOCK_PROFILES: InvestorProfile[] = RAW.map((p) => ({
  ...p,
  ranking: Math.round(computeRanking(p) * 10) / 10,
})).sort((a, b) => b.ranking - a.ranking);

export const TOP_10 = MOCK_PROFILES.slice(0, 10);

export const ALL_SECTORS: SectorKey[] = [
  "Retail & Trade",
  "Food & Hospitality",
  "Small Manufacturing",
  "Services",
  "Professional Services",
  "Agriculture",
  "Crafts & Trades",
  "Other",
];

export const ALL_CITIES = [...new Set(MOCK_PROFILES.map((p) => p.city))].sort();
export const ALL_CLASSIFICATIONS: ClassificationKey[] = ["Micro", "Small", "Medium"];
