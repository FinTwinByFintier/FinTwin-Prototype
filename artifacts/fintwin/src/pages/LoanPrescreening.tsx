import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useSearch } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";
import { usePrescreening } from "@/context/PrescreeningContext";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BANK_PRODUCTS, buildAutoProfile, evaluateReadiness,
  calcManualCompletion, demoManualInputs,
} from "@/lib/prescreeningEngine";
import type { BankProduct, CriterionResult, ManualInputs, ReadinessResult, Verdict } from "@/lib/prescreeningEngine";
import {
  fetchScoringSummary, fetchLoanProducts, submitLoanApplication, respondToLoanOffer,
  fetchDashboardSummary, requestLoanQuote, fetchBusinessProfile,
  type LoanApplication, type LoanProduct,
} from "@/lib/api";
import {
  Bell, X, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle,
  XCircle, Leaf, BarChart3, FileText, Users, Globe, Target,
  Landmark, ArrowRight, Clock, Loader2, Sparkles, ExternalLink,
  Building, Banknote, Upload, Download, Paperclip, Bug,
} from "lucide-react";
import jsPDF from "jspdf";
import { storageAuthHeaders } from "@/lib/storageToken";

function apiProductToBank(p: LoanProduct): BankProduct {
  return {
    id: p.id,
    tag: p.tag,
    tagColor: p.tag_color || "text-primary",
    name: p.name,
    bank: p.bank,
    maxAmountJOD: Number(p.max_amount_jod) || 0,
    rate: p.rate,
    rateValue: p.rate_value,
    matchPct: p.match_pct,
    minCreditScore: p.min_credit_score,
    minYearsOperation: p.min_years_operation,
    requiresRegistration: p.requires_registration,
    requiresGreenScore: p.requires_green_score,
    minGreenScore: p.min_green_score,
    requiresGreenSector: p.requires_green_sector,
    description: p.description,
  };
}

function readinessFromApplication(
  app: LoanApplication,
  product: BankProduct,
  credit: number,
  green: number,
  state: Parameters<typeof evaluateReadiness>[1],
  inputs: ManualInputs,
): ReadinessResult {
  const detail = (app.readiness_detail || {}) as Record<string, unknown>;
  if (Array.isArray(detail.credit_criteria) || Array.isArray(detail.creditCriteria)) {
    return {
      creditCriteria: (detail.credit_criteria || detail.creditCriteria) as CriterionResult[],
      greenCriteria: (detail.green_criteria || detail.greenCriteria || []) as CriterionResult[],
      creditVerdict: (detail.credit_verdict || detail.creditVerdict || "pass") as Verdict,
      greenVerdict: (detail.green_verdict || detail.greenVerdict || "pass") as Verdict,
      overallVerdict: (detail.overall_verdict || detail.overallVerdict || app.readiness_verdict || "ready") as ReadinessResult["overallVerdict"],
      rateTier: String(detail.rate_tiers || detail.rateTier || ""),
      greenClassification: (detail.green_classification || detail.greenClassification) as string | undefined,
      applicationScore: app.application_score || Number(detail.application_score || detail.applicationScore || 0),
      blockers: Number(detail.blockers || 0),
    };
  }
  return evaluateReadiness(product, state, credit, green, inputs);
}

const LOAN_PURPOSE_ICONS: Record<string, React.ElementType> = {
  'working-capital': Banknote,
  'equipment': Building,
  'expansion': Globe,
  'green': Leaf,
  'inventory': FileText,
  'other': Target,
};

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/* ── Helpers ─────────────────────────────────────────────── */
function StatusBadge({ status }: { status: 'complete' | 'partial' | 'missing' | 'uploaded' }) {
  const { t } = useTranslation();
  if (status === 'uploaded') return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{t('prescreening.step2.docStatus.uploaded')}</span>;
  if (status === 'complete') return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{t('prescreening.step2.docStatus.complete')}</span>;
  if (status === 'partial')  return <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" />{t('prescreening.step2.docStatus.partial')}</span>;
  return                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" />{t('prescreening.step2.docStatus.missing')}</span>;
}
// legacy alias
const statusBadge = (status: 'complete' | 'partial' | 'missing' | 'uploaded') => <StatusBadge status={status} />;

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

/* ── Document upload row ─────────────────────────────────── */
function DocUploadRow({ label, status }: { label: string; status: 'complete' | 'partial' | 'missing' }) {
  const { uploadedDocs, setUploadedDoc } = usePrescreening();
  const { t } = useTranslation();
  const uploaded = uploadedDocs[label];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploadError(null);

    const tUpload = (key: string) => { /* resolved in component via hook */ return key; };
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('file-type-error');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('file-size-error');
      return;
    }

    setUploading(true);
    try {
      // Step 1: Request presigned URL (requires session token)
      const authHeaders = await storageAuthHeaders();
      const metaRes = await fetch('/api/storage/uploads/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!metaRes.ok) throw new Error('Could not get upload URL');
      const { uploadURL, objectPath } = await metaRes.json() as { uploadURL: string; objectPath: string };

      // Step 2: Upload directly to GCS (presigned URL — no auth header needed)
      const putRes = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!putRes.ok) throw new Error('Upload to storage failed');

      setUploadedDoc(label, { fileName: file.name, objectPath });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const effectiveStatus = uploaded ? 'uploaded' : status;

  return (
    <div className="flex items-center justify-between text-xs gap-3">
      <div className="flex-grow min-w-0">
        <span className={effectiveStatus === 'missing' && !uploaded ? 'text-muted-foreground' : ''}>{label}</span>
        {uploaded && (
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <Paperclip className="w-3 h-3" />{uploaded.fileName}
          </p>
        )}
        {uploadError && (
          <p className="text-[10px] text-red-500 mt-0.5">
            {uploadError === 'file-type-error' ? t('prescreening.step2.fileErrors.type') :
             uploadError === 'file-size-error' ? t('prescreening.step2.fileErrors.size') : uploadError}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {statusBadge(effectiveStatus)}
        {(status === 'missing' || status === 'partial') && !uploaded && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 border border-primary/30 rounded-full px-2 py-0.5 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploading ? t('common.uploading') : t('common.upload')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── getDisplayValue helper ──────────────────────────────── */
/**
 * Sanitises any value before it is printed in the PDF.
 * Returns "Not Available" for null, undefined, empty strings, whitespace,
 * and known placeholder / demo / mock strings.
 * Otherwise returns the trimmed string representation.
 */
const PLACEHOLDER_SET = new Set([
  'n/a', '-', '--', '—', '–', 'na', 'none', 'null', 'undefined',
  'lorem ipsum', 'test', 'example', 'sample', 'unknown', 'demo',
  'your business', 'placeholder', 'not provided', 'tbd',
  'to be determined', 'demo msme trading co.', 'demo msme trading co',
  'food & hospitality', 'micro enterprise', 'your business name',
  '0 jod', '0', '—', '0 jod/mo',
]);

function getDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return 'Not Available';
  const str = String(value).trim();
  if (!str) return 'Not Available';
  if (PLACEHOLDER_SET.has(str.toLowerCase())) return 'Not Available';
  // Catch bare zero amounts shown as "0 ..." or just "0"
  if (/^0(\s+(jod|jod\/mo))?$/i.test(str)) return 'Not Available';
  return str;
}

/* ── PDF generator ───────────────────────────────────────── */
function generateApplicationPDF(params: {
  businessName: string;
  product: BankProduct;
  referenceNumber: string;
  result: ReturnType<typeof evaluateReadiness>;
  uploadedDocs: Record<string, { fileName: string; objectPath: string }>;
  manualInputs: ReturnType<typeof import('@/lib/prescreeningEngine')['emptyManualInputs']>;
  quotedRate?: string;
  quotedAmount?: number;
}) {
  const {
    businessName, product, referenceNumber, result, uploadedDocs, manualInputs,
    quotedRate, quotedAmount,
  } = params;

  const safeBusinessName = getDisplayValue(businessName);
  const amountLabel = (quotedAmount && quotedAmount > 0)
    ? `${quotedAmount.toLocaleString()} JOD`
    : 'Not Available';
  const rateLabel = getDisplayValue(quotedRate);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 20;
  const col2 = 110;
  let y = 0;

  // ── Helpers ──
  const nl = (extra = 6) => { y += extra; };
  const line = (x1: number, y1: number, x2: number, y2: number, r = 0, g = 0, b = 0) => {
    doc.setDrawColor(r, g, b);
    doc.line(x1, y1, x2, y2);
  };
  const text = (str: string, x: number, bold = false, size = 10, r = 40, g = 40, b = 40) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(r, g, b);
    doc.text(str, x, y);
  };
  const kv = (key: string, rawValue: unknown) => {
    const value = getDisplayValue(rawValue);
    text(key, margin, false, 9, 100, 100, 100);
    text(value, col2, true, 9, 40, 40, 40);
    nl(6);
  };
  const sectionTitle = (title: string) => {
    nl(4);
    doc.setFillColor(245, 247, 250);
    doc.rect(margin - 2, y - 4, W - (margin * 2) + 4, 8, 'F');
    text(title, margin, true, 10, 30, 30, 30);
    nl(7);
    line(margin, y, W - margin, y, 220, 220, 220);
    nl(4);
  };
  const ensurePage = (needed = 14) => {
    if (y + needed > 270) { doc.addPage(); y = 20; }
  };

  // ─── Cover Page ───────────────────────────────────────────
  // Header bar
  doc.setFillColor(15, 98, 254);
  doc.rect(0, 0, W, 40, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('FinTwin', margin, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('AI-Powered MSME Finance Platform', margin, 26);
  doc.setFontSize(9);
  doc.text('Jordan — Built for Jordanian Small Business Owners', margin, 33);

  y = 55;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text('Pre-Screened Application Package', margin, y);
  nl(8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('This package contains your FinTwin prescreening results and profile summary.', margin, y);
  nl(5);
  doc.text('Present it to your bank to fast-track your loan application.', margin, y);

  nl(12);
  line(margin, y, W - margin, y, 200, 200, 200);
  nl(8);

  // Application summary box
  doc.setFillColor(248, 255, 252);
  doc.setDrawColor(180, 220, 180);
  doc.roundedRect(margin, y - 2, W - (margin * 2), 58, 3, 3, 'FD');
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(60, 130, 60);
  doc.text('APPLICATION DETAILS', margin + 4, y);
  nl(6);

  kv('Business Name', safeBusinessName);
  kv('Reference', referenceNumber);
  kv('Product', `${product.name} — ${product.bank}`);
  kv('Amount', amountLabel);
  if (rateLabel !== 'Not Available') kv('Rate', `${rateLabel} per year`);
  kv('Status', result.overallVerdict === 'ready' ? 'All Criteria Met' : 'Ready with Minor Caveats');
  kv('Application Score', `${result.applicationScore} / 100`);
  kv('Generated', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }));

  nl(8);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('FinTwin does not submit to the bank on your behalf. This is a reference document only.', margin, y);

  // ─── Page 2: Prescreening Results ────────────────────────
  doc.addPage();
  y = 20;

  sectionTitle('PRESCREENING RESULTS — CREDIT CRITERIA');

  const verdictLabel = (v: Verdict) => v === 'pass' ? 'Pass' : v === 'marginal' ? 'Marginal' : 'Fail';
  const verdictColors: Record<Verdict, [number, number, number]> = {
    pass: [34, 139, 34],
    marginal: [184, 134, 11],
    fail: [200, 50, 50],
  };

  for (const c of result.creditCriteria) {
    ensurePage(18);
    const [r, g, b] = verdictColors[c.verdict];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(c.label, margin, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(r, g, b);
    doc.text(verdictLabel(c.verdict), W - margin, y, { align: 'right' });
    nl(5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const actualDisplay = getDisplayValue(c.actual);
    const requiredDisplay = getDisplayValue(c.required);
    doc.text(`Actual: ${actualDisplay}   Required: ${requiredDisplay}`, margin, y);
    nl(4);
    if (c.fix && c.verdict !== 'pass') {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(150, 100, 20);
      doc.text(`Note: ${c.fix}`, margin, y);
      nl(4);
    }
    line(margin, y, W - margin, y, 235, 235, 235);
    nl(5);
  }

  if (result.greenCriteria.length > 0) {
    ensurePage(20);
    sectionTitle('GREEN TAXONOMY CRITERIA');
    for (const c of result.greenCriteria) {
      ensurePage(18);
      const [r, g, b] = verdictColors[c.verdict];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      doc.text(c.label, margin, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(r, g, b);
      doc.text(verdictLabel(c.verdict), W - margin, y, { align: 'right' });
      nl(5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const actualDisplay = getDisplayValue(c.actual);
      const requiredDisplay = getDisplayValue(c.required);
      doc.text(`Actual: ${actualDisplay}   Required: ${requiredDisplay}`, margin, y);
      nl(4);
      line(margin, y, W - margin, y, 235, 235, 235);
      nl(5);
    }
  }

  // ─── Business Plan & Loan Purpose ────────────────────────
  const safePlan = manualInputs.businessPlan?.trim();
  const safePurpose = manualInputs.loanPurposeDescription?.trim();
  const safePurposeCategory = getDisplayValue(manualInputs.loanPurposeCategory);

  if (safePlan || safePurpose || safePurposeCategory !== 'Not Available') {
    ensurePage(30);
    sectionTitle('APPLICANT-PROVIDED INFORMATION');

    if (safePlan) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      doc.text('Business Plan', margin, y);
      nl(5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      const bpLines = doc.splitTextToSize(safePlan, W - margin * 2);
      for (const l of bpLines.slice(0, 10)) {
        ensurePage(6);
        doc.text(l, margin, y);
        nl(5);
      }
      nl(2);
    } else {
      kv('Business Plan', 'Not Available');
    }

    if (safePurpose) {
      ensurePage(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      doc.text('Loan Purpose', margin, y);
      nl(5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      const lpLines = doc.splitTextToSize(safePurpose, W - margin * 2);
      for (const l of lpLines.slice(0, 6)) {
        ensurePage(6);
        doc.text(l, margin, y);
        nl(5);
      }
    } else {
      kv('Loan Purpose', safePurposeCategory !== 'Not Available' ? safePurposeCategory : 'Not Available');
    }

    if (manualInputs.mgmtYearsExperience || manualInputs.mgmtBackground || manualInputs.mgmtTeamSize) {
      ensurePage(20);
      nl(3);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      doc.text('Management Information', margin, y);
      nl(5);
      kv('Years of experience', manualInputs.mgmtYearsExperience);
      kv('Team size', manualInputs.mgmtTeamSize);
      kv('Prior loans repaid', manualInputs.mgmtPriorLoansRepaid);
      kv('Background', manualInputs.mgmtBackground);
    }

    if (manualInputs.industrySector || manualInputs.industryDescription) {
      ensurePage(20);
      nl(3);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      doc.text('Market & Industry Context', margin, y);
      nl(5);
      kv('Target market / sector', manualInputs.industrySector);
      if (manualInputs.industryDescription?.trim()) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(60, 60, 60);
        const idLines = doc.splitTextToSize(manualInputs.industryDescription.trim(), W - margin * 2);
        for (const l of idLines.slice(0, 6)) {
          ensurePage(6);
          doc.text(l, margin, y);
          nl(5);
        }
      }
    }
  }

  // ─── Uploaded Documents ───────────────────────────────────
  const uploadedEntries = Object.entries(uploadedDocs);
  if (uploadedEntries.length > 0) {
    ensurePage(30);
    sectionTitle('UPLOADED SUPPORTING DOCUMENTS');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text('The following documents have been uploaded to FinTwin Object Storage:', margin, y);
    nl(7);
    for (const [label, info] of uploadedEntries) {
      ensurePage(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      doc.text(`\u2022 ${label}`, margin, y);
      nl(5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`  File: ${getDisplayValue(info.fileName)}`, margin, y);
      nl(5);
    }
    nl(3);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Original files are securely stored and available on request via your FinTwin reference number.', margin, y);
  }

  // ─── Footer on last page ──────────────────────────────────
  nl(10);
  line(margin, y, W - margin, y, 200, 200, 200);
  nl(5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text(`FinTwin — AI-Powered MSME Finance Platform, Jordan  |  Ref: ${referenceNumber}  |  ${new Date().toLocaleDateString('en-GB')}`, margin, y);

  doc.save(`FinTwin-Application-${referenceNumber}.pdf`);
}

/* ── Step indicator ──────────────────────────────────────── */
function StepIndicator({ current }: { current: number }) {
  const { t } = useTranslation();
  const STEP_LABELS = [
    t('prescreening.steps.selectLoan'),
    t('prescreening.steps.reviewProfile'),
    t('prescreening.steps.yourDetails'),
    t('prescreening.steps.readinessCheck'),
  ];
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
  const { selectedProductId, setSelectedProductId, nextStep, scoring, products } = usePrescreening();
  const { t } = useTranslation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselect = params.get('productId');
  const CREDIT_SCORE = scoring?.credit_score ?? 0;
  const GREEN_SCORE = scoring?.green_score ?? 62;
  const catalogue = products.length ? products.map(apiProductToBank) : BANK_PRODUCTS;

  useEffect(() => {
    if (preselect && catalogue.find(p => p.id === preselect)) {
      setSelectedProductId(preselect);
    } else if (preselect === 'new-loan') {
      const amount = parseInt(params.get('amount') ?? '0', 10);
      setSelectedProductId(amount <= 15000 ? 'msme-jlgc' : 'murabaha-arab-bank');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogue.length]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">{t('prescreening.step1.heading')}</h2>
        <p className="text-sm text-muted-foreground">{t('prescreening.step1.sub')}</p>
      </div>

      <div className="space-y-4">
        {catalogue.map(p => {
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
                      {t('prescreening.matchPct', { pct: p.matchPct })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm mb-0.5">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{p.description}</p>

                  {/* Score bar */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">{t('dashboard.creditReadiness')}</span>
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
                          <span className="text-muted-foreground">{t('dashboard.greenFinanceScore')}</span>
                          <span className={`font-bold ${GREEN_SCORE >= p.minGreenScore ? 'text-emerald-600' : 'text-amber-500'}`}>{GREEN_SCORE} / min {p.minGreenScore}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden relative">
                          <div className="absolute h-full bg-muted-foreground/20 rounded-full" style={{ width: `${p.minGreenScore}%` }} />
                          <div className={`h-full rounded-full ${GREEN_SCORE >= p.minGreenScore ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${GREEN_SCORE}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="text-[10px] text-muted-foreground">{t('prescreening.rateFromBank')}</div>
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
          {t('prescreening.step1.continueBtn')} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}

/* ── Step 2: Auto-generated profile ──────────────────────── */
function StepAutoProfile({ product }: { product: BankProduct }) {
  const { state } = useOnboarding();
  const { nextStep, prevStep, uploadedDocs, scoring, twinMetrics } = usePrescreening();
  const { t } = useTranslation();
  const [openSection, setOpenSection] = useState<string | null>('identity');
  const CREDIT_SCORE = scoring?.credit_score ?? 0;
  const GREEN_SCORE = scoring?.green_score ?? 62;

  const profile = buildAutoProfile(state, CREDIT_SCORE, GREEN_SCORE, twinMetrics);
  const docs = profile.documents(product);

  const uploadCount = Object.keys(uploadedDocs).length;
  const uploadableDocs = docs.filter(d => d.status === 'missing' || d.status === 'partial');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold">{t('prescreening.step2.heading')}</h2>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${product.tagColor} bg-current/10`}>{product.bank}</span>
        </div>
        <p className="text-sm text-muted-foreground">{t('prescreening.step2.sub')}</p>
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

      {/* Document readiness with upload */}
      <div className="bg-muted/30 border rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            {t('prescreening.step2.docReadiness', { bank: product.bank })}
          </h3>
          {uploadCount > 0 && (
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              {t('prescreening.step2.uploaded', { count: uploadCount })}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {docs.map(doc => (
            <DocUploadRow key={doc.label} label={doc.label} status={doc.status} />
          ))}
        </div>

        {uploadableDocs.length > 0 ? (
          <div className="mt-3 pt-3 border-t border-muted">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Upload className="w-3 h-3 shrink-0" />
              {t('prescreening.step2.uploadHint')}
            </p>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground mt-3">
            {t('prescreening.step2.missingDocNote')}
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep} className="gap-2"><ChevronLeft className="w-4 h-4 rtl:rotate-180" />{t('common.back')}</Button>
        <Button onClick={nextStep} className="gap-2">{t('prescreening.step2.continueBtn')} <ChevronRight className="w-4 h-4 rtl:rotate-180" /></Button>
      </div>
    </div>
  );
}

/* ── Step 3: Manual inputs ────────────────────────────────── */
function StepManualInputs({ product }: { product: BankProduct }) {
  const { manualInputs, setManualInput, nextStep, prevStep } = usePrescreening();
  const { t } = useTranslation();
  const completion = calcManualCompletion(manualInputs);
  const LOAN_PURPOSES = [
    { value: 'working-capital', label: t('prescreening.step3.loanPurposes.workingCapital'), icon: Banknote },
    { value: 'equipment',       label: t('prescreening.step3.loanPurposes.equipment'),      icon: Building },
    { value: 'expansion',       label: t('prescreening.step3.loanPurposes.expansion'),      icon: Globe },
    { value: 'green',           label: t('prescreening.step3.loanPurposes.green'),          icon: Leaf },
    { value: 'inventory',       label: t('prescreening.step3.loanPurposes.inventory'),      icon: FileText },
    { value: 'other',           label: t('prescreening.step3.loanPurposes.other'),          icon: Target },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Sticky completion bar */}
      <div className="sticky top-[112px] z-10 bg-background/95 backdrop-blur border rounded-2xl px-5 py-3 mb-5 flex items-center gap-4">
        <div className="flex-grow">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium">{t('prescreening.step3.completeness')}</span>
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
          {completion < 60 ? t('prescreening.step3.fillMore') : t('prescreening.step3.lookingStrong')}
        </span>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">{t('prescreening.step3.heading')}</h2>
        <p className="text-sm text-muted-foreground">{t('prescreening.step3.sub')}</p>
      </div>

      <div className="space-y-4">
        {/* Business plan */}
        <div className="bg-card border rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" />{t('prescreening.step3.businessPlanTitle')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t('prescreening.step3.businessPlanDesc')}</p>
            </div>
            <span className="text-[10px] text-muted-foreground italic shrink-0 ml-3">{t('prescreening.step3.businessPlanWhy')}</span>
          </div>
          <Textarea
            value={manualInputs.businessPlan}
            onChange={e => setManualInput('businessPlan', e.target.value)}
            placeholder={t('prescreening.step3.businessPlanPlaceholder')}
            className="min-h-[100px] text-sm resize-none"
          />
          <p className="text-[10px] text-muted-foreground mt-2">{t('prescreening.step3.charCount', { count: manualInputs.businessPlan.length })}</p>
        </div>

        {/* Management quality */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-muted-foreground" />{t('prescreening.step3.mgmtTitle')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">{t('prescreening.step3.yearsExperience')}</Label>
              <Input value={manualInputs.mgmtYearsExperience} onChange={e => setManualInput('mgmtYearsExperience', e.target.value)} placeholder={t('prescreening.step3.yearsExperiencePlaceholder')} className="h-10 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">{t('prescreening.step3.teamSize')}</Label>
              <Input value={manualInputs.mgmtTeamSize} onChange={e => setManualInput('mgmtTeamSize', e.target.value)} placeholder={t('prescreening.step3.teamSizePlaceholder')} className="h-10 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">{t('prescreening.step3.priorLoans')}</Label>
              <Input value={manualInputs.mgmtPriorLoansRepaid} onChange={e => setManualInput('mgmtPriorLoansRepaid', e.target.value)} placeholder={t('prescreening.step3.priorLoansPlaceholder')} className="h-10 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">{t('prescreening.step3.background')}</Label>
              <Input value={manualInputs.mgmtBackground} onChange={e => setManualInput('mgmtBackground', e.target.value)} placeholder={t('prescreening.step3.backgroundPlaceholder')} className="h-10 text-sm" />
            </div>
          </div>
        </div>

        {/* Industry & market */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><Globe className="w-4 h-4 text-muted-foreground" />{t('prescreening.step3.industryTitle')}</h3>
          <div className="mb-3">
            <Label className="text-xs mb-1.5 block">{t('prescreening.step3.targetMarket')}</Label>
            <Input value={manualInputs.industrySector} onChange={e => setManualInput('industrySector', e.target.value)} placeholder={t('prescreening.step3.targetMarketPlaceholder')} className="h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">{t('prescreening.step3.marketContext')}</Label>
            <Textarea
              value={manualInputs.industryDescription}
              onChange={e => setManualInput('industryDescription', e.target.value)}
              placeholder={t('prescreening.step3.marketContextPlaceholder')}
              className="min-h-[80px] text-sm resize-none"
            />
          </div>
        </div>

        {/* Loan purpose */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-muted-foreground" />{t('prescreening.step3.loanPurposeTitle')}</h3>
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
              <span>{t('prescreening.step3.greenPurposeHint')}</span>
            </div>
          )}
          <Textarea
            value={manualInputs.loanPurposeDescription}
            onChange={e => setManualInput('loanPurposeDescription', e.target.value)}
            placeholder={t('prescreening.step3.loanPurposeDescPlaceholder')}
            className="min-h-[80px] text-sm resize-none"
          />
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={prevStep} className="gap-2"><ChevronLeft className="w-4 h-4 rtl:rotate-180" />{t('common.back')}</Button>
        <Button onClick={nextStep} className="gap-2">
          {t('prescreening.step3.runReadinessBtn')} <Sparkles className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ── Step 4: Readiness gate ──────────────────────────────── */
function StepReadinessGate({ product }: { product: BankProduct }) {
  const { state } = useOnboarding();
  const {
    manualInputs, prevStep, submitted, setSubmitted, referenceNumber, setReferenceNumber,
    scoring, setSubmittedApplication, submittedApplication, twinMetrics,
    liveQuote, setLiveQuote, quoteAmount, setQuoteAmount,
  } = usePrescreening();
  const { t } = useTranslation();
  const [analysing, setAnalysing] = useState(true);
  const [quoting, setQuoting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const CREDIT_SCORE = scoring?.credit_score ?? 0;
  const GREEN_SCORE = scoring?.green_score ?? 62;

  useEffect(() => {
    const amount = Math.min(product.maxAmountJOD || 10000, 10000);
    setQuoteAmount(amount);
    setQuoting(true);
    requestLoanQuote({
      product_id: product.id,
      amount,
      tenor_months: 36,
      loan_category: 'Business',
      loan_type: 'Business financing',
    })
      .then(setLiveQuote)
      .catch(() => setLiveQuote(null))
      .finally(() => setQuoting(false));

    const timer = setTimeout(() => setAnalysing(false), 1800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const result = submittedApplication
    ? readinessFromApplication(submittedApplication, product, CREDIT_SCORE, GREEN_SCORE, state, manualInputs)
    : evaluateReadiness(product, state, CREDIT_SCORE, GREEN_SCORE, manualInputs, twinMetrics);

  const displayRate =
    liveQuote?.rate
    || submittedApplication?.quoted_rate
    || '';
  const displayAmount = quoteAmount;
  const quoteSource = liveQuote?.quote_source || submittedApplication?.quote_source || '';

  const productSub = quoting
    ? `${product.bank} · ${t('prescreening.fetchingQuote')}`
    : displayRate
      ? t('prescreening.step4.productSubQuote', {
          bank: product.bank,
          rate: displayRate,
          amount: displayAmount.toLocaleString(),
          source: quoteSource === 'sandbox'
            ? t('dashboard.liveBankQuote')
            : t('dashboard.estimatedQuote'),
        })
      : `${product.bank} · ${t('prescreening.rateFromBank')}`;
  const isReady = result.overallVerdict !== 'not-ready';

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const amount = quoteAmount || Math.min(product.maxAmountJOD || 10000, 10000);
      const app = await submitLoanApplication({
        product_id: product.id,
        requested_amount: amount,
        tenor_months: 36,
        financing_need: manualInputs.loanPurposeDescription || manualInputs.loanPurposeCategory || product.description,
        manual_profile: { ...manualInputs },
      });
      setSubmittedApplication(app);
      setReferenceNumber(app.reference_number);
      setSubmitted(true);
    } catch (e: any) {
      setSubmitError(e?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }, [manualInputs, product, quoteAmount, setReferenceNumber, setSubmitted, setSubmittedApplication]);

  if (submitted) {
    return <SubmissionSuccess product={product} refNum={referenceNumber} application={submittedApplication} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {analysing ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <h2 className="text-lg font-semibold mb-1">{t('prescreening.step4.analysingTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('prescreening.step4.analysingChecking', { product: product.name })}</p>
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-5">
              <h2 className="text-xl font-bold mb-1">{t('prescreening.step4.headingReady', { product: product.name })}</h2>
              <p className="text-sm text-muted-foreground">{productSub}</p>
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
                    <h3 className="font-semibold text-sm flex items-center gap-2"><Leaf className="w-4 h-4" />{t('prescreening.step4.greenTaxonomy')}</h3>
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      result.greenVerdict === 'pass' ? 'bg-emerald-200 text-emerald-800' :
                      result.greenVerdict === 'marginal' ? 'bg-amber-200 text-amber-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {result.greenVerdict === 'pass' ? t('prescreening.step4.verdictEligible') : result.greenVerdict === 'marginal' ? t('prescreening.step4.verdictMarginal') : t('prescreening.step4.verdictNotEligible')}
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
                <span className="text-sm font-medium">{t('prescreening.step4.overallStrength')}</span>
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
            {submitError && (
              <p className="text-xs text-red-600 mb-3">{submitError}</p>
            )}
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
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-2 text-xs">
      {verdictIcon(c.verdict)}
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate">{c.label}</span>
          <span className="text-muted-foreground shrink-0">{c.actual}</span>
        </div>
        <span className="text-muted-foreground text-[10px]">{t('prescreening.step4.required', { val: c.required })}</span>
        {c.fix && c.verdict !== 'pass' && (
          <p className="text-[10px] text-amber-700 mt-0.5">{c.fix}</p>
        )}
      </div>
    </div>
  );
}

function NotReadyPanel({ result, onBack }: { result: ReturnType<typeof evaluateReadiness>; onBack: () => void }) {
  const { t } = useTranslation();
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
          <h3 className="font-semibold text-red-800">{t('prescreening.step4.notReady.title')}</h3>
          <p className="text-xs text-red-600">{result.blockers > 1 ? t('prescreening.step4.notReady.blockersPlural', { count: result.blockers }) : t('prescreening.step4.notReady.blockers', { count: result.blockers })}</p>
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
        <Button variant="outline" onClick={onBack} className="gap-2 flex-1"><ChevronLeft className="w-4 h-4 rtl:rotate-180" />{t('prescreening.step4.notReady.editDetails')}</Button>
        <Button variant="outline" onClick={onBack} className="gap-2 flex-1">{t('prescreening.step4.notReady.recheck')} <ArrowRight className="w-4 h-4 rtl:rotate-180" /></Button>
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
  const { uploadedDocs, manualInputs, referenceNumber, scoring, submittedApplication, twinMetrics, liveQuote, quoteAmount } = usePrescreening();
  const { t } = useTranslation();
  const businessName = twinMetrics.displayName || state.businessName || 'Your business';
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const uploadCount = Object.keys(uploadedDocs).length;
  const CREDIT_SCORE = scoring?.credit_score ?? 0;
  const GREEN_SCORE = scoring?.green_score ?? 62;
  const quotedRate = liveQuote?.rate || submittedApplication?.quoted_rate || '';
  const quotedAmount = quoteAmount || Number(submittedApplication?.requested_amount) || 0;

  const handleDownloadPdf = useCallback(async () => {
    setGeneratingPdf(true);
    try {
      generateApplicationPDF({
        businessName, product, referenceNumber, result, uploadedDocs, manualInputs,
        quotedRate, quotedAmount,
      });
    } finally {
      setGeneratingPdf(false);
    }
  }, [businessName, product, referenceNumber, result, uploadedDocs, manualInputs, quotedRate, quotedAmount]);

  return (
    <div className="border-2 border-emerald-300 bg-emerald-50 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-emerald-800">
            {result.overallVerdict === 'ready' ? t('prescreening.step4.ready.readyTitle') : t('prescreening.step4.ready.likelyTitle')}
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
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{t('prescreening.step4.ready.packageTitle')}</p>
        <div className="space-y-2">
          {[
            { label: t('prescreening.step4.ready.applicant'), value: businessName },
            { label: t('prescreening.step4.ready.product'), value: `${product.name} — ${product.bank}` },
            {
              label: t('prescreening.step4.ready.amountRequested'),
              value: quotedAmount
                ? `${quotedAmount.toLocaleString()} JOD`
                : t('prescreening.rateFromBank'),
            },
            {
              label: t('prescreening.step4.ready.rateTier'),
              value: quotedRate
                ? `${quotedRate} / yr${result.rateTier ? ` (${result.rateTier})` : ''}`
                : t('prescreening.rateFromBank'),
            },
            { label: t('prescreening.step4.ready.creditScore'), value: `${CREDIT_SCORE} / 100` },
            ...(product.requiresGreenScore ? [{ label: t('prescreening.step4.ready.greenScore'), value: `${GREEN_SCORE} / 100 — ${t('prescreening.step4.ready.cbgEligible')}` }] : []),
            { label: t('prescreening.step4.ready.prescreeningStatus'), value: result.overallVerdict === 'ready' ? t('prescreening.step4.ready.allCriteriaMet') : t('prescreening.step4.ready.readyWithCaveats') },
            { label: t('prescreening.step4.ready.profileCompleteness'), value: `${result.applicationScore}%` },
            ...(uploadCount > 0 ? [{ label: t('prescreening.step4.ready.docsUploaded'), value: uploadCount > 1 ? t('prescreening.step4.ready.filesAttachedPlural', { count: uploadCount }) : t('prescreening.step4.ready.filesAttached', { count: uploadCount }) }] : []),
          ].map(r => (
            <div key={r.label} className="flex justify-between text-xs py-1 border-b border-emerald-100 last:border-0">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-semibold">{r.value}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 italic">
          {t('prescreening.step4.ready.disclaimer')}
        </p>
      </div>

      {/* Download PDF button */}
      <Button
        onClick={handleDownloadPdf}
        disabled={generatingPdf}
        variant="outline"
        className="w-full gap-2 h-10 mb-3 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
      >
        {generatingPdf
          ? <><Loader2 className="w-4 h-4 animate-spin" />{t('prescreening.step4.ready.generatingPdf')}</>
          : <><Download className="w-4 h-4" />{t('prescreening.step4.ready.downloadPdf')}</>
        }
      </Button>
      {uploadCount > 0 && (
        <p className="text-[10px] text-emerald-700 text-center mb-3">
          {uploadCount > 1 ? t('prescreening.step4.ready.docsInPdfPlural', { count: uploadCount }) : t('prescreening.step4.ready.docsInPdf', { count: uploadCount })}
        </p>
      )}

      <Button onClick={onSubmit} disabled={submitting} className="w-full gap-2 h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />{t('prescreening.step4.ready.finalising')}</> : <><CheckCircle2 className="w-4 h-4" />{t('prescreening.step4.ready.confirmBtn')}</>}
      </Button>
    </div>
  );
}

/* ── Submission success ───────────────────────────────────── */
function SubmissionSuccess({ product, refNum, application }: { product: BankProduct; refNum: string; application: LoanApplication | null }) {
  const [, navigate] = useLocation();
  const { uploadedDocs, manualInputs, scoring, twinMetrics, liveQuote, quoteAmount } = usePrescreening();
  const { state } = useOnboarding();
  const { t } = useTranslation();
  const businessName = twinMetrics.displayName || state.businessName || 'Your business';
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [responding, setResponding] = useState(false);
  const [appState, setAppState] = useState(application);
  const CREDIT_SCORE = scoring?.credit_score ?? 0;
  const GREEN_SCORE = scoring?.green_score ?? 62;
  const result = appState
    ? readinessFromApplication(appState, product, CREDIT_SCORE, GREEN_SCORE, state, manualInputs)
    : evaluateReadiness(product, state, CREDIT_SCORE, GREEN_SCORE, manualInputs, twinMetrics);
  const quotedRate = appState?.quoted_rate || liveQuote?.rate || '';
  const quotedAmount = Number(appState?.requested_amount) || quoteAmount || 0;

  const handleRespond = async (decision: 'approved' | 'rejected') => {
    if (!appState?.id) return;
    setResponding(true);
    try {
      const updated = await respondToLoanOffer(appState.id, decision);
      setAppState(updated);
    } finally {
      setResponding(false);
    }
  };

  const handleDownloadPdf = useCallback(async () => {
    setGeneratingPdf(true);
    try {
      generateApplicationPDF({
        businessName, product, referenceNumber: refNum, result, uploadedDocs, manualInputs,
        quotedRate, quotedAmount,
      });
    } finally {
      setGeneratingPdf(false);
    }
  }, [businessName, product, refNum, result, uploadedDocs, manualInputs, quotedRate, quotedAmount]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto text-center py-12"
    >
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{t('prescreening.success.title')}</h2>
      <p className="text-muted-foreground mb-6">{t('prescreening.success.sub', { product: product.name, bank: product.bank })}</p>
      <div className="bg-card border rounded-2xl p-4 mb-4 text-left space-y-2">
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('prescreening.success.reference')}</span><span className="font-bold font-mono">{refNum}</span></div>
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('prescreening.success.product')}</span><span className="font-semibold">{product.name}</span></div>
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('prescreening.success.bank')}</span><span className="font-semibold">{product.bank}</span></div>
        {quotedAmount > 0 && (
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('prescreening.step4.ready.amountRequested')}</span><span className="font-semibold">{quotedAmount.toLocaleString()} JOD</span></div>
        )}
        {quotedRate && (
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('prescreening.success.quotedRate')}</span><span className="font-semibold">{quotedRate} · {(appState?.quote_source || liveQuote?.quote_source) === 'sandbox' ? t('dashboard.liveBankQuote') : t('dashboard.estimatedQuote')}</span></div>
        )}
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('prescreening.success.expectedResponse')}</span><span className="font-semibold">{t('prescreening.success.responseTime')}</span></div>
        {appState?.monthly_installment && (
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('prescreening.success.monthly')}</span><span className="font-semibold">{Number(appState.monthly_installment).toLocaleString()} JOD</span></div>
        )}
        {appState?.status && (
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('dashboard.loanStatusLabel', { status: appState.status })}</span><span className="font-semibold">{appState.status}</span></div>
        )}
      </div>
      {appState?.id && appState.status === 'pending' && (
        <div className="flex gap-2 mb-3">
          <Button disabled={responding} onClick={() => handleRespond('approved')} className="flex-1 gap-1">{t('prescreening.success.acceptOffer')}</Button>
          <Button disabled={responding} variant="outline" onClick={() => handleRespond('rejected')} className="flex-1 gap-1">{t('prescreening.success.rejectOffer')}</Button>
        </div>
      )}
      {!!appState?.jopacc_reply_messages?.length && (
        <div className="text-xs text-muted-foreground text-left mb-3 space-y-1">
          {appState.jopacc_reply_messages.map((m) => <p key={m}>• {m}</p>)}
        </div>
      )}
      <Button
        onClick={handleDownloadPdf}
        disabled={generatingPdf}
        variant="outline"
        className="w-full gap-2 mb-3"
      >
        {generatingPdf
          ? <><Loader2 className="w-4 h-4 animate-spin" />{t('prescreening.success.generating')}</>
          : <><Download className="w-4 h-4" />{t('prescreening.success.downloadPdf')}</>
        }
      </Button>
      <Button onClick={() => navigate('/my-loans')} className="w-full gap-2 mb-2">
        {t('dashboard.viewMyLoans')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
      </Button>
      <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full gap-2">
        {t('prescreening.success.backToDashboard')}
      </Button>
    </motion.div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
export default function LoanPrescreening() {
  const [, navigate] = useLocation();
  const { state, updateState, hydrateFromProfile, persistProfile } = useOnboarding();
  const {
    currentStep, selectedProductId, reset, setScoring, setProducts, products, setTwinMetrics, twinMetrics,
    setSelectedProductId, replaceManualInputs, goToStep, setUploadedDoc,
  } = usePrescreening();
  const { t } = useTranslation();
  const { toggleLanguage } = useLanguage();

  // Reset flow state on every entry so repeat visits always start fresh
  useEffect(() => {
    reset();
    fetchScoringSummary().then(setScoring).catch(() => {});
    fetchLoanProducts().then((r) => setProducts(r.products || [])).catch(() => {});

    const hydrateProfile = (profile?: Parameters<typeof hydrateFromProfile>[0]) => {
      if (!profile) return;
      hydrateFromProfile(profile);
      const reg = (profile.registration_number || '').trim();
      if (reg) {
        updateState({
          registrationNumber: reg,
          isOfficiallyRegistered: profile.is_officially_registered ?? true,
        });
      }
    };

    fetchBusinessProfile()
      .then((res) => hydrateProfile(res.profile))
      .catch(() => {});

    fetchDashboardSummary()
      .then((summary) => {
        hydrateProfile(summary.profile);
        const name = summary.display_identity?.display_name;
        const debt = parseFloat(summary.monthly_debt?.total_monthly || '0');
        const cash = parseFloat(summary.total_available_balance || '0');
        const cashflow = summary.monthly_cashflow || [];
        const activeMonths = cashflow.filter((m) => m.income || m.expense);
        const avgIn = activeMonths.length
          ? activeMonths.reduce((s, m) => s + m.income, 0) / activeMonths.length
          : undefined;
        const avgOut = activeMonths.length
          ? activeMonths.reduce((s, m) => s + m.expense, 0) / activeMonths.length
          : undefined;
        const last = cashflow[cashflow.length - 1];
        const linked = summary.linked_accounts || [];
        const obAccount =
          linked.find((a) => a.source === 'open_banking') || linked[0];
        const openBankingConnected =
          linked.length > 0
          || !!summary.profile?.connected_cliq
          || state.connectedSources.cliq;
        const reg = (
          summary.profile?.registration_number
          || state.registrationNumber
          || ''
        ).trim();
        const metrics = {
          displayName: name,
          monthlyDebt: Number.isFinite(debt) ? debt : 0,
          monthlyRevenue: last?.income || (
            state.annualRevenue ? parseInt(state.annualRevenue, 10) / 12 : undefined
          ),
          cashBalance: Number.isFinite(cash) ? cash : undefined,
          debtItems: (summary.monthly_debt?.items || []).map((item) => ({
            label: item.label,
            amount: parseFloat(item.amount_monthly || '0') || 0,
          })),
          openBankingConnected,
          accountsLinked: linked.length || summary.twin_completeness?.accounts_linked || 0,
          avgMonthlyInflow: avgIn,
          avgMonthlyOutflow: avgOut,
          bankName: obAccount?.bank_name_en || summary.display_identity?.bank_name || undefined,
          ibanMasked: obAccount?.iban_masked || undefined,
          registrationNumber: reg || undefined,
        };
        setTwinMetrics(metrics);
        if (name && !state.businessName) updateState({ businessName: name });
        if (openBankingConnected && !state.connectedSources.cliq) {
          updateState({ connectedSources: { ...state.connectedSources, cliq: true } });
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const businessName = twinMetrics.displayName || state.businessName || 'Your business';
  const catalogue = products.length ? products.map(apiProductToBank) : BANK_PRODUCTS;
  const product = catalogue.find(p => p.id === selectedProductId) ?? null;

  const handleExit = () => { reset(); navigate('/dashboard'); };

  const handleDemoPrefill = () => {
    const productId = selectedProductId
      || products[0]?.id
      || 'murabaha-arab-bank';
    setSelectedProductId(productId);
    replaceManualInputs(demoManualInputs());
    const reg = (state.registrationNumber || twinMetrics.registrationNumber || '2001694321').trim();
    updateState({
      registrationNumber: reg,
      isOfficiallyRegistered: true,
      businessName: state.businessName || twinMetrics.displayName || 'Demo MSME Trading Co.',
      businessSector: state.businessSector || 'Retail & Trade',
      yearsInOperation: state.yearsInOperation || '4',
      employees: state.employees || '6',
      annualRevenue: state.annualRevenue || '72000',
      connectedSources: {
        jofotara: true,
        cliq: true,
        pos: state.connectedSources.pos,
        receipts: state.connectedSources.receipts,
      },
    });
    setTwinMetrics({
      ...twinMetrics,
      registrationNumber: reg,
      openBankingConnected: true,
      displayName: twinMetrics.displayName || state.businessName || 'Demo MSME Trading Co.',
    });
    setUploadedDoc('Business registration certificate', {
      fileName: 'registration-demo.pdf',
      objectPath: 'demo/registration-demo.pdf',
    });
    setUploadedDoc('Bank statements (3–6 months)', {
      fileName: 'bank-statements-demo.pdf',
      objectPath: 'demo/bank-statements-demo.pdf',
    });
    void persistProfile({
      registration_number: reg,
      is_officially_registered: true,
      business_name: state.businessName || twinMetrics.displayName || 'Demo MSME Trading Co.',
      business_sector: state.businessSector || 'Retail & Trade',
      years_in_operation: state.yearsInOperation || '4',
      employees: state.employees || '6',
      annual_revenue_jod: state.annualRevenue || '72000',
      connected_cliq: true,
      connected_jofotara: true,
    });
    goToStep(3);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight hover:opacity-90 transition-opacity">
            Fin<span className="text-primary">Twin</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDemoPrefill}
              title="Demo: autofill prescreening"
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full border border-dashed border-amber-400/60 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors flex items-center gap-1"
            >
              <Bug className="w-3 h-3" /> Debug fill
            </button>
            <button
              onClick={toggleLanguage}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('lang.switch')}
            </button>
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
              <X className="w-3.5 h-3.5" /> {t('common.exit')}
            </button>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-xs font-medium">{t('prescreening.title')}</span>
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
