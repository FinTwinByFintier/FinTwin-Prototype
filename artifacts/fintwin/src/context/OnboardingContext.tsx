import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Commitment } from '@/lib/simulationEngine';
import { getToken, saveOnboardingStep, setToken } from '@/lib/api';

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

  // Data Sources
  connectedSources: {
    jofotara: boolean;
    cliq: boolean;
    pos: boolean;
    receipts: boolean;
  };

  commitments: Commitment[];
}

interface OnboardingContextType {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  resetState: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resumeAtStep: (step: number) => void;
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
  commitments: defaultCommitments,
};

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
