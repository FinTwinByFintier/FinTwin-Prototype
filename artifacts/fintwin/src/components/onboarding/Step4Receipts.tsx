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

  const triggerUpload = () => {
    if (processingState !== 'idle') return;
    setUploadedFiles(fakeFiles);
    setProcessingState('processing');
    setTimeout(() => {
      setProcessingState('done');
      updateState({ connectedSources: { ...state.connectedSources, receipts: true } });
    }, 2800);
  };

  const removeFile = (name: string) => setUploadedFiles(f => f.filter(x => x.name !== name));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-xl mx-auto"
    >
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 border border-primary/20">
          <Sparkles className="w-3 h-3" /> Optional
        </div>
        <h2 className="text-3xl font-bold mb-2">Upload receipts</h2>
        <p className="text-muted-foreground">
          For cash-based businesses — our AI reads your receipts and extracts every transaction automatically.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {processingState === 'idle' && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); triggerUpload(); }}
              onClick={triggerUpload}
              className={`border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="font-medium mb-1">Drop files here or click to browse</p>
              <p className="text-sm text-muted-foreground">PDF, JPG, PNG — up to 20MB</p>
            </div>
          </motion.div>
        )}

        {processingState === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-card border rounded-3xl p-8">
            <div className="space-y-3 mb-8">
              {uploadedFiles.map(file => (
                <div key={file.name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  {file.name.endsWith('.pdf')
                    ? <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                    : <FileImage className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
              ))}
            </div>
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <p className="font-medium">Reading documents with AI...</p>
            </div>
          </motion.div>
        )}

        {processingState === 'done' && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border-2 border-primary/20 rounded-3xl p-8">
            <div className="space-y-3 mb-8">
              {uploadedFiles.map(file => (
                <div key={file.name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  {file.name.endsWith('.pdf')
                    ? <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                    : <FileImage className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <button onClick={() => removeFile(file.name)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold">23 transactions extracted</p>
              <p className="text-sm text-muted-foreground">Added to your profile</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between pt-8 mt-8 border-t">
        <Button variant="ghost" onClick={() => setCurrentStep(3)}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Back
        </Button>
        <div className="flex items-center gap-3">
          {processingState === 'idle' && (
            <Button variant="ghost" className="text-muted-foreground text-sm" onClick={() => setCurrentStep(5)}>
              Skip
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
