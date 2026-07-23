import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useOnboarding, BusinessType, BusinessSector } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Building2, CheckCircle2, Landmark, FileText,
  CreditCard, Save, Lock,
} from "lucide-react";

const BUSINESS_TYPES: BusinessType[] = ['LLC', 'Sole Proprietorship', 'Partnership', 'Other'];
const SECTORS: BusinessSector[] = [
  'Retail & Trade', 'Food & Hospitality', 'Small Manufacturing',
  'Services', 'Professional Services', 'Agriculture', 'Crafts & Trades', 'Other',
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-2xl p-6">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-5">{title}</h3>
      {children}
    </div>
  );
}

function ServiceBadge({ label, connected }: { label: string; connected: boolean }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${
      connected ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/30'
    }`}>
      <span className="text-sm font-medium">{label}</span>
      {connected
        ? <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Connected</span>
        : <span className="text-xs text-muted-foreground">Not connected</span>
      }
    </div>
  );
}

export default function Profile() {
  const { state, updateState } = useOnboarding();
  const [saved, setSaved] = useState(false);

  // Editable local state — mirrors context
  const [businessName, setBusinessName]     = useState(state.businessName || '');
  const [businessType, setBusinessType]     = useState<BusinessType | ''>(state.businessType || '');
  const [businessSector, setBusinessSector] = useState<BusinessSector | ''>(state.businessSector || '');
  const [registrationNumber, setRegNumber]  = useState(state.registrationNumber || '');
  const [employees, setEmployees]           = useState(state.employees || '');
  const [manualYears, setManualYears]       = useState(state.yearsInOperation || '');
  const [annualRevenue, setAnnualRevenue]   = useState(state.annualRevenue || '');
  const [iban, setIban]                     = useState(state.iban || '');
  const [contactPhone, setContactPhone]     = useState(state.contactPhone || '');

  // Years are editable only for unregistered businesses
  const yearsLocked = !!(state.isOfficiallyRegistered && state.verifiedRegistrationDate);

  const handleSave = () => {
    updateState({
      businessName,
      businessType: businessType as BusinessType,
      businessSector: businessSector as BusinessSector,
      registrationNumber,
      employees,
      yearsInOperation: yearsLocked ? state.yearsInOperation : manualYears,
      annualRevenue,
      iban,
      contactPhone,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <span className="font-semibold">Profile &amp; Settings</span>
          </div>
          <Button className="rounded-full gap-2" onClick={handleSave}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Profile header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-3xl p-6 mb-6 flex items-center gap-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-2xl">
              {(state.businessName || 'F')[0]}
            </span>
          </div>
          <div>
            <p className="font-bold text-xl">{state.businessName || 'Your Business'}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {state.businessSector || '—'} · {state.category || 'Micro Enterprise'}
            </p>
            {state.isOfficiallyRegistered && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
                <CheckCircle2 className="w-3 h-3" /> Registered business
              </span>
            )}
          </div>
        </motion.div>

        <div className="space-y-5">
          {/* Business Information */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <SectionCard title="Business Information">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium flex items-center gap-2"><Building2 className="w-3.5 h-3.5" />Business Name</Label>
                  <Input value={businessName} onChange={e => setBusinessName(e.target.value)} className="h-11" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium">Business Type</Label>
                    <Select value={businessType} onValueChange={(v: BusinessType) => setBusinessType(v)}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Sector</Label>
                    <Select value={businessSector} onValueChange={(v: BusinessSector) => setBusinessSector(v)}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Select sector" /></SelectTrigger>
                      <SelectContent>
                        {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {state.isOfficiallyRegistered && (
                  <div className="space-y-2">
                    <Label className="font-medium">Registration Number</Label>
                    <Input value={registrationNumber} onChange={e => setRegNumber(e.target.value)} className="h-11" />
                  </div>
                )}
              </div>
            </SectionCard>
          </motion.div>

          {/* Size & Scale */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <SectionCard title="Size & Scale">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium">Employees</Label>
                    <Input
                      type="text" inputMode="numeric"
                      value={employees}
                      onChange={e => setEmployees(e.target.value.replace(/[^\d]/g, ''))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium flex items-center gap-1.5">
                      Years in Operation
                      {yearsLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                    </Label>
                    {yearsLocked ? (
                      <div className="flex items-center h-11 px-3 rounded-xl border border-border bg-muted/40 text-sm">
                        {state.yearsInOperation} <span className="text-xs text-muted-foreground ms-2">(auto)</span>
                      </div>
                    ) : (
                      <Input
                        type="text" inputMode="numeric"
                        value={manualYears}
                        onChange={e => setManualYears(e.target.value.replace(/[^\d]/g, ''))}
                        className="h-11"
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Annual Revenue (JOD)</Label>
                  <Input
                    type="text" inputMode="numeric"
                    value={annualRevenue}
                    onChange={e => setAnnualRevenue(e.target.value.replace(/[^\d]/g, ''))}
                    className="h-11"
                    placeholder="0"
                  />
                </div>
                <div className="bg-muted/40 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Classification</span>
                  <span className="font-semibold">{state.category || 'Micro Enterprise'}</span>
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* Banking */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <SectionCard title="Banking">
              <div className="space-y-2">
                <Label className="font-medium flex items-center gap-2"><Landmark className="w-3.5 h-3.5" />Company IBAN</Label>
                <Input
                  placeholder="JO94 CBJO 0010 0000 0000 0131 000 2"
                  value={iban}
                  onChange={e => setIban(e.target.value.toUpperCase())}
                  className="h-11 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Jordanian IBANs start with JO and are 30 characters long.</p>
              </div>
            </SectionCard>
          </motion.div>

          {/* Contact */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <SectionCard title="Contact Information">
              <div className="space-y-2">
                <Label className="font-medium">Mobile Number</Label>
                <Input
                  type="tel" placeholder="+962 7X XXX XXXX"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  className="h-11"
                />
              </div>
            </SectionCard>
          </motion.div>

          {/* Connected Services */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <SectionCard title="Connected Services">
              <div className="space-y-3">
                <ServiceBadge label={<span className="flex items-center gap-2"><Landmark className="w-3.5 h-3.5" />Bank (Open Banking)</span> as any} connected={state.connectedSources.cliq} />
                <ServiceBadge label={<span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" />JoFotara (e-Invoices)</span> as any} connected={state.connectedSources.jofotara} />
                <ServiceBadge label={<span className="flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" />POS Terminal</span> as any} connected={state.connectedSources.pos} />
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                To connect or disconnect services, go to the{" "}
                <Link href="/onboarding" className="text-primary hover:underline">onboarding flow</Link>.
              </p>
            </SectionCard>
          </motion.div>
        </div>

        {/* Sticky Save footer (mobile) */}
        <div className="mt-8 pb-8">
          <Button className="w-full h-12 rounded-full gap-2" onClick={handleSave}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Changes Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </Button>
        </div>
      </main>
    </div>
  );
}
