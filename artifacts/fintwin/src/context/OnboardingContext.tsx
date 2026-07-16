import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  businessName: string;
  businessSector: BusinessSector | '';
  registrationNumber: string;
  hasRegistrationNumber: boolean;
  
  employees: string;
  yearsInOperation: string;
  annualRevenue: string;
  category: EnterpriseCategory | null;

  connectedSources: {
    jofotara: boolean;
    cliq: boolean;
    pos: boolean;
    receipts: boolean;
  };
}

interface OnboardingContextType {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  resetState: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const initialState: OnboardingState = {
  businessName: '',
  businessSector: '',
  registrationNumber: '',
  hasRegistrationNumber: true,
  employees: '',
  yearsInOperation: '',
  annualRevenue: '',
  category: null,
  connectedSources: {
    jofotara: false,
    cliq: false,
    pos: false,
    receipts: false,
  }
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(initialState);
  const [currentStep, setCurrentStep] = useState(1);

  const updateState = (updates: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const resetState = () => {
    setState(initialState);
    setCurrentStep(1);
  };

  return (
    <OnboardingContext.Provider value={{ state, updateState, resetState, currentStep, setCurrentStep }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
