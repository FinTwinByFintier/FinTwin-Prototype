import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useOnboarding, BusinessType, BusinessSector } from "@/context/OnboardingContext";
import { useSubscription, type SubscriptionStatus } from "@/context/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Building2, CheckCircle2, Landmark, FileText,
  CreditCard, Save, Lock, Zap, Calendar, RefreshCw, Shield,
  AlertTriangle, User, Receipt, ChevronRight, BadgeCheck,
} from "lucide-react";

/* ─── Constants ────────────────────────────────────────────── */
const BUSINESS_TYPES: BusinessType[] = ['LLC', 'Sole Proprietorship', 'Partnership', 'Other'];
const SECTORS: BusinessSector[] = [
  'Retail & Trade', 'Food & Hospitality', 'Small Manufacturing',
  'Services', 'Professional Services', 'Agriculture', 'Crafts & Trades', 'Other',
];

type Tab = 'profile' | 'subscription' | 'billing' | 'privacy' | 'consent';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',      label: 'Profile',           icon: User     },
  { id: 'subscription', label: 'Subscription',      icon: Zap      },
  { id: 'billing',      label: 'Billing',           icon: Receipt  },
  { id: 'privacy',      label: 'Privacy & Security',icon: Shield   },
  { id: 'consent',      label: 'Data Consent',      icon: Lock     },
];

/* ─── Shared sub-components ─────────────────────────────────── */
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

/* ─── Status pill ───────────────────────────────────────────── */
function StatusPill({ status }: { status: SubscriptionStatus }) {
  const styles: Record<SubscriptionStatus, string> = {
    active:  'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    trial:   'bg-blue-500/10 text-blue-700 border-blue-500/20',
    expired: 'bg-red-500/10 text-red-600 border-red-500/20',
    none:    'bg-muted text-muted-foreground border-border',
  };
  const labels: Record<SubscriptionStatus, string> = {
    active: 'Active', trial: 'Trial', expired: 'Expired', none: 'Not subscribed',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

/* ─── Subscription tab ──────────────────────────────────────── */
function SubscriptionTab() {
  const { state } = useOnboarding();
  const { plan, hasPremium, monthlyPrice, subscription, setUpgradeOpen } = useSubscription();

  const planLabel =
    plan === 'micro'  ? 'Micro Enterprise (Free)' :
    plan === 'small'  ? 'Small Enterprise'        :
                        'Medium Enterprise';

  const isMicro = plan === 'micro';

  return (
    <div className="space-y-4">
      {/* Current plan hero */}
      <div className={`rounded-2xl border-2 p-6 ${
        isMicro
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : hasPremium
            ? 'border-primary/30 bg-primary/5'
            : 'border-border bg-card'
      }`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Current Plan</p>
            <p className="text-xl font-bold">{planLabel}</p>
          </div>
          <StatusPill status={isMicro ? 'active' : subscription.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-background/60 rounded-xl px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Monthly Price</p>
            <p className="font-bold">{isMicro ? 'Free' : `${monthlyPrice} JOD`}</p>
          </div>
          <div className="bg-background/60 rounded-xl px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Billing Cycle</p>
            <p className="font-bold capitalize">{subscription.billingCycle}</p>
          </div>
          {subscription.startDate && (
            <div className="bg-background/60 rounded-xl px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">Start Date</p>
              <p className="font-bold">{subscription.startDate}</p>
            </div>
          )}
          {subscription.renewalDate && (
            <div className="bg-background/60 rounded-xl px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">Renewal Date</p>
              <p className="font-bold">{subscription.renewalDate}</p>
            </div>
          )}
        </div>

        {isMicro && (
          <div className="mt-4 flex items-center gap-2 bg-emerald-500/10 rounded-xl px-3 py-2.5">
            <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium text-emerald-700">All Features Included</span>
          </div>
        )}
      </div>

      {/* Upgrade CTA for small/medium without premium */}
      {!isMicro && !hasPremium && (
        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <div>
            <p className="font-semibold mb-1">Unlock All Scenarios</p>
            <p className="text-sm text-muted-foreground">
              Your plan includes free access to <strong>Hire an Employee</strong> and <strong>Apply for a Loan</strong>.
              Subscribe to unlock all financial scenarios and advanced features.
            </p>
          </div>
          <div className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">Premium subscription</span>
            <span className="font-bold">100 JOD / month</span>
          </div>
          <Button className="w-full rounded-full h-11 gap-2" onClick={() => setUpgradeOpen(true)}>
            <Zap className="w-4 h-4" /> Upgrade to Premium
          </Button>
        </div>
      )}

      {/* Manage for active subscribers */}
      {!isMicro && hasPremium && (
        <div className="bg-card border rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Premium Active</p>
            <p className="text-xs text-muted-foreground">All features are unlocked</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setUpgradeOpen(true)}>
            Manage
          </Button>
        </div>
      )}

      {/* Plan comparison */}
      <SectionCard title="Plan Comparison">
        <div className="space-y-3 text-sm">
          {[
            { tier: 'Micro Enterprise', price: 'Free', features: 'All scenarios included' },
            { tier: 'Small Enterprise', price: '100 JOD/mo', features: 'Hire & Loan free; Premium unlocks all' },
            { tier: 'Medium Enterprise', price: '100 JOD/mo', features: 'Hire & Loan free; Premium unlocks all' },
          ].map((row) => (
            <div
              key={row.tier}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                (plan === 'micro' && row.tier === 'Micro Enterprise') ||
                (plan === 'small' && row.tier === 'Small Enterprise') ||
                (plan === 'medium' && row.tier === 'Medium Enterprise')
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border'
              }`}
            >
              <div className="flex-1">
                <p className="font-medium">{row.tier}</p>
                <p className="text-xs text-muted-foreground">{row.features}</p>
              </div>
              <span className="font-bold text-right shrink-0">{row.price}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Billing tab ───────────────────────────────────────────── */
function BillingTab() {
  const { plan, hasPremium, monthlyPrice, subscription, setUpgradeOpen } = useSubscription();

  const statusColor: Record<string, string> = {
    paid:    'text-emerald-600 bg-emerald-500/10',
    pending: 'text-amber-600 bg-amber-500/10',
    failed:  'text-red-600 bg-red-500/10',
  };

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <SectionCard title="Billing Summary">
        <div className="space-y-3">
          {[
            { label: 'Current Plan',    value: plan === 'micro' ? 'Micro Enterprise (Free)' : plan === 'small' ? 'Small Enterprise' : 'Medium Enterprise' },
            { label: 'Monthly Cost',    value: plan === 'micro' ? 'Free' : `${monthlyPrice} JOD` },
            { label: 'Next Billing Date', value: subscription.renewalDate ?? '—' },
            { label: 'Payment Status',  value: hasPremium ? 'Paid' : 'N/A' },
            { label: 'Payment Method',  value: subscription.paymentMethod ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Billing history */}
      <SectionCard title="Billing History">
        {subscription.billingHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No billing history yet.</p>
        ) : (
          <div className="space-y-2">
            {subscription.billingHistory.map((record, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/30 text-sm">
                <span className="font-medium">{record.month}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor[record.status] ?? ''}`}>
                    {record.status}
                  </span>
                  <span className="font-bold">{record.amountJOD} JOD</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="flex-1 rounded-full h-11 gap-2" onClick={() => setUpgradeOpen(true)}>
          <Zap className="w-4 h-4" /> Upgrade Plan
        </Button>
        <Button variant="outline" className="flex-1 rounded-full h-11 gap-2" onClick={() => setUpgradeOpen(true)}>
          <RefreshCw className="w-4 h-4" /> Manage Subscription
        </Button>
      </div>
    </div>
  );
}

/* ─── Privacy & Security tab ────────────────────────────────── */
function PrivacyTab() {
  return (
    <div className="space-y-4">
      <SectionCard title="Security">
        <div className="space-y-3 text-sm">
          {[
            { label: 'Data Encryption',      detail: 'All data is encrypted in transit and at rest' },
            { label: 'Access Control',        detail: 'Role-based access with session tokens' },
            { label: 'Audit Logging',         detail: 'All actions are logged and auditable' },
          ].map(({ label, detail }) => (
            <div key={label} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-muted/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Privacy Policy">
        <p className="text-sm text-muted-foreground leading-relaxed">
          FinTwin is committed to protecting your privacy. Your financial data is used solely to
          generate your funding readiness profile. We do not share data with third parties without
          your explicit consent.
        </p>
        <Button variant="outline" className="rounded-full mt-4 gap-2 text-sm" asChild>
          <a href="/" target="_blank" rel="noopener noreferrer">
            Read Full Policy <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </Button>
      </SectionCard>
    </div>
  );
}

/* ─── Data Consent tab ──────────────────────────────────────── */
function DataConsentTab() {
  const { state, updateState } = useOnboarding();
  const { revokeConsent } = useSubscription();
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revoked, setRevoked] = useState(false);

  const handleRevoke = async () => {
    setRevoking(true);
    await revokeConsent();
    updateState({ consentGiven: false });
    setRevoking(false);
    setRevoked(true);
    setRevokeDialogOpen(false);
  };

  const connections = [
    { label: 'Open Banking (CliQ)', connected: state.connectedSources.cliq,     icon: Landmark   },
    { label: 'JoFotara',            connected: state.connectedSources.jofotara, icon: FileText   },
    { label: 'POS Terminal',        connected: state.connectedSources.pos,       icon: CreditCard },
  ];

  return (
    <div className="space-y-4">
      {revoked && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/20 text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Consent revoked. Financial data will no longer sync until consent is granted again.
        </div>
      )}

      <SectionCard title="Current Status">
        <div className="space-y-3">
          {connections.map(({ label, connected, icon: Icon }) => (
            <div
              key={label}
              className={`flex items-center justify-between p-4 rounded-xl border ${
                connected ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/30 border-border'
              }`}
            >
              <span className="flex items-center gap-2.5 text-sm font-medium">
                <Icon className="w-4 h-4 text-muted-foreground" /> {label}
              </span>
              {connected
                ? <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />Connected</span>
                : <span className="text-xs text-muted-foreground">Not connected</span>
              }
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div className="px-4 py-3 rounded-xl bg-muted/30">
            <p className="text-xs text-muted-foreground mb-0.5">Consent Granted</p>
            <p className="font-semibold">{state.consentGiven ? '2026-06-01' : '—'}</p>
          </div>
          <div className="px-4 py-3 rounded-xl bg-muted/30">
            <p className="text-xs text-muted-foreground mb-0.5">Consent Expiry</p>
            <p className="font-semibold">—</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Manage Consent">
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Revoking consent will disconnect your financial data from the platform. Your imported
          financial information and connected banking services will no longer be synchronized until
          consent is granted again.
        </p>
        <Button
          variant="outline"
          className="w-full rounded-full h-11 gap-2 border-red-500/30 text-red-600 hover:bg-red-500/5"
          onClick={() => setRevokeDialogOpen(true)}
          disabled={!state.consentGiven || revoked}
        >
          <Lock className="w-4 h-4" />
          {revoked ? 'Consent Revoked' : 'Revoke Consent'}
        </Button>
      </SectionCard>

      {/* Revoke confirmation dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent className="max-w-sm !rounded-3xl p-7">
          <DialogHeader>
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 mx-auto mb-3">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <DialogTitle className="text-center text-lg">Revoke Data Consent?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Revoking consent will disconnect your financial data from the platform. Your imported
            financial information and connected banking services will no longer be synchronized until
            consent is granted again.
          </p>
          <div className="flex flex-col gap-2 mt-2">
            <Button
              variant="outline"
              className="rounded-full h-11 border-red-500/30 text-red-600 hover:bg-red-500/5 gap-2"
              onClick={handleRevoke}
              disabled={revoking}
            >
              <Lock className="w-4 h-4" />
              {revoking ? 'Revoking…' : 'Revoke Consent'}
            </Button>
            <Button
              variant="ghost"
              className="rounded-full h-10 text-muted-foreground"
              onClick={() => setRevokeDialogOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Main Settings page ────────────────────────────────────── */
export default function Profile() {
  const { state, updateState, persistProfile } = useOnboarding();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saved, setSaved] = useState(false);

  // Profile form state
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
      businessSector: businessSector as BusinessSector, registrationNumber,
      employees, yearsInOperation: yearsLocked ? state.yearsInOperation : manualYears,
      annualRevenue, iban, contactPhone,
    };
    updateState(updates);
    await persistProfile({
      business_name: businessName, business_type: businessType || undefined,
      business_sector: businessSector || undefined, registration_number: registrationNumber,
      employees: employees || null,
      years_in_operation: (yearsLocked ? state.yearsInOperation : manualYears) || null,
      annual_revenue_jod: annualRevenue || null, iban, contact_phone: contactPhone,
      is_officially_registered: registrationNumber.trim() ? true : state.isOfficiallyRegistered,
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
          {activeTab === 'profile' && (
            <Button className="rounded-full gap-2" onClick={handleSave}>
              {saved
                ? <><CheckCircle2 className="w-4 h-4" /> Saved</>
                : <><Save className="w-4 h-4" /> Save Changes</>}
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Business header card */}
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

        {/* Tab navigation */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 overflow-x-auto"
        >
          <div className="flex gap-1.5 bg-muted/50 p-1 rounded-2xl w-max min-w-full">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === id
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'profile' && (
              <div className="space-y-5">
                {/* Business Information */}
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

                {/* Size & Scale */}
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
                        className="h-11" placeholder="0"
                      />
                    </div>
                    <div className="bg-muted/40 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Classification</span>
                      <span className="font-semibold">{state.category || 'Micro Enterprise'}</span>
                    </div>
                  </div>
                </SectionCard>

                {/* Banking */}
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

                {/* Contact */}
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

                {/* Connected Services */}
                <SectionCard title="Connected Services">
                  <div className="space-y-3">
                    <ServiceBadge
                      label={<span className="flex items-center gap-2"><Landmark className="w-3.5 h-3.5" />Bank (Open Banking)</span>}
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
                  <p className="text-xs text-muted-foreground mt-4">
                    To connect or disconnect services, go to the{" "}
                    <Link href="/onboarding" className="text-primary hover:underline">onboarding flow</Link>.
                  </p>
                </SectionCard>

                {/* Save footer */}
                <div className="pb-8">
                  <Button className="w-full h-12 rounded-full gap-2" onClick={handleSave}>
                    {saved ? <><CheckCircle2 className="w-4 h-4" /> Changes Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'subscription' && <SubscriptionTab />}
            {activeTab === 'billing'      && <BillingTab />}
            {activeTab === 'privacy'      && <PrivacyTab />}
            {activeTab === 'consent'      && <DataConsentTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
