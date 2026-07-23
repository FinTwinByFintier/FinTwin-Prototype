import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Commitment } from '@/lib/simulationEngine';
import {
  BusinessProfile,
  getToken,
  saveBusinessProfile,
  saveOnboardingStep,
  setToken,
  type BusinessProfilePayload,
} from '@/lib/api';

export type { Commitment };

export type BusinessType = 'LLC' | 'Sole Proprietorship' | 'Partnership' | 'Other';

export type BusinessSector =
  | 'Retail & Trade'
  | 'Food & Hospitality'
  | 'Small Manufacturing'
  | 'Services'
  | 'Professional Services'
  | 'Agriculture'
  | 'Crafts & Trades'
  | 'Other';

export type EnterpriseCategory = 'Micro Enterprise' | 'Small Enterprise' | 'Medium Enterprise';

export interface OnboardingState {
  // Auth
  authMethod: 'sanad' | 'email' | null;
  nationalId: string;

  // Business Identity
  businessType: BusinessType | '';
  isOfficiallyRegistered: boolean | null;
  registrationNumber: string;

  // Auto-filled after verification (or manually entered for unregistered)
  businessName: string;
  businessSector: BusinessSector | '';
  verifiedLegalEntity: string;
  verifiedRegistrationDate: string; // "YYYY-MM-DD" for registered, empty for unregistered

  // Size & Scale
  employees: string;
  yearsInOperation: string;  // auto-calculated for registered businesses
  annualRevenue: string;
  category: EnterpriseCategory | null;

  // Banking
  iban: string;

  // Contact
  contactPhone: string;

  // Consent
  consentGiven: boolean;

  // Data Sources (receipts ignored — not persisted)
  connectedSources: {
    jofotara: boolean;
    cliq: boolean;
    pos: boolean;
    receipts: boolean;
  };
  lastSynced: {
    jofotara: string | null;
    cliq: string | null;
    pos: string | null;
    receipts: string | null;
  };
  posProvider: string;

  commitments: Commitment[];
}

interface OnboardingContextType {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  resetState: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resumeAtStep: (step: number) => void;
  hydrateFromProfile: (profile?: BusinessProfile | null) => void;
  persistProfile: (payload: BusinessProfilePayload) => Promise<void>;
  isAuthenticated: boolean;
  addCommitment: (c: Omit<Commitment, 'id'>) => void;
  removeCommitment: (id: string) => void;
}

const defaultCommitments: Commitment[] = [
  { id: 'c1', category: 'rent',         label: 'Office / Shop Rent',          amountJOD: 800  },
  { id: 'c2', category: 'payroll',      label: 'Staff Salaries (4 employees)', amountJOD: 1600 },
  { id: 'c3', category: 'utilities',    label: 'Electricity & Water',          amountJOD: 300  },
  { id: 'c4', category: 'subscription', label: 'POS System & Software',        amountJOD: 100  },
  { id: 'c5', category: 'insurance',    label: 'Business Insurance',           amountJOD: 100  },
];

const initialState: OnboardingState = {
  authMethod: null,
  nationalId: '',
  businessType: '',
  isOfficiallyRegistered: null,
  registrationNumber: '',
  businessName: '',
  businessSector: '',
  verifiedLegalEntity: '',
  verifiedRegistrationDate: '',
  employees: '',
  yearsInOperation: '',
  annualRevenue: '',
  category: null,
  iban: '',
  contactPhone: '',
  consentGiven: false,
  connectedSources: { jofotara: false, cliq: false, pos: false, receipts: false },
  lastSynced: { jofotara: null, cliq: null, pos: null, receipts: null },
  posProvider: '',
  commitments: defaultCommitments,
};

function profileToState(profile: BusinessProfile): Partial<OnboardingState> {
  return {
    isOfficiallyRegistered:
      profile.is_officially_registered === undefined
        ? null
        : profile.is_officially_registered,
    registrationNumber: profile.registration_number || '',
    businessName: profile.business_name || '',
    businessType: (profile.business_type as BusinessType) || '',
    businessSector: (profile.business_sector as BusinessSector) || '',
    verifiedLegalEntity: profile.verified_legal_entity || '',
    verifiedRegistrationDate: profile.verified_registration_date || '',
    employees: profile.employees != null && profile.employees !== '' ? String(profile.employees) : '',
    yearsInOperation:
      profile.years_in_operation != null && profile.years_in_operation !== ''
        ? String(profile.years_in_operation)
        : '',
    annualRevenue:
      profile.annual_revenue_jod != null && profile.annual_revenue_jod !== ''
        ? String(profile.annual_revenue_jod).replace(/\.00$/, '')
        : '',
    category: (profile.category as EnterpriseCategory) || null,
    iban: profile.iban || '',
    contactPhone: profile.contact_phone || '',
    consentGiven: !!profile.consent_given,
    connectedSources: {
      jofotara: !!profile.connected_jofotara,
      cliq: !!profile.connected_cliq,
      pos: !!profile.connected_pos,
      receipts: !!profile.connected_receipts,
    },
    lastSynced: {
      jofotara: profile.last_synced_jofotara || null,
      cliq: profile.last_synced_cliq || null,
      pos: profile.last_synced_pos || null,
      receipts: profile.last_synced_receipts || null,
    },
    posProvider: profile.pos_provider || '',
  };
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(initialState);
  const [currentStep, setCurrentStepState] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getToken());

  const updateState = (updates: Partial<OnboardingState>) =>
    setState(prev => ({ ...prev, ...updates }));

  const resetState = () => {
    setState(initialState);
    setCurrentStepState(1);
    setToken(null);
    setIsAuthenticated(false);
  };

  const hydrateFromProfile = useCallback((profile?: BusinessProfile | null) => {
    if (!profile) return;
    setState(prev => ({ ...prev, ...profileToState(profile) }));
  }, []);

  const persistProfile = useCallback(async (payload: BusinessProfilePayload) => {
    if (!getToken()) return;
    try {
      const res = await saveBusinessProfile(payload);
      if (res?.profile) {
        setState((prev) => ({ ...prev, ...profileToState(res.profile) }));
      }
    } catch {
      /* keep UI moving during demo if network blips */
    }
  }, []);

  const resumeAtStep = useCallback((step: number) => {
    setCurrentStepState(step);
    setIsAuthenticated(!!getToken());
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepState(step);
    setIsAuthenticated(!!getToken());
    if (getToken() && step >= 1) {
      void saveOnboardingStep(step).catch(() => {
        /* keep UI moving even if network blips during demo */
      });
    }
  }, []);

  const addCommitment = (c: Omit<Commitment, 'id'>) => {
    const id = `c-${Date.now()}`;
    setState(prev => ({ ...prev, commitments: [...prev.commitments, { ...c, id }] }));
  };

  const removeCommitment = (id: string) =>
    setState(prev => ({ ...prev, commitments: prev.commitments.filter(c => c.id !== id) }));

  return (
    <OnboardingContext.Provider
      value={{
        state,
        updateState,
        resetState,
        currentStep,
        setCurrentStep,
        resumeAtStep,
        hydrateFromProfile,
        persistProfile,
        isAuthenticated,
        addCommitment,
        removeCommitment,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within an OnboardingProvider');
  return ctx;
}
