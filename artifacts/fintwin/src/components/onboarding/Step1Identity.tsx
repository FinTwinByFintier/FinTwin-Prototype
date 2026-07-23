import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding, BusinessType, BusinessSector } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Loader2, Pencil } from "lucide-react";
import { mockRegistryLookup, type MockRegistryLookupResult } from "@/lib/mockRegistry";

const BUSINESS_TYPES: BusinessType[] = ['LLC', 'Sole Proprietorship', 'Partnership', 'Other'];

const SECTORS: BusinessSector[] = [
  'Retail & Trade', 'Food & Hospitality', 'Small Manufacturing',
  'Services', 'Professional Services', 'Agriculture', 'Crafts & Trades', 'Other',
];

type RegistryResult = MockRegistryLookupResult;

function calcYears(dateStr: string): number {
  const year = parseInt(dateStr.slice(0, 4));
  return new Date().getFullYear() - year;
}

// ── Component ─────────────────────────────────────────────────────────────────
type Phase = 'question' | 'registered-input' | 'registered-lookup' | 'registered-confirm' | 'unregistered-form';

export function Step1Identity() {
  const { state, updateState, setCurrentStep, persistProfile } = useOnboarding();

  const [phase, setPhase] = useState<Phase>('question');
  const [regNumber, setRegNumber] = useState(state.registrationNumber || '');
  const [regError, setRegError] = useState('');

  // Lookup result (editable after auto-fill)
  const [lookedUp, setLookedUp] = useState<RegistryResult | null>(null);
  const [editName, setEditName]       = useState('');
  const [editType, setEditType]       = useState<BusinessType | ''>('');
  const [editSector, setEditSector]   = useState<BusinessSector | ''>('');

  // Unregistered manual form
  const [manualName, setManualName]       = useState(state.businessName || '');
  const [manualType, setManualType]       = useState<BusinessType | ''>(state.businessType || '');
  const [manualSector, setManualSector]   = useState<BusinessSector | ''>(state.businessSector || '');
  const [manualYears, setManualYears]     = useState(state.yearsInOperation || '');
  const [manualErrors, setManualErrors]   = useState<Record<string, string>>({});

  // ── Registered path ────────────────────────────────────────────────────────
  const handleLookup = () => {
    if (!regNumber.trim()) { setRegError('Please enter your registration number'); return; }
    setRegError('');
    setPhase('registered-lookup');

    setTimeout(() => {
      const result = mockRegistryLookup(regNumber.trim());
      setLookedUp(result);
      setEditName(result.businessName);
      setEditType(result.businessType);
      setEditSector(result.sector);

      // Pre-populate context with auto-filled data
      updateState({
        registrationNumber: regNumber.trim(),
        businessName: result.businessName,
        businessType: result.businessType,
        businessSector: result.sector,
        verifiedRegistrationDate: result.registrationDate,
        yearsInOperation: String(calcYears(result.registrationDate)),
        isOfficiallyRegistered: true,
      });

      setPhase('registered-confirm');
    }, 2500);
  };

  const handleRegisteredContinue = () => {
    // Save any edits the user made
    const payload = {
      is_officially_registered: true as const,
      registration_number: regNumber.trim() || state.registrationNumber,
      business_name: editName,
      business_type: editType as BusinessType,
      business_sector: editSector as BusinessSector,
      verified_registration_date: lookedUp?.registrationDate || state.verifiedRegistrationDate,
      years_in_operation: lookedUp
        ? String(calcYears(lookedUp.registrationDate))
        : state.yearsInOperation,
    };
    updateState({
      businessName: editName,
      businessType: editType as BusinessType,
      businessSector: editSector as BusinessSector,
    });
    void persistProfile(payload);
    setCurrentStep(4); // Skip verification step — already done inline
  };

  // ── Unregistered path ──────────────────────────────────────────────────────
  const handleUnregisteredContinue = () => {
    const errs: Record<string, string> = {};
    if (!manualName.trim())   errs.name   = 'Business name is required';
    if (!manualType)          errs.type   = 'Please select a business type';
    if (!manualSector)        errs.sector = 'Please select a sector';
    if (!manualYears.trim())  errs.years  = 'Years in operation is required';
    if (Object.keys(errs).length) { setManualErrors(errs); return; }

    const payload = {
      is_officially_registered: false as const,
      business_name: manualName,
      business_type: manualType as BusinessType,
      business_sector: manualSector as BusinessSector,
      years_in_operation: manualYears,
      registration_number: '',
      verified_registration_date: '',
      verified_legal_entity: '',
    };
    updateState({
      isOfficiallyRegistered: false,
      businessName: manualName,
      businessType: manualType as BusinessType,
      businessSector: manualSector as BusinessSector,
      yearsInOperation: manualYears,
      registrationNumber: '',
      verifiedRegistrationDate: '',
    });
    void persistProfile(payload);
    setCurrentStep(4); // Skip verification step
  };

  const clearManual = (key: string) => setManualErrors(p => { const n = { ...p }; delete n[key]; return n; });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-xl mx-auto"
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Business Information</h2>
        <p className="text-muted-foreground">Tell us about your business to get started.</p>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Phase 1: Is your business registered? ── */}
        {phase === 'question' && (
          <motion.div key="question" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-card border rounded-3xl p-8 space-y-6"
          >
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Is your business officially registered?</h3>
              <p className="text-sm text-muted-foreground">
                Registered businesses can be verified automatically from the Companies Control Department.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { updateState({ isOfficiallyRegistered: true }); setPhase('registered-input'); }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all"
              >
                <CheckCircle2 className="w-8 h-8 text-primary" />
                <span className="font-semibold text-base">Yes</span>
                <span className="text-xs text-muted-foreground text-center">My business is registered</span>
              </button>
              <button
                onClick={() => { updateState({ isOfficiallyRegistered: false }); setPhase('unregistered-form'); }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border hover:border-muted-foreground/40 hover:bg-muted/30 transition-all"
              >
                <Pencil className="w-8 h-8 text-muted-foreground" />
                <span className="font-semibold text-base">No</span>
                <span className="text-xs text-muted-foreground text-center">I'll enter details manually</span>
              </button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              No registration? No problem — you can still build your Financial Twin.
            </p>
          </motion.div>
        )}

        {/* ── Phase 2a: Registration number input ── */}
        {phase === 'registered-input' && (
          <motion.div key="reg-input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="bg-card border rounded-3xl p-8 space-y-5"
          >
            <div>
              <h3 className="text-lg font-semibold mb-1">Enter your Registration Number</h3>
              <p className="text-sm text-muted-foreground">
                We'll look it up in the Companies Control Department registry and auto-fill your business details.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Registration Number <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. 12345-LLC or SP-98765"
                value={regNumber}
                onChange={e => { setRegNumber(e.target.value); setRegError(''); }}
                className={`h-12 text-base ${regError ? 'border-destructive' : ''}`}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
              />
              {regError && <p className="text-destructive text-xs">{regError}</p>}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" className="rounded-full" onClick={() => setPhase('question')}>
                <ArrowLeft className="me-2 w-4 h-4" /> Back
              </Button>
              <Button className="rounded-full px-8" onClick={handleLookup}>
                Look up <ArrowRight className="ms-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Phase 2b: Lookup in progress ── */}
        {phase === 'registered-lookup' && (
          <motion.div key="lookup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-card border rounded-3xl p-12 flex flex-col items-center gap-5 text-center"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div>
              <p className="font-semibold text-lg">Verifying registration…</p>
              <p className="text-sm text-muted-foreground mt-1">Checking official records with the Companies Control Department.</p>
            </div>
            <div className="w-full space-y-2 mt-2">
              {[75, 55, 65, 45].map((w, i) => (
                <div key={i} className="h-3 bg-muted rounded-full animate-pulse mx-auto" style={{ width: `${w}%` }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Phase 2c: Confirmed — show editable results ── */}
        {phase === 'registered-confirm' && lookedUp && (
          <motion.div key="confirm" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border-2 border-primary/20 rounded-3xl p-8 shadow-sm space-y-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-primary">Verified by registry</p>
                <p className="text-xs text-muted-foreground">Auto-filled from Companies Control Department · Edit if needed</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">Business Name</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-12 text-base" />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Business Type</Label>
                <Select value={editType} onValueChange={(v: BusinessType) => setEditType(v)}>
                  <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Business Sector</Label>
                <Select value={editSector} onValueChange={(v: BusinessSector) => setEditSector(v)}>
                  <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-muted/40 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Years in Operation</span>
                <span className="font-semibold">{calcYears(lookedUp.registrationDate)} years <span className="text-xs text-muted-foreground font-normal">(auto-calculated)</span></span>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" className="rounded-full" onClick={() => setPhase('registered-input')}>
                <ArrowLeft className="me-2 w-4 h-4" /> Change number
              </Button>
              <Button className="rounded-full px-8" onClick={handleRegisteredContinue}>
                Continue <ArrowRight className="ms-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Phase 3: Unregistered manual form ── */}
        {phase === 'unregistered-form' && (
          <motion.div key="unregistered" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="bg-card border rounded-3xl p-8 space-y-5"
          >
            <div className="bg-muted/40 rounded-2xl p-4 text-sm text-muted-foreground">
              No problem — you can still build your Financial Twin. Some financing products may require registration later.
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Business Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Amman Coffee Roasters"
                value={manualName}
                onChange={e => { setManualName(e.target.value); clearManual('name'); }}
                className={`h-12 text-base ${manualErrors.name ? 'border-destructive' : ''}`}
              />
              {manualErrors.name && <p className="text-destructive text-xs">{manualErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Business Type <span className="text-destructive">*</span></Label>
              <Select value={manualType} onValueChange={(v: BusinessType) => { setManualType(v); clearManual('type'); }}>
                <SelectTrigger className={`h-12 text-base ${manualErrors.type ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              {manualErrors.type && <p className="text-destructive text-xs">{manualErrors.type}</p>}
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Business Sector <span className="text-destructive">*</span></Label>
              <Select value={manualSector} onValueChange={(v: BusinessSector) => { setManualSector(v); clearManual('sector'); }}>
                <SelectTrigger className={`h-12 text-base ${manualErrors.sector ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              {manualErrors.sector && <p className="text-destructive text-xs">{manualErrors.sector}</p>}
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Years in Operation <span className="text-destructive">*</span></Label>
              <Input
                type="text" inputMode="numeric" placeholder="e.g. 5"
                value={manualYears}
                onChange={e => { setManualYears(e.target.value.replace(/[^\d]/g, '')); clearManual('years'); }}
                className={`h-12 text-base ${manualErrors.years ? 'border-destructive' : ''}`}
              />
              {manualErrors.years && <p className="text-destructive text-xs">{manualErrors.years}</p>}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" className="rounded-full" onClick={() => setPhase('question')}>
                <ArrowLeft className="me-2 w-4 h-4" /> Back
              </Button>
              <Button className="rounded-full px-8" onClick={handleUnregisteredContinue}>
                Continue <ArrowRight className="ms-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
