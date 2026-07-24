import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ManualInputs } from '@/lib/prescreeningEngine';
import { emptyManualInputs } from '@/lib/prescreeningEngine';
import type { LoanApplication, LoanProduct, LoanQuote, ScoringSummary } from '@/lib/api';

export interface UploadedDoc {
  fileName: string;
  objectPath: string;
}

export type TwinMetrics = {
  displayName?: string;
  monthlyDebt?: number;
  monthlyRevenue?: number;
  cashBalance?: number;
  debtItems?: { label: string; amount: number }[];
  registrationNumber?: string;
  openBankingConnected?: boolean;
  accountsLinked?: number;
  avgMonthlyInflow?: number;
  avgMonthlyOutflow?: number;
  bankName?: string;
  ibanMasked?: string;
};

interface PrescreeningContextType {
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  currentStep: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  manualInputs: ManualInputs;
  setManualInput: <K extends keyof ManualInputs>(key: K, value: ManualInputs[K]) => void;
  replaceManualInputs: (inputs: ManualInputs) => void;
  submitted: boolean;
  setSubmitted: (v: boolean) => void;
  referenceNumber: string;
  setReferenceNumber: (v: string) => void;
  uploadedDocs: Record<string, UploadedDoc>;
  setUploadedDoc: (label: string, doc: UploadedDoc) => void;
  scoring: ScoringSummary | null;
  setScoring: (s: ScoringSummary | null) => void;
  products: LoanProduct[];
  setProducts: (p: LoanProduct[]) => void;
  submittedApplication: LoanApplication | null;
  setSubmittedApplication: (a: LoanApplication | null) => void;
  twinMetrics: TwinMetrics;
  setTwinMetrics: (m: TwinMetrics) => void;
  liveQuote: LoanQuote | null;
  setLiveQuote: (q: LoanQuote | null) => void;
  quoteAmount: number;
  setQuoteAmount: (n: number) => void;
  reset: () => void;
}

const PrescreeningContext = createContext<PrescreeningContextType | undefined>(undefined);

function generateRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `FT-2026-07-${s}`;
}

export function PrescreeningProvider({ children }: { children: ReactNode }) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [manualInputs, setManualInputs] = useState<ManualInputs>(emptyManualInputs());
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState(generateRef);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc>>({});
  const [scoring, setScoring] = useState<ScoringSummary | null>(null);
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [submittedApplication, setSubmittedApplication] = useState<LoanApplication | null>(null);
  const [twinMetrics, setTwinMetrics] = useState<TwinMetrics>({});
  const [liveQuote, setLiveQuote] = useState<LoanQuote | null>(null);
  const [quoteAmount, setQuoteAmount] = useState(10000);

  const setManualInput = <K extends keyof ManualInputs>(key: K, value: ManualInputs[K]) => {
    setManualInputs(prev => ({ ...prev, [key]: value }));
  };

  const setUploadedDoc = (label: string, doc: UploadedDoc) => {
    setUploadedDocs(prev => ({ ...prev, [label]: doc }));
  };

  const goToStep = (step: number) => setCurrentStep(Math.max(1, Math.min(4, step)));
  const nextStep = () => goToStep(currentStep + 1);
  const prevStep = () => goToStep(currentStep - 1);

  const reset = () => {
    setSelectedProductId(null);
    setCurrentStep(1);
    setManualInputs(emptyManualInputs());
    setSubmitted(false);
    setReferenceNumber(generateRef());
    setUploadedDocs({});
    setSubmittedApplication(null);
    setLiveQuote(null);
    setQuoteAmount(10000);
  };

  return (
    <PrescreeningContext.Provider value={{
      selectedProductId, setSelectedProductId,
      currentStep, goToStep, nextStep, prevStep,
      manualInputs, setManualInput,
      replaceManualInputs: setManualInputs,
      submitted, setSubmitted,
      referenceNumber, setReferenceNumber,
      uploadedDocs, setUploadedDoc,
      scoring, setScoring,
      products, setProducts,
      submittedApplication, setSubmittedApplication,
      twinMetrics, setTwinMetrics,
      liveQuote, setLiveQuote,
      quoteAmount, setQuoteAmount,
      reset,
    }}>
      {children}
    </PrescreeningContext.Provider>
  );
}

export function usePrescreening() {
  const ctx = useContext(PrescreeningContext);
  if (!ctx) throw new Error('usePrescreening must be used within PrescreeningProvider');
  return ctx;
}
