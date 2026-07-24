import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useOnboarding } from './OnboardingContext';

export type PlanTier = 'micro' | 'small' | 'medium';

export interface SubscriptionState {
  status: 'active' | 'inactive' | 'trial' | 'expired';
  startDate: string | null;
  renewalDate: string | null;
  paymentMethod: string | null;
}

export interface BillingRecord {
  id: string;
  period: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
}

interface SubscriptionContextType {
  plan: PlanTier;
  subscription: SubscriptionState;
  hasPremium: boolean;
  billingHistory: BillingRecord[];
  upgradeSubscription: () => Promise<void>;
  revokeConsent: () => Promise<void>;
  getConsentStatus: () => Promise<{ granted: boolean; date: string | null }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

const MOCK_BILLING: BillingRecord[] = [
  { id: 'b2', period: 'July 2026',  date: '2026-07-01', amount: 100, currency: 'JOD', status: 'paid' },
  { id: 'b1', period: 'June 2026',  date: '2026-06-01', amount: 100, currency: 'JOD', status: 'paid' },
];

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { state, updateState } = useOnboarding();

  const plan: PlanTier =
    state.category === 'Small Enterprise'  ? 'small'  :
    state.category === 'Medium Enterprise' ? 'medium' : 'micro';

  const [subscription, setSubscription] = useState<SubscriptionState>({
    status: 'inactive',
    startDate: null,
    renewalDate: null,
    paymentMethod: null,
  });

  // Micro always has full access; Small/Medium need an active subscription
  const hasPremium = plan === 'micro' || subscription.status === 'active';

  const upgradeSubscription = async () => {
    // TODO: wire to backend POST /api/v1/subscriptions/upgrade
    const today = new Date();
    const renewal = new Date(today);
    renewal.setMonth(renewal.getMonth() + 1);
    setSubscription({
      status: 'active',
      startDate: today.toISOString().slice(0, 10),
      renewalDate: renewal.toISOString().slice(0, 10),
      paymentMethod: 'Card ending in 4242',
    });
  };

  const revokeConsent = async () => {
    // TODO: wire to backend POST /api/v1/consent/revoke
    updateState({
      consentGiven: false,
      connectedSources: { jofotara: false, cliq: false, pos: false, receipts: false },
    });
  };

  const getConsentStatus = async () => {
    // TODO: wire to backend GET /api/v1/consent/status
    return { granted: state.consentGiven, date: '2026-06-15' };
  };

  return (
    <SubscriptionContext.Provider value={{
      plan, subscription, hasPremium,
      billingHistory: subscription.status === 'active' ? MOCK_BILLING : [],
      upgradeSubscription, revokeConsent, getConsentStatus,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used inside SubscriptionProvider');
  return ctx;
}
