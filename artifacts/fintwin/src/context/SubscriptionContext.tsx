import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';

export type PlanTier = 'micro' | 'small' | 'medium';
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'none';

export interface BillingRecord {
  month: string;
  status: 'paid' | 'pending' | 'failed';
  amountJOD: number;
}

export interface SubscriptionState {
  status: SubscriptionStatus;
  startDate: string | null;
  renewalDate: string | null;
  billingCycle: 'monthly' | 'annual';
  billingHistory: BillingRecord[];
  paymentMethod: string | null;
}

interface SubscriptionContextType {
  plan: PlanTier;
  hasPremium: boolean;
  monthlyPrice: number;
  subscription: SubscriptionState;
  upgradeOpen: boolean;
  setUpgradeOpen: (open: boolean) => void;
  // Backend stubs — wire up when API is ready
  getCurrentSubscription: () => Promise<SubscriptionState>;
  getBillingHistory: () => Promise<BillingRecord[]>;
  upgradeSubscription: () => Promise<void>;
  revokeConsent: () => Promise<void>;
  getConsentStatus: () => Promise<{ consentGiven: boolean; grantedDate: string | null }>;
}

const MOCK_BILLING_HISTORY: BillingRecord[] = [
  { month: 'July 2026', status: 'paid', amountJOD: 100 },
  { month: 'June 2026', status: 'paid', amountJOD: 100 },
];

const ACTIVE_SUBSCRIPTION: SubscriptionState = {
  status: 'active',
  startDate: '2026-06-01',
  renewalDate: '2026-08-01',
  billingCycle: 'monthly',
  billingHistory: MOCK_BILLING_HISTORY,
  paymentMethod: 'Visa •••• 4242',
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { state } = useOnboarding();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionState>({
    status: 'none',
    startDate: null,
    renewalDate: null,
    billingCycle: 'monthly',
    billingHistory: [],
    paymentMethod: null,
  });

  const plan: PlanTier =
    state.category === 'Medium Enterprise' ? 'medium' :
    state.category === 'Small Enterprise'  ? 'small'  :
    'micro';

  const hasPremium =
    plan === 'micro' ||
    subscription.status === 'active' ||
    subscription.status === 'trial';

  const monthlyPrice = plan === 'micro' ? 0 : 100;

  const getCurrentSubscription = useCallback(async () => subscription, [subscription]);
  const getBillingHistory = useCallback(async () => subscription.billingHistory, [subscription.billingHistory]);

  const upgradeSubscription = useCallback(async () => {
    // Placeholder — replace with real payment gateway call
    setSubscription(ACTIVE_SUBSCRIPTION);
    setUpgradeOpen(false);
  }, []);

  const revokeConsent = useCallback(async () => {
    // Placeholder — frontend state only until backend is ready
  }, []);

  const getConsentStatus = useCallback(async () => ({
    consentGiven: state.consentGiven,
    grantedDate:
      state.connectedSources.cliq || state.connectedSources.jofotara
        ? '2026-06-01'
        : null,
  }), [state.consentGiven, state.connectedSources]);

  return (
    <SubscriptionContext.Provider value={{
      plan, hasPremium, monthlyPrice, subscription,
      upgradeOpen, setUpgradeOpen,
      getCurrentSubscription, getBillingHistory, upgradeSubscription,
      revokeConsent, getConsentStatus,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
