import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Send } from "lucide-react";
import type { InvestorProfile } from "@/data/investorMockData";

interface Props {
  profile: InvestorProfile;
  open: boolean;
  onClose: () => void;
}

const INTEREST_TYPES = [
  "Equity Investment",
  "Debt Financing",
  "Mentorship & Advisory",
  "Strategic Partnership",
  "Grant / Blended Finance",
  "Other",
];

export function ExpressInterestModal({ profile, open, onClose }: Props) {
  const [form, setForm] = useState({
    investorName: "",
    organization: "",
    email: "",
    message: "",
    interestType: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const valid =
    form.investorName.trim() &&
    form.email.includes("@") &&
    form.interestType;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    // Store locally — no backend call
    const stored = JSON.parse(localStorage.getItem("ft_investor_interests") ?? "[]");
    stored.push({ ...form, profileId: profile.id, profileName: profile.name, timestamp: new Date().toISOString() });
    localStorage.setItem("ft_investor_interests", JSON.stringify(stored));
    setSubmitted(true);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => setSubmitted(false), 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            Express Interest
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {profile.name} · {profile.sector}
          </p>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-8 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold">Prototype request recorded.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This is a demonstration — no message has been sent to anyone.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-3 mt-2"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium mb-1 block">Investor Name *</label>
                  <input
                    value={form.investorName}
                    onChange={(e) => set("investorName", e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium mb-1 block">Organization</label>
                  <input
                    value={form.organization}
                    onChange={(e) => set("organization", e.target.value)}
                    placeholder="Fund / company (optional)"
                    className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Interest Type *</label>
                <select
                  value={form.interestType}
                  onChange={(e) => set("interestType", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Select type…</option>
                  {INTEREST_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  placeholder="Briefly describe your interest or what you are looking for…"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              <p className="text-[10px] text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
                Prototype only — this form does not send any data. Entries are stored locally in your browser for demonstration purposes.
              </p>

              <button
                type="submit"
                disabled={!valid}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit Interest
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
