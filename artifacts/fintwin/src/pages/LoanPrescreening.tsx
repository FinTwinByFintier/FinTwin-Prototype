import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useSearch } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";
import { usePrescreening } from "@/context/PrescreeningContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BANK_PRODUCTS, buildAutoProfile, evaluateReadiness,
  calcManualCompletion,
} from "@/lib/prescreeningEngine";
import type { BankProduct, CriterionResult, Verdict } from "@/lib/prescreeningEngine";
import {
  Bell, X, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle,
  XCircle, Leaf, BarChart3, FileText, Users, Globe, Target,
  Landmark, ArrowRight, Clock, Loader2, Sparkles, ExternalLink,
  Building, Banknote,
} from "lucide-react";

/* ── Constants ───────────────────────────────────────────── */
const CREDIT_SCORE = 74;
const GREEN_SCORE  = 62;

const STEP_LABELS = ['Select Loan', 'Review Profile', 'Your Details', 'Readiness Check'];

const LOAN_PURPOSES = [
  { value: 'working-capital', label: 'Working Capital', icon: Banknote },
  { value: 'equipment',       label: 'Equipment Purchase', icon: Building },
  { value: 'expansion',       label: 'Expansion / New Location', icon: Globe },
  { value: 'green',           label: 'Green Investment', icon: Leaf },
  { value: 'inventory',       label: 'Inventory / Stock', icon: FileText },
  { value: 'other',           label: 'Other', icon: Target },
];

/* ── Helpers ─────────────────────────────────────────────── */
function statusBadge(status: 'complete' | 'partial' | 'missing') {
  if (status === 'complete') return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Complete</span>;
  if (status === 'partial')  return <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" />Partial</span>;
  return                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" />Missing</span>;
}

function verdictIcon(v: Verdict) {
  if (v === 'pass')     return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
  if (v === 'marginal') return <AlertCircle  className="w-4 h-4 text-amber-500 shrink-0" />;
  return                       <XCircle      className="w-4 h-4 text-red-500 shrink-0" />;
}

function verdictColor(v: Verdict) {
  if (v === 'pass') return 'border-emerald-200 bg-emerald-50';
  if (v === 'marginal') return 'border-amber-200 bg-amber-50';
  return 'border-red-200 bg-red-50';
}

/* ── Step indicator ──────────────────────────────────────── */
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 py-5">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                done   ? 'bg-primary border-primary text-white' :
                active ? 'border-primary text-primary bg-white' :
                         'border-muted text-muted-foreground bg-white'
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : step}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`w-12 h-0.5 mx-1 mb-4 rounded-full transition-colors ${done ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Step 1: Product selector ─────────────────────────────── */
function StepSelectProduct() {
  const { selectedProductId, setSelectedProductId, nextStep } = usePrescreening();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselect = params.get('productId');

  useEffect(() => {
    if (preselect && BANK_PRODUCTS.find(p => p.id === preselect)) {
      setSelectedProductId(preselect);
    } else if (preselect === 'new-loan') {
      // default to JLGC for new loan amounts ≤ 15000, else murabaha
      const amount = parseInt(params.get('amount') ?? '0', 10);
      setSelectedProductId(amount <= 15000 ? 'msme-jlgc' : 'murabaha-arab-bank');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Which loan are you applying for?</h2>
        <p className="text-sm text-muted-foreground">Select the product that best fits your needs. We'll tailor the prescreening to that bank's criteria.</p>
      </div>

      <div className="space-y-4">
        {BANK_PRODUCTS.map(p => {
          const selected = selectedProductId === p.id;
          const meetsCredit = CREDIT_SCORE >= p.minCreditScore;
          const meetsGreen  = !p.requiresGreenScore || GREEN_SCORE >= p.minGreenScore;
          const qualified   = meetsCredit && meetsGreen;

          return (
            <motion.button
              key={p.id}
              onClick={() => setSelectedProductId(selected ? null : p.id)}
              whileTap={{ scale: 0.99 }}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                selected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/30 hover:bg-muted/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Landmark className={`w-5 h-5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${p.tagColor}`}>{p.tag}</span>
                    <span className="text-[10px] text-muted-foreground">{p.bank}</span>
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${qualified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.matchPct}% match
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm mb-0.5">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{p.description}</p>

                  {/* Score bar */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">Your credit score</span>
                        <span className={`font-bold ${CREDIT_SCORE >= p.minCreditScore ? 'text-emerald-600' : 'text-red-500'}`}>{CREDIT_SCORE} / min {p.minCreditScore}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden relative">
                        <div className="absolute h-full bg-muted-foreground/20 rounded-full" style={{ width: `${p.minCreditScore}%` }} />
                        <div className={`h-full rounded-full ${CREDIT_SCORE >= p.minCreditScore ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${CREDIT_SCORE}%` }} />
                      </div>
                    </div>
                    {p.requiresGreenScore ? (
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-muted-foreground">Your green score</span>
                          <span className={`font-bold ${GREEN_SCORE >= p.minGreenScore ? 'text-emerald-600' : 'text-amber-500'}`}>{GREEN_SCORE} / min {p.minGreenScore}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden relative">
                          <div className="absolute h-full bg-muted-foreground/20 rounded-full" style={{ width: `${p.minGreenScore}%` }} />
                          <div className={`h-full rounded-full ${GREEN_SCORE >= p.minGreenScore ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${GREEN_SCORE}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="text-[10px] text-muted-foreground">Rate</div>
                        <div className="font-bold text-sm text-primary">{p.rate} / yr</div>
                        <div className="text-[10px] text-muted-foreground ml-1">· Up to {p.maxAmountJOD.toLocaleString()} JOD</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${selected ? 'border-primary bg-primary' : 'border-muted'}`}>
                  {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex justify-end mt-6">
        <Button disabled={!selectedProductId} onClick={nextStep} className="gap-2">
          Continue to Profile Review <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ── Step 2: Auto-generated profile ──────────────────────── */
function StepAutoProfile({ product }: { product: BankProduct }) {
  const { state } = useOnboarding();
  const { nextStep, prevStep } = usePrescreening();
  const [openSection, setOpenSection] = useState<string | null>('identity');

  const profile = buildAutoProfile(state, CREDIT_SCORE, GREEN_SCORE);
  const docs = profile.documents(product);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold">Your auto-generated profile</h2>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${product.tagColor} bg-current/10`}>{product.bank}</span>
        </div>
        <p className="text-sm text-muted-foreground">This is what FinTwin has gathered from your connected data sources. Review it before continuing — you don't need to re-enter any of this.</p>
      </div>

      <div className="space-y-3 mb-6">
        {profile.sections.map(section => (
          <div key={section.id} className="border rounded-2xl overflow-hidden bg-card">
            <button
              onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm">{section.title}</span>
                {statusBadge(section.status)}
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${openSection === section.id ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {openSection === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t"
                >
                  <div className="px-5 py-4 space-y-2.5">
                    {section.items.map(item => (
                      <div key={item.label} className="flex items-start justify-between gap-4 text-xs">
                        <span className="text-muted-foreground shrink-0 w-40">{item.label}</span>
                        <span className="font-medium flex-grow">{item.value}</span>
                        {item.source && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground shrink-0">{item.source}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Document readiness */}
      <div className="bg-muted/30 border rounded-2xl p-5 mb-6">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          Document readiness — {product.bank}
        </h3>
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.label} className="flex items-center justify-between text-xs">
              <span className={doc.status === 'missing' ? 'text-muted-foreground' : ''}>{doc.label}</span>
              {statusBadge(doc.status)}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          Missing documents won't block your prescreening but will be required at the bank.
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep} className="gap-2"><ChevronLeft className="w-4 h-4" />Back</Button>
        <Button onClick={nextStep} className="gap-2">Looks good — continue <ChevronRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

/* ── Step 3: Manual inputs ────────────────────────────────── */
function StepManualInputs({ product }: { product: BankProduct }) {
  const { manualInputs, setManualInput, nextStep, prevStep } = usePrescreening();
  const completion = calcManualCompletion(manualInputs);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Sticky completion bar */}
      <div className="sticky top-[112px] z-10 bg-background/95 backdrop-blur border rounded-2xl px-5 py-3 mb-5 flex items-center gap-4">
        <div className="flex-grow">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium">Application completeness</span>
            <span className={`font-bold ${completion >= 60 ? 'text-emerald-600' : 'text-amber-500'}`}>{completion}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${completion}%` }}
              transition={{ duration: 0.3 }}
              className={`h-full rounded-full ${completion >= 60 ? 'bg-emerald-500' : completion >= 40 ? 'bg-amber-400' : 'bg-primary'}`}
            />
          </div>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 w-24 text-right">
          {completion < 60 ? 'Fill more to strengthen your application' : 'Looking strong ✓'}
        </span>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">Complete your application</h2>
        <p className="text-sm text-muted-foreground">This is what only you can tell us. It shapes the readiness gate and goes directly into your application package.</p>
      </div>

      <div className="space-y-4">
        {/* Business plan */}
        <div className="bg-card border rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" />Business Plan</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Describe what your business does, your competitive advantage, and your growth plan.</p>
            </div>
            <span className="text-[10px] text-muted-foreground italic shrink-0 ml-3">Why we ask: Banks assess viability before lending.</span>
          </div>
          <Textarea
            value={manualInputs.businessPlan}
            onChange={e => setManualInput('businessPlan', e.target.value)}
            placeholder="Amman Coffee Roasters is a specialty coffee business serving premium roasted beans to retail and hospitality customers across Amman. We differentiate through direct sourcing relationships with Ethiopian and Colombian farms..."
            className="min-h-[100px] text-sm resize-none"
          />
          <p className="text-[10px] text-muted-foreground mt-2">{manualInputs.businessPlan.length} characters · aim for 150+</p>
        </div>

        {/* Management quality */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-muted-foreground" />Management Quality</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">Years of business experience</Label>
              <Input value={manualInputs.mgmtYearsExperience} onChange={e => setManualInput('mgmtYearsExperience', e.target.value)} placeholder="e.g. 7 years" className="h-10 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Management team size</Label>
              <Input value={manualInputs.mgmtTeamSize} onChange={e => setManualInput('mgmtTeamSize', e.target.value)} placeholder="e.g. 2 people" className="h-10 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Prior loans successfully repaid</Label>
              <Input value={manualInputs.mgmtPriorLoansRepaid} onChange={e => setManualInput('mgmtPriorLoansRepaid', e.target.value)} placeholder="e.g. 1 loan, fully repaid" className="h-10 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Background / qualifications</Label>
              <Input value={manualInputs.mgmtBackground} onChange={e => setManualInput('mgmtBackground', e.target.value)} placeholder="e.g. MBA, 10 yrs F&B sector" className="h-10 text-sm" />
            </div>
          </div>
        </div>

        {/* Industry & market */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><Globe className="w-4 h-4 text-muted-foreground" />Industry & Market</h3>
          <div className="mb-3">
            <Label className="text-xs mb-1.5 block">Target market & customer segment</Label>
            <Input value={manualInputs.industrySector} onChange={e => setManualInput('industrySector', e.target.value)} placeholder="e.g. Specialty coffee shops, hotels, and corporate clients in Amman" className="h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Market context & growth potential</Label>
            <Textarea
              value={manualInputs.industryDescription}
              onChange={e => setManualInput('industryDescription', e.target.value)}
              placeholder="The specialty coffee market in Jordan is growing at ~15% annually. We serve 40+ B2B accounts and are expanding to Aqaba..."
              className="min-h-[80px] text-sm resize-none"
            />
          </div>
        </div>

        {/* Loan purpose */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-muted-foreground" />Loan Purpose</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {LOAN_PURPOSES.map(lp => {
              const Icon = lp.icon;
              const selected = manualInputs.loanPurposeCategory === lp.value;
              return (
                <button
                  key={lp.value}
                  onClick={() => setManualInput('loanPurposeCategory', lp.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                    selected ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] font-medium leading-tight">{lp.label}</span>
                </button>
              );
            })}
          </div>
          {product.requiresGreenScore && manualInputs.loanPurposeCategory !== 'green' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 flex items-center gap-2 mb-3">
              <Leaf className="w-3.5 h-3.5 shrink-0" />
              <span>Selecting <strong>Green Investment</strong> strengthens your CBJ green loan eligibility.</span>
            </div>
          )}
          <Textarea
            value={manualInputs.loanPurposeDescription}
            onChange={e => setManualInput('loanPurposeDescription', e.target.value)}
            placeholder="Describe specifically how you'll use the funds and the expected impact on your business..."
            className="min-h-[80px] text-sm resize-none"
          />
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={prevStep} className="gap-2"><ChevronLeft className="w-4 h-4" />Back</Button>
        <Button onClick={nextStep} className="gap-2">
          Run Readiness Check <Sparkles className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ── Step 4: Readiness gate ──────────────────────────────── */
function StepReadinessGate({ product }: { product: BankProduct }) {
  const { state } = useOnboarding();
  const { manualInputs, prevStep, submitted, setSubmitted, referenceNumber } = usePrescreening();
  const [analysing, setAnalysing] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnalysing(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const result = evaluateReadiness(product, state, CREDIT_SCORE, GREEN_SCORE, manualInputs);
  const isReady = result.overallVerdict !== 'not-ready';

  const handleSubmit = useCallback(() => {
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 1400);
  }, [setSubmitted]);

  if (submitted) {
    return <SubmissionSuccess product={product} refNum={referenceNumber} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {analysing ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <h2 className="text-lg font-semibold mb-1">Analysing your profile…</h2>
            <p className="text-sm text-muted-foreground">Checking {product.name} criteria</p>
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-5">
              <h2 className="text-xl font-bold mb-1">Readiness Check — {product.name}</h2>
              <p className="text-sm text-muted-foreground">{product.bank} · {product.rate} / yr · Up to {product.maxAmountJOD.toLocaleString()} JOD</p>
            </div>

            {/* Dual panels */}
            <div className={`grid gap-4 mb-5 ${result.greenCriteria.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {/* Credit */}
              <div className={`border rounded-2xl p-4 ${verdictColor(result.creditVerdict)}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" />Credit Readiness</h3>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    result.creditVerdict === 'pass' ? 'bg-emerald-200 text-emerald-800' :
                    result.creditVerdict === 'marginal' ? 'bg-amber-200 text-amber-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {result.creditVerdict === 'pass' ? 'Passes' : result.creditVerdict === 'marginal' ? 'Marginal' : 'Not Met'}
                  </div>
                </div>
                <div className="space-y-2.5">
                  {result.creditCriteria.map(c => <CriterionRow key={c.label} criterion={c} />)}
                </div>
              </div>

              {/* Green (only for green products) */}
              {result.greenCriteria.length > 0 && (
                <div className={`border rounded-2xl p-4 ${verdictColor(result.greenVerdict)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2"><Leaf className="w-4 h-4" />Green Taxonomy</h3>
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      result.greenVerdict === 'pass' ? 'bg-emerald-200 text-emerald-800' :
                      result.greenVerdict === 'marginal' ? 'bg-amber-200 text-amber-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {result.greenVerdict === 'pass' ? 'Eligible' : result.greenVerdict === 'marginal' ? 'Marginal' : 'Not Eligible'}
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {result.greenCriteria.map(c => <CriterionRow key={c.label} criterion={c} />)}
                  </div>
                </div>
              )}
            </div>

            {/* Application score bar */}
            <div className="bg-card border rounded-2xl p-4 mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall application strength</span>
                <span className="font-bold text-lg">{result.applicationScore}<span className="text-sm font-normal text-muted-foreground"> / 100</span></span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.applicationScore}%` }}
                  transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                  className={`h-full rounded-full ${result.applicationScore >= 70 ? 'bg-emerald-500' : result.applicationScore >= 50 ? 'bg-amber-400' : 'bg-primary'}`}
                />
              </div>
            </div>

            {/* Verdict */}
            {!isReady ? (
              <NotReadyPanel result={result} onBack={prevStep} />
            ) : (
              <ReadyPanel product={product} result={result} onSubmit={handleSubmit} submitting={submitting} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CriterionRow({ criterion: c }: { criterion: CriterionResult }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      {verdictIcon(c.verdict)}
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate">{c.label}</span>
          <span className="text-muted-foreground shrink-0">{c.actual}</span>
        </div>
        <span className="text-muted-foreground text-[10px]">Required: {c.required}</span>
        {c.fix && c.verdict !== 'pass' && (
          <p className="text-[10px] text-amber-700 mt-0.5">{c.fix}</p>
        )}
      </div>
    </div>
  );
}

function NotReadyPanel({ result, onBack }: { result: ReturnType<typeof evaluateReadiness>; onBack: () => void }) {
  const allFixes = [
    ...result.creditCriteria,
    ...result.greenCriteria,
  ].filter(c => c.verdict !== 'pass' && c.fix);

  return (
    <div className="border-2 border-red-200 bg-red-50 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
          <XCircle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h3 className="font-semibold text-red-800">Not ready to apply yet</h3>
          <p className="text-xs text-red-600">{result.blockers} blocker{result.blockers > 1 ? 's' : ''} to resolve before your application will pass</p>
        </div>
      </div>
      <div className="space-y-2.5 mb-4">
        {allFixes.map((c, i) => (
          <div key={c.label} className={`flex items-start gap-3 p-3 rounded-xl ${c.verdict === 'fail' ? 'bg-red-100 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
            <span className={`text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 ${c.verdict === 'fail' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>{i + 1}</span>
            <div className="flex-grow min-w-0">
              <p className="text-xs font-medium text-foreground mb-0.5">{c.label}</p>
              <p className="text-[11px] text-muted-foreground">{c.fix}</p>
              {c.impact && <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">{c.impact}</p>}
            </div>
            {c.fixHref && (
              <a href={c.fixHref} className="shrink-0 text-primary hover:opacity-80">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="gap-2 flex-1"><ChevronLeft className="w-4 h-4" />Edit Details</Button>
        <Button variant="outline" onClick={onBack} className="gap-2 flex-1">Re-check Eligibility <ArrowRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

function ReadyPanel({ product, result, onSubmit, submitting }: {
  product: BankProduct;
  result: ReturnType<typeof evaluateReadiness>;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const { state } = useOnboarding();
  const businessName = state.businessName || 'Amman Coffee Roasters';

  return (
    <div className="border-2 border-emerald-300 bg-emerald-50 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-emerald-800">
            {result.overallVerdict === 'ready' ? 'Ready to apply!' : 'Likely to qualify — apply with confidence'}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">{result.rateTier}</span>
            {result.greenClassification && (
              <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1"><Leaf className="w-3 h-3" />{result.greenClassification}</span>
            )}
          </div>
        </div>
      </div>

      {/* Application summary */}
      <div className="bg-white rounded-xl border border-emerald-200 p-4 mb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Pre-screened Application Package</p>
        <div className="space-y-2">
          {[
            { label: 'Applicant', value: businessName },
            { label: 'Product', value: `${product.name} — ${product.bank}` },
            { label: 'Amount requested', value: `Up to ${product.maxAmountJOD.toLocaleString()} JOD` },
            { label: 'Rate tier', value: `${product.rate} / yr (${result.rateTier})` },
            { label: 'Credit score', value: `${CREDIT_SCORE} / 100` },
            ...(product.requiresGreenScore ? [{ label: 'Green score', value: `${GREEN_SCORE} / 100 — CBJ eligible` }] : []),
            { label: 'Prescreening status', value: result.overallVerdict === 'ready' ? '✓ All criteria met' : '✓ Ready with minor caveats' },
            { label: 'Profile completeness', value: `${result.applicationScore}%` },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-xs py-1 border-b border-emerald-100 last:border-0">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-semibold">{r.value}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 italic">
          FinTwin does not submit to the bank on your behalf. This package is generated for your reference and to accompany your bank visit.
        </p>
      </div>

      <Button onClick={onSubmit} disabled={submitting} className="w-full gap-2 h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Finalising…</> : <><CheckCircle2 className="w-4 h-4" />Confirm Pre-screened Application</>}
      </Button>
    </div>
  );
}

/* ── Submission success ───────────────────────────────────── */
function SubmissionSuccess({ product, refNum }: { product: BankProduct; refNum: string }) {
  const [, navigate] = useLocation();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto text-center py-12"
    >
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Pre-screening complete</h2>
      <p className="text-muted-foreground mb-6">Your pre-screened application package for <strong>{product.name}</strong> is ready. Bring it to {product.bank} to fast-track your application.</p>
      <div className="bg-card border rounded-2xl p-4 mb-6 text-left space-y-2">
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Reference</span><span className="font-bold font-mono">{refNum}</span></div>
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Product</span><span className="font-semibold">{product.name}</span></div>
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Bank</span><span className="font-semibold">{product.bank}</span></div>
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Rate</span><span className="font-semibold">{product.rate} / yr</span></div>
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Expected response</span><span className="font-semibold">3–5 business days</span></div>
      </div>
      <Button onClick={() => navigate('/dashboard')} className="w-full gap-2">
        Back to Dashboard <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
export default function LoanPrescreening() {
  const [, navigate] = useLocation();
  const { state } = useOnboarding();
  const { currentStep, selectedProductId, reset } = usePrescreening();

  // Reset flow state on every entry so repeat visits always start fresh
  useEffect(() => {
    reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const businessName = state.businessName || 'Amman Coffee Roasters';
  const product = BANK_PRODUCTS.find(p => p.id === selectedProductId) ?? null;

  const handleExit = () => { reset(); navigate('/dashboard'); };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">Fin<span className="text-primary">Twin</span></span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground"><Bell className="w-5 h-5" /></Button>
            <button className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm border border-primary/30">
              {businessName.substring(0, 2).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* Sub-header with step indicator */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleExit} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-4">
              <X className="w-3.5 h-3.5" /> Exit
            </button>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-xs font-medium">Loan Prescreening</span>
            {product && <><span className="text-muted-foreground text-xs">·</span><span className={`text-xs font-semibold ${product.tagColor}`}>{product.name}</span></>}
          </div>
          <StepIndicator current={currentStep} />
          <div className="w-24" />
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <StepSelectProduct />
            </motion.div>
          )}
          {currentStep === 2 && product && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <StepAutoProfile product={product} />
            </motion.div>
          )}
          {currentStep === 3 && product && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <StepManualInputs product={product} />
            </motion.div>
          )}
          {currentStep === 4 && product && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <StepReadinessGate product={product} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
