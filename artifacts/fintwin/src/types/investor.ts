export type ProfileType = "enterprise" | "individual";
export type RiskLevel = "Low" | "Moderate" | "High";
export type FundingCurrency = "JOD";
export type ConnectionType =
  | "Investment discussion"
  | "Partnership"
  | "Mentorship"
  | "Financing opportunity"
  | "General introduction";

export interface InvestorProfile {
  id: string;
  profileType: ProfileType;
  displayName: string;
  sector: string;
  city: string;
  description: string;
  fintwinScore: number;
  financialHealthScore: number;
  greenScore: number;
  growthReadinessScore: number;
  riskLevel: RiskLevel;
  fundingNeedMin: number;
  fundingNeedMax: number;
  fundingCurrency: FundingCurrency;
  fundingPurpose: string;
  sustainabilityStrengths: string[];
  investmentHighlights: string[];
  yearsOperating?: number;
  monthlyRevenueRange?: string;
  verified: boolean;
  investorDiscoveryEnabled: boolean;
  lastUpdated: string;
}

export interface RankedProfile extends InvestorProfile {
  rankingScore: number;
  rank: number;
}

export interface InterestRequest {
  profileId: string;
  profileName: string;
  investorName: string;
  investorOrganization: string;
  investorEmail: string;
  message?: string;
  connectionType: ConnectionType;
  submittedAt: string;
}

export interface FilterState {
  search: string;
  sector: string;
  city: string;
  riskLevel: string;
  minFintwinScore: number;
  minGreenScore: number;
  verifiedOnly: boolean;
  minFunding: number;
  maxFunding: number;
  sortBy: SortOption;
}

export type SortOption =
  | "ranking"
  | "fintwinScore"
  | "greenScore"
  | "financialHealthScore"
  | "growthReadinessScore"
  | "riskLow"
  | "fundingLow"
  | "fundingHigh";
