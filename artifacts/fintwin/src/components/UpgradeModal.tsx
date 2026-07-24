import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/context/SubscriptionContext';
import { Check, Zap } from 'lucide-react';

const PREMIUM_FEATURES = [
  'All financial scenarios',
  'Advanced AI insights',
  'Financial statements',
  'Green scoring recommendations',
  'Unlimited scenario simulations',
  'Future premium features',
];

export function UpgradeModal() {
  const { upgradeOpen, setUpgradeOpen, upgradeSubscription } = useSubscription();

  return (
    <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
      <DialogContent className="max-w-sm !rounded-3xl p-7">
        <DialogHeader>
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mx-auto mb-3">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Upgrade to Premium</DialogTitle>
          <p className="text-center text-sm text-muted-foreground mt-1">
            Unlock all features for your business
          </p>
        </DialogHeader>

        <div className="space-y-2.5 my-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Premium unlocks
          </p>
          {PREMIUM_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              {f}
            </div>
          ))}
        </div>

        <div className="bg-muted/40 rounded-2xl px-4 py-4 text-center my-1">
          <span className="text-4xl font-bold">100</span>
          <span className="text-muted-foreground ml-1.5 text-sm">JOD / month</span>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          <Button
            className="rounded-full h-11 gap-2"
            onClick={() => void upgradeSubscription()}
          >
            <Zap className="w-4 h-4" /> Subscribe Now
          </Button>
          <Button
            variant="ghost"
            className="rounded-full h-10 text-muted-foreground"
            onClick={() => setUpgradeOpen(false)}
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
