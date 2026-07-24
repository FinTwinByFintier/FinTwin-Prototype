import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useOnboarding, BusinessType, BusinessSector } from "@/context/OnboardingContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Building2, CheckCircle2, Landmark, FileText,
  CreditCard, Save, Lock, Crown, Receipt, ShieldCheck, AlertTriangle,
  Zap, BadgeCheck,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */
const BUSINESS_TYPES: BusinessType[] = ['LLC', 'Sole Proprietorship', 'Partnership', 'Other'];
const SECTORS: BusinessSector[] = [
  'Retail & Trade', 'Food & Hospitality', 'Small Manufacturing',
  'Services', 'Professional Services', 'Agriculture', 'Crafts & Trades', 'Other',
];

type Tab = 'profile' | 'subscription' | 'billing' | 'privacy' | 'consent';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',      label: 'Profile',           icon: Building2  },
  { id: 'subscription', label: 'Subscription',      icon: Crown      },
  { id: 'billing',      label: 'Billing',            icon: Receipt    },
  { id: 'privacy',      label: 'Privacy & Security', icon: ShieldCheck },
  { id: 'consent',      label: 'Data Consent',       icon: Zap        },
];

/* ── Sub-components ─────────────────────────────────────────── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-2xl p-6">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-5">{title}</h3>
      {children}
    </div>
  );
}

function ServiceBadge({ label, connected }: { label: React.ReactNode; connected: boolean }) {
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}

/* ── Tab: Profile ───────────────────────────────────────────── */
function ProfileTab() {
  const { state, updateState, persistProfile } = useOnboarding();
  const [saved, setSaved] = useState(false);

  const [businessName, setBusinessName]     = useState(state.businessName || '');
  const [businessType, setBusinessType]     = useState<BusinessType | ''>(state.businessType || '');
  const [businessSector, setBusinessSector] = useState<BusinessSector | ''>(state.businessSector || '');
  const [registrationNumber, setRegNumber]  = useState(state.registrationNumber || '');
  const [employees, setEmployees]           = useState(state.employees || '');
  const [manualYears, setManualYears]       = useState(state.yearsInOperation || '');
  const [annualRevenue, setAnnualRevenue]   = useState(state.annualRevenue || '');
  const [iban, setIban]                     = useState(state.iban || '');
  const [contactPhone, setContactPhone]     = useState(state.contactPhone || '');

  const yearsLocked = !!(state.isOfficiallyRegistered && state.verifiedRegistrationDate);

  const handleSave = async () => {
    const updates = {
      businessName, businessType: businessType as BusinessType,
      businessSector: businessSector as BusinessSector,
      registrationNumber, employees,
      yearsInOperation: yearsLocked ? state.yearsInOperation : manualYears,
      annualRevenue, iban, contactPhone,
    };
    updateState(updates);
    await persistProfile({
      business_name: businessName,
      business_type: businessType || undefined,
      business_sector: businessSector || undefined,
      registration_number: registrationNumber,
      employees: employees || null,
      years_in_operation: (yearsLocked ? state.yearsInOperation : manualYears) || null,
      annual_revenue_jod: annualRevenue || null,
      iban, contact_phone: contactPhone,
      is_officially_registered: registrationNumber.trim() ? true : state.isOfficiallyRegistered,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
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

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionCard title="Size & Scale">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium">Employees</Label>
                <Input type="text" inputMode="numeric"
                  value={employees} onChange={e => setEmployees(e.target.value.replace(/[^\d]/g, ''))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="font-medium flex items-center gap-1.5">
                  Years in Operation {yearsLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                </Label>
                {yearsLocked ? (
                  <div className="flex items-center h-11 px-3 rounded-xl border border-border bg-muted/40 text-sm">
                    {state.yearsInOperation} <span className="text-xs text-muted-foreground ms-2">(auto)</span>
                  </div>
                ) : (
                  <Input type="text" inputMode="numeric"
                    value={manualYears} onChange={e => setManualYears(e.target.value.replace(/[^\d]/g, ''))} className="h-11" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Annual Revenue (JOD)</Label>
              <Input type="text" inputMode="numeric"
                value={annualRevenue} onChange={e => setAnnualRevenue(e.target.value.replace(/[^\d]/g, ''))}
                className="h-11" placeholder="0" />
            </div>
            <div className="bg-muted/40 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Classification</span>
              <span className="font-semibold">{state.category || 'Micro Enterprise'}</span>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <SectionCard title="Banking">
          <div className="space-y-2">
            <Label className="font-medium flex items-center gap-2"><Landmark className="w-3.5 h-3.5" />Company IBAN</Label>
            <Input placeholder="JO94 CBJO 0010 0000 0000 0131 000 2"
              value={iban} onChange={e => setIban(e.target.value.toUpperCase())} className="h-11 font-mono text-sm" />
            <p className="text-xs text-muted-foreground">Jordanian IBANs start with JO and are 30 characters long.</p>
          </div>
        </SectionCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <SectionCard title="Contact Information">
          <div className="space-y-2">
            <Label className="font-medium">Mobile Number</Label>
            <Input type="tel" placeholder="+962 7X XXX XXXX"
              value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="h-11" />
          </div>
        </SectionCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <SectionCard title="Connected Services">
          <div className="space-y-3">
            <ServiceBadge label={<span className="flex items-center gap-2"><Landmark className="w-3.5 h-3.5" />Bank (Open Banking)</span>} connected={state.connectedSources.cliq} />
            <ServiceBadge label={<span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" />JoFotara (e-Invoices)</span>} connected={state.connectedSources.jofotara} />
            <ServiceBadge label={<span className="flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" />POS Terminal</span>} connected={state.connectedSources.pos} />
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            To connect or disconnect services, go to the{" "}
            <Link href="/onboarding" className="text-primary hover:underline">onboarding flow</Link>.
          </p>
        </SectionCard>
      </motion.div>

      <div className="pb-8">
        <Button className="w-full h-12 rounded-full gap-2" onClick={handleSave}>
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Changes Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </Button>
      </div>
    </div>
  );
}

/* ── Tab: Subscription ──────────────────────────────────────── */
function SubscriptionTab({ onUpgrade }: { onUpgrade: () => void }) {
  const { state } = useOnboarding();
  const { plan, subscription, hasPremium } = useSubscription();

  const planLabel =
    plan === 'micro'  ? 'Micro Enterprise'  :
    plan === 'small'  ? 'Small Enterprise'  : 'Medium Enterprise';

  const isMicro = plan === 'micro';

  return (
    <div className="space-y-4">
      {/* Plan overview */}
      <div className="bg-card border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Plan</p>
            <p className="text-xl font-bold">{planLabel}</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isMicro ? 'bg-emerald-500/10' : hasPremium ? 'bg-primary/10' : 'bg-muted/50'}`}>
            <Crown className={`w-6 h-6 ${isMicro ? 'text-emerald-600' : hasPremium ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>

        {isMicro ? (
          <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3">
            <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold text-emerald-700">All Features Included — Free</span>
          </div>
        ) : (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 border ${
            hasPremium ? 'bg-primary/5 border-primary/20' : 'bg-muted/40 border-border'
          }`}>
            <div className={`w-2 h-2 rounded-full ${hasPremium ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
            <span className={`text-sm font-semibold ${hasPremium ? 'text-primary' : 'text-muted-foreground'}`}>
              {hasPremium ? 'Premium Active' : 'Free Tier — Limited Access'}
            </span>
          </div>
        )}

        {!isMicro && (
          <div className="divide-y">
            <InfoRow label="Monthly Price" value={hasPremium ? '100 JOD' : 'Free (limited)'} />
            <InfoRow label="Billing Cycle" value="Monthly" />
            <InfoRow
              label="Status"
              value={
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  hasPremium ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                }`}>
                  {hasPremium ? 'Active' : 'Inactive'}
                </span>
              }
            />
            {subscription.startDate && <InfoRow label="Start Date" value={subscription.startDate} />}
            {subscription.renewalDate && <InfoRow label="Next Renewal" value={subscription.renewalDate} />}
          </div>
        )}
      </div>

      {/* Free scenarios info for non-premium */}
      {!isMicro && !hasPremium && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
          <p className="text-sm font-semibold text-amber-800">Free scenarios available:</p>
          <ul className="space-y-1.5 text-sm text-amber-700">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" />Hire an Employee</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" />Apply for a Loan</li>
          </ul>
          <p className="text-xs text-amber-600">All other scenarios require a Premium subscription.</p>
        </div>
      )}

      {!isMicro && !hasPremium && (
        <Button className="w-full h-11 rounded-full gap-2" onClick={onUpgrade}>
          <Crown className="w-4 h-4" /> Upgrade to Premium — 100 JOD/month
        </Button>
      )}

      {!isMicro && hasPremium && (
        <Button variant="outline" className="w-full h-11 rounded-full">
          Manage Subscription
        </Button>
      )}
    </div>
  );
}

/* ── Tab: Billing ───────────────────────────────────────────── */
function BillingTab({ onUpgrade }: { onUpgrade: () => void }) {
  const { plan, subscription, hasPremium, billingHistory } = useSubscription();
  const isMicro = plan === 'micro';

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-2xl p-6 space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Billing Overview</p>
        <InfoRow label="Current Plan" value={isMicro ? 'Micro Enterprise (Free)' : hasPremium ? 'Premium' : 'Free Tier'} />
        <InfoRow label="Monthly Cost" value={isMicro || !hasPremium ? '0 JOD' : '100 JOD'} />
        <InfoRow label="Next Billing Date" value={subscription.renewalDate ?? '—'} />
        <InfoRow
          label="Payment Status"
          value={
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              hasPremium ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
            }`}>
              {hasPremium ? 'Paid' : 'N/A'}
            </span>
          }
        />
        <InfoRow label="Payment Method" value={subscription.paymentMethod ?? '—'} />
      </div>

      {/* Billing history */}
      <div className="bg-card border rounded-2xl p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Billing History</p>
        {billingHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No billing history yet.</p>
        ) : (
          <div className="space-y-2">
            {billingHistory.map(record => (
              <div key={record.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{record.period}</p>
                  <p className="text-xs text-muted-foreground">{record.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{record.amount} {record.currency}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    record.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                  }`}>{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {!isMicro && !hasPremium && (
          <Button className="flex-1 h-11 rounded-full gap-2" onClick={onUpgrade}>
            <Crown className="w-4 h-4" /> Upgrade Plan
          </Button>
        )}
        <Button variant="outline" className="flex-1 h-11 rounded-full">
          Manage Subscription
        </Button>
      </div>
    </div>
  );
}

/* ── Tab: Privacy & Security ─────────────────────────────────── */
function PrivacyTab() {
  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-2xl p-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Security</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border">
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-xs text-muted-foreground">Last changed: Never</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full text-xs h-8">Change</Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Not enabled</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full text-xs h-8">Enable</Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border">
            <div>
              <p className="text-sm font-medium">Active Sessions</p>
              <p className="text-xs text-muted-foreground">1 device</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full text-xs h-8">View</Button>
          </div>
        </div>
      </div>
      <div className="bg-card border rounded-2xl p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Privacy</p>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Your data is stored securely and never shared with third parties without your consent.</p>
          <p>All financial data connections are made via Jordan's Open Banking framework and JoFotara e-invoicing infrastructure.</p>
          <Button variant="link" className="p-0 h-auto text-primary text-sm">View Privacy Policy →</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Tab: Data Consent ──────────────────────────────────────── */
function ConsentTab() {
  const { state } = useOnboarding();
  const { revokeConsent } = useSubscription();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const handleRevoke = async () => {
    setRevoking(true);
    await revokeConsent();
    setRevoking(false);
    setConfirmOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-2xl p-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Connected Data Sources</p>
        <div className="space-y-3">
          <ServiceBadge
            label={<span className="flex items-center gap-2"><Landmark className="w-3.5 h-3.5" />Open Banking (CliQ)</span>}
            connected={state.connectedSources.cliq}
          />
          <ServiceBadge
            label={<span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" />JoFotara (e-Invoices)</span>}
            connected={state.connectedSources.jofotara}
          />
          <ServiceBadge
            label={<span className="flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" />POS Terminal</span>}
            connected={state.connectedSources.pos}
          />
        </div>

        <div className="divide-y pt-2">
          <InfoRow label="Consent Status" value={
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              state.consentGiven ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
            }`}>
              {state.consentGiven ? 'Granted' : 'Revoked'}
            </span>
          } />
          <InfoRow label="Consent Granted Date" value="15 June 2026" />
          <InfoRow label="Consent Expiration" value="15 June 2027" />
        </div>
      </div>

      {state.consentGiven && (
        <Button
          variant="outline"
          className="w-full h-11 rounded-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 gap-2"
          onClick={() => setConfirmOpen(true)}
        >
          <AlertTriangle className="w-4 h-4" /> Revoke Consent
        </Button>
      )}

      {!state.consentGiven && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          Your data consent has been revoked. Financial data is no longer being synchronised.
        </div>
      )}

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Revoke Consent
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              Revoking consent will disconnect your financial data from the platform. Your imported financial information and connected banking services will no longer be synchronized until consent is granted again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRevoke}
              disabled={revoking}
            >
              {revoking ? 'Revoking…' : 'Revoke Consent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────── */
export default function Profile() {
  const { state } = useOnboarding();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <span className="font-semibold">Profile &amp; Settings</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Business header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
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

        {/* Tab pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-6 scrollbar-none">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
          {activeTab === 'profile'      && <ProfileTab />}
          {activeTab === 'subscription' && <SubscriptionTab onUpgrade={() => setUpgradeOpen(true)} />}
          {activeTab === 'billing'      && <BillingTab onUpgrade={() => setUpgradeOpen(true)} />}
          {activeTab === 'privacy'      && <PrivacyTab />}
          {activeTab === 'consent'      && <ConsentTab />}
        </motion.div>
      </main>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
