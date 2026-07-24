import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/context/SubscriptionContext";
import {
  BarChart3, Sparkles, FileText, Leaf, Infinity, Star, Crown,
} from "lucide-react";

const FEATURES = [
  { icon: BarChart3, label: "All financial scenarios" },
  { icon: Sparkles,  label: "Advanced AI insights" },
  { icon: FileText,  label: "Financial statements" },
  { icon: Leaf,      label: "Green scoring recommendations" },
  { icon: Infinity,  label: "Unlimited scenario simulations" },
  { icon: Star,      label: "Future premium features" },
];

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const { upgradeSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    await upgradeSubscription();
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden">
        {/* Hero band */}
        <div className="bg-primary/10 border-b border-primary/20 px-6 pt-6 pb-5 flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold">Upgrade to Premium</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Unlock the full power of your FinTwin
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Feature list */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Premium unlocks</p>
            <ul className="space-y-2">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Price */}
          <div className="bg-muted/40 rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Monthly price</span>
            <span className="text-lg font-bold">100 <span className="text-sm font-semibold">JOD / month</span></span>
          </div>

          {/* Actions */}
          <div className="space-y-2 pb-1">
            <Button
              className="w-full h-11 rounded-full font-semibold"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? "Subscribing…" : "Subscribe Now"}
            </Button>
            <Button
              variant="ghost"
              className="w-full h-10 rounded-full text-muted-foreground"
              onClick={onClose}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
