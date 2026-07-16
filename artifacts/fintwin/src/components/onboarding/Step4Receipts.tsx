import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, UploadCloud, CheckCircle2, Loader2, Sparkles, FileImage, FileText, X } from "lucide-react";

type UploadedFile = { name: string; size: string };

export function Step4Receipts() {
  const { state, updateState, setCurrentStep } = useOnboarding();
  const [processingState, setProcessingState] = useState<'idle' | 'processing' | 'done'>('idle');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fakeFiles: UploadedFile[] = [
    { name: "receipt_march_2024.jpg", size: "1.2 MB" },
    { name: "invoice_supplier_042.pdf", size: "340 KB" },
    { name: "bank_statement_q1.pdf", size: "2.1 MB" },
  ];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    triggerUpload();
  };

  const triggerUpload = () => {
    if (processingState !== 'idle') return;
    setUploadedFiles(fakeFiles);
    setProcessingState('processing');
    setTimeout(() => {
      setProcessingState('done');
      updateState({ connectedSources: { ...state.connectedSources, receipts: true } });
    }, 2800);
  };

  const removeFile = (name: string) => {
    setUploadedFiles((f) => f.filter((x) => x.name !== name));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-xl mx-auto"
    >
      {/* Header with optional badge */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-5 border border-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          Optional — but powerful
        </div>
        <h2 className="text-3xl font-bold mb-3">Upload your receipts &amp; documents</h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          For cash-based businesses: our AI reads photos of receipts, invoices, or bank statements and extracts every transaction automatically.
        </p>
      </div>

      {/* AI callout */}
      <div className="flex items-start gap-4 bg-primary/5 border border-primary/15 rounded-2xl p-5 mb-8">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm mb-1">Powered by AI extraction</p>
          <p className="text-sm text-muted-foreground">
            Upload a photo of a handwritten receipt or a scanned invoice — we'll identify amounts, dates, and categories automatically. Perfect for micro businesses still operating with paper records.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {processingState === 'idle' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={triggerUpload}
              className={`border-2 border-dashed rounded-3xl p-14 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/40'
              }`}
            >
              <UploadCloud className="w-14 h-14 text-muted-foreground mb-5" />
              <p className="font-semibold text-lg mb-1">Drop files here, or click to browse</p>
              <p className="text-sm text-muted-foreground">PDF, JPG, PNG up to 20MB each</p>
            </div>
          </motion.div>
        )}

        {processingState === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-card border rounded-3xl p-8"
          >
            <div className="space-y-3 mb-8">
              {uploadedFiles.map((file) => (
                <div key={file.name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  {file.name.endsWith('.pdf') ? (
                    <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />
                  ) : (
                    <FileImage className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  )}
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>
                  <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-semibold mb-1">AI is reading your documents...</h3>
              <p className="text-sm text-muted-foreground">Extracting transactions, amounts, and dates</p>
            </div>
          </motion.div>
        )}

        {processingState === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border-2 border-primary/20 rounded-3xl p-8"
          >
            <div className="space-y-3 mb-8">
              {uploadedFiles.map((file) => (
                <div key={file.name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  {file.name.endsWith('.pdf') ? (
                    <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />
                  ) : (
                    <FileImage className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  )}
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <button onClick={() => removeFile(file.name)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-1">23 transactions extracted</h3>
              <p className="text-sm text-muted-foreground">All documents processed and added to your profile</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between pt-8 border-t mt-8">
        <Button variant="ghost" onClick={() => setCurrentStep(3)}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Back
        </Button>
        <div className="flex gap-4 items-center">
          {processingState === 'idle' && (
            <Button variant="ghost" className="text-muted-foreground" onClick={() => setCurrentStep(5)}>
              Skip this step
            </Button>
          )}
          <Button
            size="lg"
            className="rounded-full px-8"
            onClick={() => setCurrentStep(5)}
            disabled={processingState === 'processing'}
          >
            {processingState === 'done' ? 'Continue' : 'Skip & Continue'} <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
