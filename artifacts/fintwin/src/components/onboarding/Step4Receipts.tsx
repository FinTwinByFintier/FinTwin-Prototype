import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ApiError,
  extractReceipt,
  importReceiptTransactions,
  type PreviewTransaction,
} from "@/lib/api";
import {
  UploadCloud,
  CheckCircle2,
  Loader2,
  FileText,
  X,
  Trash2,
  Plus,
  Import,
} from "lucide-react";

type Phase = "upload" | "review" | "imported";

type FilePreview = {
  id: string;
  file: File;
  name: string;
  size: string;
  previewUrl: string | null;
  isPdf: boolean;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
  txCount: number;
};

type EditableTx = PreviewTransaction & { rowId: string };

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type Props = {
  onDone?: () => void;
  embedded?: boolean;
};

export function Step4Receipts({ onDone, embedded = false }: Props) {
  const { state, updateState, persistProfile } = useOnboarding();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<EditableTx[]>([]);
  const [importError, setImportError] = useState("");
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processing = files.some((f) => f.status === "processing" || f.status === "pending");
  const allSettled =
    files.length > 0 && files.every((f) => f.status === "done" || f.status === "error");

  const totals = useMemo(() => {
    const debit = rows.filter((r) => r.direction === "debit").length;
    const credit = rows.filter((r) => r.direction === "credit").length;
    return { debit, credit, total: rows.length };
  }, [rows]);

  const processFiles = async (incoming: FileList | File[]) => {
    const list = Array.from(incoming).filter(
      (f) =>
        /image\/(jpeg|png|webp|gif)|application\/pdf/i.test(f.type) ||
        /\.(jpe?g|png|webp|gif|pdf)$/i.test(f.name),
    );
    if (!list.length) return;

    setPhase("upload");
    setImportError("");

    const newFiles: FilePreview[] = list.map((file) => {
      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      return {
        id: uid(),
        file,
        name: file.name,
        size: formatBytes(file.size),
        previewUrl: isPdf ? null : URL.createObjectURL(file),
        isPdf,
        status: "pending",
        txCount: 0,
      };
    });

    setFiles((prev) => [...prev, ...newFiles]);
    setBusy(true);

    const collected: EditableTx[] = [];

    for (const item of newFiles) {
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "processing" } : f)),
      );
      try {
        const result = await extractReceipt(item.file);
        const txs = (result.transactions || []).map((tx, i) => ({
          ...tx,
          rowId: uid(),
          temp_id: tx.temp_id || `${item.id}-${i}`,
          source_filename: item.name,
          currency: tx.currency || "JOD",
          direction: (tx.direction || "unknown") as EditableTx["direction"],
          kind: tx.kind || "other",
        }));
        collected.push(...txs);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: txs.length ? "done" : "error",
                  error: txs.length
                    ? undefined
                    : result.message || "No transactions found",
                  txCount: txs.length,
                }
              : f,
          ),
        );
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Could not digitize this file";
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: "error", error: message } : f,
          ),
        );
      }
    }

    setRows((prev) => [...prev, ...collected]);
    setBusy(false);
    if (collected.length) setPhase("review");
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const updateRow = (rowId: string, patch: Partial<EditableTx>) => {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)));
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  const addBlankRow = () => {
    setRows((prev) => [
      ...prev,
      {
        rowId: uid(),
        temp_id: uid(),
        direction: "debit",
        kind: "other",
        amount: null,
        currency: "JOD",
        transaction_date: null,
        due_date: null,
        description: "",
        counterparty: "",
        reference_number: "",
        account_number: "",
        iban: "",
        commission_amount: null,
        source_filename: "manual",
      },
    ]);
    setPhase("review");
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setImporting(true);
    setImportError("");
    try {
      const result = await importReceiptTransactions({
        source_label: files.map((f) => f.name).filter(Boolean).join(", ") || "receipts",
        transactions: rows.map((r) => ({
          direction: r.direction,
          kind: r.kind,
          amount: r.amount === "" || r.amount == null ? null : r.amount,
          currency: r.currency || "JOD",
          transaction_date: r.transaction_date || null,
          due_date: r.due_date || null,
          description: r.description || "",
          counterparty: r.counterparty || "",
          reference_number: r.reference_number || "",
          account_number: r.account_number || "",
          iban: r.iban || "",
          commission_amount:
            r.commission_amount === "" || r.commission_amount == null
              ? null
              : r.commission_amount,
        })),
      });
      setImportedCount(result.imported);
      updateState({
        connectedSources: { ...state.connectedSources, receipts: true },
      });
      void persistProfile({ connected_receipts: true });
      setPhase("imported");
    } catch (err) {
      setImportError(
        err instanceof ApiError ? err.message : "Import failed. Try again.",
      );
    } finally {
      setImporting(false);
    }
  };

  const openPicker = () => inputRef.current?.click();

  const cellInput =
    "h-9 w-full rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className={embedded ? "space-y-5" : "max-w-4xl mx-auto space-y-5"}>
      {!embedded && (
        <div className="mb-2 text-center">
          <h2 className="text-3xl font-bold mb-2">Digitize receipts</h2>
          <p className="text-muted-foreground">
            Upload documents, review every debit and credit, then import into your twin.
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void processFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Dropzone */}
      {phase !== "imported" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.length) void processFiles(e.dataTransfer.files);
          }}
          onClick={openPicker}
          className={`border-2 border-dashed rounded-3xl px-6 py-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/20"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6 text-primary" />
          </div>
          <p className="font-medium text-sm mb-0.5">Drop receipts here or click to upload</p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, PDF · multiple files</p>
        </div>
      )}

      {/* File preview strip */}
      <AnimatePresence>
        {files.length > 0 && phase !== "imported" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 overflow-x-auto pb-1"
          >
            {files.map((f) => (
              <div
                key={f.id}
                className="relative shrink-0 w-[104px] rounded-2xl border bg-card overflow-hidden shadow-sm"
              >
                <div className="aspect-square bg-muted/40 flex items-center justify-center relative">
                  {f.previewUrl ? (
                    <img
                      src={f.previewUrl}
                      alt={f.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-red-400" />
                  )}
                  {(f.status === "processing" || f.status === "pending") && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                  )}
                  {f.status === "done" && (
                    <div className="absolute top-1.5 end-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {f.status === "error" && (
                    <div className="absolute inset-0 bg-destructive/10 flex items-end p-1.5">
                      <p className="text-[9px] text-destructive leading-tight line-clamp-3">
                        {f.error}
                      </p>
                    </div>
                  )}
                </div>
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-medium truncate">{f.name}</p>
                  <p className="text-[9px] text-muted-foreground">
                    {f.status === "done"
                      ? `${f.txCount} tx`
                      : f.status === "processing"
                        ? "Reading…"
                        : f.size}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(f.id);
                  }}
                  className="absolute top-1 start-1 w-5 h-5 rounded-full bg-background/90 border flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {busy && (
        <p className="text-xs text-center text-muted-foreground">
          Extracting transactions from your documents…
        </p>
      )}

      {/* Review table */}
      {phase === "review" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-semibold text-base">Review transactions</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Edit anything that looks wrong, then import into your Financial Twin.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-full bg-muted font-medium">
                {totals.total} total
              </span>
              <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 font-medium">
                {totals.debit} debit
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-medium">
                {totals.credit} credit
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card overflow-hidden">
            <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-semibold w-[7.5rem]">Direction</TableHead>
                    <TableHead className="text-xs font-semibold w-[7.5rem]">Type</TableHead>
                    <TableHead className="text-xs font-semibold w-[6.5rem]">Amount</TableHead>
                    <TableHead className="text-xs font-semibold w-[4.5rem]">Cur</TableHead>
                    <TableHead className="text-xs font-semibold w-[9rem]">Date</TableHead>
                    <TableHead className="text-xs font-semibold">Counterparty</TableHead>
                    <TableHead className="text-xs font-semibold">Description</TableHead>
                    <TableHead className="text-xs font-semibold w-[8rem]">Reference</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.rowId}>
                      <TableCell className="align-middle p-2">
                        <Select
                          value={row.direction}
                          onValueChange={(v) =>
                            updateRow(row.rowId, {
                              direction: v as EditableTx["direction"],
                            })
                          }
                        >
                          <SelectTrigger className="h-9 w-full rounded-lg text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="debit">Debit</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                            <SelectItem value="unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="align-middle p-2">
                        <Select
                          value={row.kind}
                          onValueChange={(v) => updateRow(row.rowId, { kind: v })}
                        >
                          <SelectTrigger className="h-9 w-full rounded-lg text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bill">Bill</SelectItem>
                            <SelectItem value="transfer">Transfer</SelectItem>
                            <SelectItem value="purchase">Purchase</SelectItem>
                            <SelectItem value="refund">Refund</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="align-middle p-2">
                        <Input
                          className={cellInput}
                          value={row.amount ?? ""}
                          onChange={(e) =>
                            updateRow(row.rowId, {
                              amount: e.target.value.replace(/[^\d.]/g, ""),
                            })
                          }
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell className="align-middle p-2">
                        <Input
                          className={cellInput}
                          value={row.currency || ""}
                          onChange={(e) =>
                            updateRow(row.rowId, {
                              currency: e.target.value.toUpperCase().slice(0, 8),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="align-middle p-2">
                        <Input
                          type="date"
                          className={cellInput}
                          value={row.transaction_date || ""}
                          onChange={(e) =>
                            updateRow(row.rowId, {
                              transaction_date: e.target.value || null,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="align-middle p-2">
                        <Input
                          className={cellInput}
                          value={row.counterparty || ""}
                          onChange={(e) =>
                            updateRow(row.rowId, { counterparty: e.target.value })
                          }
                          placeholder="Name"
                        />
                      </TableCell>
                      <TableCell className="align-middle p-2">
                        <Input
                          className={cellInput}
                          value={row.description || ""}
                          onChange={(e) =>
                            updateRow(row.rowId, { description: e.target.value })
                          }
                          placeholder="Note"
                        />
                      </TableCell>
                      <TableCell className="align-middle p-2">
                        <Input
                          className={cellInput}
                          value={row.reference_number || ""}
                          onChange={(e) =>
                            updateRow(row.rowId, { reference_number: e.target.value })
                          }
                          placeholder="Ref #"
                        />
                      </TableCell>
                      <TableCell className="align-middle p-2">
                        <button
                          type="button"
                          onClick={() => removeRow(row.rowId)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!rows.length && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-sm text-muted-foreground py-10"
                      >
                        No transactions yet. Upload a receipt or add a row manually.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </div>

          {importError && (
            <p className="text-sm text-destructive">{importError}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={addBlankRow}
            >
              <Plus className="w-4 h-4 me-1.5" /> Add row
            </Button>
            <div className="flex items-center gap-2">
              {onDone && (
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  onClick={onDone}
                  disabled={importing}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                className="rounded-full px-6"
                disabled={!rows.length || importing || processing}
                onClick={() => void handleImport()}
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" /> Importing…
                  </>
                ) : (
                  <>
                    <Import className="w-4 h-4 me-2" /> Import {rows.length || ""} transaction
                    {rows.length === 1 ? "" : "s"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {phase === "upload" && allSettled && !rows.length && (
        <p className="text-sm text-center text-muted-foreground py-2">
          No transactions extracted. Try another clearer image, or add a row manually.
          <button
            type="button"
            className="ms-1 text-primary hover:underline font-medium"
            onClick={addBlankRow}
          >
            Add row
          </button>
        </p>
      )}

      {phase === "imported" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-10 text-center space-y-4"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-lg">Imported successfully</p>
            <p className="text-sm text-muted-foreground mt-1">
              {importedCount} transaction{importedCount === 1 ? "" : "s"} added to your twin.
            </p>
          </div>
          {onDone && (
            <Button className="rounded-full px-8" onClick={onDone}>
              Done
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}
