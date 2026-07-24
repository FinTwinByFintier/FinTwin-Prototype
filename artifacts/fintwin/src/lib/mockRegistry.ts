import type { BusinessSector, BusinessType } from "@/context/OnboardingContext";

export type MockRegistryBusiness = {
  businessName: string;
  businessType: BusinessType;
  sector: BusinessSector;
  legalEntity: string;
};

/** Larger Jordan MSME pool for registration-ID demo lookup. */
export const MOCK_REGISTRY_BUSINESSES: MockRegistryBusiness[] = [
  { businessName: "Al Noor Trading Co.", businessType: "LLC", sector: "Retail & Trade", legalEntity: "Limited Liability Company" },
  { businessName: "Jordan Fresh Foods LLC", businessType: "LLC", sector: "Food & Hospitality", legalEntity: "Limited Liability Company" },
  { businessName: "Al Baraka Services", businessType: "Sole Proprietorship", sector: "Services", legalEntity: "Sole Proprietorship" },
  { businessName: "Amman Craft Studio", businessType: "Partnership", sector: "Crafts & Trades", legalEntity: "Partnership" },
  { businessName: "Green Valley Enterprise", businessType: "LLC", sector: "Agriculture", legalEntity: "Limited Liability Company" },
  { businessName: "Petra Supplies LLC", businessType: "LLC", sector: "Retail & Trade", legalEntity: "Limited Liability Company" },
  { businessName: "Zarqa Industrial Complex LLC", businessType: "LLC", sector: "Small Manufacturing", legalEntity: "Limited Liability Company" },
  { businessName: "Al-Karak Agriculture Co. LLC", businessType: "LLC", sector: "Agriculture", legalEntity: "Limited Liability Company" },
  { businessName: "Irbid Medical Equipment LLC", businessType: "LLC", sector: "Professional Services", legalEntity: "Limited Liability Company" },
  { businessName: "Aqaba Port Logistics", businessType: "LLC", sector: "Services", legalEntity: "Limited Liability Company" },
  { businessName: "Madaba Olive Press", businessType: "Sole Proprietorship", sector: "Food & Hospitality", legalEntity: "Sole Proprietorship" },
  { businessName: "Salt Heritage Texticrafts", businessType: "Partnership", sector: "Crafts & Trades", legalEntity: "Partnership" },
  { businessName: "Dead Sea Cosmetics Lab", businessType: "LLC", sector: "Small Manufacturing", legalEntity: "Limited Liability Company" },
  { businessName: "Jerash Guest House", businessType: "Sole Proprietorship", sector: "Food & Hospitality", legalEntity: "Sole Proprietorship" },
  { businessName: "Balqa Dairy Collective", businessType: "Partnership", sector: "Agriculture", legalEntity: "Partnership" },
  { businessName: "Abdali Digital Agency", businessType: "LLC", sector: "Professional Services", legalEntity: "Limited Liability Company" },
  { businessName: "Rainbow Street Café Co.", businessType: "LLC", sector: "Food & Hospitality", legalEntity: "Limited Liability Company" },
  { businessName: "Marka Auto Parts Trading", businessType: "Sole Proprietorship", sector: "Retail & Trade", legalEntity: "Sole Proprietorship" },
  { businessName: "Sweifieh Boutique Atelier", businessType: "Sole Proprietorship", sector: "Crafts & Trades", legalEntity: "Sole Proprietorship" },
  { businessName: "Sahab Packaging Industries", businessType: "LLC", sector: "Small Manufacturing", legalEntity: "Limited Liability Company" },
  { businessName: "Mafraq Feed & Grain", businessType: "LLC", sector: "Agriculture", legalEntity: "Limited Liability Company" },
  { businessName: "Tafila Solar Services", businessType: "LLC", sector: "Services", legalEntity: "Limited Liability Company" },
  { businessName: "Ajloun Forest Honey", businessType: "Sole Proprietorship", sector: "Food & Hospitality", legalEntity: "Sole Proprietorship" },
  { businessName: "Hussein Accounting Bureau", businessType: "Partnership", sector: "Professional Services", legalEntity: "Partnership" },
  { businessName: "Wadi Musa Tour Guides", businessType: "Partnership", sector: "Services", legalEntity: "Partnership" },
  { businessName: "Ruseifa Metal Works", businessType: "LLC", sector: "Small Manufacturing", legalEntity: "Limited Liability Company" },
  { businessName: "Jabal Amman Bookshop", businessType: "Sole Proprietorship", sector: "Retail & Trade", legalEntity: "Sole Proprietorship" },
  { businessName: "Khalda Pharma Distributors", businessType: "LLC", sector: "Retail & Trade", legalEntity: "Limited Liability Company" },
  { businessName: "Shmeisani Dental Clinic", businessType: "Partnership", sector: "Professional Services", legalEntity: "Partnership" },
  { businessName: "Marj Al-Hamam Bakery", businessType: "Sole Proprietorship", sector: "Food & Hospitality", legalEntity: "Sole Proprietorship" },
  { businessName: "Queen Alia Cargo Handlers", businessType: "LLC", sector: "Services", legalEntity: "Limited Liability Company" },
  { businessName: "Fuheis Pottery Workshop", businessType: "Sole Proprietorship", sector: "Crafts & Trades", legalEntity: "Sole Proprietorship" },
  { businessName: "Northern Highlands Orchards", businessType: "LLC", sector: "Agriculture", legalEntity: "Limited Liability Company" },
  { businessName: "East Amman Furniture Co.", businessType: "LLC", sector: "Small Manufacturing", legalEntity: "Limited Liability Company" },
  { businessName: "University Street Tutoring", businessType: "Partnership", sector: "Professional Services", legalEntity: "Partnership" },
  { businessName: "7th Circle Electronics", businessType: "LLC", sector: "Retail & Trade", legalEntity: "Limited Liability Company" },
  { businessName: "Bayader Catering Kitchen", businessType: "LLC", sector: "Food & Hospitality", legalEntity: "Limited Liability Company" },
  { businessName: "Ghor Al-Safi Dates Co.", businessType: "Sole Proprietorship", sector: "Agriculture", legalEntity: "Sole Proprietorship" },
  { businessName: "Zarqa Textile Finishing", businessType: "LLC", sector: "Small Manufacturing", legalEntity: "Limited Liability Company" },
  { businessName: "Tabarbour Cleaning Services", businessType: "Sole Proprietorship", sector: "Services", legalEntity: "Sole Proprietorship" },
  { businessName: "Dahiyat Al-Rasheed Pharmacy", businessType: "LLC", sector: "Retail & Trade", legalEntity: "Limited Liability Company" },
  { businessName: "Um Uthaina Design Studio", businessType: "Partnership", sector: "Professional Services", legalEntity: "Partnership" },
  { businessName: "Na'ur Greenhouse Farms", businessType: "LLC", sector: "Agriculture", legalEntity: "Limited Liability Company" },
  { businessName: "City Mall Kiosk Ventures", businessType: "Sole Proprietorship", sector: "Retail & Trade", legalEntity: "Sole Proprietorship" },
  { businessName: "Jubeiha Sports Gear", businessType: "LLC", sector: "Retail & Trade", legalEntity: "Limited Liability Company" },
  { businessName: "Wadi Seer Carpentry", businessType: "Sole Proprietorship", sector: "Crafts & Trades", legalEntity: "Sole Proprietorship" },
  { businessName: "Karak Castle Café", businessType: "Sole Proprietorship", sector: "Food & Hospitality", legalEntity: "Sole Proprietorship" },
  { businessName: "Irbid Tech Repair Hub", businessType: "Partnership", sector: "Services", legalEntity: "Partnership" },
  { businessName: "Amman Cold Storage Co.", businessType: "LLC", sector: "Services", legalEntity: "Limited Liability Company" },
  { businessName: "Jordanian Spice House", businessType: "LLC", sector: "Food & Hospitality", legalEntity: "Limited Liability Company" },
];

export type MockRegistryLookupResult = MockRegistryBusiness & {
  registrationDate: string; // YYYY-MM-DD
};

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

/** Pick a random MSME from the pool (demo registry). */
export function mockRegistryLookup(_regNumber?: string): MockRegistryLookupResult {
  const picked = randomItem(MOCK_REGISTRY_BUSINESSES);
  const year = 2014 + Math.floor(Math.random() * 11); // 2014–2024
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, "0");
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, "0");
  return {
    ...picked,
    registrationDate: `${year}-${month}-${day}`,
  };
}

export function formatRegistryDisplayDate(isoDate: string): string {
  const [y, m] = isoDate.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mi = Math.max(0, Math.min(11, (parseInt(m || "1", 10) || 1) - 1));
  return `${months[mi]} ${y}`;
}
