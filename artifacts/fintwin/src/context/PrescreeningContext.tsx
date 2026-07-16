import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ManualInputs } from '@/lib/prescreeningEngine';
import { emptyManualInputs } from '@/lib/prescreeningEngine';

interface PrescreeningContextType {
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  currentStep: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  manualInputs: ManualInputs;
  setManualInput: <K extends keyof ManualInputs>(key: K, value: ManualInputs[K]) => void;
  submitted: boolean;
  setSubmitted: (v: boolean) => void;
  referenceNumber: string;
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

  const setManualInput = <K extends keyof ManualInputs>(key: K, value: ManualInputs[K]) => {
    setManualInputs(prev => ({ ...prev, [key]: value }));
  };

  const goToStep = (step: number) => setCurrentStep(Math.max(1, Math.min(4, step)));
  const nextStep = () => goToStep(currentStep + 1);
  const prevStep = () => goToStep(currentStep - 1);

  const reset = () => {
    setSelectedProductId(null);
    setCurrentStep(1);
    setManualInputs(emptyManualInputs());
    setSubmitted(false);
    setReferenceNumber(generateRef()); // fresh ref for each new prescreening session
  };

  return (
    <PrescreeningContext.Provider value={{
      selectedProductId, setSelectedProductId,
      currentStep, goToStep, nextStep, prevStep,
      manualInputs, setManualInput,
      submitted, setSubmitted,
      referenceNumber,
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
